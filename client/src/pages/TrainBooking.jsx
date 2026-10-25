import { useState } from "react";
import { Link } from "react-router-dom";
import "./BookingPages.css";
import "./TrainBooking.css";

function getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function TrainBooking() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [date, setDate] = useState("");
    const [travelers, setTravelers] = useState("1");
    const [classType, setClassType] = useState("AC");
    const [search, setSearch] = useState(null);
    const [error, setError] = useState("");

    function handleSearch(event) {
        event.preventDefault();
        setError("");
        setSearch(null);

        const origin = from.trim();
        const destination = to.trim();
        const count = Number(travelers);

        if (!origin || !destination) {
            setError("Enter both departure and destination stations.");
            return;
        }

        if (origin.toLowerCase() === destination.toLowerCase()) {
            setError("Departure and destination must be different.");
            return;
        }

        if (!date || date < getToday()) {
            setError("Choose a valid journey date.");
            return;
        }

        if (!Number.isInteger(count) || count < 1 || count > 20) {
            setError("Travelers must be between 1 and 20.");
            return;
        }

        setSearch({
            from: origin,
            to: destination,
            date,
            travelers: count,
            classType,
        });
    }

    function openTrainSearch() {
        window.open(
            "https://www.irctc.co.in/nget/train-search",
            "_blank",
            "noopener,noreferrer"
        );
    }

    function swapStations() {
        setFrom(to);
        setTo(from);
        setError("");
        setSearch(null);
    }

    return (
        <main className="booking-page trains-page">
            <section className="train-hero">
                <div className="train-hero-content">
                    <span className="train-eyebrow">
                        <span className="train-eyebrow-dot" />
                        THE JOURNEY IS PART OF THE DESTINATION
                    </span>

                    <h1>
                        Take the scenic
                        <br />
                        <span>route.</span>
                    </h1>

                    <p className="train-hero-description">
                        From quick city connections to cross-country adventures,
                        plan your next rail journey with VOYAGO.
                    </p>

                    <div className="train-hero-highlights">
                        <span>
                            <span aria-hidden="true">✦</span> Your route, your
                            choice
                        </span>
                        <span>
                            <span aria-hidden="true">↗</span> Continue with IRCTC
                        </span>
                    </div>
                </div>

                <div className="train-hero-art" aria-hidden="true">
                    <div className="train-art-sun" />
                    <div className="train-art-mountain train-mountain-back" />
                    <div className="train-art-mountain train-mountain-front" />
                    <div className="train-art-track train-track-one" />
                    <div className="train-art-track train-track-two" />

                    <div className="train-art-train">
                        <div className="train-art-train-window">
                            <span />
                            <span />
                            <span />
                        </div>
                        <div className="train-art-train-front">
                            <span />
                            <span />
                        </div>
                        <div className="train-art-train-lights">
                            <i />
                            <i />
                        </div>
                    </div>

                    <span className="train-art-spark train-spark-one">✦</span>
                    <span className="train-art-spark train-spark-two">✧</span>

                    <div className="train-art-label">
                        <span className="train-art-label-icon">↗</span>
                        <span>
                            <strong>Next stop: adventure</strong>
                            <small>Your journey begins here</small>
                        </span>
                    </div>
                </div>
            </section>

            <section className="train-search-section">
                <div className="train-section-heading">
                    <div>
                        <span className="train-section-kicker">
                            YOUR JOURNEY
                        </span>
                        <h2>Where will the tracks take you?</h2>
                        <p>
                            Enter your route and preferences to prepare your
                            train search.
                        </p>
                    </div>
                    <span className="train-section-number">01 / PLAN</span>
                </div>

                <div className="train-search-card">
                    <form onSubmit={handleSearch}>
                        <div className="train-route-grid">
                            <div className="train-field">
                                <label htmlFor="train-from">FROM</label>
                                <div className="train-input-wrap">
                                    <span className="train-field-icon">
                                        <span aria-hidden="true">●</span>
                                    </span>
                                    <input
                                        id="train-from"
                                        type="text"
                                        placeholder="Departure city or station"
                                        value={from}
                                        maxLength={120}
                                        autoComplete="off"
                                        onChange={(event) => {
                                            setFrom(event.target.value);
                                            setError("");
                                            setSearch(null);
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                className="train-swap-button"
                                onClick={swapStations}
                                aria-label="Swap departure and destination"
                                title="Swap stations"
                            >
                                ⇄
                            </button>

                            <div className="train-field">
                                <label htmlFor="train-to">TO</label>
                                <div className="train-input-wrap">
                                    <span className="train-field-icon train-destination-icon">
                                        <span aria-hidden="true">●</span>
                                    </span>
                                    <input
                                        id="train-to"
                                        type="text"
                                        placeholder="Destination city or station"
                                        value={to}
                                        maxLength={120}
                                        autoComplete="off"
                                        onChange={(event) => {
                                            setTo(event.target.value);
                                            setError("");
                                            setSearch(null);
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="train-details-grid">
                            <div className="train-field">
                                <label htmlFor="train-date">JOURNEY DATE</label>
                                <div className="train-input-wrap">
                                    <span className="train-field-icon">
                                        <span aria-hidden="true">▦</span>
                                    </span>
                                    <input
                                        id="train-date"
                                        type="date"
                                        min={getToday()}
                                        value={date}
                                        onChange={(event) => {
                                            setDate(event.target.value);
                                            setError("");
                                            setSearch(null);
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="train-field">
                                <label htmlFor="train-travelers">
                                    TRAVELERS
                                </label>
                                <div className="train-input-wrap">
                                    <span className="train-field-icon">
                                        <span aria-hidden="true">♙</span>
                                    </span>
                                    <input
                                        id="train-travelers"
                                        type="number"
                                        min="1"
                                        max="20"
                                        step="1"
                                        value={travelers}
                                        onChange={(event) => {
                                            setTravelers(event.target.value);
                                            setError("");
                                            setSearch(null);
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="train-field">
                                <label htmlFor="train-class">TRAVEL CLASS</label>
                                <div className="train-input-wrap">
                                    <span className="train-field-icon">
                                        <span aria-hidden="true">▤</span>
                                    </span>
                                    <select
                                        id="train-class"
                                        value={classType}
                                        onChange={(event) => {
                                            setClassType(event.target.value);
                                            setError("");
                                            setSearch(null);
                                        }}
                                    >
                                        <option value="AC">AC</option>
                                        <option value="First Class">
                                            First Class
                                        </option>
                                        <option value="Second Class">
                                            Second Class
                                        </option>
                                        <option value="Sleeper">Sleeper</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="train-error-message" role="alert">
                                <span aria-hidden="true">!</span>
                                {error}
                            </p>
                        )}

                        <div className="train-search-footer">
                            <p>
                                <span aria-hidden="true">✦</span>
                                Your journey details, all in one place.
                            </p>

                            <button
                                type="submit"
                                className="train-search-button"
                            >
                                Prepare journey <span aria-hidden="true">→</span>
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {search ? (
                <section className="train-results-section" aria-live="polite">
                    <div className="train-section-heading">
                        <div>
                            <span className="train-section-kicker">
                                YOUR ROUTE SUMMARY
                            </span>
                            <h2>Ready for the next stop?</h2>
                            <p>
                                Review your details before continuing to the
                                official train booking service.
                            </p>
                        </div>
                        <span className="train-section-number">02 / REVIEW</span>
                    </div>

                    <div className="train-result-card">
                        <div className="train-result-topline">
                            <span className="train-result-badge">
                                <span /> ROUTE PREPARED
                            </span>
                            <span className="train-result-date">
                                {search.date}
                            </span>
                        </div>

                        <div className="train-route-summary">
                            <div className="train-route-endpoint">
                                <span>FROM</span>
                                <h3>{search.from}</h3>
                            </div>

                            <div className="train-route-connector">
                                <span className="train-route-line" />
                                <span className="train-route-icon">🚆</span>
                                <span className="train-route-line" />
                            </div>

                            <div className="train-route-endpoint train-route-end">
                                <span>TO</span>
                                <h3>{search.to}</h3>
                            </div>
                        </div>

                        <div className="train-summary-details">
                            <div>
                                <span>TRAVELERS</span>
                                <strong>
                                    {search.travelers}{" "}
                                    {search.travelers === 1
                                        ? "traveler"
                                        : "travelers"}
                                </strong>
                            </div>
                            <div>
                                <span>TRAVEL CLASS</span>
                                <strong>{search.classType}</strong>
                            </div>
                            <div>
                                <span>JOURNEY DATE</span>
                                <strong>{search.date}</strong>
                            </div>
                        </div>

                        <div className="train-result-footer">
                            <p>
                                This is a search summary, not a confirmed
                                reservation. Check live schedules, fares and
                                availability on IRCTC.
                            </p>
                            <button
                                type="button"
                                className="train-search-button"
                                onClick={openTrainSearch}
                            >
                                Continue to IRCTC
                                <span aria-hidden="true">↗</span>
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="train-journey-promo">
                    <div className="train-promo-icon" aria-hidden="true">
                        ✧
                    </div>
                    <div className="train-promo-copy">
                        <span className="train-section-kicker">
                            READY WHEN YOU ARE
                        </span>
                        <h2>Make the journey memorable.</h2>
                        <p>
                            Prepare your route above, then check real train
                            options and availability on IRCTC.
                        </p>
                    </div>
                    <div className="train-promo-decoration" aria-hidden="true">
                        <span>01</span>
                        <i />
                        <span>02</span>
                        <i />
                        <span>03</span>
                    </div>
                </section>
            )}

            <section className="train-bottom-banner">
                <div className="train-bottom-icon" aria-hidden="true">
                    ⇄
                </div>
                <div>
                    <h2>Your next adventure is just down the line.</h2>
                    <p>
                        Explore more ways to travel with VOYAGO.
                    </p>
                </div>
                <Link to="/explore" className="train-explore-link">
                    Explore VOYAGO <span aria-hidden="true">→</span>
                </Link>
            </section>
        </main>
    );
}

export default TrainBooking;