import { callLLM, sendFunctionResults } from '../services/llm.js';
import { executeTools } from './tools.js';

/**
 * Process a chat message with the agent
 * @param {string} message - User message
 * @param {string} sessionId - Session identifier
 * @returns {Promise<object>} Agent response with tools used and trace
 */
export async function processChat(message, sessionId = 'default') {
  console.log(`\n💬 Processing message for session: ${sessionId}`);
  console.log(`User: ${message}`);

  const toolsUsed = [];
  const trace = [];

  try {
    // Initial LLM call
    const messages = [
      { role: 'user', content: message }
    ];

    let llmResponse = await callLLM(messages, sessionId);
    let finalResponse = llmResponse.text;

    let maxIterations = 5; // Prevent infinite loops
    let iteration = 0;

    while (llmResponse.functionCalls && llmResponse.functionCalls.length > 0 && iteration < maxIterations) {
      iteration++;
      console.log(`\n🔄 Iteration ${iteration}: Processing ${llmResponse.functionCalls.length} function calls`);

      // Execute tools
      const toolResults = await executeTools(llmResponse.functionCalls, sessionId);

      // Track tools used
      for (const call of llmResponse.functionCalls) {
        if (!toolsUsed.includes(call.name)) {
          toolsUsed.push(call.name);
        }
      }

      // Add to trace
      trace.push(...toolResults.map(r => ({
        tool: r.name,
        args: r.args,
        result: r.response
      })));

      // Send results back to LLM and get response with potential new function calls
      const llmFollowUp = await sendFunctionResults(llmResponse.chat, toolResults);
      finalResponse = llmFollowUp.text;

      // Check if LLM returned new function calls to execute
      if (llmFollowUp.functionCalls && llmFollowUp.functionCalls.length > 0) {
        // Continue loop to execute new function calls
        llmResponse.functionCalls = llmFollowUp.functionCalls;
        console.log(`\n📋 LLM returned ${llmFollowUp.functionCalls.length} new function calls to execute`);
      } else {
        // No more function calls, exit loop
        llmResponse.functionCalls = [];
      }
    }

    console.log(`\nAgent: ${finalResponse}`);

    return {
      reply: finalResponse,
      toolsUsed,
      trace
    };

  } catch (error) {
    console.error('Error processing chat:', error);
    return {
      reply: `I encountered an error: ${error.message}`,
      toolsUsed,
      trace,
      error: error.message
    };
  }
}
