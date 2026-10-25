
import { useMemo, useState } from "react";
import "./BookingPages.css";
import "./CruiseBooking.css";

const cruiseOptions = [
  {
    id: 1,
    name: "Arabian Gulf Escape",
    operator: "Voyager Cruises",
    destination: "Dubai",
    departurePort: "Mumbai",
    duration: 5,
    price: 42999,
    cabin: "Balcony",
    stops: ["Mumbai", "Muscat", "Dubai", "Mumbai"],
    image:
      "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1200&q=85",
    description:
      "Discover waterfront skylines, vibrant markets and Arabian Gulf coastlines on this sample cruise journey.",
  },
  {
    id: 2,
    name: "Tropical Island Journey",
    operator: "Ocean Vista",
    destination: "Maldives",
    departurePort: "Mumbai",
    duration: 4,
    price: 35999,
    cabin: "Ocean View",
    stops: ["Mumbai", "Malé", "Island Excursion", "Mumbai"],
    image:
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85",
    description:
      "Explore turquoise waters, tropical scenery and island-inspired escapes.",
  },
  {
    id: 3,
    name: "Southeast Asia Discovery",
    operator: "Blue Horizon",
    destination: "Singapore",
    departurePort: "Chennai",
    duration: 7,
    price: 58999,
    cabin: "Balcony",
    stops: ["Chennai", "Singapore", "Penang", "Phuket", "Chennai"],
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=85",
    description:
      "A sample multi-stop journey featuring lively ports, city sights and tropical coastlines.",
  },
  {
    id: 4,
    name: "Coastal Getaway",
    operator: "Sea Explorer",
    destination: "Goa",
    departurePort: "Mumbai",
    duration: 3,
    price: 24999,
    cabin: "Inside",
    stops: ["Mumbai", "Goa", "Mumbai"],
    image:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=85",
    description:
      "Enjoy a shorter coastal escape with time to unwind and explore along the shore.",
  },
];

const todayString = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const formatDate = (dateString) => {
  if (!dateString) return "Not selected";

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "Not selected";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const money = (amount, currency = "INR") => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "Estimate unavailable";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-IN")}`;
  }
};

const initialFilters = {
  destination: "Any destination",
  departurePort: "Any port",
  departureDate: "",
  duration: "Any duration",
  passengers: 2,
  cabin: "Any cabin",
};

const getApiUrl = () =>
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
    /\/$/,
    ""
  );

function getDuration() {
  return 5;
}

function normalizeAiTrip(trip, index, destination) {
  return {
    ...trip,
    id: trip.id || `ai-cruise-${index + 1}`,
    title: trip.title || trip.name || `Cruise itinerary ${index + 1}`,
    destination: trip.destination || destination,
    duration: trip.duration || "Not specified",
    highlights: Array.isArray(trip.highlights) ? trip.highlights : [],
    itinerary: Array.isArray(trip.itinerary) ? trip.itinerary : [],
    travelTips: Array.isArray(trip.travelTips) ? trip.travelTips : [],
  };
}

export default function CruiseBooking() {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("recommended");
  const [searched, setSearched] = useState(false);
  const [selectedCruise, setSelectedCruise] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  // Gemini AI itinerary state
  const [generatingAiTrips, setGeneratingAiTrips] = useState(false);
  const [aiCruiseTrips, setAiCruiseTrips] = useState([]);
  const [aiCruiseOverview, setAiCruiseOverview] = useState("");
  const [aiCruiseError, setAiCruiseError] = useState("");

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));

    setSelectedCruise(null);
    setConfirmation(null);
    setAiCruiseTrips([]);
    setAiCruiseOverview("");
    setAiCruiseError("");
  };

  const results = useMemo(() => {
    const filtered = cruiseOptions.filter((cruise) => {
      const matchesDestination =
        filters.destination === "Any destination" ||
        cruise.destination === filters.destination;

      const matchesPort =
        filters.departurePort === "Any port" ||
        cruise.departurePort === filters.departurePort;

      const matchesDuration =
        filters.duration === "Any duration" ||
        (filters.duration === "1–3 nights" &&
          cruise.duration >= 1 &&
          cruise.duration <= 3) ||
        (filters.duration === "4–6 nights" &&
          cruise.duration >= 4 &&
          cruise.duration <= 6) ||
        (filters.duration === "7+ nights" && cruise.duration >= 7);

      const matchesCabin =
        filters.cabin === "Any cabin" || cruise.cabin === filters.cabin;

      return (
        matchesDestination &&
        matchesPort &&
        matchesDuration &&
        matchesCabin
      );
    });

    if (sort === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "duration-short") {
      filtered.sort((a, b) => a.duration - b.duration);
    } else if (sort === "duration-long") {
      filtered.sort((a, b) => b.duration - a.duration);
    }

    return filtered;
  }, [filters, sort]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearched(true);
    setSelectedCruise(null);
    setConfirmation(null);
  };

  const handleGenerateAiCruiseTrips = async () => {
    if (generatingAiTrips) return;

    setGeneratingAiTrips(true);
    setAiCruiseTrips([]);
    setAiCruiseOverview("");
    setAiCruiseError("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const destination =
        filters.destination !== "Any destination"
          ? filters.destination
          : "Southeast Asia";

      const selectedDuration =
        filters.duration === "1–3 nights"
          ? 3
          : filters.duration === "4–6 nights"
            ? 5
            : filters.duration === "7+ nights"
              ? 7
              : getDuration();

      const payload = {
        destination,
        departurePort:
          filters.departurePort !== "Any port" ? filters.departurePort : "",
        departureDate: filters.departureDate || "",
        duration: selectedDuration,
        guests: Number(filters.passengers),
        cabins: filters.cabin !== "Any cabin" ? filters.cabin : "Any cabin",
        currency: "INR",
        budget: "Flexible",
        preferences: [
          "sightseeing",
          "local cuisine",
          "coastal experiences",
        ],
        travelStyle: "balanced",
      };

      const response = await fetch(
        `${getApiUrl()}/ai-travel/cruises/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || `Cruise generation failed (${response.status}).`
        );
      }

      const trips = Array.isArray(data.trips)
        ? data.trips.map((trip, index) =>
            normalizeAiTrip(trip, index, destination)
          )
        : [];

      setAiCruiseTrips(trips);
      setAiCruiseOverview(data.overview || "");

      if (trips.length === 0) {
        setAiCruiseError(
          "Gemini returned no cruise itineraries. Please try again."
        );
      }
    } catch (error) {
      setAiCruiseError(
        error.name === "AbortError"
          ? "Cruise generation took too long. Please try again."
          : error.message || "Unable to reach the Voyago AI service."
      );
    } finally {
      clearTimeout(timeoutId);
      setGeneratingAiTrips(false);
    }
  };

  const clearFilters = () => {
    setFilters({ ...initialFilters });
    setSort("recommended");
    setSearched(false);
    setSelectedCruise(null);
    setConfirmation(null);
    setAiCruiseTrips([]);
    setAiCruiseOverview("");
    setAiCruiseError("");
  };

  const handleSelectCruise = (cruise) => {
    setSelectedCruise(cruise);
    setConfirmation(null);
  };

  const handleContinue = () => {
    if (!selectedCruise) return;

    setConfirmation({
      cruiseId: selectedCruise.id,
      cruiseName: selectedCruise.name,
      operator: selectedCruise.operator,
      date: filters.departureDate,
      passengers: Number(filters.passengers),
      cabin: selectedCruise.cabin,
      pricePerPassenger: selectedCruise.price,
      total: selectedCruise.price * Number(filters.passengers),
    });
  };

  return (
    <main className="booking-page cruise-booking">
      <section className="booking-hero cruise-hero">
        <div className="cruise-hero-content">
          <span className="cruise-eyebrow">
            <span className="cruise-eyebrow-dot" />
            VOYAGO CRUISES
          </span>

          <h1>
            Your next adventure
            <br />
            starts <span>at sea.</span>
          </h1>

          <p>
            Discover inspiring coastlines, remarkable ports and journeys worth
            remembering.
          </p>

          <div className="cruise-hero-highlights">
            <span>
              <span className="cruise-highlight-icon">✦</span>
              Curated journeys
            </span>
            <span>
              <span className="cruise-highlight-icon">⌁</span>
              Multiple destinations
            </span>
            <span>
              <span className="cruise-highlight-icon">◇</span>
              Your next escape
            </span>
          </div>
        </div>
      </section>

      <div className="booking-container cruise-container">
        <section className="booking-search-form cruise-search-card">
          <div className="cruise-section-heading">
            <div>
              <span className="cruise-section-kicker">PLAN YOUR JOURNEY</span>
              <h2>Find your cruise</h2>
              <p>
                Choose your preferences or let Gemini plan a personalized
                cruise itinerary.
              </p>
            </div>

            <span className="cruise-heading-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M3 18h18l-2.5 3h-13L3 18Z" />
                <path d="M5 15V8l7-4 7 4v7" />
                <path d="M9 10h6M12 4v11" />
              </svg>
            </span>
          </div>

          <form onSubmit={handleSearch}>
            <div className="booking-form-grid cruise-form-grid">
              <div className="booking-field cruise-field">
                <label htmlFor="cruise-destination">Destination</label>
                <select
                  id="cruise-destination"
                  value={filters.destination}
                  onChange={(event) =>
                    updateFilter("destination", event.target.value)
                  }
                >
                  <option>Any destination</option>
                  <option>Dubai</option>
                  <option>Maldives</option>
                  <option>Singapore</option>
                  <option>Goa</option>
                </select>
              </div>

              <div className="booking-field cruise-field">
                <label htmlFor="cruise-port">Departure port</label>
                <select
                  id="cruise-port"
                  value={filters.departurePort}
                  onChange={(event) =>
                    updateFilter("departurePort", event.target.value)
                  }
                >
                  <option>Any port</option>
                  <option>Mumbai</option>
                  <option>Chennai</option>
                </select>
              </div>

              <div className="booking-field cruise-field">
                <label htmlFor="cruise-date">Preferred departure date</label>
                <input
                  id="cruise-date"
                  type="date"
                  min={todayString()}
                  value={filters.departureDate}
                  onChange={(event) =>
                    updateFilter("departureDate", event.target.value)
                  }
                />
              </div>

              <div className="booking-field cruise-field">
                <label htmlFor="cruise-duration">Duration</label>
                <select
                  id="cruise-duration"
                  value={filters.duration}
                  onChange={(event) =>
                    updateFilter("duration", event.target.value)
                  }
                >
                  <option>Any duration</option>
                  <option>1–3 nights</option>
                  <option>4–6 nights</option>
                  <option>7+ nights</option>
                </select>
              </div>

              <div className="booking-field cruise-field">
                <label htmlFor="cruise-passengers">Passengers</label>
                <select
                  id="cruise-passengers"
                  value={filters.passengers}
                  onChange={(event) =>
                    updateFilter("passengers", Number(event.target.value))
                  }
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "passenger" : "passengers"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="booking-field cruise-field">
                <label htmlFor="cruise-cabin">Cabin preference</label>
                <select
                  id="cruise-cabin"
                  value={filters.cabin}
                  onChange={(event) =>
                    updateFilter("cabin", event.target.value)
                  }
                >
                  <option>Any cabin</option>
                  <option>Inside</option>
                  <option>Ocean View</option>
                  <option>Balcony</option>
                </select>
              </div>
            </div>

            <div className="cruise-form-footer">
              <p className="cruise-date-note">
                <span aria-hidden="true">ⓘ</span>
                Sample listings do not contain live sailing schedules or
                verified availability.
              </p>

              <button className="booking-primary-btn" type="submit">
                <span>Search cruises</span>
                <span aria-hidden="true">↗</span>
              </button>

              <button
                className="booking-secondary-btn"
                type="button"
                onClick={handleGenerateAiCruiseTrips}
                disabled={generatingAiTrips}
              >
                {generatingAiTrips
                  ? "Generating itinerary..."
                  : "✦ Generate AI cruise trips"}
              </button>
            </div>
          </form>
        </section>

        {/* Gemini-generated itineraries */}
        {(generatingAiTrips ||
          aiCruiseTrips.length > 0 ||
          aiCruiseOverview ||
          aiCruiseError) && (
          <section
            className="cruise-ai-results"
            aria-live="polite"
            aria-busy={generatingAiTrips}
          >
            <div className="cruise-section-heading">
              <div>
                <span className="cruise-section-kicker">
                  VOYAGO AI TRIP PLANNER
                </span>
                <h2>Your personalized cruise itineraries</h2>
                <p>
                  Gemini-generated travel ideas tailored to your preferences.
                </p>
              </div>
            </div>

            {generatingAiTrips && (
              <div className="cruise-demo-notice" role="status">
                <span className="cruise-notice-icon" aria-hidden="true">
                  ✦
                </span>
                <p>
                  Gemini is preparing your cruise routes, activities and
                  day-by-day experiences. This can take a little while.
                </p>
              </div>
            )}

            {aiCruiseError && (
              <p className="cruise-ai-error" role="alert">
                {aiCruiseError}
              </p>
            )}

            {aiCruiseOverview && (
              <div className="cruise-demo-notice">
                <p>{aiCruiseOverview}</p>
              </div>
            )}

            {aiCruiseTrips.length > 0 && (
              <div className="cruise-results-grid">
                {aiCruiseTrips.map((trip, index) => (
                  <article
                    className="cruise-card cruise-ai-card"
                    key={trip.id || `ai-cruise-${index}`}
                  >
                    <div className="cruise-card-body">
                      <div className="cruise-card-topline">
                        <span className="cruise-operator">
                          GEMINI AI SUGGESTION
                        </span>
                        <span className="cruise-cabin-tag">
                          {trip.style || "Personalized"}
                        </span>
                      </div>

                      <h3>{trip.title}</h3>

                      <p className="cruise-card-description">
                        {trip.description || "A personalized cruise itinerary."}
                      </p>

                      <div className="cruise-card-route">
                        <div className="cruise-route-point">
                          <span className="cruise-route-dot" />
                          <div>
                            <span>Destination</span>
                            <strong>{trip.destination}</strong>
                          </div>
                        </div>

                        <div className="cruise-route-point">
                          <span className="cruise-route-dot cruise-route-dot-muted" />
                          <div>
                            <span>Duration</span>
                            <strong>
                              {typeof trip.duration === "number"
                                ? `${trip.duration} days`
                                : trip.duration}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {trip.estimatedCost != null && (
                        <div className="cruise-price">
                          <span>Estimated trip cost</span>
                          <strong>
                            {money(
                              trip.estimatedCost,
                              trip.currency || "INR"
                            )}
                          </strong>
                          <small>AI estimate, not a live quote</small>
                        </div>
                      )}

                      {trip.accommodation && (
                        <div className="cruise-stop-line">
                          <span>ACCOMMODATION</span>
                          <p>{trip.accommodation}</p>
                        </div>
                      )}

                      {trip.highlights.length > 0 && (
                        <div className="cruise-ai-highlights">
                          <h4>Highlights</h4>
                          <ul>
                            {trip.highlights.map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {trip.itinerary.length > 0 && (
                        <div className="cruise-ai-itinerary">
                          <h4>Day-by-day itinerary</h4>

                          {trip.itinerary.map((day, dayIndex) => (
                            <details key={day.day || dayIndex}>
                              <summary>
                                Day {day.day || dayIndex + 1}
                                {day.title ? ` — ${day.title}` : ""}
                              </summary>

                              <div className="cruise-ai-day-content">
                                {day.morning && (
                                  <p>
                                    <strong>Morning: </strong>
                                    {day.morning}
                                  </p>
                                )}

                                {day.afternoon && (
                                  <p>
                                    <strong>Afternoon: </strong>
                                    {day.afternoon}
                                  </p>
                                )}

                                {day.evening && (
                                  <p>
                                    <strong>Evening: </strong>
                                    {day.evening}
                                  </p>
                                )}

                                {day.activities &&
                                  !day.morning &&
                                  !day.afternoon &&
                                  !day.evening && (
                                    <p>{day.activities}</p>
                                  )}
                              </div>
                            </details>
                          ))}
                        </div>
                      )}

                      {trip.travelTips.length > 0 && (
                        <div className="cruise-ai-highlights">
                          <h4>Travel tips</h4>
                          <ul>
                            {trip.travelTips.map((tip, tipIndex) => (
                              <li key={tipIndex}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="cruise-detail-disclaimer">
                        AI-generated suggestion only. Operators, routes,
                        prices, sailing schedules and cabin availability
                        have not been independently verified. No booking
                        has been made.
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Existing sample cruise listings */}
        <section className="cruise-results-section" aria-live="polite">
          <div className="cruise-results-header">
            <div>
              <span className="cruise-section-kicker">
                {searched ? "YOUR SEARCH" : "EXPLORE VOYAGES"}
              </span>
              <h2>
                {searched ? "Cruise results" : "Journeys to inspire you"}
              </h2>
              <p>
                {results.length} sample{" "}
                {results.length === 1 ? "journey" : "journeys"} to explore
              </p>
            </div>

            <div className="cruise-sort">
              <label htmlFor="cruise-sort">Sort by</label>
              <select
                id="cruise-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="duration-short">Shortest duration</option>
                <option value="duration-long">Longest duration</option>
              </select>
            </div>
          </div>

          <div className="cruise-demo-notice" role="note">
            <span className="cruise-notice-icon" aria-hidden="true">
              i
            </span>
            <p>
              <strong>Preview experience.</strong> These existing listings use
              sample data. Live prices, sailing dates and cabin availability
              have not been connected.
            </p>
          </div>

          {results.length === 0 ? (
            <div className="booking-empty-state cruise-empty-state">
              <span className="cruise-empty-icon" aria-hidden="true">
                ◌
              </span>
              <h3>No matching journeys</h3>
              <p>
                Try changing your destination, departure port, duration or
                cabin preference.
              </p>
              <button
                type="button"
                className="booking-secondary-btn"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="cruise-results-grid">
              {results.map((cruise, index) => (
                <article
                  className={`cruise-card ${
                    selectedCruise?.id === cruise.id
                      ? "cruise-card-selected"
                      : ""
                  }`}
                  key={cruise.id}
                  style={{ "--cruise-card-index": index }}
                >
                  <div className="cruise-card-image-wrap">
                    <img
                      className="cruise-card-image"
                      src={cruise.image}
                      alt={`${cruise.name} cruise scenery`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />
                    <span className="cruise-tag">
                      {cruise.duration} nights
                    </span>
                    <span className="cruise-image-label">VOYAGO SELECT</span>
                  </div>

                  <div className="cruise-card-body">
                    <div className="cruise-card-topline">
                      <span className="cruise-operator">
                        {cruise.operator}
                      </span>
                      <span className="cruise-cabin-tag">{cruise.cabin}</span>
                    </div>

                    <h3>{cruise.name}</h3>
                    <p className="cruise-card-description">
                      {cruise.description}
                    </p>

                    <div className="cruise-card-route">
                      <div className="cruise-route-point">
                        <span className="cruise-route-dot" />
                        <div>
                          <span>Destination</span>
                          <strong>{cruise.destination}</strong>
                        </div>
                      </div>

                      <div className="cruise-route-point">
                        <span className="cruise-route-dot cruise-route-dot-muted" />
                        <div>
                          <span>Departs from</span>
                          <strong>{cruise.departurePort}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="cruise-stop-line">
                      <span>ROUTE</span>
                      <p>{cruise.stops.join(" → ")}</p>
                    </div>

                    <div className="cruise-card-footer">
                      <div className="cruise-price">
                        <span>Sample price / person</span>
                        <strong>{money(cruise.price)}</strong>
                        <small>Final price not available</small>
                      </div>

                      <button
                        type="button"
                        className="cruise-view-btn"
                        onClick={() => handleSelectCruise(cruise)}
                        aria-pressed={selectedCruise?.id === cruise.id}
                      >
                        {selectedCruise?.id === cruise.id
                          ? "Selected"
                          : "View details"}
                        <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Existing sample-cruise selection summary */}
        {selectedCruise && (
          <section className="cruise-detail-panel" aria-live="polite">
            <div className="cruise-detail-heading">
              <div>
                <span className="cruise-section-kicker">YOUR SHORTLIST</span>
                <h2>Review your journey</h2>
                <p>
                  You selected <strong>{selectedCruise.name}</strong>.
                </p>
              </div>

              <button
                type="button"
                className="cruise-close-btn"
                onClick={() => {
                  setSelectedCruise(null);
                  setConfirmation(null);
                }}
                aria-label="Close cruise details"
              >
                ×
              </button>
            </div>

            <div className="cruise-detail-summary">
              <div className="cruise-detail-route">
                <span className="cruise-detail-icon" aria-hidden="true">
                  ✦
                </span>
                <div>
                  <strong>{selectedCruise.name}</strong>
                  <span>
                    {selectedCruise.departurePort} →{" "}
                    {selectedCruise.destination}
                  </span>
                </div>
              </div>

              <div className="cruise-detail-grid">
                <div>
                  <span>Operator</span>
                  <strong>{selectedCruise.operator}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>{selectedCruise.duration} nights</strong>
                </div>
                <div>
                  <span>Preferred departure</span>
                  <strong>{formatDate(filters.departureDate)}</strong>
                </div>
                <div>
                  <span>Passengers</span>
                  <strong>
                    {filters.passengers}{" "}
                    {filters.passengers === 1 ? "passenger" : "passengers"}
                  </strong>
                </div>
                <div>
                  <span>Cabin category</span>
                  <strong>{selectedCruise.cabin}</strong>
                </div>
                <div>
                  <span>Sample total</span>
                  <strong>
                    {money(
                      selectedCruise.price * Number(filters.passengers)
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <p className="cruise-detail-disclaimer">
              This is a selection preview only. No reservation, payment,
              sailing-date validation or cabin availability check will occur.
            </p>

            <button
              type="button"
              className="booking-primary-btn cruise-review-btn"
              onClick={handleContinue}
            >
              Review selection <span aria-hidden="true">→</span>
            </button>

            {confirmation && confirmation.cruiseId === selectedCruise.id && (
              <div className="cruise-selection-summary" role="status">
                <span className="cruise-summary-check" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <strong>Selection summary ready</strong>
                  <p>
                    {confirmation.cruiseName} · {confirmation.passengers}{" "}
                    {confirmation.passengers === 1
                      ? "passenger"
                      : "passengers"}{" "}
                    · {formatDate(confirmation.date)} · Sample total{" "}
                    {money(confirmation.total)}.
                  </p>
                  <small>
                    Nothing has been booked. Connect a cruise inventory and
                    booking provider to enable real reservations.
                  </small>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
