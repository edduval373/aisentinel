// Vercel serverless function for AI model template management
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Return the same AI model templates as the main API
      const templates = [
        {
          id: 1,
          name: "GPT-4o",
          provider: "openai",
          modelId: "gpt-4o",
          description: "Latest GPT-4 model with advanced capabilities",
          contextWindow: 128000,
          isEnabled: true
        },
        {
          id: 2,
          name: "GPT-4",
          provider: "openai", 
          modelId: "gpt-4",
          description: "Advanced reasoning and general-purpose AI model",
          contextWindow: 8192,
          isEnabled: true
        },
        {
          id: 3,
          name: "GPT-3.5 Turbo",
          provider: "openai",
          modelId: "gpt-3.5-turbo",
          description: "Fast and efficient model for most tasks",
          contextWindow: 16385,
          isEnabled: true
        },
        {
          id: 4,
          name: "Claude Sonnet 4",
          provider: "anthropic",
          modelId: "claude-sonnet-4-20250514",
          description: "Latest Claude model with advanced reasoning capabilities",
          contextWindow: 100000,
          isEnabled: true
        },
        {
          id: 5,
          name: "Claude 3 Haiku",
          provider: "anthropic",
          modelId: "claude-3-haiku-20240307",
          description: "Fast and efficient Claude model",
          contextWindow: 200000,
          isEnabled: true
        },
        {
          id: 6,
          name: "Gemini Pro",
          provider: "google",
          modelId: "gemini-pro",
          description: "Google's advanced multimodal AI model",
          contextWindow: 128000,
          isEnabled: true
        },
        {
          id: 7,
          name: "Command R+",
          provider: "cohere",
          modelId: "command-r-plus",
          description: "Cohere's advanced reasoning model",
          contextWindow: 128000,
          isEnabled: true
        },
        {
          id: 8,
          name: "Mistral Large",
          provider: "mistral",
          modelId: "mistral-large-latest",
          description: "Mistral's flagship model",
          contextWindow: 32000,
          isEnabled: true
        }
      ];

      console.log('Returning AI model templates:', templates.length, 'templates');
      return res.json(templates);
    }

    if (req.method === 'POST') {
      // Handle AI model template creation
      const { name, provider, modelId, description, contextWindow } = req.body;
      
      if (!name || !provider || !modelId) {
        return res.status(400).json({ message: 'Missing required fields: name, provider, modelId' });
      }

      // Create new template (mock response for now)
      const newTemplate = {
        id: Date.now(), // Use timestamp as ID for now
        name,
        provider,
        modelId,
        description: description || '',
        contextWindow: contextWindow || 4096,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Created new AI model template:', newTemplate);
      return res.status(201).json(newTemplate);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("Error in AI model templates API:", error);
    res.status(500).json({ message: "Failed to process AI model templates", error: error.message });
  }
}