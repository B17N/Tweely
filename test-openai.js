import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config();

console.log("Testing OpenAI API key loading...");

// Check if API key exists
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("❌ OPENAI_API_KEY environment variable is missing!");
  process.exit(1);
} else {
  console.log(`✅ OPENAI_API_KEY found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
}

// Try to initialize OpenAI client
try {
  const openai = new OpenAI({
    apiKey: apiKey
  });
  console.log("✅ OpenAI client initialized successfully");
  
  // Try a simple API call
  console.log("Testing simple API call...");
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Hello, how are you?" }],
    max_tokens: 5
  });
  
  console.log("✅ API call successful!");
  console.log(response.choices[0].message);
  
} catch (error) {
  console.error("❌ Error initializing or using OpenAI client:", error);
  process.exit(1);
}

console.log("All tests passed!"); 