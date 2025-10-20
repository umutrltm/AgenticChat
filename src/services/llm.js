import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const model = process.env.LLM_MODEL || 'gemini-2.5-flash-lite';

const vertexAI = new VertexAI({ project, location });

// Initialize the generative model with function calling
const generativeModel = vertexAI.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

/**
 * Define the agent tools as function declarations
 */
const tools = [
  {
    functionDeclarations: [
      {
        name: 'db_create',
        description: 'Create a new contact in the database. Use this when the user wants to add a new person or contact.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the contact'
            },
            email: {
              type: 'string',
              description: 'The email address of the contact'
            },
            vip: {
              type: 'boolean',
              description: 'Whether this contact is a VIP',
              default: false
            },
            notes: {
              type: 'string',
              description: 'Additional notes about the contact'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'db_read',
        description: 'Read contacts from the database. Can filter by ID, name, email, or VIP status.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The ID of a specific contact to retrieve'
            },
            name: {
              type: 'string',
              description: 'Search for contacts by name (partial match)'
            },
            email: {
              type: 'string',
              description: 'Search for contacts by email (partial match)'
            },
            vip: {
              type: 'boolean',
              description: 'Filter contacts by VIP status'
            }
          }
        }
      },
      {
        name: 'db_update',
        description: 'Update an existing contact in the database.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The ID of the contact to update'
            },
            email: {
              type: 'string',
              description: 'Find contact by email to update'
            },
            name: {
              type: 'string',
              description: 'New name for the contact'
            },
            vip: {
              type: 'boolean',
              description: 'New VIP status'
            },
            notes: {
              type: 'string',
              description: 'New or additional notes'
            }
          }
        }
      },
      {
        name: 'memory_remember',
        description: 'Store important information in long-term memory. Use this to remember key facts, user preferences, or important events.',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The information to remember'
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata to associate with this memory (e.g., contact email, date, category)'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'memory_recall',
        description: 'Search long-term memory using semantic similarity. Use this to find relevant past information.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to find relevant memories'
            },
            k: {
              type: 'integer',
              description: 'Number of results to return',
              default: 5
            }
          },
          required: ['query']
        }
      }
    ]
  }
];

/**
 * Call the LLM with function calling capabilities
 * @param {Array} messages - Conversation history
 * @param {string} sessionId - Session identifier for memory context
 * @returns {Promise<object>} LLM response with potential function calls
 */
export async function callLLM(messages, sessionId) {
  const systemInstruction = `You are a helpful AI assistant with access to a contacts database and long-term memory.

Your capabilities:
- Create, read, and update contacts in a database
- Store important information in long-term memory with semantic search
- Recall past conversations and information using semantic search

Guidelines:
- When asked about VIPs, people, or contacts, use db_read to search the database
- After creating or updating contacts, use memory_remember to store what you did
- When users ask about past interactions or "what did we...", use memory_recall to search your memory
- Always cite your sources: mention if information came from "the contacts database" or "memory from [date]"
- Be conversational and helpful
- When recalling memories, consider the semantic meaning, not just exact keywords
- Current date: ${new Date().toISOString().split('T')[0]}

Session ID: ${sessionId || 'none'}`;

  try {
    const chat = generativeModel.startChat({
      tools,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    });

    // Send all messages except the system instruction (it's already set)
    for (const msg of messages.slice(0, -1)) {
      await chat.sendMessage(msg.content);
    }

    // Send the final message
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    // Safe access to response parts
    const candidates = response.candidates || [];
    const firstCandidate = candidates[0];
    const parts = firstCandidate?.content?.parts || [];

    return {
      text: parts
        .filter(part => part.text)
        .map(part => part.text)
        .join(''),
      functionCalls: parts
        .filter(part => part.functionCall)
        .map(part => ({
          name: part.functionCall.name,
          args: part.functionCall.args
        })),
      chat // Return chat instance for potential follow-ups
    };
  } catch (error) {
    console.error('Error calling LLM:', error);
    throw error;
  }
}

/**
 * Send function results back to the LLM
 * @param {object} chat - Chat instance
 * @param {Array} functionResults - Results from function executions
 * @returns {Promise<object>} LLM response with text and potential function calls
 */
export async function sendFunctionResults(chat, functionResults) {
  const functionResponseParts = functionResults.map(result => ({
    functionResponse: {
      name: result.name,
      response: result.response
    }
  }));

  const result = await chat.sendMessage(functionResponseParts);
  const response = result.response;

  // Safe access to response parts
  const candidates = response.candidates || [];
  const firstCandidate = candidates[0];
  const parts = firstCandidate?.content?.parts || [];

  return {
    text: parts
      .filter(part => part.text)
      .map(part => part.text)
      .join(''),
    functionCalls: parts
      .filter(part => part.functionCall)
      .map(part => ({
        name: part.functionCall.name,
        args: part.functionCall.args
      }))
  };
}
