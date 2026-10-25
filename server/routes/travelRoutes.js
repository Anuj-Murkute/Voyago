
const express = require("express");

const router = express.Router();

// Temporary health check for the travel routes.
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Travel routes are working",
  });
});

module.exports = router;
