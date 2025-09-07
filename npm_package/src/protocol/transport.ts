import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { MCPMessage, ToolCall, ToolResult, ToolError } from '../types';
import MessageFactory from './messages';

export interface TransportConfig {
  host: string;
  port: number;
  timeout: number;
  maxReconnectAttempts: number;
  reconnectInterval: number;
}

export class MCPTransport extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: TransportConfig;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(config: Partial<TransportConfig> = {}) {
    super();
    this.config = {
      host: 'localhost',
      port: 3000,
      timeout: 30000,
      maxReconnectAttempts: 5,
      reconnectInterval: 1000,
      ...config
    };
  }

  async connect(): Promise<void> {
    const url = `ws://${this.config.host}:${this.config.port}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          console.log(`Connected to MCP server at ${url}`);
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data);
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });

        this.ws.on('close', (code, reason) => {
          console.log(`Disconnected from MCP server (code: ${code}, reason: ${reason})`);
          this.emit('disconnected', code, reason);
          this.handleReconnection();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Clear pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
  }

  async sendToolCall(tool: string, params: Record<string, any>): Promise<ToolResult> {
    const message = MessageFactory.createToolCall(tool, params);

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      this.pendingRequests.set(message.id, { resolve, reject, timeout });

      this.ws.send(MessageFactory.serializeMessage(message));
    });
  }

  private handleMessage(data: WebSocket.Data): void {
    const message = MessageFactory.parseMessage(data.toString());

    if (!message) {
      console.error('Received invalid message:', data);
      return;
    }

    this.emit('message', message);

    // Handle pending requests
    if (message.type === 'tool_result' || message.type === 'error') {
      const request = this.pendingRequests.get(message.id);
      if (request) {
        clearTimeout(request.timeout);
        this.pendingRequests.delete(message.id);

        if (message.type === 'tool_result') {
          const result = message as ToolResult;
          if (result.success) {
            request.resolve(result.result);
          } else {
            request.reject(new Error(`Tool execution failed: ${result.result}`));
          }
        } else {
          const error = message as ToolError;
          request.reject(new Error(`${error.code}: ${error.error}`));
        }
      }
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval * this.reconnectAttempts);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

export default MCPTransport;
