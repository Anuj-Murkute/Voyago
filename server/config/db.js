
const mongoose = require("mongoose");

let connectionPromise = null;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI is missing from the server environment.");
    }

    connectionPromise = mongoose
        .connect(mongoUri, {
            serverSelectionTimeoutMS: 10000
        })
        .then((connection) => {
            console.log(
                `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
            );

            return connection.connection;
        })
        .catch((error) => {
            connectionPromise = null;
            throw new Error(`MongoDB connection failed: ${error.message}`);
        });

    return connectionPromise;
}

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected.");
});

mongoose.connection.on("error", (error) => {
    console.error("MongoDB error:", error.message);
});

module.exports = connectDB;
