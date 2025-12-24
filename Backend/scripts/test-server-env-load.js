// Test script to verify server.js loads env.atlas.test correctly
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load .env file first
dotenv.config();

// Load environment variables from env.atlas.test file (if it exists)
const envAtlasPath = path.join(__dirname, "../env.atlas.test");
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
} else {
  console.log("⚠️  env.atlas.test file not found");
}

// Set default environment variables if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your_super_secret_jwt_key_for_study_ai_app_2024";
}
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  process.env.MONGODB_URI = "mongodb://localhost:27017/study-ai";
}

console.log("\n📋 Environment Variables Check:");
console.log(
  "MONGODB_URI:",
  process.env.MONGODB_URI
    ? process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    : "NOT SET"
);

// Verify it's the correct URI from env.atlas.test
const expectedUri = "mongodb+srv://mehranirmal:nirmal123@cluster0.eiot9yr.mongodb.net/study-ai?retryWrites=true&w=majority";
if (process.env.MONGODB_URI === expectedUri) {
  console.log("✅ Correct MongoDB URI loaded from env.atlas.test!");
} else if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes("cluster0.eiot9yr.mongodb.net")) {
  console.log("✅ MongoDB URI from env.atlas.test is loaded (cluster0.eiot9yr.mongodb.net)");
} else {
  console.log("⚠️  MongoDB URI may not be from env.atlas.test");
  console.log("   Expected cluster: cluster0.eiot9yr.mongodb.net");
  console.log("   Current URI:", process.env.MONGODB_URI ? "Set (different)" : "Not set");
}

process.exit(0);

