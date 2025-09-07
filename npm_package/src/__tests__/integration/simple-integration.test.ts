import FACETMCPServer from '../../core/server';
import MCPTools from '../../tools';
import FACETLenses from '../../utils/lenses';
import SchemaValidator from '../../utils/validator';

describe('Simple Integration Tests', () => {
  let server: FACETMCPServer;
  let tools: MCPTools;

  beforeEach(() => {
    server = new FACETMCPServer({
      host: 'localhost',
      port: 3001,
      logLevel: 'error'
    });
    tools = new MCPTools();
  });

  afterEach(() => {
    server.stop();
  });

  describe('Server Initialization', () => {
    test('server initializes with correct configuration', () => {
      const stats = server.getStats();
      expect(stats).toBeDefined();
      expect(stats.tools).toBe(3); // execute, apply_lenses, validate_schema
      expect(stats.connections).toBeGreaterThanOrEqual(0);
    });

    test('server has all required tools', () => {
      const toolNames = server.getTools();
      expect(toolNames).toContain('execute');
      expect(toolNames).toContain('apply_lenses');
      expect(toolNames).toContain('validate_schema');
      expect(toolNames).toHaveLength(3);
    });
  });

  describe('MCP Tools Integration', () => {
    test('all tools are properly registered', () => {
      const allTools = tools.getAllTools();
      expect(allTools).toHaveLength(3);

      const toolNames = allTools.map(tool => tool.name);
      expect(toolNames).toContain('execute');
      expect(toolNames).toContain('apply_lenses');
      expect(toolNames).toContain('validate_schema');
    });

    test('execute tool handles template substitution', async () => {
      const executeTool = tools.getAllTools().find(t => t.name === 'execute');
      expect(executeTool).toBeDefined();

      const result = await executeTool!.handler({
        facet_source: 'Hello {{name}}!',
        variables: { name: 'World' }
      });

      expect(result.result).toContain('Hello World!');
    });

    test('apply_lenses tool processes text correctly', async () => {
      const lensesTool = tools.getAllTools().find(t => t.name === 'apply_lenses');
      expect(lensesTool).toBeDefined();

      const result = await lensesTool!.handler({
        input_string: '  hello world  ',
        lenses: ['trim']
      });

      expect(result.result).toBe('hello world');
      expect(result.changed).toBe(true);
    });

    test('validate_schema tool validates data', async () => {
      const validateTool = tools.getAllTools().find(t => t.name === 'validate_schema');
      expect(validateTool).toBeDefined();

      const result = await validateTool!.handler({
        json_object: { name: 'John', age: 30 },
        json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name']
        }
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });
  });

  describe('FACET Lenses Integration', () => {
    test('lenses work independently', () => {
      expect(FACETLenses.applyLenses('  hello  ', ['trim'])).toBe('hello');
      expect(FACETLenses.applyLenses('HELLO', ['lowercase'])).toBe('hello');
      expect(FACETLenses.applyLenses('hello   world', ['squeeze_spaces'])).toBe('hello world');
    });

    test('lenses work in combination', () => {
      const result = FACETLenses.applyLenses('  HELLO   WORLD  ', ['trim', 'squeeze_spaces', 'lowercase']);
      expect(result).toBe('hello world');
    });

    test('all lenses are available', () => {
      const allLenses = FACETLenses.getAllLenses();
      expect(allLenses.length).toBeGreaterThanOrEqual(7); // trim, dedent, squeeze_spaces, etc.

      const lensNames = allLenses.map(lens => lens.name);
      expect(lensNames).toContain('trim');
      expect(lensNames).toContain('uppercase');
      expect(lensNames).toContain('lowercase');
      expect(lensNames).toContain('squeeze_spaces');
    });
  });

  describe('Schema Validator Integration', () => {
    let validator: SchemaValidator;

    beforeEach(() => {
      validator = new SchemaValidator();
    });

    test('validates simple schemas', () => {
      const schema = { type: 'string' };
      expect(validator.validate('test', schema).valid).toBe(true);
      expect(validator.validate(123, schema).valid).toBe(false);
    });

    test('validates complex schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 }
        },
        required: ['name']
      };

      expect(validator.validate({ name: 'John', age: 30 }, schema).valid).toBe(true);
      expect(validator.validate({ age: 30 }, schema).valid).toBe(false); // missing name
      expect(validator.validate({ name: 'John', age: -5 }, schema).valid).toBe(false); // invalid age
    });

    test('handles schema validation errors', () => {
      const invalidSchema = { type: 'invalid_type' };
      const result = validator.validate({}, invalidSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Server Lifecycle', () => {
    test('server can start and stop', async () => {
      await server.start();
      expect(server.getStats().connections).toBeGreaterThanOrEqual(0);

      server.stop();
      // Should not throw
    });

    test('server handles multiple start/stop cycles', async () => {
      await server.start();
      server.stop();

      await server.start();
      server.stop();

      // Should not throw
    });

    test('server maintains stats correctly', async () => {
      await server.start();
      const initialStats = server.getStats();

      expect(initialStats).toHaveProperty('connections');
      expect(initialStats).toHaveProperty('tools');
      expect(initialStats).toHaveProperty('uptime');

      expect(typeof initialStats.connections).toBe('number');
      expect(typeof initialStats.tools).toBe('number');
      expect(typeof initialStats.uptime).toBe('number');

      server.stop();
    });
  });
});
