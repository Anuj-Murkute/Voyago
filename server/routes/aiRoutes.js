
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { generateItinerary } = require("../controllers/aiController");

// Generate and save an itinerary for an authenticated user's trip.
router.post("/generate/:tripId", protect, generateItinerary);

module.exports = router;
