
import { useState } from "react";
import { Link } from "react-router-dom";
import "./BookingPages.css";
import "./HotelBooking.css";

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const destinations = [
    {
        name: "Goa",
        country: "India",
        description: "Beachfront escapes & sunset stays",
        image:
            "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
    },
    {
        name: "Manali",
        country: "Himachal Pradesh, India",
        description: "Mountain views & cozy retreats",
        image:
            "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=85",
    },
    {
        name: "Jaipur",
        country: "Rajasthan, India",
        description: "Heritage hotels & royal charm",
        image:
            "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=85",
    },
];

function HotelBooking() {
    const [destination, setDestination] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [guests, setGuests] = useState("1");
    const [rooms, setRooms] = useState("1");
    const [searchMessage, setSearchMessage] = useState("");

    // Gemini trip-generation state
    const [generatingTrips, setGeneratingTrips] = useState(false);
    const [generatedTrips, setGeneratedTrips] = useState([]);
    const [tripOverview, setTripOverview] = useState("");
    const [tripError, setTripError] = useState("");
    const [tripBudgetNote, setTripBudgetNote] = useState("");

    const today = getToday();

    const clearGeneratedTrips = () => {
        setGeneratedTrips([]);
        setTripOverview("");
        setTripBudgetNote("");
        setTripError("");
    };

    const handleSearch = async (event) => {
        event.preventDefault();

        setSearchMessage("");
        clearGeneratedTrips();

        const guestCount = Number(guests);
        const roomCount = Number(rooms);

        if (!destination.trim()) {
            setSearchMessage("Please enter your destination.");
            return;
        }

        if (!checkIn || checkIn < today) {
            setSearchMessage("Please select a valid check-in date.");
            return;
        }

        if (!checkOut || checkOut <= checkIn) {
            setSearchMessage("Check-out must be after check-in.");
            return;
        }

        if (
            !Number.isInteger(guestCount) ||
            guestCount < 1 ||
            guestCount > 20
        ) {
            setSearchMessage("Guests must be between 1 and 20.");
            return;
        }

        if (
            !Number.isInteger(roomCount) ||
            roomCount < 1 ||
            roomCount > 10
        ) {
            setSearchMessage("Rooms must be between 1 and 10.");
            return;
        }

        setGeneratingTrips(true);

        try {
            const API_URL =
                import.meta.env.VITE_API_URL ||
                "http://localhost:5000/api";

            const response = await fetch(
                `${API_URL}/ai-travel/hotels/generate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        destination: destination.trim(),
                        checkIn,
                        checkOut,
                        guests: guestCount,
                        rooms: roomCount,
                        budget: "Flexible",
                        interests:
                            "Sightseeing, local food, relaxation, cultural experiences",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        "Could not generate hotel trips. Please try again."
                );
            }

            
const normalizedTrips = (Array.isArray(data.trips) ? data.trips : []).map(
    (trip, index) => {
        const cost = Number(
            trip.estimatedCost ?? trip.priceEstimate ?? trip.price
        );
        const currency = trip.currency || data.currency || "INR";

        return {
            ...trip,
            id: trip.id || `hotel-package-${index + 1}`,
            name: trip.title || trip.name || `Trip package ${index + 1}`,
            destination: trip.destination || destination.trim(),
            duration: Number.parseInt(trip.duration, 10) || 0,
            priceEstimate:
                Number.isFinite(cost) && cost > 0
                    ? new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency,
                          maximumFractionDigits: 0,
                      }).format(cost)
                    : "Estimate unavailable",
            highlights: Array.isArray(trip.highlights)
                ? trip.highlights
                : [],
            itinerary: Array.isArray(trip.itinerary)
                ? trip.itinerary
                : [],
            travelTips: Array.isArray(trip.travelTips)
                ? trip.travelTips
                : [],
        };
    }
);

setGeneratedTrips(normalizedTrips);

            setTripOverview(data.overview || "");
            setTripBudgetNote(
                data.budgetDisclaimer ||
                    "All prices are estimates, not live hotel quotes."
            );

            if (!data.trips?.length) {
                setTripError(
                    "No trip packages were returned. Please try again."
                );
            }
        } catch (error) {
            setTripError(
                error.message ||
                    "Unable to generate hotel trips. Please try again."
            );
        } finally {
            setGeneratingTrips(false);
        }
    };

    const selectDestination = (name) => {
        setDestination(name);
        setSearchMessage("");
        clearGeneratedTrips();

        document.getElementById("hotel-destination")?.focus();
    };

    return (
        <main className="booking-page hotels-page">
            <section className="hotel-hero">
                <div className="hotel-hero-glow" aria-hidden="true" />

                <div className="hotel-hero-content">
                    <div className="hotel-eyebrow">
                        <span className="hotel-eyebrow-dot" />
                        YOUR NEXT STAY STARTS HERE
                    </div>

                    <h1>
                        Stay somewhere
                        <br />
                        <span>extraordinary.</span>
                    </h1>

                    <p className="hotel-hero-description">
                        From peaceful mountain hideaways to vibrant city
                        escapes, find a place that makes every journey feel
                        special.
                    </p>

                    <div className="hotel-hero-points">
                        <span>
                            <span aria-hidden="true">✦</span> Stays for every
                            journey
                        </span>
                        <span>
                            <span aria-hidden="true">⌖</span> Destinations
                            worldwide
                        </span>
                    </div>
                </div>

                <div className="hotel-hero-art" aria-hidden="true">
                    <div className="hotel-art-orbit hotel-art-orbit-one" />
                    <div className="hotel-art-orbit hotel-art-orbit-two" />

                    <div className="hotel-art-building">
                        <div className="hotel-art-roof" />

                        <div className="hotel-art-balcony">
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <div className="hotel-art-windows">
                            {Array.from({ length: 12 }).map((_, index) => (
                                <span key={index} />
                            ))}
                        </div>
                    </div>

                    <div className="hotel-art-star hotel-art-star-one">
                        ✦
                    </div>

                    <div className="hotel-art-star hotel-art-star-two">
                        ✧
                    </div>

                    <div className="hotel-art-label">
                        <span className="hotel-art-label-icon">✦</span>
                        <span>
                            <strong>Find your escape</strong>
                            <small>Make the journey yours</small>
                        </span>
                    </div>
                </div>
            </section>

            <section className="hotel-search-section">
                <div className="hotel-section-heading">
                    <div>
                        <span className="hotel-section-kicker">
                            PLAN YOUR STAY
                        </span>

                        <h2>Where are you headed?</h2>

                        <p>
                            Choose your destination, dates and travel party.
                        </p>
                    </div>

                    <span className="hotel-search-number">
                        01 / SEARCH
                    </span>
                </div>

                <div className="hotel-search-card">
                    <form onSubmit={handleSearch}>
                        <div className="hotel-search-grid">
                            <div className="hotel-field hotel-field-destination">
                                <label htmlFor="hotel-destination">
                                    DESTINATION
                                </label>

                                <div className="hotel-input-wrap">
                                    <span
                                        className="hotel-field-icon"
                                        aria-hidden="true"
                                    >
                                        ⌖
                                    </span>

                                    <input
                                        id="hotel-destination"
                                        name="destination"
                                        type="text"
                                        placeholder="City, hotel or destination"
                                        autoComplete="off"
                                        value={destination}
                                        onChange={(event) => {
                                            setDestination(event.target.value);
                                            setSearchMessage("");
                                            clearGeneratedTrips();
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="hotel-field">
                                <label htmlFor="hotel-checkin">
                                    CHECK-IN
                                </label>

                                <div className="hotel-input-wrap">
                                    <span
                                        className="hotel-field-icon"
                                        aria-hidden="true"
                                    >
                                        ↘
                                    </span>

                                    <input
                                        id="hotel-checkin"
                                        name="checkIn"
                                        type="date"
                                        min={today}
                                        value={checkIn}
                                        onChange={(event) => {
                                            const value = event.target.value;

                                            setCheckIn(value);
                                            setSearchMessage("");
                                            clearGeneratedTrips();

                                            if (
                                                checkOut &&
                                                checkOut <= value
                                            ) {
                                                setCheckOut("");
                                            }
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="hotel-field">
                                <label htmlFor="hotel-checkout">
                                    CHECK-OUT
                                </label>

                                <div className="hotel-input-wrap">
                                    <span
                                        className="hotel-field-icon"
                                        aria-hidden="true"
                                    >
                                        ↗
                                    </span>

                                    <input
                                        id="hotel-checkout"
                                        name="checkOut"
                                        type="date"
                                        min={checkIn || today}
                                        value={checkOut}
                                        onChange={(event) => {
                                            setCheckOut(event.target.value);
                                            setSearchMessage("");
                                            clearGeneratedTrips();
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="hotel-field">
                                <label htmlFor="hotel-guests">
                                    GUESTS
                                </label>

                                <div className="hotel-input-wrap">
                                    <span
                                        className="hotel-field-icon"
                                        aria-hidden="true"
                                    >
                                        ♙
                                    </span>

                                    <input
                                        id="hotel-guests"
                                        name="guests"
                                        type="number"
                                        min="1"
                                        max="20"
                                        step="1"
                                        value={guests}
                                        onChange={(event) => {
                                            setGuests(event.target.value);
                                            setSearchMessage("");
                                            clearGeneratedTrips();
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="hotel-field">
                                <label htmlFor="hotel-rooms">
                                    ROOMS
                                </label>

                                <div className="hotel-input-wrap">
                                    <span
                                        className="hotel-field-icon"
                                        aria-hidden="true"
                                    >
                                        ▤
                                    </span>

                                    <input
                                        id="hotel-rooms"
                                        name="rooms"
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="1"
                                        value={rooms}
                                        onChange={(event) => {
                                            setRooms(event.target.value);
                                            setSearchMessage("");
                                            clearGeneratedTrips();
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="hotel-search-footer">
                            <p>
                                <span aria-hidden="true">✦</span>
                                Let Gemini plan a stay around your journey.
                            </p>

                            <button
                                type="submit"
                                className="hotel-search-button"
                                disabled={generatingTrips}
                            >
                                <span>
                                    {generatingTrips
                                        ? "Generating your trips..."
                                        : "Generate hotel trips"}
                                </span>

                                <span aria-hidden="true">→</span>
                            </button>
                        </div>

                        {searchMessage && (
                            <p
                                className="hotel-search-message"
                                role="alert"
                            >
                                {searchMessage}
                            </p>
                        )}
                    </form>
                </div>
            </section>

            {/* Gemini-generated hotel packages and itineraries */}
            {(generatingTrips ||
                generatedTrips.length > 0 ||
                tripError ||
                tripOverview) && (
                <section
                    className="hotel-ai-results"
                    aria-live="polite"
                    aria-busy={generatingTrips}
                >
                    <div className="hotel-section-heading">
                        <div>
                            <span className="hotel-section-kicker">
                                VOYAGO AI TRIP PLANNER
                            </span>

                            <h2>Your personalized hotel trips</h2>

                            <p>
                                Explore stays, experiences and daily plans
                                tailored to your destination.
                            </p>
                        </div>

                        <span className="hotel-search-number">
                            GEMINI AI
                        </span>
                    </div>

                    {generatingTrips && (
                        <div className="hotel-ai-status" role="status">
                            <span
                                className="hotel-ai-status-icon"
                                aria-hidden="true"
                            >
                                ✦
                            </span>

                            <div>
                                <strong>Crafting your getaway...</strong>
                                <p>
                                    Gemini is creating three personalized
                                    packages with accommodation suggestions,
                                    activities and day-by-day itineraries.
                                </p>
                            </div>
                        </div>
                    )}

                    {tripError && (
                        <p
                            className="hotel-search-message"
                            role="alert"
                        >
                            {tripError}
                        </p>
                    )}

                    {tripOverview && (
                        <div className="hotel-ai-overview">
                            <span className="hotel-section-kicker">
                                YOUR TRIP OVERVIEW
                            </span>

                            <p>{tripOverview}</p>

                            {tripBudgetNote && (
                                <p className="hotel-inspiration-note">
                                    {tripBudgetNote}
                                </p>
                            )}
                        </div>
                    )}

                    {generatedTrips.length > 0 && (
                        <div className="hotel-ai-trip-grid">
                            {generatedTrips.map((trip) => (
                                <article
                                    className="hotel-ai-trip-card"
                                    key={trip.id}
                                >
                                    <span className="hotel-section-kicker">
                                        AI-GENERATED PACKAGE
                                    </span>

                                    <h3>{trip.name}</h3>

                                    <p>{trip.description}</p>

                                    <div className="hotel-ai-trip-meta">
                                        <span>
                                            <strong>Destination</strong>
                                            <br />
                                            {trip.destination}
                                        </span>

                                        <span>
                                            <strong>Duration</strong>
                                            <br />
                                            {trip.duration} days
                                        </span>

                                        <span>
                                            <strong>Estimated budget</strong>
                                            <br />
                                            {trip.priceEstimate}
                                        </span>
                                    </div>

                                    <div className="hotel-ai-accommodation">
                                        <h4>Where you'll stay</h4>
                                        <p>{trip.accommodation}</p>
                                    </div>

                                    {trip.highlights?.length > 0 && (
                                        <div className="hotel-ai-highlights">
                                            <h4>Trip highlights</h4>

                                            <ul>
                                                {trip.highlights.map(
                                                    (highlight, index) => (
                                                        <li key={index}>
                                                            {highlight}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {trip.itinerary?.length > 0 && (
                                        <div className="hotel-ai-itinerary">
                                            <h4>Day-by-day itinerary</h4>

                                            {trip.itinerary.map((day) => (
                                                <details key={day.day}>
                                                    <summary>
                                                        <span>
                                                            Day {day.day}
                                                        </span>
                                                        {" — "}
                                                        {day.title}
                                                    </summary>

                                                    <div className="hotel-ai-day-content">
                                                        <p>
                                                            <strong>
                                                                Morning
                                                            </strong>
                                                            {day.morning}
                                                        </p>

                                                        <p>
                                                            <strong>
                                                                Afternoon
                                                            </strong>
                                                            {day.afternoon}
                                                        </p>

                                                        <p>
                                                            <strong>
                                                                Evening
                                                            </strong>
                                                            {day.evening}
                                                        </p>
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                    )}

                                    {trip.travelTips?.length > 0 && (
                                        <div className="hotel-ai-tips">
                                            <h4>Travel tips</h4>

                                            <ul>
                                                {trip.travelTips.map(
                                                    (tip, index) => (
                                                        <li key={index}>
                                                            {tip}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    <p className="hotel-ai-disclaimer">
                                        AI-generated suggestion. Hotel
                                        availability, rates and reservations
                                        have not been verified.
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}

            <section className="hotel-destinations-section">
                <div className="hotel-section-heading hotel-destination-heading">
                    <div>
                        <span className="hotel-section-kicker">
                            A LITTLE INSPIRATION
                        </span>

                        <h2>Places worth staying for</h2>

                        <p>
                            Start with a destination and let the journey
                            unfold.
                        </p>
                    </div>

                    <span className="hotel-search-number">
                        02 / EXPLORE
                    </span>
                </div>

                <div className="hotel-destination-grid">
                    {destinations.map((place, index) => (
                        <button
                            type="button"
                            className="hotel-destination-card"
                            key={place.name}
                            onClick={() => selectDestination(place.name)}
                            aria-label={`Search hotels in ${place.name}`}
                        >
                            <div className="hotel-destination-image-wrap">
                                <img
                                    src={place.image}
                                    alt=""
                                    className="hotel-destination-image"
                                    loading="lazy"
                                />

                                <span className="hotel-destination-index">
                                    0{index + 1}
                                </span>

                                <span className="hotel-destination-arrow">
                                    ↗
                                </span>
                            </div>

                            <div className="hotel-destination-info">
                                <div>
                                    <h3>{place.name}</h3>
                                    <p>{place.country}</p>
                                </div>

                                <p className="hotel-destination-description">
                                    {place.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <p className="hotel-inspiration-note">
                    Choose a destination above to start planning your
                    personalized stay. Hotel availability and live pricing
                    require a separate booking service.
                </p>
            </section>

            <section className="hotel-bottom-banner">
                <div className="hotel-bottom-icon" aria-hidden="true">
                    ✧
                </div>

                <div>
                    <h2>Every great trip needs a great stay.</h2>

                    <p>
                        Explore your next adventure and make room for
                        something memorable.
                    </p>
                </div>

                <Link to="/explore" className="hotel-explore-link">
                    Explore VOYAGO <span aria-hidden="true">→</span>
                </Link>
            </section>
        </main>
    );
}

export default HotelBooking;
