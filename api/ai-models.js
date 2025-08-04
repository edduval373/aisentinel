// Simple fallback for AI models API in production
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Temporary fallback response until production deployment is fixed
    // This matches your Railway database models structure
    const fallbackModels = [
      {
        id: 1,
        name: "GPT-4o",
        provider: "openai",
        modelId: "gpt-4o",
        description: "Latest GPT-4 model with advanced capabilities",
        contextWindow: 128000,
        isEnabled: true,
        hasValidApiKey: true,
        warning: undefined
      },
      {
        id: 2,
        name: "GPT-4",
        provider: "openai", 
        modelId: "gpt-4",
        description: "Advanced reasoning and general-purpose AI model",
        contextWindow: 8192,
        isEnabled: true,
        hasValidApiKey: true,
        warning: undefined
      },
      {
        id: 3,
        name: "GPT-3.5 Turbo",
        provider: "openai",
        modelId: "gpt-3.5-turbo",
        description: "Fast and efficient model for most tasks",
        contextWindow: 16385,
        isEnabled: true,
        hasValidApiKey: true,
        warning: undefined
      },
      {
        id: 4,
        name: "Claude Sonnet 4",
        provider: "anthropic",
        modelId: "claude-sonnet-4-20250514",
        description: "Latest Claude model with advanced reasoning capabilities",
        contextWindow: 100000,
        isEnabled: true,
        hasValidApiKey: true,
        warning: undefined
      },
      {
        id: 5,
        name: "Claude 3 Haiku",
        provider: "anthropic",
        modelId: "claude-3-haiku-20240307",
        description: "Fast and efficient Claude model",
        contextWindow: 200000,
        isEnabled: true,
        hasValidApiKey: true,
        warning: undefined
      },
      {
        id: 6,
        name: "Gemini Pro",
        provider: "google",
        modelId: "gemini-pro",
        description: "Google's advanced multimodal AI model",
        contextWindow: 128000,
        isEnabled: true,
        hasValidApiKey: true,
        warning: undefined
      },
      {
        id: 7,
        name: "Command R+",
        provider: "cohere",
        modelId: "command-r-plus",
        description: "Cohere's advanced reasoning model",
        contextWindow: 128000,
        isEnabled: true,
        hasValidApiKey: true,
        warning: undefined
      },
      {
        id: 8,
        name: "Mistral Large",
        provider: "mistral",
        modelId: "mistral-large-latest",
        description: "Mistral's flagship model",
        contextWindow: 32000,
        isEnabled: true,
        hasValidApiKey: true,
        warning: undefined
      }
    ];
    
    console.log("Returning fallback AI models:", fallbackModels.length, "models");
    return res.json(fallbackModels);
  } catch (error) {
    console.error("Error fetching AI models:", error);
    res.status(500).json({ message: "Failed to fetch AI models", error: error.message });
  }
}