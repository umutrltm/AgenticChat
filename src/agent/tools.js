import { ContactsDB } from '../db/contacts.js';
import { MemoryDB } from '../db/memory.js';

/**
 * Execute a tool function call
 * @param {string} name - Tool name
 * @param {object} args - Tool arguments
 * @param {string} sessionId - Session identifier
 * @returns {Promise<object>} Tool execution result
 */
export async function executeTool(name, args, sessionId) {
  console.log(`Executing tool: ${name}`, JSON.stringify(args, null, 2));

  try {
    let result;

    switch (name) {
      case 'db_create':
        result = ContactsDB.create({
          name: args.name,
          email: args.email || null,
          vip: args.vip || false,
          notes: args.notes || ''
        });
        break;

      case 'db_read':
        if (args.id) {
          result = ContactsDB.read(args.id);
        } else {
          result = ContactsDB.search({
            name: args.name,
            email: args.email,
            vip: args.vip
          });
        }
        break;

      case 'db_update':
        // Find contact by email if ID not provided
        let contactId = args.id;
        if (!contactId && args.email) {
          const contact = ContactsDB.readByEmail(args.email);
          if (contact) {
            contactId = contact.id;
          }
        }

        if (!contactId) {
          throw new Error('Contact ID or email required for update');
        }

        // Prepare updates (remove id and email from args)
        const updates = { ...args };
        delete updates.id;
        delete updates.email;

        result = ContactsDB.update(contactId, updates);
        break;

      case 'memory_remember':
        result = await MemoryDB.remember(
          args.text,
          sessionId,
          args.metadata || null
        );
        break;

      case 'memory_recall':
        result = await MemoryDB.recall(
          args.query,
          args.k || 5,
          sessionId
        );
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    console.log(`Tool result:`, JSON.stringify(result, null, 2));
    return { success: true, data: result };

  } catch (error) {
    console.error(`Tool execution error:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Execute multiple tool calls and return results
 * @param {Array} functionCalls - Array of function calls from LLM
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Array>} Array of function results
 */
export async function executeTools(functionCalls, sessionId) {
  const results = [];

  for (const call of functionCalls) {
    const result = await executeTool(call.name, call.args, sessionId);
    results.push({
      name: call.name,
      args: call.args,
      response: result
    });
  }

  return results;
}
