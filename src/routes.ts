import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { MinesweeperGame } from "./game";
import { renderBoardText } from "./serverBoardText";
import { GameConfig, Position, CellState } from "./types";
import { randomUUID } from "crypto";
import { routeSchemas } from "./schemas";

// In-memory game sessions: { [id]: MinesweeperGame }
const games: Record<string, MinesweeperGame> = {};

// Environment variables
const ADMIN_KEY = process.env.ADMIN_KEY;

// Authorization middleware
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

// Routes plugin
const routesPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Health check endpoint
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
          version: "1.0.0",
        });
      } catch (error) {
        reply.status(500).send({
          status: "error",
          message: "Health check failed",
        });
      }
    },
  );

  // Create new game endpoint
  fastify.post<{ Body: GameConfig }>(
    "/api/game",
    {
      schema: routeSchemas.createGame,
    },
    async (req: FastifyRequest<{ Body: GameConfig }>, reply: FastifyReply) => {
      const config = req.body;

      // Validate configuration
      const errors: string[] = [];

      if (!config.width || config.width < 3 || config.width > 50) {
        errors.push("Width must be between 3 and 50");
      }
      if (!config.height || config.height < 3 || config.height > 50) {
        errors.push("Height must be between 3 and 50");
      }
      if (
        !config.bombPercentage ||
        config.bombPercentage < 1 ||
        config.bombPercentage > 99
      ) {
        errors.push("Bomb percentage must be between 1 and 99");
      }

      if (errors.length > 0) {
        return reply
          .code(400)
          .send({ error: "Invalid configuration", details: errors });
      }

      const gameId = randomUUID();
      const game = new MinesweeperGame(config);
      games[gameId] = game;

      const gameState = game.getGameState();
      reply.code(201).send({
        id: gameId,
        config: game.getConfig(),
        status: gameState.status,
        board: renderBoardText(game.getConfig(), gameState),
        flags: gameState.grid
          .flat()
          .filter((cell) => cell.state === CellState.FLAGGED).length,
        remainingCells: gameState.totalSafeCells - gameState.revealedCells,
      });
    },
  );

  // Get game state endpoint
  fastify.get<{ Params: { id: string } }>(
    "/api/game/:id",
    {
      schema: routeSchemas.getGameState,
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const game = games[req.params.id];
      if (!game) return reply.code(404).send({ error: "Game not found" });

      const gameState = game.getGameState();
      reply.send({
        id: req.params.id,
        config: game.getConfig(),
        status: gameState.status,
        board: renderBoardText(game.getConfig(), gameState),
        flags: gameState.grid
          .flat()
          .filter((cell) => cell.state === CellState.FLAGGED).length,
        remainingCells: gameState.totalSafeCells - gameState.revealedCells,
      });
    },
  );

  // Reveal cell endpoint
  fastify.post<{ Params: { id: string }; Body: Position }>(
    "/api/game/:id/reveal",
    {
      schema: routeSchemas.revealCell,
    },
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: Position }>,
      reply: FastifyReply,
    ) => {
      const game = games[req.params.id];
      if (!game) return reply.code(404).send({ error: "Game not found" });

      const { row, col } = req.body as Position;

      // Validate position
      const config = game.getConfig();
      if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
        return reply.code(400).send({ error: "Invalid position" });
      }

      const success = game.revealCell({ row, col });
      if (!success) {
        return reply.code(400).send({
          error: "Cannot reveal cell - it may already be revealed or flagged",
        });
      }

      const gameState = game.getGameState();
      reply.send({
        id: req.params.id,
        config: game.getConfig(),
        status: gameState.status,
        board: renderBoardText(game.getConfig(), gameState),
        flags: gameState.grid
          .flat()
          .filter((cell) => cell.state === CellState.FLAGGED).length,
        remainingCells: gameState.totalSafeCells - gameState.revealedCells,
      });
    },
  );

  // Flag cell endpoint
  fastify.post<{ Params: { id: string }; Body: Position }>(
    "/api/game/:id/flag",
    {
      schema: routeSchemas.flagCell,
    },
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: Position }>,
      reply: FastifyReply,
    ) => {
      const game = games[req.params.id];
      if (!game) return reply.code(404).send({ error: "Game not found" });

      const { row, col } = req.body as Position;

      // Validate position
      const config = game.getConfig();
      if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
        return reply.code(400).send({ error: "Invalid position" });
      }

      const success = game.toggleFlag({ row, col });
      if (!success) {
        return reply
          .code(400)
          .send({ error: "Cannot flag cell - it may already be revealed" });
      }

      const gameState = game.getGameState();
      reply.send({
        id: req.params.id,
        config: game.getConfig(),
        status: gameState.status,
        board: renderBoardText(game.getConfig(), gameState),
        flags: gameState.grid
          .flat()
          .filter((cell) => cell.state === CellState.FLAGGED).length,
        remainingCells: gameState.totalSafeCells - gameState.revealedCells,
      });
    },
  );

  // List games endpoint (admin only)
  fastify.get(
    "/api/games",
    {
      schema: routeSchemas.listGames,
      preHandler: requireAdminKey,
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      reply.send({
        ids: Object.keys(games),
        total: Object.keys(games).length,
        message: "Active game sessions",
      });
    },
  );

  // Command endpoint
  fastify.post<{ Params: { id: string }; Body: { command: string } }>(
    "/api/game/:id/command",
    {
      schema: routeSchemas.executeCommand,
    },
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { command: string };
      }>,
      reply: FastifyReply,
    ) => {
      const game = games[req.params.id];
      if (!game) return reply.code(404).send({ error: "Game not found" });

      const input = req.body.command.trim();
      let message = "";
      let gameState = game.getGameState();

      // Handle empty command (just return current board)
      if (input === "") {
        message =
          "Enter a command like A1 to reveal, F A1 to flag, or Q to quit";
        reply.send({
          board: renderBoardText(game.getConfig(), gameState),
          message,
          status: gameState.status,
        });
        return;
      }

      // Parse CLI-style commands: 'F A1', 'A1', 'Q'
      const flagMatch = input.match(/^F\s+([A-Z])(\d{1,2})$/i);
      const revealMatch = input.match(/^([A-Z])(\d{1,2})$/i);
      const quitMatch = input.match(/^Q(UIT)?$/i);

      if (quitMatch) {
        message = "Game quit.";
        reply.send({
          board: renderBoardText(game.getConfig(), gameState),
          message,
          status: "QUIT",
        });
        return;
      }

      let success = false;
      const config = game.getConfig();

      if (flagMatch) {
        const col =
          flagMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
        const row = parseInt(flagMatch[2], 10) - 1;

        if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
          message = `Position ${flagMatch[1].toUpperCase()}${flagMatch[2]} is out of bounds. Valid range: A1-${String.fromCharCode(65 + config.width - 1)}${config.height}`;
        } else {
          success = game.toggleFlag({ row, col });
          message = success
            ? `Flag toggled at ${flagMatch[1].toUpperCase()}${flagMatch[2]}`
            : `Cannot flag ${flagMatch[1].toUpperCase()}${flagMatch[2]} - cell may already be revealed`;
        }
      } else if (revealMatch) {
        const col =
          revealMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
        const row = parseInt(revealMatch[2], 10) - 1;

        if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
          message = `Position ${revealMatch[1].toUpperCase()}${revealMatch[2]} is out of bounds. Valid range: A1-${String.fromCharCode(65 + config.width - 1)}${config.height}`;
        } else {
          success = game.revealCell({ row, col });
          message = success
            ? `Revealed ${revealMatch[1].toUpperCase()}${revealMatch[2]}`
            : `Cannot reveal ${revealMatch[1].toUpperCase()}${revealMatch[2]} - cell may already be revealed or flagged`;
        }
      } else {
        message = `Invalid command "${input}". Valid commands: A1-${String.fromCharCode(65 + config.width - 1)}${config.height} to reveal, F A1-${String.fromCharCode(65 + config.width - 1)}${config.height} to flag, Q to quit`;
      }

      // Get updated game state
      gameState = game.getGameState();

      reply.send({
        board: renderBoardText(game.getConfig(), gameState),
        message,
        status: gameState.status,
        gameState: {
          id: req.params.id,
          config: game.getConfig(),
          status: gameState.status,
          board: renderBoardText(game.getConfig(), gameState),
          flags: gameState.grid
            .flat()
            .filter((cell) => cell.state === CellState.FLAGGED).length,
          remainingCells: gameState.totalSafeCells - gameState.revealedCells,
        },
      });
    },
  );
};

export default routesPlugin;
