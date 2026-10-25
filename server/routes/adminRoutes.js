
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges are required.",
    });
  }

  next();
};

// All endpoints below require an authenticated admin.
router.use(protect, requireAdmin);

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const [
      totalUsers,
      totalAdmins,
      registrationsLast7Days,
      activeToday,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      }),
      User.countDocuments({
        lastActivityAt: { $gte: today },
      }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        registrationsLast7Days,
        activeToday,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin statistics.",
    });
  }
});

// GET /api/admin/users?page=1&limit=20&search=
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    const filter = {};

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "_id name email role createdAt lastLoginAt lastActivityAt"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load registered users.",
    });
  }
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(req.params.id)
      .select(
        "_id name email role createdAt updatedAt lastLoginAt lastActivityAt"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Admin user details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load user details.",
    });
  }
});

module.exports = router;
