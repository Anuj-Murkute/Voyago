
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
    const databaseConnected =
        mongoose.connection.readyState === 1;

    const status = databaseConnected ? "ok" : "degraded";

    return res.status(databaseConnected ? 200 : 503).json({
        success: databaseConnected,
        status,
        service: "VOYAGO API",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: {
            status: databaseConnected ? "connected" : "disconnected"
        }
    });
});

module.exports = router;
