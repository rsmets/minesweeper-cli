import pino from 'pino';

/**
 * Logger configuration using pino
 * Only outputs when LOG_LEVEL environment variable is set to debug or trace
 */

// Get log level from environment variable, default to 'silent' (no output)
const logLevel = process.env.LOG_LEVEL?.toLowerCase() || 'silent';

// Create pino logger instance
export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

// Create child loggers for different components
export const gameLogger = logger.child({ component: 'game' });
export const cliLogger = logger.child({ component: 'cli' });
export const mainLogger = logger.child({ component: 'main' });
