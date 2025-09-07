import { v4 as uuidv4 } from 'uuid';
import { MCPMessage, ToolCall, ToolResult, ToolError } from '../types';

export class MessageFactory {
  static createToolCall(tool: string, params: Record<string, any>): ToolCall {
    return {
      id: uuidv4(),
      type: 'tool_call',
      timestamp: Date.now(),
      tool,
      params
    };
  }

  static createToolResult(tool: string, result: any, success: boolean = true): ToolResult {
    return {
      id: uuidv4(),
      type: 'tool_result',
      timestamp: Date.now(),
      tool,
      result,
      success
    };
  }

  static createError(error: string, code: string = 'INTERNAL_ERROR', tool?: string): ToolError {
    return {
      id: uuidv4(),
      type: 'error',
      timestamp: Date.now(),
      tool,
      error,
      code
    };
  }

  static parseMessage(data: string): MCPMessage | null {
    try {
      const message = JSON.parse(data);

      // Validate message structure
      if (!message.id || !message.type || !message.timestamp) {
        throw new Error('Invalid message structure');
      }

      return message as MCPMessage;
    } catch (error) {
      console.error('Failed to parse MCP message:', error);
      return null;
    }
  }

  static serializeMessage(message: MCPMessage): string {
    return JSON.stringify(message, null, 2);
  }
}

export default MessageFactory;
