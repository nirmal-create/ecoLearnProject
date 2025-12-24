const { GoogleGenerativeAI } = require("@google/generative-ai");

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No API key found. Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY in your environment variables."
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

// Function to get available models
const getAvailableModel = async () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No API key found. Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY in your environment variables."
    );
  }
  
  // Use the most reliable models first (without testing each one)
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-pro",
  ];

  const genAI = getGenAI();
  
  // Simply return the first model - let it fail during actual use if there's an issue
  // This avoids unnecessary initialization errors
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log(`Using model: gemini-2.5-flash`);
    return model;
  } catch (error) {
    console.error("Model initialization error:", error);
    // Try fallback models
    for (const modelName of ["gemini-2.0-flash", "gemini-pro"]) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Using fallback model: ${modelName}`);
        return model;
      } catch (fallbackError) {
        console.log(`Fallback model ${modelName} failed:`, fallbackError.message);
        continue;
      }
    }
    throw new Error(`Model initialization failed: ${error.message}`);
  }
};

// Function to check API usage
const checkAPIUsage = async () => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${
        process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
      }`
    );
    const data = await response.json();
    return {
      success: true,
      models: data.models || [],
      quotaInfo: "Check Google AI Studio for detailed quota information",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// AI Assistant chat function
const generateAssistantResponse = async (userMessage) => {
  try {
    const model = await getAvailableModel();

    const systemPrompt = `You are a helpful AI study assistant. You help students with:
    - Explaining difficult concepts in simple terms
    - Providing study tips and techniques
    - Answering academic questions
    - Giving advice on exam preparation
    - Explaining topics from various subjects
    
    IMPORTANT FORMATTING INSTRUCTIONS:
    - Always structure your responses in clear, well-spaced paragraphs
    - Use double line breaks (\\n\\n) to separate paragraphs
    - Use **BOLD TEXT** for headings and important points
    - Use bullet points (- or *) for lists when appropriate
    - Use numbered lists (1., 2., 3.) for step-by-step instructions
    - Add relevant emojis to make responses engaging and relatable
    - Make your responses educational and encouraging
    - Keep responses conversational but informative
    - Break down complex topics into digestible sections
    - Provide practical examples when helpful
    
    RESPONSE LENGTH GUIDELINES:
    - For simple questions: Provide concise, direct answers (2-3 paragraphs)
    - For complex topics: Provide detailed explanations (4-6 paragraphs)
    - For "explain" or "how to" questions: Give comprehensive step-by-step guidance
    - For "what is" questions: Give clear definitions with examples
    - For study tips: Provide actionable advice with examples
    
    EMOJI USAGE:
    - 📚 for study-related topics
    - 🎯 for goals and objectives
    - 💡 for tips and insights
    - ⏰ for time management
    - 🧠 for learning and memory
    - 📝 for note-taking and writing
    - 🎓 for academic topics
    - 🚀 for motivation and success
    - ❓ for questions and clarifications
    - ✅ for completed tasks or achievements
    
    Example format:
    **📚 Study Strategy Guide**
    
    Here's how to approach your studies effectively:
    
    **🎯 Set Clear Goals**
    - Define what you want to achieve
    - Break down large goals into smaller tasks
    - Track your progress regularly
    
    **💡 Active Learning Techniques**
    1. Take detailed notes while studying
    2. Create flashcards for key concepts
    3. Practice with past exam questions
    4. Form study groups with classmates
    
    Always format your response with proper paragraphs, bold headings, and relevant emojis.`;

    const prompt = `${systemPrompt}\n\nStudent: ${userMessage}\n\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Assistant response generation error:", error);
    throw new Error("Failed to generate assistant response");
  }
};

exports.generateQuiz = async (req, res) => {
  console.log("📝 Quiz generation request received");
  console.log("Request body:", req.body);
  console.log("User:", req.user ? req.user.email : "Unknown");
  
  const { topic, level, count = 5 } = req.body;
  if (!topic || !level) {
    return res.status(400).json({ error: "Topic and level are required." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    console.log(`🔑 API Key check: ${apiKey ? 'SET (' + apiKey.substring(0, 15) + '...)' : 'NOT SET'}`);
    
    if (!apiKey) {
      console.error("❌ API key is not set!");
      return res.status(500).json({
        error: "API key not configured",
        details: "GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable is not set",
      });
    }
    
    const model = await getAvailableModel();
    console.log(`✅ Model initialized successfully`);

    const prompt = `Generate ${count} multiple-choice quiz questions on the topic of '${topic}' for a ${level} level student. Each question should have 4 options and indicate the correct answer. 

IMPORTANT: 
- The answer should be the exact text of the correct option, not just A, B, C, or D.
- Return ONLY the JSON array, no additional text or explanations.
- Ensure the response is valid JSON format.

Format as JSON: [{"question": "question text", "options": ["option A text", "option B text", "option C text", "option D text"], "answer": "exact text of correct option"}]`;

    console.log(`📤 Sending prompt to Gemini API (${count} questions on ${topic})...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(`📥 Received response (${text.length} characters)`);
    console.log("Gemini response preview:", text.substring(0, 200) + "...");

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    
    // Remove markdown code blocks (```json ... ```)
    cleanedText = cleanedText.replace(/^```json\s*/i, '');
    cleanedText = cleanedText.replace(/^```\s*/i, '');
    cleanedText = cleanedText.replace(/\s*```$/i, '');
    cleanedText = cleanedText.trim();

    // Try to parse the JSON from the response
    let quiz;
    try {
      quiz = JSON.parse(cleanedText);
    } catch (e) {
      console.log(
        "Failed to parse JSON directly, trying to extract JSON from response"
      );
      console.log("Parse error:", e.message);
      console.log("Cleaned text:", cleanedText.substring(0, 200));
      
      // fallback: try to extract JSON array from the response
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          quiz = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("JSON extraction failed:", parseError.message);
          quiz = null;
        }
      } else {
        quiz = null;
      }
    }

    if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
      console.error("Failed to parse quiz. Response was:", cleanedText.substring(0, 500));
      return res.status(500).json({ 
        error: "Failed to parse quiz from AI response.",
        details: "The AI response could not be parsed as valid JSON. Please try again.",
        rawResponse: cleanedText.substring(0, 200) // Include first 200 chars for debugging
      });
    }

    console.log(`✅ Successfully generated ${quiz.length} quiz questions`);
    res.json({ quiz });
  } catch (error) {
    console.error("Gemini quiz generation error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      stack: error.stack,
    });

    // Provide more specific error messages
    if (error.status === 404 || error.statusCode === 404) {
      return res.status(500).json({
        error:
          "AI model not available. Please check your API key and model configuration.",
        details: error.message,
      });
    }

    if (error.message && error.message.includes("No available models found")) {
      return res.status(500).json({
        error: "No compatible AI models available. Please check your API key.",
        details: error.message,
      });
    }

    if (error.message && error.message.includes("API_KEY_INVALID")) {
      return res.status(500).json({
        error: "Invalid API key. Please check your Gemini API key configuration.",
        details: error.message,
      });
    }

    if (error.message && (error.message.includes("429") || error.message.includes("quota"))) {
      return res.status(500).json({
        error: "API quota exceeded. Please check your API usage limits.",
        details: error.message,
      });
    }

    // Check for API key related errors
    if (error.message && (
      error.message.includes("API_KEY") || 
      error.message.includes("API key") ||
      error.message.includes("authentication") ||
      error.message.includes("401") ||
      error.message.includes("403")
    )) {
      return res.status(500).json({
        error: "API key authentication failed. Please check your Gemini API key configuration.",
        details: error.message,
      });
    }

    // Log full error for debugging
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    res.status(500).json({ 
      error: "Failed to generate quiz. Please try again.",
      details: error.message || "Unknown error occurred",
      errorType: error.constructor.name,
      // Include more details in development
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
        fullError: error.toString()
      })
    });
  }
};

// New endpoint for AI Assistant chat
exports.chatWithAssistant = async (req, res) => {
  console.log("Assistant chat request:", req.body);
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const response = await generateAssistantResponse(message);
    res.json({ response });
  } catch (error) {
    console.error("Assistant chat error:", error);
    res.status(500).json({ error: "Failed to get assistant response." });
  }
};

// New endpoint to check API usage
exports.checkUsage = async (req, res) => {
  try {
    const usageInfo = await checkAPIUsage();
    res.json(usageInfo);
  } catch (error) {
    res.status(500).json({ error: "Failed to check API usage" });
  }
};

// Image Analysis function
exports.analyzeImage = async (req, res) => {
  try {
    // For now, return a placeholder response
    // You can implement actual image analysis later
    res.json({
      success: true,
      message: "Image analysis endpoint is available",
      note: "Actual image analysis functionality needs to be implemented",
      availableFeatures: [
        "Image upload",
        "Basic image processing",
        "AI-powered analysis (coming soon)",
      ],
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    res.status(500).json({ error: "Failed to analyze image" });
  }
};
