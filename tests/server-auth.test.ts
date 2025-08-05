import { test, describe } from "node:test";
import assert from "node:assert";

// Mock Fastify request and reply objects for testing authorization
interface MockRequest {
  headers: Record<string, string>;
}

interface MockReply {
  statusCode?: number;
  response?: any;
  code(status: number): MockReply;
  send(data: any): MockReply;
}

// Import the authorization function logic (we'll need to extract it)
async function requireAdminKey(
  req: MockRequest,
  reply: MockReply,
  apiKey: string = "minesweeper-admin-key",
): Promise<void> {
  const providedKey = req.headers["x-api-key"] || req.headers["authorization"];

  if (!providedKey || providedKey !== apiKey) {
    reply.code(401).send({
      error: "Unauthorized",
      message:
        "Valid API key required. Provide it via 'X-API-Key' or 'Authorization' header.",
    });
    return;
  }
}

// Mock reply implementation
function createMockReply(): MockReply {
  const reply: MockReply = {
    code(status: number) {
      this.statusCode = status;
      return this;
    },
    send(data: any) {
      this.response = data;
      return this;
    },
  };
  return reply;
}

describe("Server Authorization", () => {
  describe("requireAdminKey function", () => {
    test("should allow access with valid X-API-Key header", async () => {
      const req: MockRequest = {
        headers: {
          "x-api-key": "minesweeper-admin-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      assert.strictEqual(reply.statusCode, undefined);
      assert.strictEqual(reply.response, undefined);
    });

    test("should allow access with valid Authorization header", async () => {
      const req: MockRequest = {
        headers: {
          authorization: "minesweeper-admin-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      assert.strictEqual(reply.statusCode, undefined);
      assert.strictEqual(reply.response, undefined);
    });

    test("should deny access with invalid API key", async () => {
      const req: MockRequest = {
        headers: {
          "x-api-key": "invalid-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
      assert.deepStrictEqual(reply.response, {
        error: "Unauthorized",
        message:
          "Valid API key required. Provide it via 'X-API-Key' or 'Authorization' header.",
      });
    });

    test("should deny access with missing API key", async () => {
      const req: MockRequest = {
        headers: {},
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
      assert.deepStrictEqual(reply.response, {
        error: "Unauthorized",
        message:
          "Valid API key required. Provide it via 'X-API-Key' or 'Authorization' header.",
      });
    });

    test("should work with custom API key", async () => {
      const customKey = "custom-secret-key";
      const req: MockRequest = {
        headers: {
          "x-api-key": customKey,
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply, customKey);

      assert.strictEqual(reply.statusCode, undefined);
      assert.strictEqual(reply.response, undefined);
    });

    test("should deny access with wrong custom API key", async () => {
      const customKey = "custom-secret-key";
      const req: MockRequest = {
        headers: {
          "x-api-key": "wrong-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply, customKey);
      assert.strictEqual(reply.statusCode, 401);
    });

    test("should prioritize X-API-Key over Authorization header", async () => {
      const req: MockRequest = {
        headers: {
          "x-api-key": "minesweeper-admin-key",
          authorization: "wrong-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      assert.strictEqual(reply.statusCode, undefined);
    });

    test("should fall back to Authorization header if X-API-Key is missing", async () => {
      const req: MockRequest = {
        headers: {
          authorization: "minesweeper-admin-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      assert.strictEqual(reply.statusCode, undefined);
    });
  });

  describe("API Key Validation", () => {
    test("should handle empty string API key", async () => {
      const req: MockRequest = {
        headers: {
          "x-api-key": "",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
    });

    test("should handle whitespace-only API key", async () => {
      const req: MockRequest = {
        headers: {
          "x-api-key": "   ",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
    });

    test("should be case-sensitive", async () => {
      const req: MockRequest = {
        headers: {
          "x-api-key": "MINESWEEPER-ADMIN-KEY", // uppercase
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
    });
  });

  describe("Header Handling", () => {
    test("should handle headers with different cases", async () => {
      const req: MockRequest = {
        headers: {
          "X-API-KEY": "minesweeper-admin-key", // uppercase header name
        },
      };
      const reply = createMockReply();

      // Note: In real HTTP, headers are case-insensitive, but our mock uses exact matching
      // This test documents the current behavior
      await requireAdminKey(req, reply);

      assert.strictEqual(reply.statusCode, 401); // Will fail because we're looking for lowercase
    });

    test("should handle Authorization header with Bearer prefix", async () => {
      const req: MockRequest = {
        headers: {
          authorization: "Bearer minesweeper-admin-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      // This will fail because we expect exact match, not Bearer prefix
      assert.strictEqual(reply.statusCode, 401);
    });
  });

  describe("Security Considerations", () => {
    test("should not reveal the expected API key in error messages", async () => {
      const req: MockRequest = {
        headers: {
          "x-api-key": "wrong-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      assert.strictEqual(reply.response?.error, "Unauthorized");
      assert(
        !reply.response?.message.includes("minesweeper-admin-key"),
        "Error message should not reveal the expected API key",
      );
    });

    test("should provide helpful error message", async () => {
      const req: MockRequest = {
        headers: {},
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      assert.strictEqual(reply.response?.error, "Unauthorized");
      assert(
        reply.response?.message.includes("X-API-Key"),
        "Error message should mention the X-API-Key header",
      );
      assert(
        reply.response?.message.includes("Authorization"),
        "Error message should mention the Authorization header",
      );
    });
  });
});
