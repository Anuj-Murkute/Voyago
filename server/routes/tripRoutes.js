
const express = require("express");
const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const validId = (id) => mongoose.isValidObjectId(id);

const findOwnedTrip = (id, userId) =>
    Trip.findOne({ _id: id, user: userId });

const isValidDate = (value) =>
    Number.isFinite(new Date(value).getTime());

const validTravelers = (value) =>
    Number.isInteger(Number(value)) &&
    Number(value) >= 1 &&
    Number(value) <= 30;

// CREATE TRIP
router.post("/", protect, async (req, res) => {
    try {
        const {
            destination,
            startDate,
            endDate,
            travelers,
            budget,
            interests = []
        } = req.body || {};

        if (
            typeof destination !== "string" ||
            !destination.trim() ||
            !startDate ||
            !endDate ||
            travelers === undefined ||
            !budget
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required trip details."
            });
        }

        if (
            !isValidDate(startDate) ||
            !isValidDate(endDate) ||
            new Date(endDate) < new Date(startDate)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid trip dates."
            });
        }

        if (!validTravelers(travelers)) {
            return res.status(400).json({
                success: false,
                message: "Travelers must be between 1 and 30."
            });
        }

        if (typeof budget !== "string" || !budget.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid budget."
            });
        }

        if (
            !Array.isArray(interests) ||
            interests.some((item) => typeof item !== "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Interests must be an array of strings."
            });
        }

        const trip = await Trip.create({
            user: req.user,
            destination: destination.trim(),
            startDate,
            endDate,
            travelers: Number(travelers),
            budget: budget.trim(),
            interests
        });

        return res.status(201).json({
            success: true,
            message: "Trip created successfully.",
            trip
        });
    } catch (error) {
        console.error("Create trip error:", error.message);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid trip details."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create trip."
        });
    }
});

// GET ALL TRIPS BELONGING TO THE CURRENT USER
router.get("/", protect, async (req, res) => {
    try {
        const trips = await Trip.find({
            user: req.user
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: trips.length,
            trips
        });
    } catch (error) {
        console.error("Get trips error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch trips."
        });
    }
});

// GET ONE TRIP
router.get("/:id", protect, async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID."
            });
        }

        const trip = await findOwnedTrip(req.params.id, req.user);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found."
            });
        }

        return res.status(200).json({
            success: true,
            trip
        });
    } catch (error) {
        console.error("Get trip error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch trip."
        });
    }
});

// UPDATE TRIP DETAILS
router.patch("/:id", protect, async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID."
            });
        }

        const allowedFields = [
            "destination",
            "startDate",
            "endDate",
            "travelers",
            "budget",
            "interests",
            "status"
        ];

        const body = req.body || {};
        const updates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(body, field)) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No supported trip fields provided."
            });
        }

        if (
            updates.destination !== undefined &&
            (
                typeof updates.destination !== "string" ||
                !updates.destination.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Destination must not be empty."
            });
        }

        if (
            updates.travelers !== undefined &&
            !validTravelers(updates.travelers)
        ) {
            return res.status(400).json({
                success: false,
                message: "Travelers must be between 1 and 30."
            });
        }

        if (
            updates.budget !== undefined &&
            (
                typeof updates.budget !== "string" ||
                !updates.budget.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid budget."
            });
        }

        if (
            updates.interests !== undefined &&
            (
                !Array.isArray(updates.interests) ||
                updates.interests.some(
                    (item) => typeof item !== "string"
                )
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Interests must be an array of strings."
            });
        }

        if (
            updates.status !== undefined &&
            !["planning", "confirmed", "completed"].includes(updates.status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip status."
            });
        }

        if (updates.destination !== undefined) {
            updates.destination = updates.destination.trim();
        }

        if (updates.budget !== undefined) {
            updates.budget = updates.budget.trim();
        }

        if (updates.travelers !== undefined) {
            updates.travelers = Number(updates.travelers);
        }

        const trip = await findOwnedTrip(req.params.id, req.user);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found."
            });
        }

        const startDate = updates.startDate ?? trip.startDate;
        const endDate = updates.endDate ?? trip.endDate;

        if (
            !isValidDate(startDate) ||
            !isValidDate(endDate) ||
            new Date(endDate) < new Date(startDate)
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide valid dates. End date cannot precede start date."
            });
        }

        Object.assign(trip, updates);
        await trip.save();

        return res.status(200).json({
            success: true,
            message: "Trip updated successfully.",
            trip
        });
    } catch (error) {
        console.error("Update trip error:", error.message);

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip details."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update trip."
        });
    }
});

// DELETE TRIP
router.delete("/:id", protect, async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID."
            });
        }

        const trip = await Trip.findOneAndDelete({
            _id: req.params.id,
            user: req.user
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Trip deleted successfully.",
            tripId: trip._id
        });
    } catch (error) {
        console.error("Delete trip error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete trip."
        });
    }
});

// SAVE RESOLVED MAP PLACE LOCATIONS
router.put("/:id/places", protect, async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID."
            });
        }

        const { places } = req.body || {};

        if (
            !Array.isArray(places) ||
            places.some(
                (place) =>
                    !place ||
                    !Number.isInteger(Number(place.day)) ||
                    Number(place.day) < 1
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Places must be an array with valid day numbers."
            });
        }

        const trip = await findOwnedTrip(req.params.id, req.user);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found."
            });
        }

        const incomingDays = new Set(
            places.map((place) => Number(place.day))
        );

        const existingPlaces = Array.isArray(trip.placeLocations)
            ? trip.placeLocations
            : [];

        const remainingPlaces = existingPlaces.filter(
            (place) => !incomingDays.has(Number(place.day))
        );

        trip.placeLocations = [
            ...remainingPlaces,
            ...places
        ];

        await trip.save();

        return res.status(200).json({
            success: true,
            message: "Place locations saved successfully.",
            places: trip.placeLocations
        });
    } catch (error) {
        console.error("Save place locations error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to save place locations."
        });
    }
});

// SAVE RESOLVED HOTEL LOCATIONS
router.put("/:id/hotels", protect, async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID."
            });
        }

        const { hotels } = req.body || {};

        if (!Array.isArray(hotels)) {
            return res.status(400).json({
                success: false,
                message: "Hotels must be an array."
            });
        }

        const trip = await findOwnedTrip(req.params.id, req.user);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found."
            });
        }

        trip.hotelLocations = hotels;
        await trip.save();

        return res.status(200).json({
            success: true,
            message: "Hotel locations saved successfully.",
            hotels: trip.hotelLocations
        });
    } catch (error) {
        console.error("Save hotel locations error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to save hotel locations."
        });
    }
});

// SAVE RESOLVED RESTAURANT LOCATIONS
router.put("/:id/restaurants", protect, async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID."
            });
        }

        const { restaurants } = req.body || {};

        if (!Array.isArray(restaurants)) {
            return res.status(400).json({
                success: false,
                message: "Restaurants must be an array."
            });
        }

        const trip = await findOwnedTrip(req.params.id, req.user);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found."
            });
        }

        trip.restaurantLocations = restaurants;
        await trip.save();

        return res.status(200).json({
            success: true,
            message: "Restaurant locations saved successfully.",
            restaurants: trip.restaurantLocations
        });
    } catch (error) {
        console.error("Save restaurant locations error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to save restaurant locations."
        });
    }
});

module.exports = router;
