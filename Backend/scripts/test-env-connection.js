const mongoose = require("mongoose");
require("dotenv").config();

const testConnection = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/study-ai";

    console.log("\n🔌 Testing MongoDB Connection from .env file...");
    console.log(
      "📍 Connection string:",
      mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    );

    if (!mongoUri || mongoUri.includes("localhost")) {
      console.log("⚠️  Warning: Using default localhost connection");
    }

    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    console.log("\n⏳ Connecting...");
    await mongoose.connect(mongoUri, connectionOptions);
    
    console.log("✅ MongoDB connected successfully!");
    
    const db = mongoose.connection;
    console.log("\n📊 Connection Details:");
    console.log("   Database Name:", db.name);
    console.log("   Host:", db.host);
    console.log("   Ready State:", db.readyState === 1 ? "Connected" : "Not Connected");
    
    console.log("\n✅ Connection test completed successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ MongoDB connection failed!");
    console.error("Error:", err.message);
    process.exit(1);
  }
};

testConnection();

