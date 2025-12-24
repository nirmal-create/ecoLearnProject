// Test script to simulate quiz generation request
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
  console.log("✅ Environment variables loaded from env.atlas.test");
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error("❌ No API key found");
  process.exit(1);
}

console.log("🔑 API Key:", apiKey ? "SET" : "NOT SET");
console.log("🧪 Testing quiz generation...\n");

async function testQuizGeneration() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const topic = "JavaScript";
    const level = "beginner";
    const count = 5;

    const prompt = `Generate ${count} multiple-choice quiz questions on the topic of '${topic}' for a ${level} level student. Each question should have 4 options and indicate the correct answer. 

IMPORTANT: 
- The answer should be the exact text of the correct option, not just A, B, C, or D.
- Return ONLY the JSON array, no additional text or explanations.
- Ensure the response is valid JSON format.

Format as JSON: [{"question": "question text", "options": ["option A text", "option B text", "option C text", "option D text"], "answer": "exact text of correct option"}]`;

    console.log("📤 Sending request to Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("\n📥 Raw response received:");
    console.log(text.substring(0, 500) + "...\n");

    // Clean the response
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, "");
    cleanedText = cleanedText.replace(/^```\s*/i, "");
    cleanedText = cleanedText.replace(/\s*```$/i, "");
    cleanedText = cleanedText.trim();

    console.log("🧹 Cleaned text:");
    console.log(cleanedText.substring(0, 300) + "...\n");

    // Try to parse JSON
    let quiz;
    try {
      quiz = JSON.parse(cleanedText);
      console.log("✅ JSON parsed successfully!");
    } catch (e) {
      console.log("⚠️  Direct parse failed, trying to extract JSON...");
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        quiz = JSON.parse(jsonMatch[0]);
        console.log("✅ JSON extracted and parsed!");
      } else {
        throw new Error("Could not find JSON array in response");
      }
    }

    if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
      throw new Error("Quiz is not a valid array or is empty");
    }

    console.log(`\n✅ SUCCESS! Generated ${quiz.length} questions`);
    console.log("\n📋 Sample question:");
    console.log(JSON.stringify(quiz[0], null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Quiz generation failed!");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

testQuizGeneration();

