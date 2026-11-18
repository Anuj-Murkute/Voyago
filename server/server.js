const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");
const aiRoutes = require("./routes/aiRoutes");
const healthRoutes = require("./routes/healthRoutes");
const travelRoutes = require("./routes/travelRoutes");
const aiTravelRoutes = require("./routes/aiTravelRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.disable("x-powered-by");

// ================================================
// CORS CONFIGURATION
// ================================================

const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),

  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://voyago-eight-xi.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS blocked this origin: ${origin}`)
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

// CORS must be registered before API routes.
app.use(cors(corsOptions));

// ================================================
// MIDDLEWARE
// ================================================

app.use(helmet());

app.use(
  express.json({
    limit: "1mb",
  })
);

// ================================================
// ROOT ROUTE
// ================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VOYAGO API is running",
  });
});

// ================================================
// API ROUTES
// ================================================

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/trips", tripRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/travel", travelRoutes);

app.use("/api/ai-travel", aiTravelRoutes);

// Admin dashboard API
app.use("/api/admin", adminRoutes);

// ================================================
// UNKNOWN ROUTES
// ================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ================================================
// CENTRAL ERROR HANDLER
// ================================================

app.use((err, req, res, next) => {
  console.error("API error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large",
    });
  }

  if (
    err.message &&
    err.message.startsWith("CORS blocked")
  ) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
});

// ================================================
// SERVER
// ================================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`VOYAGO API running on port ${PORT}`);

    console.log(
      `Health check: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Hotels AI: http://localhost:${PORT}/api/ai-travel/hotels/generate`
    );

    console.log(
      `Admin API: http://localhost:${PORT}/api/admin`
    );

    console.log(
      `Allowed frontend origins: ${allowedOrigins.join(", ")}`
    );
  });

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(
      "Failed to start VOYAGO:",
      error.message
    );

    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
};