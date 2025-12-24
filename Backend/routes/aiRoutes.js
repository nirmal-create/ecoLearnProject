const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  generateQuiz,
  chatWithAssistant,
  checkUsage,
  analyzeImage,
} = require("../controllers/aiController");

// AI Quiz Generation (Protected route)
router.post("/generate-quiz", auth, generateQuiz);

// AI Assistant Chat (Protected route)
router.post("/chat", auth, chatWithAssistant);

// Check API Usage (Protected route)
router.get("/usage", auth, checkUsage);

// Image Analysis (Protected route)
router.post("/analyze-image", auth, analyzeImage);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "AI routes are healthy",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "POST /api/ai/generate-quiz - Generate quiz questions",
      "POST /api/ai/chat - Chat with AI assistant",
      "GET /api/ai/usage - Check API usage",
      "POST /api/ai/analyze-image - Analyze images",
    ],
  });
});

// Test endpoint to check if the route is working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "AI routes are working!",
    availableFeatures: [
      "Quiz Generation",
      "AI Assistant Chat",
      "API Usage Monitoring",
      "Image Analysis",
    ],
  });
});

// Diagnostic endpoint to check API key status (protected)
router.get("/diagnostics", auth, (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  res.json({
    success: true,
    apiKeySet: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + "..." : "NOT SET",
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
