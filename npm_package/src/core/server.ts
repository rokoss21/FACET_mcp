import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { EventEmitter } from 'events';
import winston from 'winston';
import { MCPMessage, ServerConfig, MCPTool } from '../types';
import MessageFactory from '../protocol/messages';
import MCPTools from '../tools';

export class FACETMCPServer extends EventEmitter {
  private wss: WebSocket.Server | null = null;
  private config: ServerConfig;
  private tools: Map<string, MCPTool> = new Map();
  private logger: winston.Logger;
  private connections = new Set<WebSocket>();

  constructor(config: Partial<ServerConfig> = {}) {
    super();

    this.config = {
      host: 'localhost',
      port: 3000,
      maxConnections: 100,
      timeout: 30000,
      logLevel: 'info',
      ...config
    };

    this.logger = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console()
      ]
    });

    this.initializeTools();
  }

  private initializeTools(): void {
    const toolsManager = new MCPTools();
    const tools = toolsManager.getAllTools();

    for (const tool of tools) {
      this.tools.set(tool.name, tool);
      this.logger.info(`Registered tool: ${tool.name}`);
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({
          host: this.config.host,
          port: this.config.port,
          maxPayload: 1024 * 1024, // 1MB max payload
          perMessageDeflate: false
        });

        this.wss.on('listening', () => {
          this.logger.info(`FACET MCP Server listening on ws://${this.config.host}:${this.config.port}`);
          this.emit('started');
          resolve();
        });

        this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
          this.handleConnection(ws, request);
        });

        this.wss.on('error', (error) => {
          this.logger.error(`Server error: ${error.message}`);
          this.emit('error', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const clientIp = request.socket.remoteAddress || 'unknown';
    this.logger.info(`New connection from ${clientIp}`);

    if (this.connections.size >= this.config.maxConnections) {
      this.logger.warn(`Connection rejected: max connections (${this.config.maxConnections}) reached`);
      ws.close(1013, 'Server at capacity');
      return;
    }

    this.connections.add(ws);

    ws.on('message', (data: WebSocket.Data) => {
      this.handleMessage(ws, data);
    });

    ws.on('close', (code, reason) => {
      this.logger.info(`Connection closed from ${clientIp} (code: ${code})`);
      this.connections.delete(ws);
    });

    ws.on('error', (error) => {
      this.logger.error(`Connection error from ${clientIp}: ${error.message}`);
      this.connections.delete(ws);
    });

    // Send welcome message
    const welcomeMessage = MessageFactory.createToolResult('system', {
      message: 'Welcome to FACET MCP Server',
      version: '0.1.0',
      available_tools: Array.from(this.tools.keys())
    });

    ws.send(MessageFactory.serializeMessage(welcomeMessage));
  }

  private async handleMessage(ws: WebSocket, data: WebSocket.Data): Promise<void> {
    try {
      const message = MessageFactory.parseMessage(data.toString());

      if (!message) {
        const errorMessage = MessageFactory.createError('Invalid message format', 'INVALID_MESSAGE');
        ws.send(MessageFactory.serializeMessage(errorMessage));
        return;
      }

      if (message.type === 'tool_call') {
        await this.handleToolCall(ws, message as any);
      } else {
        const errorMessage = MessageFactory.createError('Unsupported message type', 'UNSUPPORTED_TYPE');
        ws.send(MessageFactory.serializeMessage(errorMessage));
      }

    } catch (error) {
      this.logger.error(`Message handling error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const errorMessage = MessageFactory.createError('Internal server error', 'INTERNAL_ERROR');
      ws.send(MessageFactory.serializeMessage(errorMessage));
    }
  }

  private async handleToolCall(ws: WebSocket, toolCall: any): Promise<void> {
    const { tool, params, id } = toolCall;

    this.logger.info(`Tool call: ${tool} (id: ${id})`);

    const toolDefinition = this.tools.get(tool);
    if (!toolDefinition) {
      const errorMessage = MessageFactory.createError(`Unknown tool: ${tool}`, 'UNKNOWN_TOOL', tool);
      ws.send(MessageFactory.serializeMessage(errorMessage));
      return;
    }

    try {
      const result = await toolDefinition.handler(params);
      const successMessage = MessageFactory.createToolResult(tool, result, true);
      ws.send(MessageFactory.serializeMessage(successMessage));
      this.logger.info(`Tool ${tool} executed successfully`);
    } catch (error) {
      const errorMessage = MessageFactory.createError(
        error instanceof Error ? error.message : 'Tool execution failed',
        'TOOL_EXECUTION_ERROR',
        tool
      );
      ws.send(MessageFactory.serializeMessage(errorMessage));
      this.logger.error(`Tool ${tool} execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  stop(): void {
    if (this.wss) {
      this.logger.info('Stopping FACET MCP Server...');

      // Close all connections
      for (const ws of this.connections) {
        ws.close(1000, 'Server shutting down');
      }
      this.connections.clear();

      this.wss.close(() => {
        this.logger.info('FACET MCP Server stopped');
        this.emit('stopped');
      });

      this.wss = null;
    }
  }

  getStats(): {
    connections: number;
    tools: number;
    uptime: number;
  } {
    return {
      connections: this.connections.size,
      tools: this.tools.size,
      uptime: process.uptime()
    };
  }

  getTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

export default FACETMCPServer;
