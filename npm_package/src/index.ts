// Main exports for FACET MCP Server
export { default as FACETMCPServer } from './core/server';
export { default as MCPClient } from './core/client';
export { default as MCPTransport } from './protocol/transport';
export { default as MessageFactory } from './protocol/messages';
export { default as FACETLenses } from './utils/lenses';
export { default as SchemaValidator } from './utils/validator';
export { default as MCPTools } from './tools';

// Re-export types
export type {
  MCPMessage,
  ToolCall,
  ToolResult,
  ToolError,
  MCPTool,
  FACETLens,
  ServerConfig,
  LogLevel
} from './types';

console.log('🚀 FACET MCP Server v0.1.0');
console.log('Agent-First AI Tooling loaded successfully!');

// For CLI usage
if (require.main === module) {
  require('./cli');
}
