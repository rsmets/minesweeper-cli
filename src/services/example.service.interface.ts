/**
 * Example Service Interface
 * Defines the contract for the ExampleService implementation
 * This demonstrates explicit interface definition for better type safety and testability
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
 * ExampleServiceInterface
 * Defines the contract that any ExampleService implementation must follow
 * This enables easy mocking for tests and potential future implementations
 */
export interface ExampleServiceInterface {
  /**
   * Create a new item
   * @param input - Item creation data
   * @returns The newly created item
   */
  create(input: CreateItemInput): ExampleItem;

  /**
   * Get an item by ID
   * @param id - The item ID
   * @returns The item if found, undefined otherwise
   */
  get(id: string): ExampleItem | undefined;

  /**
   * Get all items
   * @returns Array of all items
   */
  getAll(): ExampleItem[];

  /**
   * Update an existing item
   * @param id - The item ID to update
   * @param input - Partial item data to update
   * @returns The updated item if found, undefined otherwise
   */
  update(id: string, input: UpdateItemInput): ExampleItem | undefined;

  /**
   * Delete an item by ID
   * @param id - The item ID to delete
   * @returns true if item was deleted, false if not found
   */
  delete(id: string): boolean;

  /**
   * Get the count of all items
   * @returns The total number of items
   */
  count(): number;

  /**
   * Clear all items (useful for testing)
   */
  clear(): void;
}
