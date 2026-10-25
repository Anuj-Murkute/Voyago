
const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

const amadeusBase = () =>
  process.env.AMADEUS_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

const DEFAULT_CURRENCY = "INR";

// ---------------- General helpers ----------------

function toStringArray(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return String(item.name || item.title || item.label || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function makeError(message, status = 502) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getFallbackActivity(kind, period, destination) {
  const place = destination || "your destination";

  const activities = {
    hotels: {
      morning: `Enjoy breakfast and explore a local attraction in ${place}.`,
      afternoon: `Discover local landmarks and enjoy regional cuisine in ${place}.`,
      evening: `Spend the evening exploring the local area and dining nearby.`,
    },
    cruises: {
      morning: `Enjoy breakfast onboard and review the day's cruise activities.`,
      afternoon: `Explore the scheduled port of call or enjoy onboard facilities.`,
      evening: `Enjoy dinner onboard and the evening entertainment.`,
    },
  };

  return activities[kind]?.[period] || "Enjoy your planned travel activities.";
}

// ---------------- Amadeus helpers ----------------

async function getAmadeusToken() {
  const { AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET } = process.env;

  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw makeError(
      "Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to server/.env.",
      503
    );
  }

  const response = await fetch(
    `${amadeusBase()}/v1/security/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw makeError(
      data.error_description || "Amadeus authentication failed.",
      502
    );
  }

  return data.access_token;
}

async function amadeusGet(path, token) {
  const response = await fetch(`${amadeusBase()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw makeError(
      data.errors?.[0]?.detail ||
        data.errors?.[0]?.title ||
        "Hotel provider request failed.",
      response.status === 400 ? 400 : 502
    );
  }

  return data;
}

// ---------------- Gemini helpers ----------------

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw makeError("Add GEMINI_API_KEY to server/.env.", 503);
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

function extractJson(text) {
  if (!text || typeof text !== "string") {
    throw makeError(
      "Gemini returned an empty response. Check your API key, model access, and generation limits."
    );
  }

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end <= start) {
      throw makeError(
        "Gemini did not return complete JSON. Please retry with a shorter trip or fewer requirements."
      );
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw makeError(
        "Gemini returned invalid or incomplete JSON. Please retry."
      );
    }
  }
}

function normalizeItineraryDay(day, index, kind, destination) {
  const source = day && typeof day === "object" ? day : {};
  const activities = toStringArray(source.activities);

  const morning =
    String(source.morning || activities[0] || "").trim() ||
    getFallbackActivity(kind, "morning", destination);

  const afternoon =
    String(source.afternoon || activities[1] || "").trim() ||
    getFallbackActivity(kind, "afternoon", destination);

  const evening =
    String(source.evening || activities[2] || "").trim() ||
    getFallbackActivity(kind, "evening", destination);

  return {
    day: Math.max(1, Number(source.day) || index + 1),
    title: String(source.title || `Day ${index + 1}`).trim(),
    morning,
    afternoon,
    evening,
    activities: activities.length
      ? activities
      : [morning, afternoon, evening],
    notes: String(source.notes || "").trim(),
    travelTips: toStringArray(source.travelTips),
  };
}

function normalizeTrip(trip, index, kind, input) {
  const source = trip && typeof trip === "object" ? trip : {};

  const itinerary = Array.isArray(source.itinerary)
    ? source.itinerary
        .slice(0, 21)
        .map((day, dayIndex) =>
          normalizeItineraryDay(
            day,
            dayIndex,
            kind,
            input.destination
          )
        )
    : [];

  return {
    id: String(source.id || `${kind}-${Date.now()}-${index}`),
    title: String(source.title || "Travel package").trim(),
    style: String(source.style || input.travelStyle || "Balanced").trim(),
    description: String(source.description || "").trim(),
    estimatedCost: Math.max(0, Number(source.estimatedCost) || 0),
    currency: String(source.currency || input.currency || DEFAULT_CURRENCY),
    duration: String(source.duration || input.duration || "").trim(),
    accommodation: String(source.accommodation || "").trim(),
    highlights: toStringArray(source.highlights),
    itinerary,
  };
}

async function generateItinerary(kind, input) {
  const ai = getGeminiClient();
  const isHotel = kind === "hotels";

  const prompt = `
You are VOYAGO, a professional travel itinerary planner.

Create exactly 3 distinct ${
    isHotel ? "hotel-based travel packages" : "cruise travel packages"
  }.

Return one valid JSON object only. Do not use Markdown or code fences.

TRAVELER INFORMATION:
${JSON.stringify(input, null, 2)}

REQUIREMENTS:
1. Personalize the packages to the destination, travel dates, group size,
   budget, travel style, and preferences.
2. Provide estimated costs only. Never claim that a price is live or that
   a hotel, cruise, room, or cabin is available or booked.
3. Do not invent booking URLs, reservation IDs, or provider confirmations.
4. Include a realistic itinerary, accommodation or cruise suggestion,
   highlights, and estimated total package cost.
5. Every itinerary day MUST include all three string fields:
   "morning", "afternoon", and "evening".
6. Also include "activities" as an array of up to 3 short strings.
   The activities should correspond to the day's morning, afternoon,
   and evening plan.
7. Include a short "notes" string and a "travelTips" array for each day.
8. Keep each activity practical and concise.
9. Match the itinerary length to the supplied dates or duration where possible.
10. Use the supplied currency, defaulting to INR.
11. For hotels, suggest a suitable accommodation type or area. Do not
    claim a specific hotel is available.
12. For cruises, describe plausible onboard activities and ports only when
    supported by the destination and trip information. Do not claim a
    specific sailing is available.
13. If dates or trip length are not supplied, use a reasonable duration
    and state it clearly.
14. Do not return fewer than 3 packages.

RETURN EXACTLY THIS STRUCTURE:
{
  "destination": "destination",
  "overview": "short overview",
  "trips": [
    {
      "id": "package-1",
      "title": "package title",
      "style": "travel style",
      "description": "short description",
      "estimatedCost": 25000,
      "currency": "INR",
      "duration": "3 days",
      "accommodation": "accommodation or cruise suggestion",
      "highlights": ["highlight 1", "highlight 2"],
      "itinerary": [
        {
          "day": 1,
          "title": "day title",
          "morning": "morning activity",
          "afternoon": "afternoon activity",
          "evening": "evening activity",
          "activities": [
            "morning activity",
            "afternoon activity",
            "evening activity"
          ],
          "notes": "short practical note",
          "travelTips": ["useful travel tip"]
        }
      ]
    }
  ]
}
`;

  let timeoutId;

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        // Override GEMINI_MODEL in server/.env if needed.
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 6000,
          thinkingConfig: {
            thinkingLevel: "low",
          },
        },
      }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            makeError(
              "Itinerary generation timed out after 45 seconds. Please retry."
            )
          );
        }, 45000);
      }),
    ]);

    const parsed = extractJson(response.text);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.trips) ||
      parsed.trips.length === 0
    ) {
      throw makeError("Gemini returned no itinerary packages.");
    }

    const trips = parsed.trips
      .slice(0, 3)
      .map((trip, index) => normalizeTrip(trip, index, kind, input));

    if (trips.length !== 3) {
      console.warn(
        `Gemini returned ${trips.length} ${kind} packages instead of 3.`
      );
    }

    return {
      destination: String(parsed.destination || input.destination || ""),
      overview: String(parsed.overview || "").trim(),
      trips,
    };
  } catch (error) {
    console.error(`Gemini ${kind} generation failed:`, error.message);

    if (error.status) {
      throw error;
    }

    const message = String(error.message || "");

    const status =
      /429|resource exhausted|quota/i.test(message)
        ? 429
        : /API key|permission|unauthorized|model.*not found|not supported/i.test(
              message
            )
          ? 502
          : 502;

    throw makeError(
      message || "Itinerary generation failed. Please try again.",
      status
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------- AI hotel itinerary ----------------

router.post("/hotels/generate", async (req, res) => {
  try {
    const body = req.body || {};
    const destination = String(
      body.destination || body.location || ""
    ).trim();

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: "Enter a destination to generate hotel trips.",
      });
    }

    const input = {
      destination,
      checkIn: String(body.checkIn || body.checkInDate || ""),
      checkOut: String(body.checkOut || body.checkOutDate || ""),
      guests: Number(body.guests || body.adults || 2),
      rooms: Number(body.rooms || 1),
      budget: body.budget ?? "",
      currency: body.currency || DEFAULT_CURRENCY,
      preferences: body.preferences || body.interests || [],
      travelStyle: body.travelStyle || body.style || "balanced",
      additionalRequirements:
        body.additionalRequirements || body.notes || "",
    };

    if (
      input.checkIn &&
      input.checkOut &&
      input.checkOut <= input.checkIn
    ) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in.",
      });
    }

    if (
      !Number.isInteger(input.guests) ||
      input.guests < 1 ||
      input.guests > 20 ||
      !Number.isInteger(input.rooms) ||
      input.rooms < 1 ||
      input.rooms > 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Guests or room count is invalid.",
      });
    }

    const result = await generateItinerary("hotels", input);

    return res.json({
      success: true,
      source: "Gemini AI",
      ...result,
    });
  } catch (error) {
    console.error("Hotel itinerary error:", error.message);

    return res.status(error.status || 502).json({
      success: false,
      message: error.message || "Hotel itinerary generation failed.",
    });
  }
});

// ---------------- AI cruise itinerary ----------------

router.post("/cruises/generate", async (req, res) => {
  try {
    const body = req.body || {};

    const input = {
      destination: String(
        body.destination || body.region || ""
      ).trim(),
      departurePort: String(
        body.departurePort || body.port || ""
      ).trim(),
      departureDate: String(body.departureDate || body.date || ""),
      returnDate: String(body.returnDate || ""),
      duration: String(body.duration || ""),
      guests: Number(body.guests || body.adults || 2),
      cabins: Number(body.cabins || 1),
      budget: body.budget ?? "",
      currency: body.currency || DEFAULT_CURRENCY,
      cruiseLine: body.cruiseLine || body.operator || "Any",
      preferences: body.preferences || body.interests || [],
      travelStyle: body.travelStyle || body.style || "balanced",
      additionalRequirements:
        body.additionalRequirements || body.notes || "",
    };

    if (!input.destination && !input.departurePort) {
      return res.status(400).json({
        success: false,
        message: "Enter a cruise destination or departure port.",
      });
    }

    if (
      !Number.isInteger(input.guests) ||
      input.guests < 1 ||
      input.guests > 20 ||
      !Number.isInteger(input.cabins) ||
      input.cabins < 1 ||
      input.cabins > 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Guests or cabin count is invalid.",
      });
    }

    const result = await generateItinerary("cruises", input);

    return res.json({
      success: true,
      source: "Gemini AI",
      ...result,
    });
  } catch (error) {
    console.error("Cruise itinerary error:", error.message);

    return res.status(error.status || 502).json({
      success: false,
      message: error.message || "Cruise itinerary generation failed.",
    });
  }
});

// ---------------- Amadeus hotel search ----------------

router.get("/hotels", async (req, res) => {
  try {
    const destination = String(req.query.destination || "").trim();
    const checkIn = String(req.query.checkIn || "");
    const checkOut = String(req.query.checkOut || "");
    const guests = Number(req.query.guests || 1);
    const rooms = Number(req.query.rooms || 1);

    if (
      !destination ||
      !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) ||
      checkOut <= checkIn
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a destination and valid check-in/check-out dates.",
      });
    }

    if (
      !Number.isInteger(guests) ||
      guests < 1 ||
      guests > 20 ||
      !Number.isInteger(rooms) ||
      rooms < 1 ||
      rooms > 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Guests or room count is invalid.",
      });
    }

    const token = await getAmadeusToken();

    const locations = await amadeusGet(
      `/v1/reference-data/locations?subType=CITY&keyword=${encodeURIComponent(
        destination
      )}&page%5Blimit%5D=5`,
      token
    );

    const city = (locations.data || []).find((item) => item.iataCode);

    if (!city) {
      return res.json({
        success: true,
        results: [],
        message: "No matching city found. Try a major nearby city.",
      });
    }

    const hotelList = await amadeusGet(
      `/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(
        city.iataCode
      )}&radius=20&radiusUnit=KM&hotelSource=ALL`,
      token
    );

    const hotelIds = [
      ...new Set(
        (hotelList.data || [])
          .map((hotel) => hotel.hotelId)
          .filter(Boolean)
      ),
    ].slice(0, 10);

    if (!hotelIds.length) {
      return res.json({
        success: true,
        results: [],
        destination: city.name || destination,
        message: "No hotels returned for this city.",
      });
    }

    const params = new URLSearchParams({
      hotelIds: hotelIds.join(","),
      adults: String(guests),
      roomQuantity: String(rooms),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      currency: "INR",
    });

    const offerData = await amadeusGet(
      `/v3/shopping/hotel-offers?${params.toString()}`,
      token
    );

    const hotelInfo = new Map(
      (hotelList.data || []).map((hotel) => [
        hotel.hotelId,
        hotel,
      ])
    );

    const results = (offerData.data || []).map((item) => {
      const hotel = item.hotel || {};
      const offer = item.offers?.[0] || {};
      const listedHotel = hotelInfo.get(hotel.hotelId);

      return {
        id: hotel.hotelId || hotel.name,
        name: hotel.name || "Hotel",
        address:
          [
            listedHotel?.address?.lines?.join(", "),
            listedHotel?.address?.cityName || city.name,
            listedHotel?.address?.countryCode,
          ]
            .filter(Boolean)
            .join(", ") || destination,
        rating: hotel.rating || null,
        price: offer.price?.total || null,
        currency: offer.price?.currency || DEFAULT_CURRENCY,
        room:
          offer.room?.description?.text ||
          offer.room?.typeEstimated?.category ||
          "Room offer",
        checkIn,
        checkOut,
      };
    });

    return res.json({
      success: true,
      destination: city.name || destination,
      results,
      source: "Amadeus",
    });
  } catch (error) {
    console.error("Hotel search error:", error.message);

    return res.status(error.status || 502).json({
      success: false,
      message: error.message || "Hotel search failed.",
    });
  }
});

// ---------------- SerpApi cruise search ----------------

router.get("/cruises", async (req, res) => {
  try {
    const destination = String(
      req.query.destination || ""
    ).trim();
    const port = String(req.query.port || "").trim();
    const date = String(req.query.date || "").trim();
    const duration = String(req.query.duration || "").trim();

    if (!process.env.SERPAPI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Add SERPAPI_API_KEY to server/.env.",
      });
    }

    const queryParts = [
      "cruise",
      destination && destination !== "Any destination"
        ? `to ${destination}`
        : "cruise itineraries and deals",
      port && port !== "Any port" ? `departing from ${port}` : "",
      date ? `departure around ${date}` : "",
      duration && duration !== "Any duration" ? duration : "",
      "cruise line official website",
    ].filter(Boolean);

    const params = new URLSearchParams({
      engine: "google",
      q: queryParts.join(" "),
      api_key: process.env.SERPAPI_API_KEY,
      num: "10",
    });

    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`,
      {
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw makeError(
        data.error || "Cruise search provider failed.",
        502
      );
    }

    const results = (data.organic_results || [])
      .filter((item) => item.link)
      .map((item, index) => {
        let operator = "Cruise provider";

        try {
          operator = new URL(item.link)
            .hostname
            .replace(/^www\./, "");
        } catch {
          // Keep the fallback operator when the URL is invalid.
        }

        return {
          id: item.position || index + 1,
          name: item.title || "Cruise listing",
          operator,
          link: item.link,
          description:
            item.snippet ||
            "Open the provider website to check dates and prices.",
          image: item.thumbnail || null,
          source: "SerpApi",
        };
      });

    return res.json({
      success: true,
      results,
      source: "SerpApi",
      note: "Web listings are not verified live cabin inventory.",
    });
  } catch (error) {
    console.error("Cruise search error:", error.message);

    return res.status(error.status || 502).json({
      success: false,
      message: error.message || "Cruise search failed.",
    });
  }
});

module.exports = router;
