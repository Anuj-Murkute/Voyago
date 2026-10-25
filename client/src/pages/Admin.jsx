
import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAdminStats,
  getAdminUsers,
  getAdminUser,
} from "../services/api";
import "./Admin.css";

const formatDate = (value) => {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (name) =>
  (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export default function Admin() {
  const { user, token, authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    registrationsLast7Days: 0,
    activeToday: 0,
  });

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadStats = useCallback(async () => {
    if (!token) return;

    setStatsLoading(true);

    try {
      const response = await getAdminStats(token);
      setStats(response.stats || {});
    } catch (err) {
      setError(err.message || "Unable to load dashboard statistics.");
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const loadUsers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const response = await getAdminUsers(token, {
        page,
        limit: 20,
        search,
      });

      setUsers(response.users || []);
      setPagination(
        response.pagination || {
          page,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setUsers([]);
      setError(err.message || "Unable to load registered users.");
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    if (!authLoading && user?.role === "admin" && token) {
      loadStats();
    }
  }, [authLoading, user?.role, token, loadStats]);

  useEffect(() => {
    if (!authLoading && user?.role === "admin" && token) {
      loadUsers();
    }
  }, [authLoading, user?.role, token, loadUsers]);

  if (authLoading) {
    return (
      <div className="admin-loading" role="status">
        <span className="admin-spinner" />
        <p>Loading your VOYAGO session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const openUserDetails = async (userId) => {
    setSelectedUser(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await getAdminUser(userId, token);
      setSelectedUser(response.user || null);

      if (!response.user) {
        setDetailError("User details were not returned by the server.");
      }
    } catch (err) {
      setDetailError(err.message || "Unable to load user details.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="admin-eyebrow">
              <span className="admin-live-dot" />
              VOYAGO CONTROL CENTER
            </div>

            <h1>Admin Dashboard</h1>

            <p>
              Monitor registered accounts and recent platform activity.
            </p>
          </div>

          <button
            className="admin-secondary-button"
            onClick={() => {
              loadStats();
              loadUsers();
            }}
            disabled={loading || statsLoading}
          >
            <span aria-hidden="true">↻</span> Refresh
          </button>
        </header>

        {error && (
          <div className="admin-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                loadStats();
                loadUsers();
              }}
            >
              Retry
            </button>
          </div>
        )}

        <section className="admin-stats" aria-label="Platform statistics">
          <article className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-icon users-icon">♙</span>
              <span className="admin-stat-caption">All accounts</span>
            </div>
            <div className="admin-stat-value">
              {statsLoading ? "—" : stats.totalUsers ?? 0}
            </div>
            <div className="admin-stat-label">Registered users</div>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-icon admins-icon">♛</span>
              <span className="admin-stat-caption">Privileged access</span>
            </div>
            <div className="admin-stat-value">
              {statsLoading ? "—" : stats.totalAdmins ?? 0}
            </div>
            <div className="admin-stat-label">Administrators</div>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-icon new-icon">↗</span>
              <span className="admin-stat-caption">Last 7 days</span>
            </div>
            <div className="admin-stat-value">
              {statsLoading ? "—" : stats.registrationsLast7Days ?? 0}
            </div>
            <div className="admin-stat-label">New registrations</div>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-icon active-icon">●</span>
              <span className="admin-stat-caption">Since midnight</span>
            </div>
            <div className="admin-stat-value">
              {statsLoading ? "—" : stats.activeToday ?? 0}
            </div>
            <div className="admin-stat-label">Active today</div>
          </article>
        </section>

        <section className="admin-users-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Registered accounts</h2>
              <p>Search users and inspect their account activity.</p>
            </div>

            <span className="admin-total-badge">
              {pagination.total ?? 0} accounts
            </span>
          </div>

          <div className="admin-toolbar">
            <label className="admin-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or email..."
                aria-label="Search users by name or email"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>

            <span className="admin-results-label">
              {loading ? "Loading accounts..." : `Showing ${users.length} accounts`}
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Last login</th>
                  <th>Last activity</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="admin-table-message">
                      <span className="admin-spinner" />
                      <span>Loading registered users...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-table-message">
                      <span className="admin-empty-icon">♙</span>
                      <strong>No users found</strong>
                      <span>Try a different search term.</span>
                    </td>
                  </tr>
                ) : (
                  users.map((account) => (
                    <tr key={account._id}>
                      <td>
                        <div className="admin-user-cell">
                          <span className="admin-avatar">
                            {getInitials(account.name)}
                          </span>
                          <span className="admin-user-copy">
                            <strong>{account.name}</strong>
                            <span>{account.email}</span>
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-role ${
                            account.role === "admin"
                              ? "admin-role-admin"
                              : "admin-role-user"
                          }`}
                        >
                          {account.role || "user"}
                        </span>
                      </td>

                      <td className="admin-date">
                        {formatDate(account.createdAt)}
                      </td>

                      <td className="admin-date">
                        {formatDate(account.lastLoginAt)}
                      </td>

                      <td className="admin-date">
                        {formatDate(account.lastActivityAt)}
                      </td>

                      <td>
                        <button
                          className="admin-view-button"
                          type="button"
                          onClick={() => openUserDetails(account._id)}
                        >
                          View
                          <span aria-hidden="true"> ↗</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="admin-pagination">
            <span>
              Page {pagination.page || page} of{" "}
              {Math.max(1, pagination.totalPages || 0)}
            </span>

            <div className="admin-pagination-actions">
              <button
                type="button"
                disabled={loading || page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                ← Previous
              </button>

              <button
                type="button"
                disabled={
                  loading ||
                  page >= Math.max(1, pagination.totalPages || 0)
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next →
              </button>
            </div>
          </footer>
        </section>

        <div className="admin-footer-note">
          <span>🔒</span>
          Account information is available only to authorized administrators.
        </div>
      </div>

      {(selectedUser || detailLoading || detailError) && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
              setDetailError("");
            }
          }}
        >
          <section
            className="admin-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-detail-title"
          >
            <div className="admin-detail-header">
              <div>
                <span className="admin-eyebrow">ACCOUNT INFORMATION</span>
                <h2 id="admin-detail-title">User details</h2>
              </div>

              <button
                className="admin-close-button"
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setDetailError("");
                }}
                aria-label="Close user details"
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <div className="admin-detail-state">
                <span className="admin-spinner" />
                Loading user details...
              </div>
            ) : detailError ? (
              <div className="admin-error" role="alert">
                {detailError}
              </div>
            ) : selectedUser ? (
              <>
                <div className="admin-detail-profile">
                  <span className="admin-avatar admin-avatar-large">
                    {getInitials(selectedUser.name)}
                  </span>
                  <div>
                    <h3>{selectedUser.name}</h3>
                    <p>{selectedUser.email}</p>
                    <span
                      className={`admin-role ${
                        selectedUser.role === "admin"
                          ? "admin-role-admin"
                          : "admin-role-user"
                      }`}
                    >
                      {selectedUser.role || "user"}
                    </span>
                  </div>
                </div>

                <div className="admin-detail-list">
                  <div>
                    <span>Account ID</span>
                    <strong className="admin-id-value">{selectedUser._id}</strong>
                  </div>
                  <div>
                    <span>Registration date</span>
                    <strong>{formatDate(selectedUser.createdAt)}</strong>
                  </div>
                  <div>
                    <span>Last login</span>
                    <strong>{formatDate(selectedUser.lastLoginAt)}</strong>
                  </div>
                  <div>
                    <span>Last activity</span>
                    <strong>{formatDate(selectedUser.lastActivityAt)}</strong>
                  </div>
                  <div>
                    <span>Last profile update</span>
                    <strong>{formatDate(selectedUser.updatedAt)}</strong>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}
