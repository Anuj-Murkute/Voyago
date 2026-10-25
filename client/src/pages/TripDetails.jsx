
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TripMap from "../components/TripMap";
import HotelSearch from "../components/HotelSearch";
import {
    getTrip,
    generateItinerary,
    saveHotelLocations,
    saveRestaurantLocations
} from "../services/api";
import "./TripDetails.css";

const EMPTY_ARRAY = [];

function getResponseTrip(response) {
    return (
        response?.trip ||
        response?.data?.trip ||
        (response?.data?._id ? response.data : null) ||
        (response?._id ? response : null)
    );
}

function getHotels(trip) {
    return trip?.hotels || trip?.hotelLocations || [];
}

function getRestaurants(trip) {
    return trip?.restaurants || trip?.restaurantLocations || [];
}

function getActivities(day) {
    if (Array.isArray(day)) return day;

    return (
        day?.activities ||
        day?.places ||
        day?.stops ||
        []
    );
}

function getActivityName(activity) {
    if (typeof activity === "string") return activity;

    return (
        activity?.place ||
        activity?.name ||
        activity?.title ||
        activity?.location ||
        "Unnamed place"
    );
}

function getActivityDescription(activity) {
    if (typeof activity === "string") return "";

    return (
        activity?.description ||
        activity?.reason ||
        activity?.details ||
        ""
    );
}

function getItemName(item) {
    return (
        item?.name ||
        item?.hotelName ||
        item?.restaurantName ||
        item?.title ||
        ""
    );
}

function formatDate(value) {
    if (!value) return "Not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getToday() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function toCoordinates(location) {
    if (!location) return null;

    const latitude =
        typeof location.lat === "function"
            ? location.lat()
            : location.lat;

    const longitude =
        typeof location.lng === "function"
            ? location.lng()
            : location.lng;

    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return null;
    }

    return {
        latitude,
        longitude
    };
}

function TripDetails() {
    const { tripId } = useParams();
    const { token } = useAuth();

    const [trip, setTrip] = useState(null);
    const [itinerary, setItinerary] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState(null);

    const [selectedDay, setSelectedDay] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [resolvingRecommendations, setResolvingRecommendations] =
        useState(false);
    const [error, setError] = useState("");
    const [placesMessage, setPlacesMessage] = useState("");

    const requestVersion = useRef(0);
    const resolvingRef = useRef(false);
    const generationRef = useRef(false);

    const applyTrip = useCallback((tripData) => {
        setTrip(tripData);

        setItinerary(
            Array.isArray(tripData?.itinerary)
                ? tripData.itinerary
                : []
        );

        setHotels(
            Array.isArray(getHotels(tripData))
                ? getHotels(tripData)
                : []
        );

        setRestaurants(
            Array.isArray(getRestaurants(tripData))
                ? getRestaurants(tripData)
                : []
        );

        setSelectedHotel(tripData?.selectedHotel || null);
    }, []);

    const loadTrip = useCallback(async () => {
        const currentVersion = ++requestVersion.current;

        if (!token) {
            setTrip(null);
            setError("Please sign in to view this trip.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await getTrip(tripId, token);

            if (currentVersion !== requestVersion.current) return;

            const tripData = getResponseTrip(response);

            if (!tripData) {
                throw new Error("Trip data was not found.");
            }

            applyTrip(tripData);
            setSelectedDay(0);
        } catch (err) {
            if (currentVersion !== requestVersion.current) return;

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load this trip."
            );
        } finally {
            if (currentVersion === requestVersion.current) {
                setLoading(false);
            }
        }
    }, [tripId, token, applyTrip]);

    useEffect(() => {
        loadTrip();

        return () => {
            // Ignore results from requests started for an older trip.
            requestVersion.current += 1;
        };
    }, [loadTrip]);

    const resolveRecommendations = useCallback(async (
        hotelList,
        restaurantList,
        destination,
        currentTripId
    ) => {
        if (resolvingRef.current) return;

        const hasHotels = Array.isArray(hotelList) && hotelList.length > 0;
        const hasRestaurants =
            Array.isArray(restaurantList) && restaurantList.length > 0;

        if (!hasHotels && !hasRestaurants) return;
        if (!token || !destination || !currentTripId) return;

        const google = window.google;

        if (!google?.maps?.importLibrary) {
            setPlacesMessage(
                "Google Places is not available right now. Your saved recommendations are still shown."
            );
            return;
        }

        resolvingRef.current = true;
        setResolvingRecommendations(true);
        setPlacesMessage("");

        try {
            const { Place } = await google.maps.importLibrary("places");

            const resolveList = async (items, type) => {
                const resolved = [];

                for (const item of items) {
                    const name = getItemName(item);
                    if (!name) continue;

                    try {
                        const { places = [] } = await Place.searchByText({
                            textQuery: `${name}, ${destination}`,
                            fields: [
                                "id",
                                "displayName",
                                "formattedAddress",
                                "location",
                                "rating",
                                "websiteURI"
                            ],
                            maxResultCount: 1
                        });

                        const place = places[0];
                        const coordinates = toCoordinates(place?.location);

                        if (!place || !coordinates) continue;

                        resolved.push({
                            name: place.displayName || name,
                            placeId: place.id || "",
                            address: place.formattedAddress || "",
                            ...coordinates,
                            rating: place.rating ?? null,
                            website: place.websiteURI || ""
                        });
                    } catch {
                        // One failed place lookup should not stop other results.
                    }
                }

                return resolved;
            };

            const [resolvedHotels, resolvedRestaurants] = await Promise.all([
                hasHotels ? resolveList(hotelList, "hotel") : [],
                hasRestaurants ? resolveList(restaurantList, "restaurant") : []
            ]);

            if (resolvedHotels.length > 0) {
                await saveHotelLocations(
                    currentTripId,
                    resolvedHotels,
                    token
                );
            }

            if (resolvedRestaurants.length > 0) {
                await saveRestaurantLocations(
                    currentTripId,
                    resolvedRestaurants,
                    token
                );
            }

            // Add coordinates to existing recommendations without discarding
            // descriptions, cuisine, price information, or other saved fields.
            if (resolvedHotels.length > 0) {
                const resolvedByName = new Map(
                    resolvedHotels.map((item) => [
                        item.name.toLowerCase(),
                        item
                    ])
                );

                setHotels((current) =>
                    current.map((item) => {
                        const resolved = resolvedByName.get(
                            getItemName(item).toLowerCase()
                        );

                        return resolved ? { ...item, ...resolved } : item;
                    })
                );
            }

            if (resolvedRestaurants.length > 0) {
                const resolvedByName = new Map(
                    resolvedRestaurants.map((item) => [
                        item.name.toLowerCase(),
                        item
                    ])
                );

                setRestaurants((current) =>
                    current.map((item) => {
                        const resolved = resolvedByName.get(
                            getItemName(item).toLowerCase()
                        );

                        return resolved ? { ...item, ...resolved } : item;
                    })
                );
            }

            if (
                (hasHotels && resolvedHotels.length === 0) ||
                (hasRestaurants && resolvedRestaurants.length === 0)
            ) {
                setPlacesMessage(
                    "Some recommendations could not be matched to a map location. Your itinerary is unaffected."
                );
            }
        } catch {
            setPlacesMessage(
                "Could not update map locations right now. Your trip and itinerary are still available."
            );
        } finally {
            resolvingRef.current = false;
            setResolvingRecommendations(false);
        }
    }, [token]);

    const handleGenerateItinerary = async () => {
        if (generationRef.current || generating) return;

        if (!token) {
            setError("Please sign in to generate an itinerary.");
            return;
        }

        generationRef.current = true;
        setGenerating(true);
        setError("");

        try {
            const response = await generateItinerary(tripId, token);
            let generatedTrip = getResponseTrip(response);

            // Some APIs return only a success message. Reload the persisted
            // trip in that case instead of assuming generation failed.
            if (!generatedTrip) {
                const reloadResponse = await getTrip(tripId, token);
                generatedTrip = getResponseTrip(reloadResponse);
            }

            if (!generatedTrip) {
                throw new Error(
                    "The itinerary response was empty. Please reload the trip."
                );
            }

            applyTrip(generatedTrip);
            setSelectedDay(0);

            const nextHotels = getHotels(generatedTrip);
            const nextRestaurants = getRestaurants(generatedTrip);

            // Map resolution is optional; do not make itinerary generation
            // appear to fail when a Places lookup or save operation fails.
            resolveRecommendations(
                nextHotels,
                nextRestaurants,
                generatedTrip.destination || trip?.destination,
                generatedTrip._id || tripId
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to generate the itinerary. Please try again."
            );
        } finally {
            generationRef.current = false;
            setGenerating(false);
        }
    };

    const handleHotelSelectionSaved = (hotel) => {
        if (!hotel) return;

        setSelectedHotel(hotel);

        setHotels((current) => {
            const hotelName = getItemName(hotel).toLowerCase();

            const exists = current.some((item) => {
                if (hotel.placeId && item.placeId) {
                    return hotel.placeId === item.placeId;
                }

                return getItemName(item).toLowerCase() === hotelName;
            });

            return exists ? current : [hotel, ...current];
        });
    };

    if (loading) {
        return (
            <div className="trip-details-page">
                <div className="trip-loading" role="status">
                    <div className="loading-spinner" />
                    <p>Loading your trip...</p>
                </div>
            </div>
        );
    }

    if (error && !trip) {
        return (
            <div className="trip-details-page">
                <div className="trip-error">
                    <h2>Unable to load trip</h2>
                    <p>{error}</p>
                    <button type="button" onClick={loadTrip}>
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="trip-details-page">
                <div className="trip-error">
                    <h2>Trip not found</h2>
                    <p>This trip may have been deleted or may no longer be available.</p>
                </div>
            </div>
        );
    }

    const tripInterests = Array.isArray(trip.interests)
        ? trip.interests
        : EMPTY_ARRAY;

    return (
        <main className="trip-details-page">
            <section className="trip-hero">
                <div className="trip-hero-content">
                    <div className="trip-title-section">
                        <span className="trip-label">YOUR VOYAGO TRIP</span>
                        <h1>{trip.destination || "Your destination"}</h1>
                        <p className="trip-subtitle">
                            Your personalized travel plan
                        </p>
                    </div>

                    <div className="trip-info-grid">
                        <div className="trip-info-item">
                            <span className="info-icon" aria-hidden="true">📅</span>
                            <div>
                                <span className="info-label">DATES</span>
                                <strong>
                                    {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                                </strong>
                            </div>
                        </div>

                        <div className="trip-info-item">
                            <span className="info-icon" aria-hidden="true">👤</span>
                            <div>
                                <span className="info-label">TRAVELERS</span>
                                <strong>
                                    {trip.travelers ?? "—"}{" "}
                                    {Number(trip.travelers) === 1 ? "Traveler" : "Travelers"}
                                </strong>
                            </div>
                        </div>

                        <div className="trip-info-item">
                            <span className="info-icon" aria-hidden="true">💰</span>
                            <div>
                                <span className="info-label">BUDGET</span>
                                <strong className="capitalize">
                                    {trip.budget || "Not set"}
                                </strong>
                            </div>
                        </div>

                        <div className="trip-info-item">
                            <span className="info-icon" aria-hidden="true">✨</span>
                            <div>
                                <span className="info-label">INTERESTS</span>
                                <div className="interest-list">
                                    {tripInterests.length > 0 ? (
                                        tripInterests.map((interest) => (
                                            <span className="interest-tag" key={interest}>
                                                {interest}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="trip-subtitle">None selected</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {error && (
                <div className="trip-inline-error" role="alert">
                    {error}
                </div>
            )}

            <section className="map-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">EXPLORE YOUR TRIP</span>
                        <h2>🗺️ Interactive Trip Map</h2>
                        <p>Explore the places included in your day-by-day plan.</p>
                    </div>
                </div>

                {itinerary.length > 0 ? (
                    <div className="map-card">
                        <div className="map-day-selector">
                            <div className="map-day-title">
                                <span>DAY</span>
                                <strong>{selectedDay + 1}</strong>
                            </div>

                            <div className="day-buttons" aria-label="Select itinerary day">
                                {itinerary.map((day, index) => (
                                    <button
                                        type="button"
                                        key={day?._id || index}
                                        className={
                                            selectedDay === index
                                                ? "day-button active"
                                                : "day-button"
                                        }
                                        aria-pressed={selectedDay === index}
                                        onClick={() => setSelectedDay(index)}
                                    >
                                        <span className="day-number">{index + 1}</span>
                                        <span className="day-text">Day {index + 1}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="trip-map-wrapper">
                            <TripMap
                                tripId={trip._id || tripId}
                                destination={trip.destination}
                                itinerary={itinerary}
                                selectedDay={selectedDay}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="empty-map-state">
                        <div className="empty-icon">🗺️</div>
                        <h3>Your map is waiting</h3>
                        <p>Generate an itinerary to explore its stops on the map.</p>
                    </div>
                )}

                {resolvingRecommendations && (
                    <p className="trip-subtitle" role="status">
                        Updating recommendation map locations...
                    </p>
                )}

                {placesMessage && (
                    <p className="trip-subtitle" role="status">
                        {placesMessage}
                    </p>
                )}
            </section>

            <section className="itinerary-section">
                <div className="section-heading itinerary-heading">
                    <div>
                        <span className="section-kicker">AI POWERED</span>
                        <h2>📅 Your AI Itinerary</h2>
                        <p>
                            Generate or refresh the day-by-day plan for your trip.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="generate-button"
                        onClick={handleGenerateItinerary}
                        disabled={generating}
                    >
                        {generating ? "Generating..." : "✨ Regenerate itinerary"}
                    </button>
                </div>

                {itinerary.length === 0 ? (
                    <div className="empty-itinerary">
                        <div className="empty-icon">✨</div>
                        <h3>No itinerary generated yet</h3>
                        <p>Let VOYAGO create a personalized plan for your trip.</p>
                        <button
                            type="button"
                            className="generate-button large"
                            onClick={handleGenerateItinerary}
                            disabled={generating}
                        >
                            {generating ? "Creating your itinerary..." : "✨ Generate AI itinerary"}
                        </button>
                    </div>
                ) : (
                    <div className="itinerary-list">
                        {itinerary.map((day, dayIndex) => {
                            const activities = getActivities(day);

                            return (
                                <article
                                    className="day-card"
                                    key={day?._id || dayIndex}
                                >
                                    <div className="day-card-header">
                                        <div className="day-badge">
                                            DAY {dayIndex + 1}
                                        </div>

                                        <div className="day-title-wrapper">
                                            <h3>
                                                {day?.title ||
                                                    day?.theme ||
                                                    `Day ${dayIndex + 1}`}
                                            </h3>

                                            {day?.description && (
                                                <p>{day.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="activity-list">
                                        {activities.length > 0 ? (
                                            activities.map((activity, activityIndex) => (
                                                <div
                                                    className="activity-item"
                                                    key={activity?._id || activityIndex}
                                                >
                                                    <div className="activity-number">
                                                        {activityIndex + 1}
                                                    </div>

                                                    <div className="activity-content">
                                                        <h4>{getActivityName(activity)}</h4>
                                                        {getActivityDescription(activity) && (
                                                            <p>
                                                                {getActivityDescription(activity)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="trip-subtitle">
                                                No activities listed for this day yet.
                                            </p>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="recommendation-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">STAY</span>
                        <h2>🏨 Recommended Hotels</h2>
                        <p>Accommodation suggestions associated with this trip.</p>
                    </div>
                </div>

                {hotels.length > 0 ? (
                    <div className="recommendation-grid">
                        {hotels.map((hotel, index) => (
                            <article
                                className="recommendation-card"
                                key={hotel?.placeId || hotel?._id || index}
                            >
                                <div className="recommendation-icon">🏨</div>
                                <div className="recommendation-content">
                                    <span className="recommendation-type">HOTEL</span>
                                    <h3>{getItemName(hotel) || "Recommended hotel"}</h3>

                                    {hotel.description && <p>{hotel.description}</p>}

                                    {(hotel.address || hotel.location) && (
                                        <span className="recommendation-location">
                                            📍 {hotel.address || hotel.location}
                                        </span>
                                    )}

                                    {hotel.rating != null && (
                                        <span className="recommendation-price">
                                            ★ {hotel.rating}
                                        </span>
                                    )}

                                    {hotel.priceRange && (
                                        <span className="recommendation-price">
                                            {hotel.priceRange}
                                        </span>
                                    )}

                                    {hotel.website && (
                                        <p>
                                            <a
                                                href={hotel.website}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Visit website ↗
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="empty-recommendations">
                        No hotel recommendations available yet.
                    </div>
                )}
            </section>

            <section className="recommendation-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">BOOK YOUR STAY</span>
                        <h2>🏨 Find Your Stay</h2>
                        <p>
                            Search hotel options for {trip.destination || "your destination"}.
                        </p>
                    </div>
                </div>

                <HotelSearch
                    trip={trip}
                    initialHotels={hotels}
                    selectedHotel={selectedHotel}
                    onSelectionSaved={handleHotelSelectionSaved}
                />
            </section>

            <section className="recommendation-section">
                <div className="section-heading">
                    <div>
                        <span className="section-kicker">FOOD & DINING</span>
                        <h2>🍴 Recommended Restaurants</h2>
                        <p>Restaurant suggestions associated with your destination.</p>
                    </div>
                </div>

                {restaurants.length > 0 ? (
                    <div className="recommendation-grid">
                        {restaurants.map((restaurant, index) => (
                            <article
                                className="recommendation-card"
                                key={restaurant?.placeId || restaurant?._id || index}
                            >
                                <div className="recommendation-icon">🍴</div>
                                <div className="recommendation-content">
                                    <span className="recommendation-type">
                                        RESTAURANT
                                    </span>
                                    <h3>
                                        {getItemName(restaurant) || "Recommended restaurant"}
                                    </h3>

                                    {restaurant.description && (
                                        <p>{restaurant.description}</p>
                                    )}

                                    {(restaurant.address || restaurant.location) && (
                                        <span className="recommendation-location">
                                            📍 {restaurant.address || restaurant.location}
                                        </span>
                                    )}

                                    {restaurant.rating != null && (
                                        <span className="recommendation-price">
                                            ★ {restaurant.rating}
                                        </span>
                                    )}

                                    {restaurant.cuisine && (
                                        <span className="recommendation-cuisine">
                                            {restaurant.cuisine}
                                        </span>
                                    )}

                                    {restaurant.website && (
                                        <p>
                                            <a
                                                href={restaurant.website}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Visit website ↗
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="empty-recommendations">
                        No restaurant recommendations available yet.
                    </div>
                )}
            </section>
        </main>
    );
}

export default TripDetails;
