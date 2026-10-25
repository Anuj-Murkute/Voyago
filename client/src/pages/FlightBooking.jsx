
import { useState } from "react";
import "./BookingPages.css";
import "./FlightBooking.css";

function getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function FlightBooking() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [departure, setDeparture] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [travelers, setTravelers] = useState("1");
    const [tripType, setTripType] = useState("Round Trip");
    const [search, setSearch] = useState(null);
    const [error, setError] = useState("");

    const today = getToday();

    function updateField(setter, value) {
        setter(value);
        setSearch(null);
        setError("");
    }

    function handleSearch(event) {
        event.preventDefault();
        setError("");
        setSearch(null);

        const origin = from.trim();
        const destination = to.trim();
        const passengerCount = Number(travelers);

        if (!origin || !destination) {
            setError("Enter both your departure and destination cities.");
            return;
        }

        if (origin.toLowerCase() === destination.toLowerCase()) {
            setError("Departure and destination must be different.");
            return;
        }

        if (!departure || departure < today) {
            setError("Choose a departure date that is today or later.");
            return;
        }

        if (
            tripType === "Round Trip" &&
            (!returnDate || returnDate < departure)
        ) {
            setError("Return date must be on or after your departure date.");
            return;
        }

        if (
            !Number.isInteger(passengerCount) ||
            passengerCount < 1 ||
            passengerCount > 20
        ) {
            setError("Travelers must be between 1 and 20.");
            return;
        }

        setSearch({
            from: origin,
            to: destination,
            departure,
            returnDate: tripType === "Round Trip" ? returnDate : "",
            travelers: passengerCount,
            tripType,
        });
    }

    function openFlightSearch() {
        if (!search) return;

        const params = new URLSearchParams({
            q: `${search.from} to ${search.to}`,
            d: search.departure,
        });

        if (search.tripType === "Round Trip" && search.returnDate) {
            params.set("r", search.returnDate);
        }

        window.open(
            `https://www.google.com/travel/flights?${params.toString()}`,
            "_blank",
            "noopener,noreferrer"
        );
    }

    function formatDate(dateString) {
        if (!dateString) return "";

        return new Date(`${dateString}T12:00:00`).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    }

    return (
        <main className="booking-page flights-page">
            <section className="flight-hero">
                <div className="flight-hero-copy">
                    <span className="flight-eyebrow">
                        <span className="flight-eyebrow-dot" />
                        YOUR NEXT JOURNEY STARTS HERE
                    </span>

                    <h1>
                        The world is closer
                        <br />
                        <span>than you think.</span>
                    </h1>

                    <p className="flight-hero-description">
                        Find your route, choose your dates, and get ready
                        for the journey ahead.
                    </p>

                    <div className="flight-trust-row">
                        <span>
                            <span className="flight-trust-icon">↗</span>
                            Flexible trip planning
                        </span>
                        <span>
                            <span className="flight-trust-icon">◎</span>
                            Explore flight options
                        </span>
                    </div>
                </div>

                <div className="flight-hero-art" aria-hidden="true">
                    <div className="flight-orbit flight-orbit-one" />
                    <div className="flight-orbit flight-orbit-two" />

                    <div className="flight-art-glow" />

                    <div className="flight-route-line">
                        <span className="flight-route-point flight-route-point-start" />
                        <span className="flight-route-point flight-route-point-end" />
                    </div>

                    <div className="flight-plane">
                        <svg
                            viewBox="0 0 120 120"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M105 14C101 10 94 12 88 18L68 38L31 22C27 20 23 21 20 24L17 27L46 48L29 65L15 61L9 67L25 80L38 96L44 90L40 76L57 59L78 88L81 85C84 82 85 78 83 74L67 37L87 17C93 11 101 9 105 14Z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>

                    <div className="flight-art-label flight-art-label-top">
                        <span className="flight-art-label-icon">✦</span>
                        Your journey
                    </div>

                    <div className="flight-art-label flight-art-label-bottom">
                        <span className="flight-art-label-dot" />
                        New destinations await
                    </div>
                </div>

                <div className="flight-hero-watermark" aria-hidden="true">
                    VOYAGO
                </div>
            </section>

            <section className="flight-search-shell">
                <div className="flight-search-heading">
                    <div>
                        <span className="flight-section-kicker">
                            FLIGHT SEARCH
                        </span>
                        <h2>Where would you like to go?</h2>
                        <p>Build your trip details below to explore available flights.</p>
                    </div>

                    <div className="flight-search-symbol" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M21 3L10.5 13.5"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                            />
                            <path
                                d="M21 3L14.3 21L10.5 13.5L3 9.7L21 3Z"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flight-search-form">
                    <div className="flight-trip-toggle" aria-label="Trip type">
                        <button
                            type="button"
                            className={tripType === "Round Trip" ? "active" : ""}
                            aria-pressed={tripType === "Round Trip"}
                            onClick={() => {
                                setTripType("Round Trip");
                                setSearch(null);
                                setError("");
                            }}
                        >
                            <span aria-hidden="true">⇄</span>
                            Round trip
                        </button>

                        <button
                            type="button"
                            className={tripType === "One Way" ? "active" : ""}
                            aria-pressed={tripType === "One Way"}
                            onClick={() => {
                                setTripType("One Way");
                                setReturnDate("");
                                setSearch(null);
                                setError("");
                            }}
                        >
                            <span aria-hidden="true">→</span>
                            One way
                        </button>
                    </div>

                    <div className="flight-fields-grid">
                        <div className="flight-field flight-location-field">
                            <label htmlFor="flight-from">FROM</label>
                            <div className="flight-input-wrap">
                                <span className="flight-field-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 21S19 14.8 19 9.5A7 7 0 1 0 5 9.5C5 14.8 12 21 12 21Z"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                        />
                                        <circle
                                            cx="12"
                                            cy="9.5"
                                            r="2.3"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                        />
                                    </svg>
                                </span>

                                <input
                                    id="flight-from"
                                    type="text"
                                    placeholder="Departure city"
                                    autoComplete="off"
                                    maxLength={100}
                                    value={from}
                                    onChange={(event) =>
                                        updateField(setFrom, event.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="flight-swap-column">
                            <button
                                type="button"
                                className="flight-swap-button"
                                aria-label="Swap departure and destination"
                                title="Swap cities"
                                onClick={() => {
                                    setFrom(to);
                                    setTo(from);
                                    setSearch(null);
                                    setError("");
                                }}
                            >
                                ⇄
                            </button>
                        </div>

                        <div className="flight-field flight-location-field">
                            <label htmlFor="flight-to">TO</label>
                            <div className="flight-input-wrap">
                                <span className="flight-field-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 21S19 14.8 19 9.5A7 7 0 1 0 5 9.5C5 14.8 12 21 12 21Z"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                        />
                                        <circle
                                            cx="12"
                                            cy="9.5"
                                            r="2.3"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                        />
                                    </svg>
                                </span>

                                <input
                                    id="flight-to"
                                    type="text"
                                    placeholder="Destination city"
                                    autoComplete="off"
                                    maxLength={100}
                                    value={to}
                                    onChange={(event) =>
                                        updateField(setTo, event.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="flight-field">
                            <label htmlFor="flight-departure">DEPARTURE</label>
                            <div className="flight-input-wrap">
                                <span className="flight-field-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <rect
                                            x="3.5"
                                            y="5.5"
                                            width="17"
                                            height="15"
                                            rx="2"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                        />
                                        <path
                                            d="M7.5 3.5V7.5M16.5 3.5V7.5M3.5 10H20.5"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>

                                <input
                                    id="flight-departure"
                                    type="date"
                                    min={today}
                                    value={departure}
                                    onChange={(event) => {
                                        const nextDeparture = event.target.value;
                                        setDeparture(nextDeparture);

                                        if (returnDate && nextDeparture > returnDate) {
                                            setReturnDate("");
                                        }

                                        setSearch(null);
                                        setError("");
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {tripType === "Round Trip" && (
                            <div className="flight-field">
                                <label htmlFor="flight-return">RETURN</label>
                                <div className="flight-input-wrap">
                                    <span className="flight-field-icon" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <rect
                                                x="3.5"
                                                y="5.5"
                                                width="17"
                                                height="15"
                                                rx="2"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                            />
                                            <path
                                                d="M7.5 3.5V7.5M16.5 3.5V7.5M3.5 10H20.5"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </span>

                                    <input
                                        id="flight-return"
                                        type="date"
                                        min={departure || today}
                                        value={returnDate}
                                        onChange={(event) =>
                                            updateField(setReturnDate, event.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flight-field">
                            <label htmlFor="flight-travelers">TRAVELERS</label>
                            <div className="flight-input-wrap">
                                <span className="flight-field-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <circle
                                            cx="9"
                                            cy="8"
                                            r="3.2"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                        />
                                        <path
                                            d="M2.8 20V18.5A5.2 5.2 0 0 1 8 13.3H10A5.2 5.2 0 0 1 15.2 18.5V20"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M15 5.2A3.2 3.2 0 0 1 15 11.4M17 13.5A5.2 5.2 0 0 1 21.2 18.5V20"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>

                                <select
                                    id="flight-travelers"
                                    value={travelers}
                                    onChange={(event) =>
                                        updateField(setTravelers, event.target.value)
                                    }
                                    required
                                >
                                    {Array.from({ length: 20 }, (_, index) => index + 1).map(
                                        (count) => (
                                            <option key={count} value={String(count)}>
                                                {count} {count === 1 ? "traveler" : "travelers"}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="flight-error" role="alert">
                            <span aria-hidden="true">!</span>
                            {error}
                        </p>
                    )}

                    <div className="flight-form-footer">
                        <p>
                            <span aria-hidden="true">ⓘ</span>
                            Flight schedules and fares are checked with the provider.
                        </p>

                        <button type="submit" className="flight-search-button">
                            <span>Explore flights</span>
                            <span className="flight-button-arrow" aria-hidden="true">
                                ↗
                            </span>
                        </button>
                    </div>
                </form>
            </section>

            {search ? (
                <section className="flight-result-panel" aria-live="polite">
                    <div className="flight-result-topline">
                        <span className="flight-section-kicker">YOUR SEARCH</span>
                        <span className="flight-result-status">
                            <span />
                            Ready to explore
                        </span>
                    </div>

                    <div className="flight-route-summary">
                        <div className="flight-city-block">
                            <span className="flight-city-label">FROM</span>
                            <h2>{search.from}</h2>
                            <p>Departure city</p>
                        </div>

                        <div className="flight-route-visual" aria-hidden="true">
                            <span className="flight-route-circle">✈</span>
                            <span className="flight-route-dash" />
                            <span className="flight-route-circle">●</span>
                        </div>

                        <div className="flight-city-block flight-city-destination">
                            <span className="flight-city-label">TO</span>
                            <h2>{search.to}</h2>
                            <p>Destination city</p>
                        </div>
                    </div>

                    <div className="flight-summary-details">
                        <div>
                            <span className="flight-summary-icon" aria-hidden="true">▦</span>
                            <div>
                                <span>DEPARTURE</span>
                                <strong>{formatDate(search.departure)}</strong>
                            </div>
                        </div>

                        {search.returnDate && (
                            <div>
                                <span className="flight-summary-icon" aria-hidden="true">↩</span>
                                <div>
                                    <span>RETURN</span>
                                    <strong>{formatDate(search.returnDate)}</strong>
                                </div>
                            </div>
                        )}

                        <div>
                            <span className="flight-summary-icon" aria-hidden="true">♙</span>
                            <div>
                                <span>TRAVELERS</span>
                                <strong>
                                    {search.travelers}{" "}
                                    {search.travelers === 1 ? "traveler" : "travelers"}
                                </strong>
                            </div>
                        </div>

                        <div>
                            <span className="flight-summary-icon" aria-hidden="true">⇄</span>
                            <div>
                                <span>TRIP TYPE</span>
                                <strong>{search.tripType}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="flight-provider-note">
                        <div>
                            <span className="flight-provider-note-icon" aria-hidden="true">
                                ↗
                            </span>
                            <div>
                                <strong>Ready for takeoff?</strong>
                                <p>
                                    Continue to Google Flights to check current schedules,
                                    availability and prices.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="flight-search-button"
                            onClick={openFlightSearch}
                        >
                            <span>View available flights</span>
                            <span className="flight-button-arrow" aria-hidden="true">
                                ↗
                            </span>
                        </button>
                    </div>

                    <p className="flight-disclaimer">
                        Voyago prepares your search but does not retrieve live flight
                        availability or complete bookings on this page.
                    </p>
                </section>
            ) : (
                <section className="flight-inspiration">
                    <div className="flight-inspiration-icon" aria-hidden="true">
                        ✧
                    </div>
                    <div>
                        <span className="flight-section-kicker">YOUR NEXT ADVENTURE</span>
                        <h2>One search closer to somewhere new.</h2>
                        <p>
                            Add your travel details above to prepare a flight search
                            tailored to your journey.
                        </p>
                    </div>
                    <div className="flight-inspiration-decoration" aria-hidden="true">
                        ✈
                    </div>
                </section>
            )}
        </main>
    );
}

export default FlightBooking;
