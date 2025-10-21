import type { Logger } from "pino";
import { logger as rootLogger } from "../logger";

/**
 * BaseServiceInterface
 * Simple interface for all services extending BaseService
 */
export interface BaseServiceInterface {
  readonly logger: Logger;
}

/**
 * BaseService
 * Abstract base class for all services with logging and abstract create method
 */
export abstract class BaseService implements BaseServiceInterface {
  /**
   * Structured logger for the concrete service
   */
  public readonly logger: Logger;

  /**
   * Construct a new BaseService
   * @param injectedLogger - Optional logger to use, defaults to component-scoped logger
   */
  protected constructor(injectedLogger?: Logger) {
    this.logger =
      injectedLogger ?? rootLogger.child({ component: this.constructor.name });
  }
}
