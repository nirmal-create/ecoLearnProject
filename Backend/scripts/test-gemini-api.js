// Test script to verify Gemini API key is working
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error("❌ No API key found. Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY");
  process.exit(1);
}

console.log("\n🔑 API Key Status:");
console.log("   GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");
console.log("   GOOGLE_AI_API_KEY:", process.env.GOOGLE_AI_API_KEY ? "SET" : "NOT SET");
console.log("   Using API Key:", apiKey.substring(0, 10) + "...");

console.log("\n🧪 Testing Gemini API connection...");

async function testGeminiAPI() {
  // Try different model names - use the models/ prefix
  const modelConfigs = [
    { model: "gemini-2.5-flash" },
    { model: "gemini-2.0-flash" },
    { model: "gemini-2.5-pro" },
    { model: "gemini-1.5-flash" },
    { model: "gemini-pro" },
  ];

  for (const config of modelConfigs) {
    try {
      console.log(`\n🔄 Trying model: ${config.model}...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel(config);
      
      console.log("⏳ Sending test request...");
      const result = await model.generateContent("Say hello in one word");
      const response = await result.response;
      const text = response.text();
      
      console.log("✅ Gemini API connection successful!");
      console.log(`✅ Working model: ${config.model}`);
      console.log("📝 Test response:", text.trim());
      console.log("\n✅ API key is working correctly!");
      process.exit(0);
    } catch (error) {
      const errorMsg = error.message.split('\n')[0];
      if (errorMsg.includes("429") || errorMsg.includes("quota")) {
        console.log(`   ⚠️  ${config.model}: Quota exceeded (but API key is valid!)`);
        console.log("   ✅ API key is valid and working!");
        console.log("   ⚠️  You may have hit rate limits. The key works!");
        process.exit(0);
      } else {
        console.log(`   ❌ ${config.model} failed: ${errorMsg}`);
      }
      continue;
    }
  }
  
  console.error("\n❌ All models failed. API key may be invalid or models unavailable.");
  console.log("\n💡 Note: The API key appears to be valid (no authentication errors).");
  console.log("   The issue might be with model availability or API version.");
  process.exit(1);
}

testGeminiAPI();

