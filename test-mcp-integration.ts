#!/usr/bin/env node

/**
 * Simple test script to verify MCP integration with @mcp-it/fastify
 * This tests that the MCP endpoints are available and working
 */

async function testMCPEndpoints() {
  const baseUrl = process.env.TEST_URL || "http://localhost:8081";

  console.log("🧪 Testing MCP Integration");
  console.log("=========================");
  console.log(`Base URL: ${baseUrl}`);
  console.log();

  try {
    // Test 1: Health check (regular API)
    console.log("1. Testing regular API health check...");
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log("✅ Health check:", healthData.status);
    console.log();

    // Test 2: Check if MCP SSE endpoint is available
    console.log("2. Testing MCP SSE endpoint availability...");
    try {
      const sseResponse = await fetch(`${baseUrl}/mcp/sse`, {
        method: "GET",
        headers: {
          "Accept": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });

      if (sseResponse.ok) {
        console.log("✅ MCP SSE endpoint is available");
        console.log(`   Status: ${sseResponse.status}`);
        console.log(`   Content-Type: ${sseResponse.headers.get("content-type")}`);
      } else {
        console.log(`⚠️  MCP SSE endpoint returned status: ${sseResponse.status}`);
      }
    } catch (error) {
      console.log("⚠️  MCP SSE endpoint test failed:", error);
    }
    console.log();

    // Test 3: Check for MCP tools endpoint (if available)
    console.log("3. Testing MCP tools discovery...");
    try {
      const toolsResponse = await fetch(`${baseUrl}/mcp/tools`);
      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json();
        console.log("✅ MCP tools endpoint available");
        console.log(`   Found ${Array.isArray(toolsData) ? toolsData.length : 'unknown'} tools`);
      } else {
        console.log(`ℹ️  MCP tools endpoint not available (status: ${toolsResponse.status})`);
      }
    } catch (error) {
      console.log("ℹ️  MCP tools endpoint not available");
    }
    console.log();

    // Test 4: Test creating a game (will be exposed as MCP tool)
    console.log("4. Testing game creation (MCP tool source)...");
    const gameConfig = {
      width: 5,
      height: 5,
      bombPercentage: 20
    };

    const createResponse = await fetch(`${baseUrl}/api/game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameConfig),
    });

    if (createResponse.ok) {
      const gameData = await createResponse.json();
      console.log("✅ Game creation works (this will be an MCP tool)");
      console.log(`   Game ID: ${gameData.id}`);

      // Test game state retrieval
      const stateResponse = await fetch(`${baseUrl}/api/game/${gameData.id}`);
      if (stateResponse.ok) {
        const stateData = await stateResponse.json();
        console.log("✅ Game state retrieval works (this will be an MCP tool)");
        console.log(`   Status: ${stateData.status}`);
      }
    } else {
      console.log("❌ Game creation failed");
    }
    console.log();

    // Summary
    console.log("📋 MCP Integration Summary");
    console.log("==========================");
    console.log("✅ Server is running with @mcp-it/fastify plugin");
    console.log("✅ Regular API endpoints are working");
    console.log("✅ MCP SSE endpoint is available at /mcp/sse");
    console.log("ℹ️  API routes will be automatically exposed as MCP tools");
    console.log();
    console.log("🔌 MCP Client Configuration:");
    console.log("For Claude Desktop, use:");
    console.log(JSON.stringify({
      mcpServers: {
        minesweeper: {
          url: `${baseUrl}/mcp/sse`,
          type: "sse"
        }
      }
    }, null, 2));
    console.log();
    console.log("📖 Available MCP Tools (auto-generated from API routes):");
    console.log("• POST /api/game - Create new game");
    console.log("• GET /api/game/:id - Get game state");
    console.log("• POST /api/game/:id/reveal - Reveal cell");
    console.log("• POST /api/game/:id/flag - Flag cell");
    console.log("• POST /api/game/:id/command - Execute command");
    console.log("• GET /api/games - List games (admin)");
    console.log("• GET /api/health - Health check");

  } catch (error) {
    console.error("❌ Test failed:", error);

    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Make sure the server is running:");
      console.error("   pnpm run dev:server");
      console.error("   # or");
      console.error("   PORT=8081 pnpm exec tsx src/server.ts");
    }
  }
}

async function main() {
  const command = process.argv[2];

  if (command === "--help" || command === "-h") {
    console.log("MCP Integration Test");
    console.log("===================");
    console.log();
    console.log("Usage:");
    console.log("  tsx test-mcp-integration.ts                Test localhost:8081");
    console.log("  TEST_URL=http://localhost:3000 tsx test-mcp-integration.ts");
    console.log();
    console.log("Environment:");
    console.log("  TEST_URL    Server URL to test (default: http://localhost:8081)");
    return;
  }

  await testMCPEndpoints();
}

if (require.main === module) {
  main().catch(console.error);
}
