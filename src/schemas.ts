import { z } from "zod";

/**
 * API Schemas using Zod for validation
 * These schemas define the structure and validation rules for API requests/responses
 * They are also used to generate Swagger/OpenAPI documentation
 */

// ===========================
// Zod Schemas for Validation
// ===========================

/**
 * Schema for creating a new item
 * Validates name (1-100 chars) and description (optional, max 500 chars)
 */
export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .default(""),
});

/**
 * Schema for updating an existing item
 * All fields are optional (partial update)
 */
export const updateItemSchema = z.object({
  name: z
    .string()
    .min(1, "Name must not be empty")
    .max(100, "Name must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
});

/**
 * Schema for item ID parameter (UUID format)
 */
export const itemIdParamSchema = z.object({
  id: z.string().uuid("Invalid item ID format"),
});

// ===========================
// Fastify Route Schemas (JSON Schema format for Swagger)
// ===========================

/**
 * Convert Zod schemas to JSON Schema for Fastify/Swagger
 * Note: In a production app, you might use @fastify/type-provider-zod
 * for automatic conversion, but we're keeping it manual for clarity
 */

// JSON Schema for create item request
const createItemJsonSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Item name",
    },
    description: {
      type: "string",
      maxLength: 500,
      description: "Item description (optional)",
    },
  },
} as const;

// JSON Schema for update item request
const updateItemJsonSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Item name",
    },
    description: {
      type: "string",
      maxLength: 500,
      description: "Item description",
    },
  },
} as const;

// JSON Schema for item response
const itemResponseSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "Unique item identifier",
    },
    name: {
      type: "string",
      description: "Item name",
    },
    description: {
      type: "string",
      description: "Item description",
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Creation timestamp",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Last update timestamp",
    },
  },
} as const;

// JSON Schema for error response
const errorResponseSchema = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Error message",
    },
    message: {
      type: "string",
      description: "Detailed error message",
    },
    details: {
      type: "array",
      items: { type: "string" },
      description: "Validation error details",
    },
  },
} as const;

// JSON Schema for health response
const healthResponseSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["ok", "error"],
      description: "Health status",
    },
    timestamp: {
      type: "string",
      format: "date-time",
      description: "Current timestamp",
    },
    uptime: {
      type: "number",
      description: "Server uptime in seconds",
    },
    version: {
      type: "string",
      description: "API version",
    },
  },
} as const;

// JSON Schema for items list response
const itemsListResponseSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: itemResponseSchema,
      description: "Array of items",
    },
    total: {
      type: "number",
      description: "Total number of items",
    },
  },
} as const;

// JSON Schema for item ID parameter
const itemIdParamJsonSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "Item ID",
    },
  },
} as const;

// JSON Schema for unauthorized response
const unauthorizedResponseSchema = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Error type",
    },
    message: {
      type: "string",
      description: "Error message with instructions",
    },
  },
} as const;

/**
 * Fastify route schemas for all endpoints
 * These are used by Fastify for validation and Swagger documentation
 */
export const routeSchemas = {
  // Health check endpoint
  health: {
    operationId: "getHealth",
    tags: ["health"],
    summary: "Health check",
    description: "Check server health and status",
    response: {
      200: healthResponseSchema,
      500: errorResponseSchema,
    },
  },

  // Create item endpoint
  createItem: {
    operationId: "createItem",
    tags: ["items"],
    summary: "Create new item",
    description: "Create a new item with name and optional description",
    body: createItemJsonSchema,
    response: {
      201: itemResponseSchema,
      400: errorResponseSchema,
    },
  },

  // Get item endpoint
  getItem: {
    operationId: "getItem",
    tags: ["items"],
    summary: "Get item by ID",
    description: "Retrieve a specific item by its unique ID",
    params: itemIdParamJsonSchema,
    response: {
      200: itemResponseSchema,
      404: errorResponseSchema,
    },
  },

  // List items endpoint (admin only)
  listItems: {
    operationId: "listItems",
    tags: ["items", "admin"],
    summary: "List all items",
    description: "Retrieve all items (admin only)",
    security: [{ adminKey: [] }],
    response: {
      200: itemsListResponseSchema,
      401: unauthorizedResponseSchema,
    },
  },

  // Update item endpoint
  updateItem: {
    operationId: "updateItem",
    tags: ["items"],
    summary: "Update item",
    description: "Update an existing item's name and/or description",
    params: itemIdParamJsonSchema,
    body: updateItemJsonSchema,
    response: {
      200: itemResponseSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
    },
  },

  // Delete item endpoint (admin only)
  deleteItem: {
    operationId: "deleteItem",
    tags: ["items", "admin"],
    summary: "Delete item",
    description: "Delete an item by ID (admin only)",
    params: itemIdParamJsonSchema,
    security: [{ adminKey: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
        },
      },
      401: unauthorizedResponseSchema,
      404: errorResponseSchema,
    },
  },
} as const;
