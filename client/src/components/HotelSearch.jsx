import React, { useEffect, useMemo, useState } from "react";
import { saveSelectedHotel } from "../services/api";
import "./HotelSearch.css";

const HotelSearch = ({ trip, initialHotels = [], selectedHotel = null, onSelectionSaved }) => {
    const [query, setQuery] = useState("");
    const [guests, setGuests] = useState(Number(trip?.travelers) || 1);
    const [rooms, setRooms] = useState(1);
    const [results, setResults] = useState(initialHotels);
    const [loading, setLoading] = useState(false);
    const [searchMessage, setSearchMessage] = useState("");
    const [savingId, setSavingId] = useState("");

    useEffect(() => {
        setResults(initialHotels || []);
    }, [initialHotels]);

    const nights = useMemo(() => {
        if (!trip?.startDate || !trip?.endDate) return 1;
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff);
    }, [trip?.startDate, trip?.endDate]);

    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const getLocation = (hotel) =>
        hotel?.address || hotel?.formattedAddress || hotel?.location || "Location unavailable";

    const searchHotels = async (event) => {
        event.preventDefault();
        setSearchMessage("");

        if (!window.google?.maps?.importLibrary) {
            setSearchMessage("Google Maps is still loading. Please try again in a moment.");
            return;
        }

        try {
            setLoading(true);

            const { Place } = await window.google.maps.importLibrary("places");
            const destination = trip?.destination || "";
            const searchText = `${query.trim() || "hotels"} ${destination}`.trim();

            const request = {
                textQuery: searchText,
                fields: [
                    "id",
                    "displayName",
                    "formattedAddress",
                    "location",
                    "rating",
                    "websiteURI",
                    "googleMapsURI",
                    "priceLevel"
                ],
                maxResultCount: 8
            };

            const response = await Place.searchByText(request);
            const places = response?.places || [];

            const mapped = places.map((place) => {
                const location = place.location;
                const latitude = location
                    ? typeof location.lat === "function" ? location.lat() : location.lat
                    : null;
                const longitude = location
                    ? typeof location.lng === "function" ? location.lng() : location.lng
                    : null;

                return {
                    id: place.id || `${place.displayName}-${place.formattedAddress}`,
                    placeId: place.id || "",
                    name: place.displayName || "Hotel",
                    address: place.formattedAddress || "",
                    latitude,
                    longitude,
                    rating: place.rating || null,
                    priceLevel: place.priceLevel ?? null,
                    website: place.websiteURI || "",
                    mapsUrl: place.googleMapsURI || ""
                };
            });

            setResults(mapped);

            if (mapped.length === 0) {
                setSearchMessage(`No hotels found for ${destination}. Try a different hotel name or area.`);
            }
        } catch (error) {
            console.error("VOYAGO hotel search error:", error);
            setSearchMessage(error?.message || "Unable to search hotels right now.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (hotel) => {
        const hotelId = hotel.placeId || hotel.id;
        const token = localStorage.getItem("token");

        try {
            setSavingId(hotelId);
            setSearchMessage("");

            const normalizedHotel = {
                ...hotel,
                checkIn: trip?.startDate || "",
                checkOut: trip?.endDate || "",
                guests,
                rooms,
                nights
            };

            const response = await saveSelectedHotel(
                trip._id,
                normalizedHotel,
                token
            );

            if (onSelectionSaved) {
                onSelectionSaved(response.selectedHotel || normalizedHotel);
            }
        } catch (error) {
            console.error("VOYAGO hotel selection error:", error);
            setSearchMessage(error?.message || "Unable to save this hotel.");
        } finally {
            setSavingId("");
        }
    };

    return (
        <div className="hotel-search-card">
            <div className="hotel-search-summary">
                <div>
                    <span className="hotel-search-label">YOUR STAY</span>
                    <h3>{trip?.destination || "Your destination"}</h3>
                    <p>
                        {formatDate(trip?.startDate)} → {formatDate(trip?.endDate)} · {nights} {nights === 1 ? "night" : "nights"}
                    </p>
                </div>
                <div className="hotel-search-summary-badge">
                    🏨 {guests} {guests === 1 ? "Guest" : "Guests"}
                </div>
            </div>

            <form className="hotel-search-form" onSubmit={searchHotels}>
                <div className="hotel-search-field hotel-search-field-wide">
                    <label>SEARCH HOTELS</label>
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={`e.g. luxury hotels in ${trip?.destination || "your destination"}`}
                    />
                </div>

                <div className="hotel-search-field">
                    <label>GUESTS</label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={guests}
                        onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))}
                    />
                </div>

                <div className="hotel-search-field">
                    <label>ROOMS</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={rooms}
                        onChange={(event) => setRooms(Math.max(1, Number(event.target.value) || 1))}
                    />
                </div>

                <button className="hotel-search-button" type="submit" disabled={loading}>
                    {loading ? "Searching..." : "Search Hotels"}
                </button>
            </form>

            {selectedHotel && (
                <div className="selected-hotel-banner">
                    <div>
                        <span>SELECTED STAY</span>
                        <strong>{selectedHotel.name}</strong>
                        <small>
                            {formatDate(selectedHotel.checkIn || trip?.startDate)} → {formatDate(selectedHotel.checkOut || trip?.endDate)} · {selectedHotel.rooms || rooms} room(s) · {selectedHotel.guests || guests} guest(s)
                        </small>
                    </div>
                    {selectedHotel.website && (
                        <a href={selectedHotel.website} target="_blank" rel="noopener noreferrer">
                            Visit Hotel
                        </a>
                    )}
                </div>
            )}

            {searchMessage && <div className="hotel-search-message">{searchMessage}</div>}

            {results.length > 0 && (
                <div className="hotel-results-grid">
                    {results.map((hotel, index) => {
                        const hotelId = hotel.placeId || hotel.id || `${hotel.name}-${index}`;
                        const isSelected = selectedHotel && (selectedHotel.placeId === hotel.placeId || selectedHotel.id === hotel.id);

                        return (
                            <article className={`hotel-result-card ${isSelected ? "selected" : ""}`} key={hotelId}>
                                <div className="hotel-result-icon">🏨</div>
                                <div className="hotel-result-content">
                                    <div className="hotel-result-topline">
                                        <span>HOTEL</span>
                                        {hotel.rating && <b>⭐ {hotel.rating}</b>}
                                    </div>
                                    <h4>{hotel.name}</h4>
                                    <p className="hotel-result-address">📍 {getLocation(hotel)}</p>

                                    <div className="hotel-result-meta">
                                        <span>📅 {nights} {nights === 1 ? "night" : "nights"}</span>
                                        <span>👤 {guests}</span>
                                        <span>🛏️ {rooms} room{rooms === 1 ? "" : "s"}</span>
                                    </div>

                                    <div className="hotel-result-actions">
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(hotel)}
                                            disabled={savingId === hotelId}
                                        >
                                            {savingId === hotelId ? "Saving..." : isSelected ? "Selected ✓" : "Select Stay"}
                                        </button>
                                        {hotel.website && (
                                            <a href={hotel.website} target="_blank" rel="noopener noreferrer">
                                                Hotel Website
                                            </a>
                                        )}
                                        {hotel.mapsUrl && (
                                            <a href={hotel.mapsUrl} target="_blank" rel="noopener noreferrer">
                                                Maps
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HotelSearch;
