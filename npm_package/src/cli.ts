#!/usr/bin/env node

import { Command } from 'commander';
import FACETMCPServer from './core/server';
import FACETLenses from './utils/lenses';
import MCPClient from './core/client';

const program = new Command();

program
  .name('facet-mcp')
  .description('FACET MCP Server - Agent-First AI Tooling')
  .version('0.1.0');

program
  .command('start')
  .description('Start the MCP server')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-l, --log-level <level>', 'Log level (error, warn, info, debug)', 'info')
  .action(async (options) => {
    const server = new FACETMCPServer({
      host: options.host,
      port: parseInt(options.port, 10),
      logLevel: options.logLevel as any
    });

    console.log(`🚀 Starting FACET MCP Server on ws://${options.host}:${options.port}`);

    try {
      await server.start();
      console.log('✅ Server started successfully!');
      console.log('📊 Available tools:', server.getTools().join(', '));

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  });

program
  .command('tools')
  .description('List available MCP tools')
  .action(() => {
    console.log('🛠️  Available FACET MCP Tools');
    console.log('==================================================\n');

    console.log('🔧 execute');
    console.log('   Execute complete FACET documents with processing and validation.');
    console.log('   Use for complex multi-step pipelines with input processing and output contracts.\n');

    console.log('🔧 apply_lenses');
    console.log('   Apply FACET lenses for atomic text transformations.');
    console.log('   Perfect for cleaning and normalizing text data.\n');

    console.log('🔧 validate_schema');
    console.log('   Validate JSON data against JSON Schema.');
    console.log('   Ensures data quality and prevents format errors.\n');
  });

program
  .command('lenses')
  .description('List available FACET lenses')
  .action(() => {
    console.log('🔍 Available FACET Lenses');
    console.log('==================================================\n');

    const lenses = FACETLenses.getAllLenses();

    for (const lens of lenses) {
      console.log(`🔧 ${lens.name}`);
      console.log(`   ${lens.description}\n`);
    }
  });

program
  .command('connect')
  .description('Connect to MCP server and test tools')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('-p, --port <port>', 'Server port', '3000')
  .action(async (options) => {
    const client = new MCPClient(options.host, parseInt(options.port, 10));

    try {
      console.log(`🔌 Connecting to MCP server at ws://${options.host}:${options.port}...`);
      await client.connect();

      console.log('✅ Connected successfully!');

      // Test apply_lenses tool
      console.log('\n🧪 Testing apply_lenses tool...');
      const testResult = await client.applyLenses('   Hello   World   ', ['trim', 'squeeze_spaces']);
      console.log('📝 Result:', testResult);

      // Test validate_schema tool
      console.log('\n🧪 Testing validate_schema tool...');
      const schemaResult = await client.validateSchema(
        { name: 'John', age: 30 },
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name']
        }
      );
      console.log('📋 Validation result:', schemaResult);

      await client.disconnect();
      console.log('✅ Tests completed successfully!');

    } catch (error) {
      console.error('❌ Connection or test failed:', error);
      process.exit(1);
    }
  });

program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log('🎮 FACET MCP Server Usage Examples');
    console.log('==================================================\n');

    console.log('📋 Example 1: Start Server');
    console.log('```bash');
    console.log('facet-mcp start --port 3001');
    console.log('```\n');

    console.log('🔗 Example 2: Connect and Use Tools');
    console.log('```javascript');
    console.log('import { MCPClient } from "facet-mcp-server";');
    console.log('');
    console.log('const client = new MCPClient("localhost", 3001);');
    console.log('await client.connect();');
    console.log('');
    console.log('// Clean text');
    console.log('const result = await client.applyLenses("   Messy   input   ", ["trim", "squeeze_spaces"]);');
    console.log('console.log(result.result); // "Messy input"');
    console.log('');
    console.log('// Validate data');
    console.log('const validation = await client.validateSchema(data, schema);');
    console.log('```\n');

    console.log('🛠️ Example 3: Execute FACET Document');
    console.log('```javascript');
    console.log('const result = await client.execute(`');
    console.log('@workflow(name="ProcessData", version="1.0")');
    console.log('  description: "Process user input"');
    console.log('');
    console.log('@input');
    console.log('  text: "{{user_input}}"');
    console.log('');
    console.log('@processing');
    console.log('  steps: ["clean", "validate", "transform"]');
    console.log('`, { user_input: "Hello World!" });');
    console.log('```\n');
  });

// Parse command line arguments
program.parse();
