
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTrips, deleteTrip } from "../services/api";
import "./Dashboard.css";

function formatDate(value) {
    if (!value) return "Not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function Dashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingTripId, setDeletingTripId] = useState(null);

    const fetchTrips = useCallback(async () => {
        if (!token) {
            setTrips([]);
            setLoading(false);
            setError("Please log in to view your trips.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data = await getTrips(token);
            setTrips(Array.isArray(data?.trips) ? data.trips : []);
        } catch (err) {
            console.error("Fetch trips error:", err);
            setError(err?.message || "Unable to load your trips.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    const handleDeleteTrip = async (event, tripId, destination) => {
        event.stopPropagation();

        const confirmed = window.confirm(
            `Are you sure you want to delete your trip to ${destination || "this destination"}? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setDeletingTripId(tripId);
            setError("");

            await deleteTrip(tripId, token);

            setTrips((currentTrips) =>
                currentTrips.filter((trip) => trip._id !== tripId)
            );
        } catch (err) {
            console.error("Delete trip error:", err);
            setError(err?.message || "Failed to delete this trip.");
        } finally {
            setDeletingTripId(null);
        }
    };

    return (
        <main className="dashboard-page">
            <div className="dashboard-container">
                <section className="welcome-section">
                    <div>
                        <p className="welcome-label">YOUR TRAVEL SPACE</p>

                        <h1>
                            Welcome back
                            {user?.name ? `, ${user.name}` : ""} 👋
                        </h1>

                        <p className="welcome-text">
                            Ready to plan your next unforgettable journey?
                        </p>
                    </div>

                    <Link to="/plan-trip" className="plan-button">
                        + Plan a Trip
                    </Link>
                </section>

                <section className="stats-grid" aria-label="Travel statistics">
                    <div className="stat-card">
                        <div className="stat-icon" aria-hidden="true">✈</div>
                        <div>
                            <span>Trips Planned</span>
                            <strong>{loading ? "—" : trips.length}</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" aria-hidden="true">🗺</div>
                        <div>
                            <span>Places Explored</span>
                            <strong>—</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" aria-hidden="true">♥</div>
                        <div>
                            <span>Saved Places</span>
                            <strong>—</strong>
                        </div>
                    </div>
                </section>

                <section className="dashboard-grid">
                    <article className="main-card plan-trip-card">
                        <div className="card-icon" aria-hidden="true">✦</div>
                        <h2>Plan your next adventure</h2>
                        <p>
                            Tell VOYAGO where you want to go, what you love,
                            and how you want to travel. Generate a personalized
                            itinerary for your next journey.
                        </p>
                        <Link to="/plan-trip" className="card-button">
                            Start Planning →
                        </Link>
                    </article>

                    <article className="main-card explore-card">
                        <div className="card-icon" aria-hidden="true">🌍</div>
                        <h2>Explore destinations</h2>
                        <p>
                            Find inspiration for your next journey and discover
                            destinations, attractions, and experiences.
                        </p>
                        <button
                            type="button"
                            className="card-button secondary"
                            onClick={() => navigate("/explore")}
                        >
                            Explore Destinations →
                        </button>
                    </article>
                </section>

                <section className="recent-section">
                    <div className="section-header">
                        <div>
                            <h2>Your Trips</h2>
                            <p>Your upcoming and recently planned journeys</p>
                        </div>

                        {!loading && (
                            <button
                                type="button"
                                className="refresh-button"
                                onClick={fetchTrips}
                            >
                                ↻ Refresh
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="dashboard-error" role="alert">
                            <p>{error}</p>
                            <button type="button" onClick={fetchTrips}>
                                Try again
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="empty-trips" role="status">
                            <div className="empty-icon" aria-hidden="true">⏳</div>
                            <h3>Loading your trips...</h3>
                            <p>Please wait while we fetch your journeys.</p>
                        </div>
                    )}

                    {!loading && !error && trips.length === 0 && (
                        <div className="empty-trips">
                            <div className="empty-icon" aria-hidden="true">🧳</div>
                            <h3>No trips yet</h3>
                            <p>Your next adventure is waiting to be planned.</p>
                            <Link to="/plan-trip" className="empty-button">
                                Create Your First Trip
                            </Link>
                        </div>
                    )}

                    {!loading && trips.length > 0 && (
                        <div className="trips-grid">
                            {trips.map((trip) => (
                                <article className="trip-card" key={trip._id}>
                                    <button
                                        type="button"
                                        className="trip-card-open"
                                        onClick={() => navigate(`/trip/${trip._id}`)}
                                        aria-label={`View trip to ${trip.destination || "destination"}`}
                                    >
                                        <div className="trip-card-top">
                                            <div className="trip-destination">
                                                <span aria-hidden="true">📍</span>{" "}
                                                {trip.destination || "Untitled trip"}
                                            </div>

                                            <span className="trip-status">
                                                {trip.status || "Planned"}
                                            </span>
                                        </div>

                                        <div className="trip-details">
                                            <div>
                                                <span>Dates</span>
                                                <strong>
                                                    {formatDate(trip.startDate)}
                                                    {" → "}
                                                    {formatDate(trip.endDate)}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Travelers</span>
                                                <strong>
                                                    {Number(trip.travelers) || 1}{" "}
                                                    {(Number(trip.travelers) || 1) === 1
                                                        ? "Traveler"
                                                        : "Travelers"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Budget</span>
                                                <strong>
                                                    {trip.budget ?? "Not set"}
                                                </strong>
                                            </div>
                                        </div>
                                    </button>

                                    {Array.isArray(trip.interests) &&
                                        trip.interests.length > 0 && (
                                            <div className="trip-interests">
                                                {trip.interests.map((interest, index) => (
                                                    <span key={`${interest}-${index}`}>
                                                        {interest}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                    <button
                                        type="button"
                                        className="card-button secondary delete-trip-button"
                                        disabled={deletingTripId === trip._id}
                                        onClick={(event) =>
                                            handleDeleteTrip(
                                                event,
                                                trip._id,
                                                trip.destination
                                            )
                                        }
                                    >
                                        {deletingTripId === trip._id
                                            ? "Deleting..."
                                            : "Delete Trip"}
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Dashboard;
