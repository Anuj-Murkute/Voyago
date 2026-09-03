const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/health", healthRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Voyago API is running 🚀"
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Voyago server running on port ${PORT}`);
  });
};

startServer();