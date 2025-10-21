import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { exampleService } from "./services";
import { routeSchemas, createItemSchema, updateItemSchema } from "./schemas";
import { readFileSync } from "fs";
import { join } from "path";

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8")
);
const VERSION = packageJson.version;

// Environment variables
// - ADMIN_KEY: Admin key for protected endpoints (set via environment or .env file)
const ADMIN_KEY = process.env.ADMIN_KEY;

/**
 * Authorization middleware - requires valid admin key
 * Checks for admin key in X-Admin-Key or Authorization header
 * Returns 401 if key is missing or invalid
 */
const requireAdminKey = async (req: FastifyRequest, reply: FastifyReply) => {
  const adminKey = req.headers["x-admin-key"] || req.headers["authorization"];

  if (!adminKey || adminKey !== ADMIN_KEY) {
    reply.code(401).send({
      error: "Unauthorized",
      message:
        "Valid admin key required. Provide it via 'X-Admin-Key' or 'Authorization' header.",
    });
    return;
  }
};

/**
 * Routes plugin
 * Registers all API routes with the Fastify instance
 */
const routesPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // ===========================
  // Health Check Endpoint
  // ===========================

  /**
   * GET /api/health
   * Public endpoint for health checks
   * Used by load balancers, monitoring systems, and fly.io
   */
  fastify.get(
    "/api/health",
    {
      schema: routeSchemas.health,
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        reply.status(200).send({
          status: "ok",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: VERSION,
        });
      } catch (error) {
        reply.status(500).send({
          status: "error",
          message: "Health check failed",
        });
      }
    }
  );

  // ===========================
  // CRUD Endpoints for Items
  // ===========================

  /**
   * POST /api/items
   * Create a new item
   * Body: { name: string, description?: string }
   */
  fastify.post<{ Body: { name: string; description?: string } }>(
    "/api/items",
    {
      schema: routeSchemas.createItem,
    },
    async (
      req: FastifyRequest<{ Body: { name: string; description?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate request body using Zod schema
        const validatedData = createItemSchema.parse(req.body);

        // Create the item using the service
        const item = exampleService.create(validatedData);

        // Return 201 Created with the new item
        reply.code(201).send(item);
      } catch (error: any) {
        // Handle validation errors from Zod
        if (error.name === "ZodError") {
          return reply.code(400).send({
            error: "Validation error",
            details: error.errors.map((e: any) => e.message),
          });
        }

        // Handle unexpected errors
        reply.code(500).send({
          error: "Internal server error",
          message: "Failed to create item",
        });
      }
    }
  );

  /**
   * GET /api/items/:id
   * Get a specific item by ID
   * Params: { id: string (UUID) }
   */
  fastify.get<{ Params: { id: string } }>(
    "/api/items/:id",
    {
      schema: routeSchemas.getItem,
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const item = exampleService.get(req.params.id);

      if (!item) {
        return reply.code(404).send({
          error: "Not found",
          message: `Item with ID ${req.params.id} not found`,
        });
      }

      reply.send(item);
    }
  );

  /**
   * GET /api/items
   * List all items (admin only)
   * Requires admin key in X-Admin-Key or Authorization header
   */
  fastify.get(
    "/api/items",
    {
      schema: routeSchemas.listItems,
      preHandler: requireAdminKey, // Apply authorization middleware
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const items = exampleService.getAll();
      reply.send({
        items,
        total: items.length,
      });
    }
  );

  /**
   * PUT /api/items/:id
   * Update an existing item
   * Params: { id: string (UUID) }
   * Body: { name?: string, description?: string }
   */
  fastify.put<{
    Params: { id: string };
    Body: { name?: string; description?: string };
  }>(
    "/api/items/:id",
    {
      schema: routeSchemas.updateItem,
    },
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { name?: string; description?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate request body using Zod schema
        const validatedData = updateItemSchema.parse(req.body);

        // Update the item using the service
        const item = exampleService.update(req.params.id, validatedData);

        if (!item) {
          return reply.code(404).send({
            error: "Not found",
            message: `Item with ID ${req.params.id} not found`,
          });
        }

        reply.send(item);
      } catch (error: any) {
        // Handle validation errors from Zod
        if (error.name === "ZodError") {
          return reply.code(400).send({
            error: "Validation error",
            details: error.errors.map((e: any) => e.message),
          });
        }

        // Handle unexpected errors
        reply.code(500).send({
          error: "Internal server error",
          message: "Failed to update item",
        });
      }
    }
  );

  /**
   * DELETE /api/items/:id
   * Delete an item by ID (admin only)
   * Params: { id: string (UUID) }
   * Requires admin key in X-Admin-Key or Authorization header
   */
  fastify.delete<{ Params: { id: string } }>(
    "/api/items/:id",
    {
      schema: routeSchemas.deleteItem,
      preHandler: requireAdminKey, // Apply authorization middleware
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const deleted = exampleService.delete(req.params.id);

      if (!deleted) {
        return reply.code(404).send({
          error: "Not found",
          message: `Item with ID ${req.params.id} not found`,
        });
      }

      reply.send({
        success: true,
        message: `Item ${req.params.id} deleted successfully`,
      });
    }
  );
};

export default routesPlugin;
