
import { useState } from "react";
import { ArrowRight, ArrowUpDown, BusFront, CalendarDays, MapPin, Users } from "lucide-react";
import "./BookingPages.css";
import "./BusBooking.css";

function getToday() {
    const date = new Date();
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

function formatRedBusDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day))
        .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        })
        .replace(/ /g, "-");
}

export default function BusBooking() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [date, setDate] = useState("");
    const [travelers, setTravelers] = useState("1");
    const [busType, setBusType] = useState("Any");
    const [search, setSearch] = useState(null);
    const [error, setError] = useState("");

    const today = getToday();

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

        if (!date || date < today) {
            setError("Choose a journey date that is today or later.");
            return;
        }

        if (!Number.isInteger(passengerCount) ||
            passengerCount < 1 || passengerCount > 20) {
            setError("Travelers must be between 1 and 20.");
            return;
        }

        setSearch({
            from: origin,
            to: destination,
            date,
            travelers: passengerCount,
            busType,
        });
    }

    function swapCities() {
        setFrom(to);
        setTo(from);
    }

    function openBusSearch() {
        if (!search) return;

        const route = `${search.from.toLowerCase().replace(/\s+/g, "-")}-to-${search.to
            .toLowerCase()
            .replace(/\s+/g, "-")}`;

        const params = new URLSearchParams({
            fromCityName: search.from,
            fromCityId: "",
            srcCountry: "IND",
            toCityName: search.to,
            toCityId: "",
            destCountry: "null",
            onward: formatRedBusDate(search.date),
            opId: "0",
            busType: search.busType,
        });

        window.open(
            `https://www.redbus.in/bus-tickets/${route}?${params}`,
            "_blank",
            "noopener,noreferrer"
        );
    }

    return (
        <main className="booking-page buses-page">
            <section className="bus-hero">
                <div className="bus-hero-copy">
                    <span className="bus-eyebrow">
                        <span className="bus-eyebrow-dot" />
                        VOYAGO BUS TRAVEL
                    </span>

                    <h1>
                        The journey matters.
                        <br />
                        <span>Make it yours.</span>
                    </h1>

                    <p>
                        Find your route, choose your travel date and explore
                        bus services for your next getaway.
                    </p>

                    <div className="bus-hero-highlights">
                        <span><MapPin size={16} /> Flexible routes</span>
                        <span><CalendarDays size={16} /> Plan ahead</span>
                        <span><BusFront size={17} /> Explore bus services</span>
                    </div>
                </div>

                <div className="bus-hero-art" aria-hidden="true">
                    <div className="bus-art-orbit bus-art-orbit-one" />
                    <div className="bus-art-orbit bus-art-orbit-two" />
                    <div className="bus-art-icon">
                        <BusFront size={92} strokeWidth={1.1} />
                    </div>
                    <span className="bus-art-label">YOUR NEXT STOP</span>
                    <span className="bus-art-route">Adventure awaits</span>
                </div>
            </section>

            <div className="bus-content">
                <section className="bus-search-card">
                    <div className="bus-section-heading">
                        <div>
                            <span className="bus-section-kicker">PLAN YOUR JOURNEY</span>
                            <h2>Where are you headed?</h2>
                            <p>Enter your travel details to prepare your bus search.</p>
                        </div>
                        <div className="bus-heading-icon">
                            <BusFront size={25} />
                        </div>
                    </div>

                    <form onSubmit={handleSearch}>
                        <div className="bus-form-grid">
                            <div className="bus-field bus-route-field">
                                <label htmlFor="bus-from">FROM</label>
                                <div className="bus-input-wrap">
                                    <MapPin size={18} />
                                    <input
                                        id="bus-from"
                                        type="text"
                                        placeholder="Departure city"
                                        autoComplete="off"
                                        maxLength={100}
                                        value={from}
                                        onChange={(event) => setFrom(event.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bus-swap-wrap">
                                <button
                                    type="button"
                                    className="bus-swap-button"
                                    onClick={swapCities}
                                    aria-label="Swap departure and destination"
                                    title="Swap cities"
                                >
                                    <ArrowUpDown size={18} />
                                </button>
                            </div>

                            <div className="bus-field bus-destination-field">
                                <label htmlFor="bus-to">TO</label>
                                <div className="bus-input-wrap">
                                    <MapPin size={18} />
                                    <input
                                        id="bus-to"
                                        type="text"
                                        placeholder="Destination city"
                                        autoComplete="off"
                                        maxLength={100}
                                        value={to}
                                        onChange={(event) => setTo(event.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bus-field">
                                <label htmlFor="bus-date">JOURNEY DATE</label>
                                <div className="bus-input-wrap">
                                    <CalendarDays size={18} />
                                    <input
                                        id="bus-date"
                                        type="date"
                                        min={today}
                                        value={date}
                                        onChange={(event) => setDate(event.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bus-field">
                                <label htmlFor="bus-travelers">TRAVELERS</label>
                                <div className="bus-input-wrap">
                                    <Users size={18} />
                                    <input
                                        id="bus-travelers"
                                        type="number"
                                        min="1"
                                        max="20"
                                        step="1"
                                        value={travelers}
                                        onChange={(event) => setTravelers(event.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bus-field">
                                <label htmlFor="bus-type">BUS PREFERENCE</label>
                                <div className="bus-input-wrap">
                                    <BusFront size={18} />
                                    <select
                                        id="bus-type"
                                        value={busType}
                                        onChange={(event) => setBusType(event.target.value)}
                                    >
                                        <option value="Any">Any bus type</option>
                                        <option value="AC">AC</option>
                                        <option value="Non-AC">Non-AC</option>
                                        <option value="Seater">Seater</option>
                                        <option value="Sleeper">Sleeper</option>
                                        <option value="AC Sleeper">AC Sleeper</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="bus-error" role="alert">{error}</p>
                        )}

                        <div className="bus-form-footer">
                            <p>
                                <span className="bus-info-dot">i</span>
                                Availability and fares are checked with the external provider.
                            </p>
                            <button type="submit" className="bus-search-button">
                                Search buses <ArrowRight size={18} />
                            </button>
                        </div>
                    </form>
                </section>

                <section className="bus-results" aria-live="polite">
                    {search ? (
                        <>
                            <div className="bus-results-heading">
                                <span className="bus-section-kicker">YOUR SEARCH</span>
                                <h2>Ready for the road?</h2>
                                <p>Review your route before continuing to the provider.</p>
                            </div>

                            <div className="bus-route-result">
                                <div className="bus-result-city">
                                    <span>FROM</span>
                                    <h3>{search.from}</h3>
                                </div>

                                <div className="bus-result-connector">
                                    <span />
                                    <BusFront size={22} />
                                    <span />
                                </div>

                                <div className="bus-result-city bus-result-destination">
                                    <span>TO</span>
                                    <h3>{search.to}</h3>
                                </div>

                                <div className="bus-result-meta">
                                    <span><CalendarDays size={16} /> {search.date}</span>
                                    <span><Users size={16} /> {search.travelers} traveler(s)</span>
                                    <span><BusFront size={16} /> {search.busType}</span>
                                </div>

                                <p className="bus-provider-note">
                                    VOYAGO has not retrieved live schedules, fares or seat availability.
                                    Continue to the provider to check current options.
                                </p>

                                <button
                                    type="button"
                                    className="bus-search-button"
                                    onClick={openBusSearch}
                                >
                                    Explore buses <ArrowRight size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="bus-discovery">
                            <div className="bus-discovery-icon">
                                <BusFront size={25} />
                            </div>
                            <div>
                                <span className="bus-section-kicker">YOUR NEXT ADVENTURE</span>
                                <h2>Every great trip starts somewhere.</h2>
                                <p>
                                    Add your route and travel details above to get started.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
