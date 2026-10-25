
import { useState } from "react";
import "./TravelRecommendations.css";

const PAGE_CONFIG = {
  hotel: {
    title: "Find Your Perfect Stay",
    subtitle: "Discover stays that fit your destination and budget.",
    button: "Search Hotels",
    dateLabel: "Check-in",
    secondDateLabel: "Check-out",
    placeholder: "Where do you want to stay?",
    icon: "🏨"
  },
  cruise: {
    title: "Explore Your Next Cruise",
    subtitle: "Discover cruise experiences for your next adventure.",
    button: "Search Cruises",
    dateLabel: "Departure",
    secondDateLabel: "Return",
    placeholder: "Where would you like to cruise?",
    icon: "🚢"
  }
};

export default function TravelRecommendations({ type = "hotel" }) {
  const config = PAGE_CONFIG[type] || PAGE_CONFIG.hotel;

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [budget, setBudget] = useState("Any");
  const [preferences, setPreferences] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/travel/recommendations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            destination,
            checkIn,
            checkOut,
            guests: Number(guests),
            budget,
            preferences
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setResults(data.results || []);
      setSummary(data.summary || "");
    } catch (err) {
      setError(
        err.message || "Unable to connect to the travel recommendation service."
      );
    } finally {
      setLoading(false);
    }
  }

  const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);

  return (
    <main className={`travel-page travel-page--${type}`}>
      <section className="travel-hero">
        <div className="travel-hero__content">
          <span className="travel-eyebrow">
            {config.icon} AI-POWERED TRAVEL
          </span>

          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
      </section>

      <form className="travel-search" onSubmit={handleSearch}>
        <div className="travel-field travel-field--destination">
          <label htmlFor={`${type}-destination`}>Destination</label>
          <input
            id={`${type}-destination`}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={config.placeholder}
            maxLength={120}
            required
          />
        </div>

        <div className="travel-field">
          <label htmlFor={`${type}-checkin`}>
            {config.dateLabel}
          </label>
          <input
            id={`${type}-checkin`}
            type="date"
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value > checkOut) {
                setCheckOut("");
              }
            }}
            min={new Date().toLocaleDateString("en-CA")}
          />
        </div>

        <div className="travel-field">
          <label htmlFor={`${type}-checkout`}>
            {config.secondDateLabel}
          </label>
          <input
            id={`${type}-checkout`}
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || new Date().toLocaleDateString("en-CA")}
          />
        </div>

        <div className="travel-field">
          <label htmlFor={`${type}-guests`}>Guests</label>
          <select
            id={`${type}-guests`}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>{n} guests</option>
            ))}
          </select>
        </div>

        <div className="travel-field">
          <label htmlFor={`${type}-budget`}>Budget</label>
          <select
            id={`${type}-budget`}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          >
            <option>Any</option>
            <option>Budget</option>
            <option>Mid-range</option>
            <option>Luxury</option>
          </select>
        </div>

        <div className="travel-field travel-field--preferences">
          <label htmlFor={`${type}-preferences`}>
            Preferences (optional)
          </label>
          <input
            id={`${type}-preferences`}
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder={
              type === "hotel"
                ? "Pool, breakfast, sea view..."
                : "Family, adventure, island stops..."
            }
            maxLength={500}
          />
        </div>

        <button
          className="travel-search__button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Generating..." : config.button}
        </button>
      </form>

      {error && (
        <div className="travel-error" role="alert">{error}</div>
      )}

      {loading && (
        <div className="travel-loading" role="status">
          <span className="travel-spinner" />
          <h3>Finding recommendations for you...</h3>
          <p>Gemini is preparing suggestions for your trip.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <section className="travel-results">
          <div className="travel-results__heading">
            <div>
              <span className="travel-eyebrow">YOUR DISCOVERIES</span>
              <h2>Recommended {type === "hotel" ? "Stays" : "Cruises"}</h2>
              <p>{summary}</p>
            </div>
            <span className="travel-results__count">
              {results.length} suggestions
            </span>
          </div>

          <div className="travel-grid">
            {results.map((item, index) => (
              <article className="travel-card" key={`${item.name}-${index}`}>
                <div className="travel-card__image">
                  <div className="travel-card__image-placeholder">
                    {config.icon}
                  </div>
                  <span className="travel-card__badge">
                    AI suggestion
                  </span>
                </div>

                <div className="travel-card__body">
                  <div className="travel-card__location">
                    <span aria-hidden="true">📍</span>
                    {item.location}
                  </div>

                  <h3>{item.name}</h3>
                  <p className="travel-card__description">
                    {item.description}
                  </p>

                  {item.features?.length > 0 && (
                    <div className="travel-card__features">
                      {item.features.map((feature, i) => (
                        <span key={`${feature}-${i}`}>{feature}</span>
                      ))}
                    </div>
                  )}

                  <div className="travel-card__footer">
                    <div>
                      <strong>{currency(item.price)}</strong>
                      <small>{item.priceUnit}</small>
                    </div>
                    <span className="travel-card__rating">
                      ★ {item.rating ? item.rating.toFixed(1) : "N/A"}
                    </span>
                  </div>

                  <p className="travel-card__disclaimer">
                    Estimated AI-generated information. Verify prices,
                    property details and availability before booking.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && results.length === 0 && (
        <section className="travel-empty">
          <div>{config.icon}</div>
          <h2>Your next adventure starts here</h2>
          <p>
            Enter a destination above to generate personalized
            {type === "hotel" ? " hotel" : " cruise"} suggestions.
          </p>
        </section>
      )}
    </main>
  );
}
