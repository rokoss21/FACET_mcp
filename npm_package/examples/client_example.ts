import { MCPClient } from '../src/index';

async function main() {
  console.log('🚀 FACET MCP Client Example');
  console.log('==============================\n');

  const client = new MCPClient('localhost', 3000);

  try {
    // Connect to server
    console.log('🔌 Connecting to MCP server...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test text processing
    console.log('🧪 Testing text processing...');
    const messyText = '   Hello   World   with   extra   spaces   ';
    console.log(`📝 Input: "${messyText}"`);

    const cleanResult = await client.applyLenses(messyText, ['trim', 'squeeze_spaces']);
    console.log(`✨ Result: "${cleanResult.result}"`);
    console.log(`📊 Changed: ${cleanResult.changed}\n`);

    // Test schema validation
    console.log('🧪 Testing schema validation...');
    const testData = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com'
    };

    const testSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number', minimum: 0 },
        email: { type: 'string', format: 'email' }
      },
      required: ['name', 'age']
    };

    const validationResult = await client.validateSchema(testData, testSchema);
    console.log(`📋 Validation result:`, validationResult);

    if (validationResult.valid) {
      console.log('✅ Data is valid!\n');
    } else {
      console.log('❌ Data validation failed:');
      validationResult.errors?.forEach(error => console.log(`   - ${error}`));
      console.log();
    }

    // Test FACET execution
    console.log('🧪 Testing FACET execution...');
    const facetDocument = `
@workflow(name="GreetingProcessor", version="1.0")
  description: "Process greeting with user name"

@input
  greeting: "{{greeting}}"
  name: "{{name}}"

@processing
  steps: ["format", "clean"]

@output(format="json")
  require: "Processed greeting"
  schema: {"type": "object", "required": ["message"]}
`;

    const executionResult = await client.execute(facetDocument, {
      greeting: '  Hello   ',
      name: 'Alice'
    });

    console.log('🎯 FACET execution result:', executionResult);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Disconnect
    console.log('\n🔌 Disconnecting...');
    await client.disconnect();
    console.log('✅ Disconnected successfully!');
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
