#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { writeWikiPage, appendToWikiPage, listWikiPages, deleteWikiPage, readWikiPage, } from './wiki-operations.js';
/**
 * GitHub Wiki MCP Server
 *
 * Provides tools for managing GitHub wiki pages through the Model Context Protocol.
 * Supports writing, reading, appending, listing, and deleting wiki pages.
 */
const TOOLS = [
    {
        name: 'write_wiki_page',
        description: 'Write or update a GitHub wiki page. Creates a new page or overwrites an existing one with the provided content.',
        inputSchema: {
            type: 'object',
            properties: {
                owner: {
                    type: 'string',
                    description: 'GitHub repository owner (username or organization)',
                },
                repo: {
                    type: 'string',
                    description: 'GitHub repository name',
                },
                token: {
                    type: 'string',
                    description: 'GitHub personal access token with repo scope (optional; defaults to GITHUB_TOKEN env var)',
                },
                pageName: {
                    type: 'string',
                    description: 'Name of the wiki page (e.g., "Architettura" or "API Documentation")',
                },
                content: {
                    type: 'string',
                    description: 'Markdown content for the wiki page',
                },
                commitMessage: {
                    type: 'string',
                    description: 'Optional commit message (defaults to "Update {pageName}")',
                },
            },
            required: ['owner', 'repo', 'pageName', 'content'],
        },
    },
    {
        name: 'read_wiki_page',
        description: 'Read the content of an existing GitHub wiki page.',
        inputSchema: {
            type: 'object',
            properties: {
                owner: {
                    type: 'string',
                    description: 'GitHub repository owner (username or organization)',
                },
                repo: {
                    type: 'string',
                    description: 'GitHub repository name',
                },
                token: {
                    type: 'string',
                    description: 'GitHub personal access token with repo scope (optional; defaults to GITHUB_TOKEN env var)',
                },
                pageName: {
                    type: 'string',
                    description: 'Name of the wiki page to read',
                },
            },
            required: ['owner', 'repo', 'pageName'],
        },
    },
    {
        name: 'append_to_wiki_page',
        description: 'Append content to an existing wiki page. If the page does not exist, creates it with the provided content.',
        inputSchema: {
            type: 'object',
            properties: {
                owner: {
                    type: 'string',
                    description: 'GitHub repository owner (username or organization)',
                },
                repo: {
                    type: 'string',
                    description: 'GitHub repository name',
                },
                token: {
                    type: 'string',
                    description: 'GitHub personal access token with repo scope (optional; defaults to GITHUB_TOKEN env var)',
                },
                pageName: {
                    type: 'string',
                    description: 'Name of the wiki page to append to',
                },
                content: {
                    type: 'string',
                    description: 'Markdown content to append',
                },
                commitMessage: {
                    type: 'string',
                    description: 'Optional commit message (defaults to "Append to {pageName}")',
                },
            },
            required: ['owner', 'repo', 'pageName', 'content'],
        },
    },
    {
        name: 'list_wiki_pages',
        description: 'List all wiki pages in a GitHub repository wiki.',
        inputSchema: {
            type: 'object',
            properties: {
                owner: {
                    type: 'string',
                    description: 'GitHub repository owner (username or organization)',
                },
                repo: {
                    type: 'string',
                    description: 'GitHub repository name',
                },
                token: {
                    type: 'string',
                    description: 'GitHub personal access token with repo scope (optional; defaults to GITHUB_TOKEN env var)',
                },
            },
            required: ['owner', 'repo'],
        },
    },
    {
        name: 'delete_wiki_page',
        description: 'Delete a wiki page from a GitHub repository wiki.',
        inputSchema: {
            type: 'object',
            properties: {
                owner: {
                    type: 'string',
                    description: 'GitHub repository owner (username or organization)',
                },
                repo: {
                    type: 'string',
                    description: 'GitHub repository name',
                },
                token: {
                    type: 'string',
                    description: 'GitHub personal access token with repo scope (optional; defaults to GITHUB_TOKEN env var)',
                },
                pageName: {
                    type: 'string',
                    description: 'Name of the wiki page to delete',
                },
                commitMessage: {
                    type: 'string',
                    description: 'Optional commit message (defaults to "Delete {pageName}")',
                },
            },
            required: ['owner', 'repo', 'pageName'],
        },
    },
];
const server = new Server({
    name: 'github-wiki-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});
/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'write_wiki_page': {
                const result = await writeWikiPage(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'read_wiki_page': {
                const result = await readWikiPage(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'append_to_wiki_page': {
                const result = await appendToWikiPage(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'list_wiki_pages': {
                const result = await listWikiPages(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'delete_wiki_page': {
                const result = await deleteWikiPage(args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: false, error: errorMessage }, null, 2),
                },
            ],
            isError: true,
        };
    }
});
/**
 * Start the server
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('GitHub Wiki MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map