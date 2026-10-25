
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Authenticated account routes
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);

module.exports = router;