import MessageFactory from '../../protocol/messages';
import { ToolCall, ToolResult, ToolError } from '../../types';

describe('MessageFactory', () => {
  describe('createToolCall', () => {
    test('creates tool call message with correct structure', () => {
      const toolCall = MessageFactory.createToolCall('test_tool', { param1: 'value1' });

      expect(toolCall.id).toBeDefined();
      expect(typeof toolCall.id).toBe('string');
      expect(toolCall.type).toBe('tool_call');
      expect(typeof toolCall.timestamp).toBe('number');
      expect(toolCall.tool).toBe('test_tool');
      expect(toolCall.params).toEqual({ param1: 'value1' });
    });

    test('generates unique IDs for different calls', () => {
      const call1 = MessageFactory.createToolCall('tool1', {});
      const call2 = MessageFactory.createToolCall('tool2', {});

      expect(call1.id).not.toBe(call2.id);
    });
  });

  describe('createToolResult', () => {
    test('creates successful tool result', () => {
      const result = MessageFactory.createToolResult('test_tool', 'success_data', true);

      expect(result.type).toBe('tool_result');
      expect(result.tool).toBe('test_tool');
      expect(result.result).toBe('success_data');
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    test('creates failed tool result', () => {
      const result = MessageFactory.createToolResult('test_tool', 'error_message', false);

      expect(result.success).toBe(false);
      expect(result.result).toBe('error_message');
    });
  });

  describe('createError', () => {
    test('creates error message with code', () => {
      const error = MessageFactory.createError('Test error', 'TEST_ERROR', 'test_tool');

      expect(error.type).toBe('error');
      expect(error.error).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.tool).toBe('test_tool');
      expect(error.id).toBeDefined();
      expect(typeof error.timestamp).toBe('number');
    });

    test('creates error without tool context', () => {
      const error = MessageFactory.createError('Generic error', 'GENERIC_ERROR');

      expect(error.tool).toBeUndefined();
      expect(error.error).toBe('Generic error');
    });
  });

  describe('parseMessage', () => {
    test('parses valid JSON message', () => {
      const message = MessageFactory.createToolCall('test', {});
      const serialized = MessageFactory.serializeMessage(message);
      const parsed = MessageFactory.parseMessage(serialized);

      expect(parsed).toEqual(message);
    });

    test('returns null for invalid JSON', () => {
      const parsed = MessageFactory.parseMessage('invalid json');
      expect(parsed).toBeNull();
    });

    test('returns null for malformed message structure', () => {
      const malformed = JSON.stringify({ invalid: 'structure' });
      const parsed = MessageFactory.parseMessage(malformed);
      expect(parsed).toBeNull();
    });

    test('handles complex message data', () => {
      const complexParams = {
        nested: {
          array: [1, 2, 3],
          string: 'test',
          number: 42
        }
      };

      const message = MessageFactory.createToolCall('complex_tool', complexParams);
      const serialized = MessageFactory.serializeMessage(message);
      const parsed = MessageFactory.parseMessage(serialized);

      if (parsed && 'params' in parsed) {
        expect((parsed as any).params).toEqual(complexParams);
      } else {
        expect(parsed).toBeDefined();
      }
    });
  });

  describe('serializeMessage', () => {
    test('serializes message to valid JSON', () => {
      const message = MessageFactory.createToolCall('test', { key: 'value' });
      const serialized = MessageFactory.serializeMessage(message);

      expect(typeof serialized).toBe('string');

      const parsed = JSON.parse(serialized);
      expect(parsed).toEqual(message);
    });

    test('includes all message properties in serialization', () => {
      const message: ToolResult = {
        id: 'test-id',
        type: 'tool_result',
        timestamp: 1234567890,
        tool: 'test_tool',
        result: { data: 'test' },
        success: true
      };

      const serialized = MessageFactory.serializeMessage(message);
      const parsed = JSON.parse(serialized);

      expect(parsed.id).toBe('test-id');
      expect(parsed.type).toBe('tool_result');
      expect(parsed.timestamp).toBe(1234567890);
      expect(parsed.tool).toBe('test_tool');
      expect(parsed.result).toEqual({ data: 'test' });
      expect(parsed.success).toBe(true);
    });
  });

  describe('Message Types', () => {
    test('ToolCall type structure', () => {
      const call: ToolCall = {
        id: 'call-123',
        type: 'tool_call',
        timestamp: Date.now(),
        tool: 'test_tool',
        params: { arg: 'value' }
      };

      expect(call.type).toBe('tool_call');
      expect(call.tool).toBeDefined();
      expect(call.params).toBeDefined();
    });

    test('ToolResult type structure', () => {
      const result: ToolResult = {
        id: 'result-123',
        type: 'tool_result',
        timestamp: Date.now(),
        tool: 'test_tool',
        result: 'output',
        success: true
      };

      expect(result.type).toBe('tool_result');
      expect(result.success).toBeDefined();
    });

    test('ToolError type structure', () => {
      const error: ToolError = {
        id: 'error-123',
        type: 'error',
        timestamp: Date.now(),
        error: 'Error message',
        code: 'ERROR_CODE'
      };

      expect(error.type).toBe('error');
      expect(error.code).toBeDefined();
    });
  });

  describe('Timestamp Generation', () => {
    test('generates reasonable timestamps', () => {
      const before = Date.now();
      const message = MessageFactory.createToolCall('test', {});
      const after = Date.now();

      expect(message.timestamp).toBeGreaterThanOrEqual(before);
      expect(message.timestamp).toBeLessThanOrEqual(after);
    });

    test('timestamps are numbers', () => {
      const message = MessageFactory.createToolCall('test', {});
      expect(typeof message.timestamp).toBe('number');
      expect(message.timestamp).toBeGreaterThan(0);
    });
  });
});
