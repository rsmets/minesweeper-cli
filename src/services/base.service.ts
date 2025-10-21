import type { Logger } from "pino";
import { logger as rootLogger } from "../logger";

/**
 * BaseService
 *
 * An abstract base class for application services that centralizes common
 * cross-cutting concerns such as structured logging. Concrete services extend
 * this class to gain a consistent, typed logger and a predictable lifecycle.
 *
 * Design notes:
 * - A `pino` Logger instance is injected via the constructor to allow callers
 *   to provide a specific child logger (e.g., `exampleServiceLogger`).
 * - If a logger is not provided, a sensible default child logger is created
 *   from the root logger using the service's constructor name as the component.
 * - Subclasses may optionally perform initialization in their own constructor
 *   after calling `super(...)`.
 */
export abstract class BaseService {
  /**
   * Strongly-typed, structured logger for the concrete service.
   * The logger is `protected` so subclasses can log directly with rich context.
   */
  protected readonly logger: Logger;

  /**
   * Construct a new BaseService.
   *
   * @param injectedLogger - Optional logger to use. When omitted, a default
   *                         child logger is created using the class name.
   */
  protected constructor(injectedLogger?: Logger) {
    // Prefer the injected logger to enable explicit, per-service child loggers.
    // Fall back to a component-scoped child derived from the root logger.
    this.logger =
      injectedLogger ?? rootLogger.child({ component: this.constructor.name });
  }
}
