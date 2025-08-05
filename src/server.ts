import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { MinesweeperGame } from "./game";
import { renderBoardText } from "./serverBoardText";
import { GameConfig, Position } from "./types";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// In-memory game sessions: { [id]: MinesweeperGame }
const games: Record<string, MinesweeperGame> = {};

// Serve static frontend
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "../frontend/dist"),
  prefix: "/",
});

// Health check
fastify.get("/api/health", async (_req, _reply) => {
  return { status: "ok" };
});

// Create new game
fastify.post<{ Body: GameConfig }>("/api/game", async (req, reply) => {
  const config = req.body;
  const id = randomUUID();
  games[id] = new MinesweeperGame(config);
  reply.code(201).send({ id });
});

// Get game state
fastify.get<{ Params: { id: string } }>("/api/game/:id", async (req, reply) => {
  const game = games[req.params.id];
  if (!game) return reply.code(404).send({ error: "Game not found" });
  reply.send({
    id: req.params.id,
    config: game.getConfig(),
    state: game.getGameState(),
  });
});

// Reveal cell
fastify.post<{ Params: { id: string }; Body: Position }>(
  "/api/game/:id/reveal",
  async (req, reply) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });
    const { row, col } = req.body;
    const ok = game.revealCell({ row, col });
    reply.send({ ok, state: game.getGameState() });
  }
);

// Toggle flag
fastify.post<{ Params: { id: string }; Body: Position }>(
  "/api/game/:id/flag",
  async (req, reply) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });
    const { row, col } = req.body;
    const ok = game.toggleFlag({ row, col });
    reply.send({ ok, state: game.getGameState() });
  }
);

// List all active games (IDs only)
fastify.get("/api/games", async (_req, reply) => {
  reply.send({ ids: Object.keys(games) });
});

// CLI-style command endpoint: accepts commands like 'A1', 'F B2', 'Q', etc.
fastify.post<{ Params: { id: string }; Body: { command: string } }>(
  "/api/game/:id/command",
  async (req, reply) => {
    const game = games[req.params.id];
    if (!game) return reply.code(404).send({ error: "Game not found" });
    const input = req.body.command.trim();
    let message = "";
    let status = game.getGameState().status;
    let ok = false;

    // Parse command: 'F <coord>' to flag, '<coord>' to reveal
    const flagMatch = input.match(/^F\s+([A-Z])(\d{1,2})$/i);
    const revealMatch = input.match(/^([A-Z])(\d{1,2})$/i);
    const quitMatch = input.match(/^Q$/i);

    if (quitMatch) {
      message = "Game quit.";
      status = "QUIT";
    } else if (flagMatch) {
      const col = flagMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
      const row = parseInt(flagMatch[2], 10) - 1;
      ok = game.toggleFlag({ row, col });
      message = ok ? `Flag toggled at ${flagMatch[1].toUpperCase()}${flagMatch[2]}` : "Invalid flag action.";
      status = game.getGameState().status;
    } else if (revealMatch) {
      const col = revealMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
      const row = parseInt(revealMatch[2], 10) - 1;
      ok = game.revealCell({ row, col });
      message = ok ? `Revealed ${revealMatch[1].toUpperCase()}${revealMatch[2]}` : "Invalid reveal action.";
      status = game.getGameState().status;
    } else {
      message = "Unknown command. Use e.g. 'A1', 'F B2', or 'Q'.";
    }

    // Always return the board in CLI-style text
    const boardText = renderBoardText(game.getConfig(), game.getGameState());
    reply.send({ boardText, message, status });
  }
);

const port = process.env.PORT || 3000;

fastify.listen({ port: Number(port), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
