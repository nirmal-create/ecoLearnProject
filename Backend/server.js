const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load .env file first
dotenv.config();

// Load environment variables from env.atlas.test file (if it exists)
const envAtlasPath = path.join(__dirname, "env.atlas.test");
if (fs.existsSync(envAtlasPath)) {
  const envContent = fs.readFileSync(envAtlasPath, "utf8");
  envContent.split("\n").forEach((line) => {
    if (line.includes("=") && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
  console.log("✅ Environment variables loaded from env.atlas.test");
}

// Set default environment variables if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your_super_secret_jwt_key_for_study_ai_app_2024";
}
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  process.env.MONGODB_URI = "mongodb://localhost:27017/study-ai";
}

console.log(
  "Loaded GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY ? "FOUND" : "NOT FOUND"
);
console.log(
  "Loaded GOOGLE_AI_API_KEY:",
  process.env.GOOGLE_AI_API_KEY ? "FOUND" : "NOT FOUND"
);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "SET" : "NOT SET");
console.log(
  "MONGODB_URI:",
  process.env.MONGODB_URI
    ? process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    : "NOT SET"
);
const express = require("express");
const app = express();

app.use(express.json());
const cors = require("cors");

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/study-ai";

    console.log("🔌 Attempting to connect to MongoDB...");
    console.log(
      "📍 Connection string:",
      mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    ); // Hide credentials in logs

    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    };

    await mongoose.connect(mongoUri, connectionOptions);
    console.log("✅ MongoDB connected successfully!");

    // Test the connection
    const db = mongoose.connection;
    db.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    db.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("🔍 Error details:", err);

    // Don't exit immediately, give it a chance to retry
    if (process.env.NODE_ENV === "production") {
      console.log("🔄 Retrying connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const studyMaterialRoutes = require("./routes/studyMaterialRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const badgeRoutes = require("./routes/badgeRoutes");
const quizAttemptRoutes = require("./routes/quizAttemptRoutes");
const ecoChallengeRoutes = require("./routes/ecoChallengeRoutes");
const funChallengeRoutes = require("./routes/funChallengeRoutes");
const debugRoutes = require("./routes/debugRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Load environment variables

// Initialize Express app;

// Connect to MongoDB
connectDB();

// CORS configuration to allow both frontends
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (process.env.ALLOW_ALL_ORIGINS === "true") return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin);
    return isAllowed
      ? callback(null, true)
      : callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));

// No-cache middleware for admin routes (development only)
if (process.env.NODE_ENV === "development") {
  app.use("/api/admin*", (req, res, next) => {
    res.set({
      "Cache-Control":
        "no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });
    next();
  });
}

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StudyAI Backend is running",
    health: "ok",
    docs: "/api/health",
  });
});

// Health check route for Render
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "StudyAI Backend Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Database health check
app.get("/db-health", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    res.status(200).json({
      success: true,
      status: "ok",
      database: states[dbState] || "unknown",
      message: "Database connection status checked",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "error",
      error: "Database health check failed",
      details: error.message,
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/study-materials", studyMaterialRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/quiz-attempts", quizAttemptRoutes);
app.use("/api/eco", ecoChallengeRoutes);
app.use("/api/fun", funChallengeRoutes);
app.use("/api/debug", debugRoutes);

// Public college statistics route
app.get("/api/college/stats", async (req, res) => {
  try {
    const User = require("./models/User");
    const collegeStats = await User.aggregate([
      {
        $group: {
          _id: "$school",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const formattedStats = collegeStats.map((stat) => ({
      college: stat._id,
      students: stat.count,
    }));

    res.json({
      success: true,
      data: formattedStats,
      totalColleges: collegeStats.length,
      totalStudents: collegeStats.reduce((sum, stat) => sum + stat.count, 0),
    });
  } catch (error) {
    console.error("Error fetching public college stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch college statistics",
    });
  }
});

// API Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "StudyAI Backend Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// 404 handler for undefined API routes
app.use("/api/*", notFound);

// Global error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
