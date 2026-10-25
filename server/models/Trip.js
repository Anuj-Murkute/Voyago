
const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        destination: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        travelers: {
            type: Number,
            required: true,
            min: 1,
            max: 100
        },

        budget: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },

        interests: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["planning", "confirmed", "completed"],
            default: "planning"
        },

        itinerary: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },

        hotels: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },

        restaurants: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },

        placeLocations: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },

        hotelLocations: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },

        restaurantLocations: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        }
    },
    {
        timestamps: true,
        strict: true
    }
);

// Support efficient queries for a user's trips.
tripSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Trip", tripSchema);
