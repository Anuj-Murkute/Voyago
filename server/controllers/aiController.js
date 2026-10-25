
const { GoogleGenAI, Type } = require("@google/genai");
const mongoose = require("mongoose");
const Trip = require("../models/Trip");

const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const generateItinerary = async (req, res) => {
    try {
        // 1. Check configuration
        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({
                success: false,
                message: "AI service is not configured. Add GEMINI_API_KEY to server/.env."
            });
        }

        // 2. Validate trip ID
        const { tripId } = req.params;

        if (!mongoose.isValidObjectId(tripId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID."
            });
        }

        // 3. Verify trip ownership
        const trip = await Trip.findOne({
            _id: tripId,
            user: req.user
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found."
            });
        }

        // 4. Validate dates
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end < start
        ) {
            return res.status(400).json({
                success: false,
                message: "This trip has invalid travel dates."
            });
        }

        const startDate = start.toISOString().slice(0, 10);
        const endDate = end.toISOString().slice(0, 10);

        const expectedDays =
            Math.floor(
                (Date.parse(`${endDate}T00:00:00Z`) -
                    Date.parse(`${startDate}T00:00:00Z`)) /
                    86400000
            ) + 1;

        // Avoid accidentally generating excessively large itineraries.
        if (expectedDays < 1 || expectedDays > 30) {
            return res.status(400).json({
                success: false,
                message: "Trips must be between 1 and 30 days for itinerary generation."
            });
        }

        // 5. Build the prompt
        const prompt = `
You are VOYAGO, an AI travel planning assistant.

Create a realistic, organized itinerary using the following trip details.

Destination: ${trip.destination}
Start date: ${startDate}
End date: ${endDate}
Number of travelers: ${trip.travelers}
Budget: ${trip.budget}
Interests: ${(trip.interests || []).join(", ")}

REQUIREMENTS

ITINERARY:
- Return exactly ${expectedDays} days.
- Day numbers must run from 1 to ${expectedDays}.
- Dates must match the trip dates, in order.
- Use recognizable attractions and realistic activities for the destination.
- Group nearby activities together when practical.
- Consider the budget, interests, opening times, and travel time.
- Do not invent coordinates, Google Place IDs, ratings, or booking URLs.
- Activity durations should be realistic.

HOTELS:
- Recommend up to 3 relevant hotel options.
- Use recognizable properties where possible.
- Do not invent ratings or booking URLs.
- Explain why each option suits the trip.
- priceLevel must be Budget, Moderate, or Luxury.

RESTAURANTS:
- Recommend up to 6 relevant restaurants.
- Consider cuisine, meal type, budget, and interests.
- Do not invent ratings or booking URLs.
- Explain why each is recommended.
- priceLevel should be Budget, Moderate, or Luxury.

ACCURACY:
- Do not claim live availability or current prices have been verified.
- If uncertain about a venue, avoid fabricated details.
- Return only JSON matching the requested schema.
`;

        // 6. Request structured output from Gemini
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const response = await ai.models.generateContent({
            model: AI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING
                        },
                        hotels: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    priceLevel: { type: Type.STRING },
                                    whyRecommended: { type: Type.STRING },
                                    suitableFor: { type: Type.STRING }
                                },
                                required: [
                                    "name",
                                    "description",
                                    "priceLevel",
                                    "whyRecommended",
                                    "suitableFor"
                                ]
                            }
                        },
                        restaurants: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    cuisine: { type: Type.STRING },
                                    meal: { type: Type.STRING },
                                    priceLevel: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    whyRecommended: { type: Type.STRING }
                                },
                                required: [
                                    "name",
                                    "cuisine",
                                    "meal",
                                    "priceLevel",
                                    "description",
                                    "whyRecommended"
                                ]
                            }
                        },
                        days: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.INTEGER },
                                    date: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    activities: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                time: { type: Type.STRING },
                                                place: { type: Type.STRING },
                                                description: { type: Type.STRING },
                                                duration: { type: Type.STRING }
                                            },
                                            required: [
                                                "time",
                                                "place",
                                                "description",
                                                "duration"
                                            ]
                                        }
                                    }
                                },
                                required: [
                                    "day",
                                    "date",
                                    "title",
                                    "activities"
                                ]
                            }
                        }
                    },
                    required: [
                        "summary",
                        "hotels",
                        "restaurants",
                        "days"
                    ]
                }
            }
        });

        // 7. Check the provider response
        if (
            !response ||
            typeof response.text !== "string" ||
            !response.text.trim()
        ) {
            return res.status(502).json({
                success: false,
                message: "Gemini returned an empty response. Please try again."
            });
        }

        let result;

        try {
            result = JSON.parse(response.text);
        } catch {
            return res.status(502).json({
                success: false,
                message: "Gemini returned invalid JSON. Nothing was saved."
            });
        }

        // 8. Validate generated structure before saving
        if (
            !result ||
            typeof result.summary !== "string" ||
            !Array.isArray(result.days) ||
            result.days.length !== expectedDays ||
            !Array.isArray(result.hotels) ||
            !Array.isArray(result.restaurants)
        ) {
            return res.status(502).json({
                success: false,
                message: "The generated itinerary has an unexpected format. Nothing was saved."
            });
        }

        const validDays = result.days.every((day, index) => {
            const expectedDate = new Date(start);
            expectedDate.setUTCDate(expectedDate.getUTCDate() + index);

            return (
                day &&
                Number(day.day) === index + 1 &&
                day.date === expectedDate.toISOString().slice(0, 10) &&
                typeof day.title === "string" &&
                Array.isArray(day.activities)
            );
        });

        const validActivities = result.days.every((day) =>
            day.activities.every((activity) =>
                activity &&
                typeof activity.time === "string" &&
                typeof activity.place === "string" &&
                typeof activity.description === "string" &&
                typeof activity.duration === "string"
            )
        );

        const validHotels = result.hotels.every((hotel) =>
            hotel &&
            typeof hotel.name === "string" &&
            typeof hotel.description === "string" &&
            typeof hotel.priceLevel === "string" &&
            typeof hotel.whyRecommended === "string" &&
            typeof hotel.suitableFor === "string"
        );

        const validRestaurants = result.restaurants.every((restaurant) =>
            restaurant &&
            typeof restaurant.name === "string" &&
            typeof restaurant.cuisine === "string" &&
            typeof restaurant.meal === "string" &&
            typeof restaurant.priceLevel === "string" &&
            typeof restaurant.description === "string" &&
            typeof restaurant.whyRecommended === "string"
        );

        if (
            !validDays ||
            !validActivities ||
            !validHotels ||
            !validRestaurants
        ) {
            return res.status(502).json({
                success: false,
                message: "The generated itinerary contains incomplete or invalid data. Nothing was saved."
            });
        }

        // 9. Persist the itinerary only after validation
        trip.itinerary = result.days;
        trip.hotels = result.hotels;
        trip.restaurants = result.restaurants;

        await trip.save();

        // 10. Return the saved itinerary
        return res.status(200).json({
            success: true,
            message: "Itinerary, hotels, and restaurants generated successfully.",
            summary: result.summary,
            trip
        });
    } catch (error) {
        console.error("AI itinerary generation error:", error);

        const message = String(error.message || "");

        if (/429|RESOURCE_EXHAUSTED|rate limit/i.test(message)) {
            return res.status(429).json({
                success: false,
                message: "The AI request limit was reached. Please wait before trying again."
            });
        }

        if (/API key|PERMISSION_DENIED|UNAUTHENTICATED|invalid.*key/i.test(message)) {
            return res.status(503).json({
                success: false,
                message: "Gemini credentials are invalid or unavailable. Check GEMINI_API_KEY."
            });
        }

        if (/NOT_FOUND|model.*not found|model.*unavailable|unsupported model/i.test(message)) {
            return res.status(503).json({
                success: false,
                message: `Gemini model "${AI_MODEL}" is unavailable. Set GEMINI_MODEL to a model supported by your API key.`
            });
        }

        return res.status(502).json({
            success: false,
            message: "Itinerary generation failed. Check the backend terminal for details and try again."
        });
    }
};

module.exports = { generateItinerary };
