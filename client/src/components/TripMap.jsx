
import { useCallback, useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { savePlaceLocations } from "../services/api";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

// --------------------------------------------------
// GOOGLE MAPS CONFIGURATION
// --------------------------------------------------

const apiKey = (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_KEY ||
    ""
).trim();

const mapId = (
    import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID"
).trim();


let googleLibrariesPromise = null;

const CACHE_KEY = "voyago_google_places_cache";
const CACHE_LIMIT = 250;
const REQUEST_TIMEOUT = 12000;

const placeCache = new Map();

// --------------------------------------------------
// CACHE HELPERS
// --------------------------------------------------

function loadPlaceCache() {
    try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== "object") return;

        Object.entries(parsed).slice(-CACHE_LIMIT).forEach(([key, value]) => {
            if (
                value &&
                Number.isFinite(value.latitude) &&
                Number.isFinite(value.longitude) &&
                Math.abs(value.latitude) <= 90 &&
                Math.abs(value.longitude) <= 180
            ) {
                placeCache.set(key, value);
            }
        });
    } catch (error) {
        console.warn("VOYAGO: Could not load place cache:", error.message);
    }
}

function persistPlaceCache() {
    try {
        const entries = [...placeCache.entries()].slice(-CACHE_LIMIT);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch (error) {
        console.warn("VOYAGO: Could not persist place cache:", error.message);
    }
}

if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    loadPlaceCache();
}

// --------------------------------------------------
// GOOGLE MAPS LIBRARIES
// --------------------------------------------------

async function loadGoogleLibraries() {
    if (!apiKey) {
        console.error(
            "VOYAGO: Google Maps API key is missing from the frontend build.",
            {
                primaryVariableConfigured: Boolean(
                    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                ),
                alternateVariableConfigured: Boolean(
                    import.meta.env.VITE_GOOGLE_MAPS_KEY
                ),
                productionHint:
                    "Set VITE_GOOGLE_MAPS_API_KEY in Vercel and redeploy."
            }
        );

        throw new Error(
            "Google Maps API key is missing from the deployed frontend. " +
            "Add VITE_GOOGLE_MAPS_API_KEY in Vercel → Settings → Environment Variables, " +
            "select Production, and redeploy."
        );
    }

    if (!googleLibrariesPromise) {
        googleLibrariesPromise = (async () => {
            try {
                setOptions({
                    key: apiKey,
                    v: "weekly"
                });

                const [
                    mapsLibrary,
                    markerLibrary,
                    placesLibrary,
                    routesLibrary,
                    coreLibrary
                ] = await Promise.all([
                    importLibrary("maps"),
                    importLibrary("marker"),
                    importLibrary("places"),
                    importLibrary("routes"),
                    importLibrary("core")
                ]);

                return [
                    mapsLibrary,
                    markerLibrary,
                    placesLibrary,
                    routesLibrary,
                    coreLibrary
                ];
            } catch (error) {
                googleLibrariesPromise = null;

                console.error(
                    "VOYAGO: Google Maps libraries failed to load.",
                    error
                );

                throw error;
            }
        })();
    }

    return googleLibrariesPromise;
}

// --------------------------------------------------
// GENERAL HELPERS
// --------------------------------------------------

function normalizePlaceName(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function getPlaceCacheKey(destination, activityName) {
    return `${normalizePlaceName(destination)}|${normalizePlaceName(activityName)}`;
}

function getActivityName(activity) {
    if (typeof activity === "string") return activity.trim();
    if (!activity || typeof activity !== "object") return "";

    const candidates = [activity.place, activity.name, activity.title];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
        }
    }

    if (typeof activity.location === "string") {
        return activity.location.trim();
    }

    return "";
}

function getActivityDescription(activity) {
    if (!activity || typeof activity !== "object") return "";
    return activity.description || activity.reason || "";
}

function getActivityLocation(activity) {
    if (!activity || typeof activity !== "object") return null;

    const candidates = [
        activity.coordinates,
        activity.position,
        typeof activity.location === "object" ? activity.location : null,
        activity,
    ];

    for (const location of candidates) {
        if (!location || typeof location !== "object") continue;

        const rawLat = location.latitude ?? location.lat;
        const rawLng = location.longitude ?? location.lng;

        if (rawLat == null || rawLng == null || rawLat === "" || rawLng === "") {
            continue;
        }

        const latitude = Number(
            typeof rawLat === "function" ? rawLat() : rawLat
        );
        const longitude = Number(
            typeof rawLng === "function" ? rawLng() : rawLng
        );

        if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            Math.abs(latitude) <= 90 &&
            Math.abs(longitude) <= 180
        ) {
            return {
                latitude,
                longitude,
                address: activity.address || location.address || "",
                placeId: activity.placeId || location.placeId || "",
                displayName:
                    activity.placeName ||
                    activity.name ||
                    activity.place ||
                    "",
                types: activity.types || location.types || [],
            };
        }
    }

    return null;
}

function withTimeout(promise, timeout = REQUEST_TIMEOUT) {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
            () => reject(new Error("Request timed out")),
            timeout
        );
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    })[character]);
}

function getCoordinate(location, key) {
    const value = location?.[key];
    return Number(typeof value === "function" ? value() : value);
}

function createCachedPlace(cached, LatLng) {
    return {
        id: cached.placeId || "",
        displayName: cached.displayName || "",
        location: new LatLng(cached.latitude, cached.longitude),
        formattedAddress: cached.address || "",
        types: cached.types || [],
    };
}

function clearMapObjects(markersRef, polylinesRef, infoWindowRef) {
    markersRef.current.forEach((marker) => {
        marker.map = null;
    });
    markersRef.current = [];

    polylinesRef.current.forEach((polyline) => {
        polyline.setMap(null);
    });
    polylinesRef.current = [];

    infoWindowRef.current?.close();
    infoWindowRef.current = null;
}

function createMarkerContent(number, placeName) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
        "display:flex;flex-direction:column;align-items:center;transform:translateY(-2px)";

    const pin = document.createElement("div");
    pin.style.cssText = [
        "width:38px",
        "height:38px",
        "border-radius:50%",
        "background:#e53935",
        "color:white",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "font:800 15px Arial,sans-serif",
        "border:3px solid white",
        "box-shadow:0 3px 12px rgba(0,0,0,.3)",
        "cursor:pointer",
    ].join(";");

    pin.textContent = String(number);

    const label = document.createElement("div");
    label.style.cssText = [
        "margin-top:5px",
        "padding:5px 9px",
        "background:#fff",
        "border:1px solid #e5e7eb",
        "border-radius:8px",
        "box-shadow:0 3px 12px rgba(0,0,0,.15)",
        "color:#111827",
        "font:700 12px Arial,sans-serif",
        "max-width:190px",
        "white-space:nowrap",
        "overflow:hidden",
        "text-overflow:ellipsis",
        "pointer-events:none",
    ].join(";");

    label.textContent = placeName;
    wrapper.append(pin, label);

    return wrapper;
}

function formatDuration(minutes) {
    if (minutes == null || !Number.isFinite(Number(minutes))) return "--";

    const total = Math.max(0, Math.round(Number(minutes)));
    if (total < 60) return `${total} min`;

    const hours = Math.floor(total / 60);
    const remaining = total % 60;

    return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function getRouteDurationMinutes(route) {
    if (Number.isFinite(route?.durationMillis)) {
        return Math.round(route.durationMillis / 60000);
    }

    // The newer Routes API can return duration as a string such as "123s".
    if (typeof route?.duration === "string") {
        const seconds = Number.parseFloat(route.duration.replace(/s$/, ""));
        if (Number.isFinite(seconds)) return Math.round(seconds / 60);
    }

    return null;
}

// --------------------------------------------------
// TRIP MAP
// --------------------------------------------------

function TripMap({ tripId, destination, itinerary, selectedDay }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);
    const polylinesRef = useRef([]);
    const routeResultsRef = useRef({});
    const infoWindowRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [routeInfo, setRouteInfo] = useState(null);
    const [travelOptions, setTravelOptions] = useState([]);
    const [selectedTravelMode, setSelectedTravelMode] = useState("WALKING");
    const [themeMode, setThemeMode] = useState(
        document.documentElement.dataset.theme || "light"
    );

    // Follow the app's light/dark theme.
    useEffect(() => {
        const root = document.documentElement;

        const updateTheme = () => {
            setThemeMode(root.dataset.theme || "light");
        };

        updateTheme();

        const observer = new MutationObserver(updateTheme);
        observer.observe(root, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return () => observer.disconnect();
    }, []);

    const dark = themeMode === "dark";

    const colors = {
        surface: dark ? "#172033" : "#ffffff",
        surfaceSecondary: dark ? "#202b40" : "#f8fafc",
        text: dark ? "#f1f5f9" : "#111827",
        muted: dark ? "#a8b4c7" : "#64748b",
        border: dark ? "#344158" : "#e5e7eb",
        selected: dark ? "#1e3a5f" : "#eff6ff",
        accent: "#2563eb",
    };

    const getCurrentActivities = useCallback(() => {
        const currentDay = itinerary?.[selectedDay];

        const activities =
            currentDay?.activities ||
            currentDay?.places ||
            currentDay?.stops ||
            [];

        return Array.isArray(activities) ? activities : [];
    }, [itinerary, selectedDay]);

    // --------------------------------------------------
    // LOAD MAP AND RESOLVE PLACES
    // --------------------------------------------------

    useEffect(() => {
        let cancelled = false;

        const loadMap = async () => {
            setLoading(true);
            setError("");
            setRouteInfo(null);
            setTravelOptions([]);
            routeResultsRef.current = {};

            try {
                if (!mapRef.current) {
                    throw new Error("The map container is not ready.");
                }

                const [
                    mapsLibrary,
                    markerLibrary,
                    placesLibrary,
                    routesLibrary,
                    coreLibrary,
                ] = await loadGoogleLibraries();

                if (cancelled) return;

                const { Map, InfoWindow } = mapsLibrary;
                const { AdvancedMarkerElement } = markerLibrary;
                const { Place } = placesLibrary;
                const { Route } = routesLibrary;
                const { LatLngBounds, LatLng } = coreLibrary;

                clearMapObjects(markersRef, polylinesRef, infoWindowRef);

                const map = new Map(mapRef.current, {
                    center: { lat: 20.5937, lng: 78.9629 },
                    zoom: 5,
                    mapId,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                    clickableIcons: false,
                });

                mapInstance.current = map;
                infoWindowRef.current = new InfoWindow();

                const activities = getCurrentActivities();

                if (activities.length === 0) {
                    setError("No places were found for this day.");
                    setLoading(false);
                    return;
                }

                const bounds = new LatLngBounds();
                const resolvedPlaces = [];

                for (let index = 0; index < activities.length; index++) {
                    if (cancelled) return;

                    const activity = activities[index];
                    const activityName = getActivityName(activity);

                    if (!activityName) continue;

                    try {
                        const cacheKey = getPlaceCacheKey(destination, activityName);
                        let place = null;

                        // 1. Use coordinates already stored in the itinerary.
                        const savedLocation = getActivityLocation(activity);

                        if (savedLocation) {
                            place = createCachedPlace(savedLocation, LatLng);
                            placeCache.set(cacheKey, savedLocation);
                            persistPlaceCache();
                        }

                        // 2. Use the session cache.
                        if (!place) {
                            const cached = placeCache.get(cacheKey);

                            if (cached) {
                                place = createCachedPlace(cached, LatLng);
                            }
                        }

                        // 3. Search Google Places only when necessary.
                        if (!place) {
                            const query = `${activityName}, ${destination}`;

                            const result = await withTimeout(
                                Place.searchByText({
                                    textQuery: query,
                                    fields: [
                                        "id",
                                        "displayName",
                                        "location",
                                        "formattedAddress",
                                        "types",
                                    ],
                                    language: "en",
                                    maxResultCount: 5,
                                })
                            );

                            if (cancelled) return;

                            if (!result?.places?.length) {
                                console.warn("VOYAGO: No result for", activityName);
                                continue;
                            }

                            const normalizedSearch = normalizePlaceName(activityName);

                            place = result.places.find((candidate) => {
                                const candidateName = normalizePlaceName(
                                    candidate.displayName
                                );

                                return (
                                    candidateName &&
                                    (candidateName.includes(normalizedSearch) ||
                                        normalizedSearch.includes(candidateName))
                                );
                            }) || result.places[0];

                            if (!place?.location) {
                                console.warn("VOYAGO: No location for", activityName);
                                continue;
                            }

                            const latitude = getCoordinate(place.location, "lat");
                            const longitude = getCoordinate(place.location, "lng");

                            if (
                                Number.isFinite(latitude) &&
                                Number.isFinite(longitude)
                            ) {
                                const cachedPlace = {
                                    latitude,
                                    longitude,
                                    displayName: place.displayName || activityName,
                                    address: place.formattedAddress || "",
                                    placeId: place.id || "",
                                    types: place.types || [],
                                };

                                placeCache.set(cacheKey, cachedPlace);
                                persistPlaceCache();
                            }
                        }

                        if (!place?.location) continue;

                        const displayName = place.displayName || activityName;

                        resolvedPlaces.push({ activity, place, index });
                        bounds.extend(place.location);

                        const marker = new AdvancedMarkerElement({
                            map,
                            position: place.location,
                            content: createMarkerContent(index + 1, displayName),
                            title: displayName,
                        });

                        marker.addEventListener("gmp-click", () => {
                            if (cancelled) return;

                            const description = getActivityDescription(activity);
                            const time =
                                typeof activity === "object" ? activity.time || "" : "";
                            const duration =
                                typeof activity === "object"
                                    ? activity.duration || ""
                                    : "";
                            const address = place.formattedAddress || "";

                            // Escape all values inserted into the info-window HTML.
                            infoWindowRef.current?.setContent(`
                                <div style="width:270px;padding:4px;font-family:Arial,sans-serif">
                                    <div style="display:inline-block;background:#111827;color:white;padding:4px 8px;border-radius:5px;font-size:10px;font-weight:800;margin-bottom:8px">
                                        STOP ${index + 1}
                                    </div>
                                    <h3 style="margin:0 0 8px;color:#111827;font-size:17px;line-height:1.3">
                                        ${escapeHtml(displayName)}
                                    </h3>
                                    ${
                                        address
                                            ? `<div style="color:#64748b;font-size:12px;line-height:1.4;margin-bottom:9px">${escapeHtml(address)}</div>`
                                            : ""
                                    }
                                    ${
                                        description
                                            ? `<p style="margin:0 0 10px;color:#475569;font-size:13px;line-height:1.5">${escapeHtml(description)}</p>`
                                            : ""
                                    }
                                    ${
                                        time
                                            ? `<div style="font-size:12px;color:#334155;margin-bottom:5px">🕐 ${escapeHtml(time)}</div>`
                                            : ""
                                    }
                                    ${
                                        duration
                                            ? `<div style="font-size:12px;color:#334155">⏱ ${escapeHtml(duration)}</div>`
                                            : ""
                                    }
                                </div>
                            `);

                            infoWindowRef.current?.open({
                                map,
                                anchor: marker,
                                shouldFocus: false,
                            });

                            map.panTo(place.location);
                        });

                        markersRef.current.push(marker);
                    } catch (placeError) {
                        if (!cancelled) {
                            console.warn(
                                `VOYAGO: Could not resolve ${activityName}:`,
                                placeError.message
                            );
                        }
                    }
                }

                if (cancelled) return;

                if (resolvedPlaces.length === 0) {
                    setError(
                        "VOYAGO could not find any itinerary places on Google Maps."
                    );
                    setLoading(false);
                    return;
                }

                // Persist resolved places through the existing authenticated API.
                if (tripId) {
                    const token = localStorage.getItem("token");

                    if (token) {
                        const placesToSave = resolvedPlaces.map(
                            ({ activity, place, index }) => ({
                                day: Number(selectedDay) + 1,
                                order: index + 1,
                                name: place.displayName || getActivityName(activity),
                                placeId: place.id || "",
                                latitude: getCoordinate(place.location, "lat"),
                                longitude: getCoordinate(place.location, "lng"),
                                address: place.formattedAddress || "",
                                description: getActivityDescription(activity),
                                time:
                                    typeof activity === "object"
                                        ? activity.time || ""
                                        : "",
                                duration:
                                    typeof activity === "object"
                                        ? activity.duration || ""
                                        : "",
                            })
                        );

                        try {
                            await savePlaceLocations(tripId, placesToSave, token);
                        } catch (saveError) {
                            console.warn(
                                "VOYAGO: Could not save place locations:",
                                saveError.message
                            );
                        }
                    } else {
                        console.warn(
                            "VOYAGO: No authentication token; locations were not saved."
                        );
                    }
                }

                if (cancelled) return;

                if (resolvedPlaces.length === 1) {
                    map.setCenter(resolvedPlaces[0].place.location);
                    map.setZoom(15);
                } else {
                    map.fitBounds(bounds, 80);
                }

                setLoading(false);

                // Routes require at least two stops.
                if (resolvedPlaces.length < 2) return;

                // Routes API expects location values, not the complete
                // custom Place wrapper objects used by VOYAGO's cache.
                const origin = resolvedPlaces[0].place.location;
                const finalDestination =
                    resolvedPlaces[resolvedPlaces.length - 1].place.location;
                const intermediates = resolvedPlaces
                    .slice(1, -1)
                    .map((item) => ({
                        location: item.place.location,
                    }));

                const routeModes = [
                    {
                        mode: "WALKING",
                        label: "Walking",
                        icon: "🚶",
                        description: "Best for nearby sightseeing",
                    },
                    {
                        mode: "DRIVING",
                        label: "Driving",
                        icon: "🚗",
                        description: "Best for faster point-to-point travel",
                    },
                ];

                // Request routes independently so one unavailable mode
                // does not prevent the other mode from working.
                for (const option of routeModes) {
                    if (cancelled) return;

                    try {
                        const result = await withTimeout(
                            Route.computeRoutes({
                                origin,
                                destination: finalDestination,
                                intermediates,
                                travelMode: option.mode,
                                fields: [
                                    "path",
                                    "distanceMeters",
                                    "durationMillis",
                                    "duration",
                                    "legs",
                                ],
                            })
                        );

                        if (cancelled) return;

                        const route = result?.routes?.[0];
                        if (!route) continue;

                        const distanceKm = Number.isFinite(route.distanceMeters)
                            ? (route.distanceMeters / 1000).toFixed(1)
                            : null;

                        const duration = getRouteDurationMinutes(route);

                        routeResultsRef.current[option.mode] = route;

                        setTravelOptions((previous) => [
                            ...previous.filter(
                                (item) => item.mode !== option.mode
                            ),
                            {
                                ...option,
                                distance: distanceKm,
                                duration,
                            },
                        ]);
                    } catch (routeError) {
                        console.warn(
                            `VOYAGO: ${option.label} route unavailable:`,
                            routeError.message
                        );
                    }
                }
            } catch (mapError) {
                console.error("VOYAGO Google Maps error:", mapError);

                if (!cancelled) {
                    setError(mapError.message || "Unable to load Google Maps.");
                    setLoading(false);
                }
            }
        };

        if (
            destination &&
            tripId &&
            Array.isArray(itinerary) &&
            itinerary.length > 0 &&
            mapRef.current
        ) {
            loadMap();
        } else {
            setLoading(false);
            setError("");
        }

        return () => {
            cancelled = true;
            clearMapObjects(markersRef, polylinesRef, infoWindowRef);
            routeResultsRef.current = {};
            mapInstance.current = null;
        };
    }, [destination, tripId, itinerary, selectedDay, getCurrentActivities]);

    // --------------------------------------------------
    // DRAW THE SELECTED ROUTE
    // --------------------------------------------------

    useEffect(() => {
        const map = mapInstance.current;
        const route = routeResultsRef.current[selectedTravelMode];

        polylinesRef.current.forEach((polyline) => polyline.setMap(null));
        polylinesRef.current = [];

        if (!map || !route) {
            setRouteInfo(null);
            return undefined;
        }

        try {
            const polylines = route.createPolylines();

            polylines.forEach((polyline) => {
                polyline.setOptions({
                    strokeColor: dark ? "#93c5fd" : "#2563eb",
                    strokeOpacity: 0.9,
                    strokeWeight: 5,
                    zIndex: 1,
                });

                polyline.setMap(map);
                polylinesRef.current.push(polyline);
            });

            const option = travelOptions.find(
                (item) => item.mode === selectedTravelMode
            );

            if (option) {
                setRouteInfo({
                    distance: option.distance,
                    duration: option.duration,
                    stops: getCurrentActivities().length,
                });
            } else {
                setRouteInfo(null);
            }
        } catch (error) {
            console.warn("VOYAGO: Could not draw route:", error.message);
            setRouteInfo(null);
        }

        return () => {
            polylinesRef.current.forEach((polyline) => polyline.setMap(null));
            polylinesRef.current = [];
        };
    }, [
        selectedTravelMode,
        travelOptions,
        itinerary,
        selectedDay,
        dark,
        getCurrentActivities,
    ]);

    const selectedOption = travelOptions.find(
        (option) => option.mode === selectedTravelMode
    );

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    const panelStyle = {
        background: colors.surface,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        boxShadow: dark
            ? "0 4px 18px rgba(0,0,0,.18)"
            : "0 4px 15px rgba(15,23,42,.05)",
    };

    const smallTextStyle = {
        color: colors.muted,
        fontSize: "12px",
    };

    return (
        <div className={`trip-map ${dark ? "trip-map--dark" : "trip-map--light"}`}>
            {routeInfo && (
                <div className="trip-map__summary">
                    <div
                        className="trip-map__summary-item trip-map__summary-item--primary"
                        style={{ background: dark ? "#243a5b" : "#111827" }}
                    >
                        📍 {routeInfo.stops} stops
                    </div>

                    <div className="trip-map__summary-item" style={panelStyle}>
                        📏 {routeInfo.distance ?? "--"} km
                    </div>

                    <div className="trip-map__summary-item" style={panelStyle}>
                        {selectedTravelMode === "WALKING" ? "🚶" : "🚗"}{" "}
                        {formatDuration(routeInfo.duration)}
                    </div>
                </div>
            )}

            {travelOptions.length > 0 && (
                <section
                    className="trip-map__travel-panel"
                    style={{ ...panelStyle, padding: "16px", marginBottom: "14px" }}
                >
                    <div className="trip-map__panel-heading">
                        <span
                            style={{
                                color: colors.accent,
                                fontSize: "10px",
                                fontWeight: 800,
                                letterSpacing: "1.4px",
                            }}
                        >
                            TRAVEL OPTIONS
                        </span>

                        <h3 style={{ color: colors.text, margin: "4px 0 14px" }}>
                            Choose how you want to travel
                        </h3>
                    </div>

                    <div className="trip-map__travel-options">
                        {travelOptions.map((option) => {
                            const selected =
                                selectedTravelMode === option.mode;

                            return (
                                <button
                                    key={option.mode}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() =>
                                        setSelectedTravelMode(option.mode)
                                    }
                                    className="trip-map__travel-option"
                                    style={{
                                        background: selected
                                            ? colors.selected
                                            : colors.surface,
                                        border: `1px solid ${
                                            selected ? colors.accent : colors.border
                                        }`,
                                        color: colors.text,
                                    }}
                                >
                                    <span className="trip-map__option-title">
                                        <span aria-hidden="true">{option.icon}</span>
                                        <strong>{option.label}</strong>
                                    </span>

                                    <strong className="trip-map__option-duration">
                                        {formatDuration(option.duration)}
                                    </strong>

                                    <span style={smallTextStyle}>
                                        {option.distance ?? "--"} km
                                    </span>

                                    <span style={smallTextStyle}>
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedOption && (
                        <div
                            className="trip-map__selected-route"
                            style={{
                                background: colors.surfaceSecondary,
                                color: colors.text,
                            }}
                        >
                            <div>
                                <strong>
                                    {selectedOption.icon} {selectedOption.label}
                                </strong>
                                <p style={{ ...smallTextStyle, margin: "4px 0 0" }}>
                                    {selectedOption.description}
                                </p>
                            </div>

                            <div className="trip-map__selected-stats">
                                <div>
                                    <span>TIME</span>
                                    <strong>
                                        {formatDuration(selectedOption.duration)}
                                    </strong>
                                </div>
                                <div>
                                    <span>DISTANCE</span>
                                    <strong>
                                        {selectedOption.distance ?? "--"} km
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            <div className="trip-map__canvas">
                <div ref={mapRef} className="trip-map__map-element" />

                {loading && (
                    <div
                        className="trip-map__overlay trip-map__loading"
                        style={{
                            background: colors.surface,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                        }}
                        role="status"
                        aria-live="polite"
                    >
                        <span aria-hidden="true">🗺️</span>
                        Finding itinerary places...
                    </div>
                )}

                {error && (
                    <div className="trip-map__overlay trip-map__error" role="alert">
                        <strong>⚠️ Map unavailable</strong>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <style>{`
                .trip-map {
                    width: 100%;
                    min-width: 0;
                    position: relative;
                    color: ${colors.text};
                }

                .trip-map__summary {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 12px;
                }

                .trip-map__summary-item {
                    display: flex;
                    align-items: center;
                    padding: 9px 14px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 700;
                }

                .trip-map__summary-item--primary {
                    color: #fff;
                }

                .trip-map__travel-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
                    gap: 9px;
                }

                .trip-map__travel-option {
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                    padding: 12px;
                    border-radius: 12px;
                    text-align: left;
                    cursor: pointer;
                    font: inherit;
                    transition: border-color .2s ease, background .2s ease;
                }

                .trip-map__travel-option:focus-visible {
                    outline: 3px solid #60a5fa;
                    outline-offset: 2px;
                }

                .trip-map__option-title {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    font-size: 13px;
                }

                .trip-map__option-title > span {
                    font-size: 21px;
                }

                .trip-map__option-duration {
                    font-size: 17px;
                }

                .trip-map__selected-route {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-top: 12px;
                    padding: 12px;
                    border-radius: 11px;
                }

                .trip-map__selected-stats {
                    display: flex;
                    gap: 20px;
                }

                .trip-map__selected-stats > div {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .trip-map__selected-stats span {
                    color: ${colors.muted};
                    font-size: 9px;
                    letter-spacing: .6px;
                }

                .trip-map__selected-stats strong {
                    font-size: 13px;
                }

                .trip-map__canvas {
                    position: relative;
                    width: 100%;
                    height: 600px;
                    overflow: hidden;
                    border-radius: 20px;
                    background: ${dark ? "#202b40" : "#e5e7eb"};
                }

                .trip-map__map-element {
                    width: 100%;
                    height: 100%;
                }

                .trip-map__overlay {
                    position: absolute;
                    z-index: 5;
                    box-shadow: 0 4px 18px rgba(0,0,0,.15);
                    font-size: 12px;
                    font-weight: 600;
                }

                .trip-map__loading {
                    top: 18px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    max-width: calc(100% - 28px);
                    padding: 10px 16px;
                    border-radius: 999px;
                    white-space: nowrap;
                }

                .trip-map__error {
                    top: 18px;
                    left: 18px;
                    right: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    padding: 13px 16px;
                    color: ${dark ? "#fecaca" : "#991b1b"};
                    background: ${dark ? "#451a24" : "#fff"};
                    border: 1px solid ${dark ? "#7f1d1d" : "#fecaca"};
                    border-radius: 12px;
                }

                @media (max-width: 600px) {
                    .trip-map__canvas {
                        height: 440px;
                        border-radius: 14px;
                    }

                    .trip-map__selected-route {
                        align-items: flex-start;
                    }

                    .trip-map__selected-stats {
                        width: 100%;
                        justify-content: space-between;
                    }

                    .trip-map__loading {
                        font-size: 11px;
                        padding: 9px 12px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .trip-map__travel-option {
                        transition: none;
                    }
                }
            `}</style>
        </div>
    );
}

export default TripMap;
