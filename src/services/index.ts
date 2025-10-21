import { ExampleService } from "./example.service";
import { ExampleServiceInterface } from "./example.service.interface";
export { BaseService } from "./base.service";

/**
 * Service Factory Functions
 * These functions create singleton instances of services
 * They will be used with Fastify decorators for dependency injection
 */

/**
 * Creates a singleton instance of ExampleService
 * This function is called once when the service is first requested
 */
export const createExampleService = (): ExampleService => {
  return ExampleService.create();
};

// Re-export service types and interfaces for type safety
export type { ExampleService } from "./example.service";
export type {
  ExampleServiceInterface,
  ExampleItem,
  CreateItemInput,
  UpdateItemInput,
} from "./example.service.interface";
