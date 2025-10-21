import { randomUUID } from "crypto";

/**
 * Example service demonstrating basic CRUD operations
 * This is a simple in-memory data store for demonstration purposes
 */

// Simple data model for our example entity
export interface ExampleItem {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Input type for creating a new item
export interface CreateItemInput {
  name: string;
  description: string;
}

// Input type for updating an existing item
export interface UpdateItemInput {
  name?: string;
  description?: string;
}

/**
 * ExampleService class
 * Provides basic CRUD operations for example items
 * Uses an in-memory store (Map) for simplicity
 */
export class ExampleService {
  // In-memory data store: Map<id, ExampleItem>
  private items: Map<string, ExampleItem> = new Map();

  /**
   * Create a new item
   * @param input - Item creation data
   * @returns The newly created item
   */
  create(input: CreateItemInput): ExampleItem {
    const now = new Date();
    const item: ExampleItem = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(item.id, item);
    return item;
  }

  /**
   * Get an item by ID
   * @param id - The item ID
   * @returns The item if found, undefined otherwise
   */
  get(id: string): ExampleItem | undefined {
    return this.items.get(id);
  }

  /**
   * Get all items
   * @returns Array of all items
   */
  getAll(): ExampleItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Update an existing item
   * @param id - The item ID to update
   * @param input - Partial item data to update
   * @returns The updated item if found, undefined otherwise
   */
  update(id: string, input: UpdateItemInput): ExampleItem | undefined {
    const item = this.items.get(id);
    if (!item) {
      return undefined;
    }

    // Update only the provided fields
    if (input.name !== undefined) {
      item.name = input.name;
    }
    if (input.description !== undefined) {
      item.description = input.description;
    }
    item.updatedAt = new Date();

    this.items.set(id, item);
    return item;
  }

  /**
   * Delete an item by ID
   * @param id - The item ID to delete
   * @returns true if item was deleted, false if not found
   */
  delete(id: string): boolean {
    return this.items.delete(id);
  }

  /**
   * Get the count of all items
   * @returns The total number of items
   */
  count(): number {
    return this.items.size;
  }

  /**
   * Clear all items (useful for testing)
   */
  clear(): void {
    this.items.clear();
  }
}
