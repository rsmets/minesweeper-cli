import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
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
      req: FastifyRequest<{ Params: { id: string }; Body: { command: string } }>,
      reply: FastifyReply,
    ) => {
      const game = games[req.params.id];
      if (!game) return reply.code(404).send({ error: "Game not found" });

      const input = req.body.command.trim();
      let message = "";

      try {
        const parts = input.toLowerCase().split(/\s+/);
        const action = parts[0];
        const row = parseInt(parts[1], 10);
        const col = parseInt(parts[2], 10);

        if (isNaN(row) || isNaN(col)) {
          return reply.code(400).send({
            error: "Invalid command format. Use: 'reveal 3 4' or 'flag 2 5'",
          });
        }

        const config = game.getConfig();
        if (row < 0 || row >= config.height || col < 0 || col >= config.width) {
          return reply.code(400).send({ error: "Position out of bounds" });
        }

        let success = false;
        switch (action) {
          case "reveal":
          case "r":
            success = game.revealCell({ row, col });
            message = success
              ? `Revealed cell at (${row}, ${col})`
              : `Cannot reveal cell at (${row}, ${col}) - it may already be revealed or flagged`;
            break;
          case "flag":
          case "f":
            success = game.toggleFlag({ row, col });
            message = success
              ? `Toggled flag at (${row}, ${col})`
              : `Cannot flag cell at (${row}, ${col}) - it may already be revealed`;
            break;
          default:
            return reply
              .code(400)
              .send({ error: "Unknown command. Use 'reveal' or 'flag'" });
        }

        if (!success) {
          return reply.code(400).send({ error: message });
        }

        const gameState = game.getGameState();
        reply.send({
          message,
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
      } catch (error) {
        reply.code(400).send({ error: (error as Error).message });
      }
    },
  );
};

export default routesPlugin;
