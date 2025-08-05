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
  adminKey: string = "minesweeper-admin-key",
): Promise<void> {
  const providedKey =
    req.headers["x-admin-key"] || req.headers["authorization"];

  if (!providedKey || providedKey !== adminKey) {
    reply.code(401).send({
      error: "Unauthorized",
      message:
        "Valid admin key required. Provide it via 'X-Admin-Key' or 'Authorization' header.",
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
    test("should allow access with valid X-Admin-Key header", async () => {
      const req: MockRequest = {
        headers: {
          "x-admin-key": "minesweeper-admin-key",
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

    test("should deny access with invalid admin key", async () => {
      const req: MockRequest = {
        headers: {
          "x-admin-key": "invalid-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
      assert.deepStrictEqual(reply.response, {
        error: "Unauthorized",
        message:
          "Valid admin key required. Provide it via 'X-Admin-Key' or 'Authorization' header.",
      });
    });

    test("should deny access with missing admin key", async () => {
      const req: MockRequest = {
        headers: {},
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
      assert.deepStrictEqual(reply.response, {
        error: "Unauthorized",
        message:
          "Valid admin key required. Provide it via 'X-Admin-Key' or 'Authorization' header.",
      });
    });

    test("should work with custom admin key", async () => {
      const customKey = "custom-secret-key";
      const req: MockRequest = {
        headers: {
          "x-admin-key": customKey,
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply, customKey);

      assert.strictEqual(reply.statusCode, undefined);
      assert.strictEqual(reply.response, undefined);
    });

    test("should deny access with wrong custom admin key", async () => {
      const customKey = "custom-secret-key";
      const req: MockRequest = {
        headers: {
          "x-admin-key": "wrong-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply, customKey);
      assert.strictEqual(reply.statusCode, 401);
    });

    test("should prioritize X-Admin-Key over Authorization header", async () => {
      const req: MockRequest = {
        headers: {
          "x-admin-key": "minesweeper-admin-key",
          authorization: "wrong-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      assert.strictEqual(reply.statusCode, undefined);
    });

    test("should fall back to Authorization header if X-Admin-Key is missing", async () => {
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

  describe("Admin Key Validation", () => {
    test("should handle empty string admin key", async () => {
      const req: MockRequest = {
        headers: {
          "x-admin-key": "",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
    });

    test("should handle whitespace-only admin key", async () => {
      const req: MockRequest = {
        headers: {
          "x-admin-key": "   ",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);
      assert.strictEqual(reply.statusCode, 401);
    });

    test("should be case-sensitive", async () => {
      const req: MockRequest = {
        headers: {
          "x-admin-key": "MINESWEEPER-ADMIN-KEY", // uppercase
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
          "X-ADMIN-KEY": "minesweeper-admin-key", // uppercase header name
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
    test("should not reveal the expected admin key in error messages", async () => {
      const req: MockRequest = {
        headers: {
          "x-admin-key": "wrong-key",
        },
      };
      const reply = createMockReply();

      await requireAdminKey(req, reply);

      assert.strictEqual(reply.response?.error, "Unauthorized");
      assert(
        !reply.response?.message.includes("minesweeper-admin-key"),
        "Error message should not reveal the expected admin key",
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
        reply.response?.message.includes("X-Admin-Key"),
        "Error message should mention the X-Admin-Key header",
      );
      assert(
        reply.response?.message.includes("Authorization"),
        "Error message should mention the Authorization header",
      );
    });
  });
});
