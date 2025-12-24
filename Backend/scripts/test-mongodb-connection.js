const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Load environment variables from env.atlas.test file
const envPath = path.join(__dirname, "../env.atlas.test");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
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

const testConnection = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/study-ai";

    console.log("\n🔌 Testing MongoDB Connection...");
    console.log(
      "📍 Connection string:",
      mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    );

    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    console.log("\n⏳ Connecting...");
    await mongoose.connect(mongoUri, connectionOptions);
    
    console.log("✅ MongoDB connected successfully!");
    
    // Get connection info
    const db = mongoose.connection;
    console.log("\n📊 Connection Details:");
    console.log("   Database Name:", db.name);
    console.log("   Host:", db.host);
    console.log("   Port:", db.port);
    console.log("   Ready State:", db.readyState === 1 ? "Connected" : "Not Connected");
    
    // List collections
    const collections = await db.db.listCollections().toArray();
    console.log("\n📁 Collections in database:");
    if (collections.length > 0) {
      collections.forEach((col) => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log("   (No collections found - database is empty)");
    }
    
    console.log("\n✅ Connection test completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ MongoDB connection failed!");
    console.error("Error:", err.message);
    console.error("\n🔍 Error details:", err);
    process.exit(1);
  }
};

// Run the test
testConnection();

