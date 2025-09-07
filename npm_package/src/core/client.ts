import { MCPTransport } from '../protocol/transport';

export class MCPClient {
  private transport: MCPTransport;

  constructor(host: string = 'localhost', port: number = 3000) {
    this.transport = new MCPTransport({ host, port });
  }

  async connect(): Promise<void> {
    await this.transport.connect();
    console.log('Connected to FACET MCP Server');
  }

  async disconnect(): Promise<void> {
    this.transport.disconnect();
    console.log('Disconnected from FACET MCP Server');
  }

  async execute(facetSource: string, variables: Record<string, any> = {}): Promise<any> {
    return await this.transport.sendToolCall('execute', {
      facet_source: facetSource,
      variables
    });
  }

  async applyLenses(inputString: string, lenses: string[]): Promise<any> {
    return await this.transport.sendToolCall('apply_lenses', {
      input_string: inputString,
      lenses
    });
  }

  async validateSchema(jsonObject: any, jsonSchema: any): Promise<any> {
    return await this.transport.sendToolCall('validate_schema', {
      json_object: jsonObject,
      json_schema: jsonSchema
    });
  }

  get isConnected(): boolean {
    return this.transport.isConnected;
  }

  get connectionState(): string {
    return this.transport.connectionState;
  }
}

export default MCPClient;
