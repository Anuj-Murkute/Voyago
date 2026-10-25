
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Compass,
  Globe2,
  LoaderCircle,
  MapPin,
  Pencil,
  Plane,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getTrips, updateProfile } from "../services/api";
import "./Profile.css";

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name) {
  return (name || "Traveler")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "T";
}

export default function Profile() {
  const { user, token, updateUser } = useAuth();

  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    let active = true;

    async function loadTrips() {
      setTripsLoading(true);
      setTripsError("");

      try {
        const response = await getTrips(token);
        if (active) {
          setTrips(Array.isArray(response.trips) ? response.trips : []);
        }
      } catch (requestError) {
        if (active) {
          setTripsError(requestError.message || "Unable to load trip activity.");
        }
      } finally {
        if (active) setTripsLoading(false);
      }
    }

    if (token) loadTrips();

    return () => {
      active = false;
    };
  }, [token]);

  const completedTrips = trips.filter(
    (trip) => trip.status === "completed"
  );
  const planningTrips = trips.filter(
    (trip) => trip.status === "planning"
  );
  const confirmedTrips = trips.filter(
    (trip) => trip.status === "confirmed"
  );

  const destinations = new Set(
    completedTrips
      .map((trip) => trip.destination?.trim().toLowerCase())
      .filter(Boolean)
  ).size;

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setError("Your name must be between 2 and 80 characters.");
      return;
    }

    if (cleanName === user?.name) {
      setEditing(false);
      return;
    }

    setSaving(true);

    try {
      const response = await updateProfile({ name: cleanName }, token);
      const updatedUser = response.user || response;

      updateUser(updatedUser);
      setName(updatedUser.name || cleanName);
      setEditing(false);
      setMessage("Your profile has been updated.");
    } catch (requestError) {
      setError(requestError.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setName(user?.name || "");
    setEditing(false);
    setError("");
    setMessage("");
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        <div className="profile-breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>My Profile</span>
        </div>

        <header className="profile-heading">
          <div>
            <span className="profile-eyebrow">YOUR VOYAGO ACCOUNT</span>
            <h1>My profile<span>.</span></h1>
            <p>Manage your account and keep track of your travel journey.</p>
          </div>
          <Link className="profile-trips-button" to="/trips">
            <Compass size={17} />
            My trips
            <ArrowRight size={16} />
          </Link>
        </header>

        <section className="profile-hero">
          <div className="profile-hero-glow" />
          <div className="profile-avatar-large">{getInitials(user?.name)}</div>
          <div className="profile-hero-copy">
            <span className="profile-member-label">
              <ShieldCheck size={14} />
              VERIFIED SESSION
            </span>
            <h2>{user?.name || "Traveler"}</h2>
            <p>{user?.email || "Email unavailable"}</p>
            <div className="profile-member-since">
              <CalendarDays size={15} />
              Member since {formatDate(user?.createdAt)}
            </div>
          </div>
          <div className="profile-hero-badge">
            <Globe2 size={17} />
            <span>Travel starts here</span>
          </div>
        </section>

        <section className="profile-stats" aria-label="Travel statistics">
          <article className="profile-stat-card">
            <span className="profile-stat-icon"><Plane size={19} /></span>
            <span className="profile-stat-label">Total trips</span>
            <strong>{tripsLoading ? "—" : trips.length}</strong>
            <span className="profile-stat-caption">Trips in your account</span>
          </article>
          <article className="profile-stat-card">
            <span className="profile-stat-icon"><MapPin size={19} /></span>
            <span className="profile-stat-label">Destinations explored</span>
            <strong>{tripsLoading ? "—" : destinations}</strong>
            <span className="profile-stat-caption">Unique completed destinations</span>
          </article>
          <article className="profile-stat-card">
            <span className="profile-stat-icon"><Compass size={19} /></span>
            <span className="profile-stat-label">In progress</span>
            <strong>
              {tripsLoading ? "—" : planningTrips.length + confirmedTrips.length}
            </strong>
            <span className="profile-stat-caption">Planning or confirmed trips</span>
          </article>
        </section>

        {tripsError && (
          <div className="profile-notice profile-notice-error" role="alert">
            {tripsError} Your account details are still available.
          </div>
        )}

        <div className="profile-content-grid">
          <section className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <span className="profile-eyebrow">PERSONAL INFORMATION</span>
                <h2>Account details</h2>
              </div>
              {!editing && (
                <button
                  className="profile-edit-button"
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setMessage("");
                    setError("");
                  }}
                >
                  <Pencil size={15} />
                  Edit
                </button>
              )}
            </div>

            {message && (
              <div className="profile-notice profile-notice-success" role="status">
                <Check size={16} />
                {message}
              </div>
            )}

            {error && (
              <div className="profile-notice profile-notice-error" role="alert">
                {error}
              </div>
            )}

            {editing ? (
              <form className="profile-edit-form" onSubmit={handleSave}>
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />

                <label htmlFor="profile-email">Email address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                />
                <p className="profile-field-hint">
                  Your email address cannot be changed from this page.
                </p>

                <div className="profile-form-actions">
                  <button className="profile-save-button" type="submit" disabled={saving}>
                    {saving ? (
                      <LoaderCircle className="profile-spinner" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    className="profile-cancel-button"
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details-list">
                <div className="profile-detail-row">
                  <span className="profile-detail-icon"><UserRound size={18} /></span>
                  <div>
                    <span className="profile-detail-label">Full name</span>
                    <strong>{user?.name || "Not available"}</strong>
                  </div>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-icon"><ShieldCheck size={18} /></span>
                  <div>
                    <span className="profile-detail-label">Email address</span>
                    <strong className="profile-email-value">{user?.email || "Not available"}</strong>
                  </div>
                  <span className="profile-readonly-label">Account email</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-icon"><CalendarDays size={18} /></span>
                  <div>
                    <span className="profile-detail-label">Account created</span>
                    <strong>{formatDate(user?.createdAt)}</strong>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="profile-panel profile-journey-panel">
            <span className="profile-eyebrow">YOUR JOURNEY</span>
            <h2>Ready for somewhere new?</h2>
            <p>Your next adventure begins with a plan. Create a trip and let VOYAGO help organise the details.</p>
            <Link to="/plan-trip" className="profile-plan-button">
              Plan a new trip
              <ArrowRight size={17} />
            </Link>

            <div className="profile-journey-divider" />

            <div className="profile-journey-link">
              <span className="profile-detail-icon"><Compass size={18} /></span>
              <div>
                <strong>Explore destinations</strong>
                <span>Find inspiration for your next trip.</span>
              </div>
              <Link to="/explore" aria-label="Explore destinations">
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="profile-journey-link">
              <span className="profile-detail-icon"><Plane size={18} /></span>
              <div>
                <strong>View all trips</strong>
                <span>
                  {tripsLoading
                    ? "Loading your trips…"
                    : `${trips.length} ${trips.length === 1 ? "trip" : "trips"} saved to your account.`}
                </span>
              </div>
              <Link to="/trips" aria-label="View all trips">
                <ArrowRight size={17} />
              </Link>
            </div>
          </aside>
        </div>

        <footer className="profile-footer">
          <ShieldCheck size={16} />
          Your profile is private to your VOYAGO account.
          <span>·</span>
          <Link to="/dashboard">Back to dashboard</Link>
        </footer>
      </div>
    </main>
  );
}
