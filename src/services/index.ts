import { ExampleService } from "./example.service";

/**
 * Service Registry
 * Centralized singleton management for all services
 */
class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service with a name
   */
  register<T>(name: string, service: T): T {
    this.services.set(name, service);
    return service;
  }

  /**
   * Get a service by name
   */
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service as T;
  }

  /**
   * Check if a service exists
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// Initialize all services as singletons
const registry = ServiceRegistry.getInstance();

// Register services here
const exampleService = registry.register(
  "exampleService",
  new ExampleService()
);

// Export the registry and individual services for convenience
export { ServiceRegistry, registry };
export { exampleService };

// Re-export service types for type safety where needed
export type { ExampleService } from "./example.service";
