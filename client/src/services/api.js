
const API_URL = (
  import.meta.env.VITE_API_URL || "https://voyago-uz0y.onrender.com/api"
).replace(/\/$/, "");

async function apiRequest(path, options = {}) {
  const { timeoutMs = 20000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        ...(fetchOptions.body ? { "Content-Type": "application/json" } : {}),
        ...(fetchOptions.headers || {}),
      },
    });

    const rawBody = await response.text();
    let data = {};

    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        if (response.ok) {
          throw new Error("The server returned an unreadable response.");
        }
      }
    }

    if (
      response.status === 401 &&
      fetchOptions.headers?.Authorization
    ) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {
        // Continue even if browser storage is unavailable.
      }

      window.dispatchEvent(new Event("voyago:session-expired"));
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Request failed (${response.status}). Please try again.`
      );
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        timeoutMs >= 60000
          ? "Itinerary generation timed out. Check your trip before retrying."
          : "The request timed out. Check your connection and try again."
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Cannot reach the VOYAGO API. Make sure the backend is running and VITE_API_URL is correct."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

const jsonBody = (body) => JSON.stringify(body);

// ================================================
// AUTHENTICATION
// ================================================

export const registerUser = (userData) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: jsonBody(userData),
  });

export const loginUser = (userData) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: jsonBody(userData),
  });

export const getCurrentUser = (token) =>
  apiRequest("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const updateProfile = (updates, token) =>
  apiRequest("/auth/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: jsonBody(updates),
  });

// ================================================
// TRIPS
// ================================================

export const createTrip = (tripData, token) =>
  apiRequest("/trips", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: jsonBody(tripData),
  });

export const getTrips = (token) =>
  apiRequest("/trips", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const getTrip = (tripId, token) =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const updateTrip = (tripId, updates, token) =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: jsonBody(updates),
  });

export const deleteTrip = (tripId, token) =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ================================================
// AI ITINERARY GENERATION
// ================================================

export const generateItinerary = (tripId, token) =>
  apiRequest(`/ai/generate/${encodeURIComponent(tripId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeoutMs: 90000,
  });

// ================================================
// TRIP PLACES, HOTELS AND RESTAURANTS
// ================================================

export const savePlaceLocations = (tripId, places, token) =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}/places`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: jsonBody({ places }),
  });

export const saveHotelLocations = (tripId, hotels, token) =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}/hotels`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: jsonBody({ hotels }),
  });

export const saveRestaurantLocations = (tripId, restaurants, token) =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}/restaurants`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: jsonBody({ restaurants }),
  });

export const saveSelectedHotel = (tripId, hotel, token) =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}/hotels`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: jsonBody({ hotels: [hotel] }),
  });

// ================================================
// ADMIN DASHBOARD
// All admin endpoints require a valid admin token.
// ================================================

export const getAdminStats = (token) =>
  apiRequest("/admin/stats", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const getAdminUsers = (
  token,
  { page = 1, limit = 20, search = "" } = {}
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: search.trim(),
  });

  return apiRequest(`/admin/users?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAdminUser = (userId, token) =>
  apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
