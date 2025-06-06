import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { FamilyContextBuilder, FamilyContext } from './family-context';

export interface MCPQueryResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private contextBuilder: FamilyContextBuilder;

  constructor() {
    this.contextBuilder = new FamilyContextBuilder();
  }

  async initialize(): Promise<void> {
    try {
      // Create transport for MCP server communication
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@modelcontextprotocol/server-postgres', process.env.DATABASE_URL || ''],
      });

      // Create MCP client
      this.client = new Client(
        {
          name: 'familytasks-ai',
          version: '1.0.0',
        },
        {
          capabilities: {
            resources: {},
            tools: {},
          },
        }
      );

      // Connect to the MCP server
      await this.client.connect(this.transport);
      console.log('MCP Client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      throw error;
    }
  }

  async queryWithFamilyContext(
    query: string, 
    familyId: string, 
    userRole: string
  ): Promise<MCPQueryResult> {
    try {
      if (!this.client) {
        throw new Error('MCP client not initialized');
      }

      // Build family context
      const familyContext = await this.contextBuilder.buildContext(familyId, userRole);

      // Create family-scoped SQL query
      const scopedQuery = this.addFamilyScope(query, familyId);

      // Execute query through MCP
      const result = await this.client.callTool({
        name: 'postgres_query',
        arguments: {
          query: scopedQuery,
        },
      });

      return {
        success: true,
        data: {
          queryResult: result,
          familyContext,
        },
      };
    } catch (error) {
      console.error('MCP query failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getFamilyContext(familyId: string, userRole: string): Promise<FamilyContext> {
    return await this.contextBuilder.buildContext(familyId, userRole);
  }

  async validateFamilyAccess(userId: string, familyId: string): Promise<boolean> {
    return await this.contextBuilder.validateFamilyAccess(userId, familyId);
  }

  private addFamilyScope(query: string, familyId: string): string {
    // Add family_id filter to ensure data isolation
    const familyTables = ['tasks', 'family_members', 'points_history', 'notifications'];
    
    let scopedQuery = query;
    
    // Add WHERE clause for family isolation if not present
    familyTables.forEach(table => {
      const tableRegex = new RegExp(`FROM\\s+${table}(?!.*WHERE.*family_id)`, 'gi');
      if (tableRegex.test(scopedQuery) && !scopedQuery.includes('WHERE')) {
        scopedQuery = scopedQuery.replace(
          new RegExp(`FROM\\s+${table}`, 'gi'),
          `FROM ${table} WHERE family_id = '${familyId}'`
        );
      } else if (tableRegex.test(scopedQuery) && !scopedQuery.includes(`${table}.family_id`)) {
        scopedQuery = scopedQuery.replace(
          /WHERE/gi,
          `WHERE ${table}.family_id = '${familyId}' AND`
        );
      }
    });

    return scopedQuery;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
      }
      if (this.transport) {
        await this.transport.close();
      }
      console.log('MCP Client disconnected');
    } catch (error) {
      console.error('Error disconnecting MCP client:', error);
    }
  }
}

// Singleton instance
let mcpClientInstance: MCPClient | null = null;

export async function getMCPClient(): Promise<MCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
    await mcpClientInstance.initialize();
  }
  return mcpClientInstance;
}

export async function closeMCPClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.disconnect();
    mcpClientInstance = null;
  }
}