// Script to list available Gemini models
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load .env file first
dotenv.config();

// Load environment variables from env.atlas.test file
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
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error("❌ No API key found");
  process.exit(1);
}

async function listModels() {
  try {
    console.log("🔍 Fetching available models...\n");
    
    // Try v1 API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      // Try v1beta
      const responseBeta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      
      if (!responseBeta.ok) {
        console.error("❌ Failed to fetch models:", responseBeta.status, responseBeta.statusText);
        const errorText = await responseBeta.text();
        console.error("Error:", errorText);
        process.exit(1);
      }
      
      const data = await responseBeta.json();
      console.log("✅ Available models (v1beta):\n");
      if (data.models && data.models.length > 0) {
        data.models.forEach((model) => {
          console.log(`   - ${model.name}`);
          if (model.supportedGenerationMethods) {
            console.log(`     Methods: ${model.supportedGenerationMethods.join(", ")}`);
          }
        });
      } else {
        console.log("   No models found");
      }
    } else {
      const data = await response.json();
      console.log("✅ Available models (v1):\n");
      if (data.models && data.models.length > 0) {
        data.models.forEach((model) => {
          console.log(`   - ${model.name}`);
          if (model.supportedGenerationMethods) {
            console.log(`     Methods: ${model.supportedGenerationMethods.join(", ")}`);
          }
        });
      } else {
        console.log("   No models found");
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

listModels();

