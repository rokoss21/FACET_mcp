export interface MCPMessage {
  id: string;
  type: 'tool_call' | 'tool_result' | 'error';
  timestamp: number;
}

export interface ToolCall extends MCPMessage {
  type: 'tool_call';
  tool: string;
  params: Record<string, any>;
}

export interface ToolResult extends MCPMessage {
  type: 'tool_result';
  tool: string;
  result: any;
  success: boolean;
}

export interface ToolError extends MCPMessage {
  type: 'error';
  tool?: string;
  error: string;
  code: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: Record<string, any>) => Promise<any>;
}

export interface FACETLens {
  name: string;
  description: string;
  apply: (input: string) => string;
}

export interface ServerConfig {
  host: string;
  port: number;
  maxConnections: number;
  timeout: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
