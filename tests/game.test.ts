import { test, describe } from "node:test";
import assert from "node:assert";
import { MinesweeperGame } from "../src/game";
import { GameStatus, CellState } from "../src/types";

describe("MinesweeperGame", () => {
  describe("Constructor and Initialization", () => {
    test("should create a game with valid configuration", () => {
      const config = { width: 10, height: 10, bombPercentage: 15 };
      const game = new MinesweeperGame(config);

      assert.strictEqual(game.getConfig().width, 10);
      assert.strictEqual(game.getConfig().height, 10);
      assert.strictEqual(game.getConfig().bombPercentage, 15);

      const state = game.getGameState();
      assert.strictEqual(state.grid.length, 10); // height
      assert.strictEqual(state.grid[0].length, 10); // width
      assert.strictEqual(state.status, GameStatus.PLAYING);
    });

    test("should initialize all cells as hidden", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });
      const state = game.getGameState();

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          assert.strictEqual(state.grid[row][col].state, CellState.HIDDEN);
        }
      }
    });

    test("should place correct number of bombs", () => {
      const game = new MinesweeperGame({
        width: 10,
        height: 10,
        bombPercentage: 20,
      });
      const state = game.getGameState();

      let bombCount = 0;
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (state.grid[row][col].isBomb) {
            bombCount++;
          }
        }
      }

      // 20% of 100 cells = 20 bombs
      assert.strictEqual(bombCount, 20);
    });

    test("should calculate total safe cells correctly", () => {
      const game = new MinesweeperGame({
        width: 8,
        height: 8,
        bombPercentage: 25,
      });
      const state = game.getGameState();

      // 25% of 64 cells = 16 bombs, so 48 safe cells
      assert.strictEqual(state.totalSafeCells, 48);
      assert.strictEqual(state.revealedCells, 0);
    });
  });

  describe("Cell Revelation", () => {
    test("should reveal a safe cell", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });

      // Find a safe cell
      const state = game.getGameState();
      let safeRow = -1,
        safeCol = -1;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (!state.grid[row][col].isBomb) {
            safeRow = row;
            safeCol = col;
            break;
          }
        }
        if (safeRow !== -1) break;
      }

      const initialRevealed = game.getGameState().revealedCells;
      const result = game.revealCell({ row: safeRow, col: safeCol });
      assert.strictEqual(result, true);

      const newState = game.getGameState();
      assert.strictEqual(
        newState.grid[safeRow][safeCol].state,
        CellState.REVEALED,
      );
      // Should have revealed at least 1 cell (could be more due to flood fill)
      assert(newState.revealedCells > initialRevealed);
    });

    test("should end game when revealing a bomb", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 50,
      });

      // Find a bomb cell
      const state = game.getGameState();
      let bombRow = -1,
        bombCol = -1;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (state.grid[row][col].isBomb) {
            bombRow = row;
            bombCol = col;
            break;
          }
        }
        if (bombRow !== -1) break;
      }

      const result = game.revealCell({ row: bombRow, col: bombCol });
      assert.strictEqual(result, true);

      const newState = game.getGameState();
      assert.strictEqual(newState.status, GameStatus.LOST);
    });

    test("should not reveal already revealed cell", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });

      // Find a safe cell and reveal it
      const state = game.getGameState();
      let safeRow = -1,
        safeCol = -1;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (!state.grid[row][col].isBomb) {
            safeRow = row;
            safeCol = col;
            break;
          }
        }
        if (safeRow !== -1) break;
      }

      // First reveal should work
      assert.strictEqual(game.revealCell({ row: safeRow, col: safeCol }), true);

      // Second reveal should fail
      assert.strictEqual(
        game.revealCell({ row: safeRow, col: safeCol }),
        false,
      );
    });

    test("should not reveal flagged cell", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });

      // Flag a cell first
      assert.strictEqual(game.toggleFlag({ row: 0, col: 0 }), true);

      // Try to reveal flagged cell should fail
      assert.strictEqual(game.revealCell({ row: 0, col: 0 }), false);

      const state = game.getGameState();
      assert.strictEqual(state.grid[0][0].state, CellState.FLAGGED);
    });

    test("should return false for out of bounds coordinates", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });

      assert.strictEqual(game.revealCell({ row: -1, col: 0 }), false);
      assert.strictEqual(game.revealCell({ row: 0, col: -1 }), false);
      assert.strictEqual(game.revealCell({ row: 5, col: 0 }), false);
      assert.strictEqual(game.revealCell({ row: 0, col: 5 }), false);
    });
  });

  describe("Flag Functionality", () => {
    test("should flag a hidden cell", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });

      const result = game.toggleFlag({ row: 2, col: 2 });
      assert.strictEqual(result, true);

      const state = game.getGameState();
      assert.strictEqual(state.grid[2][2].state, CellState.FLAGGED);
    });

    test("should unflag a flagged cell", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });

      // Flag the cell
      assert.strictEqual(game.toggleFlag({ row: 2, col: 2 }), true);
      let state = game.getGameState();
      assert.strictEqual(state.grid[2][2].state, CellState.FLAGGED);

      // Unflag the cell
      assert.strictEqual(game.toggleFlag({ row: 2, col: 2 }), true);
      state = game.getGameState();
      assert.strictEqual(state.grid[2][2].state, CellState.HIDDEN);
    });

    test("should not flag a revealed cell", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });

      // Find and reveal a safe cell
      const state = game.getGameState();
      let safeRow = -1,
        safeCol = -1;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (!state.grid[row][col].isBomb) {
            safeRow = row;
            safeCol = col;
            break;
          }
        }
        if (safeRow !== -1) break;
      }

      // Reveal the cell first
      assert.strictEqual(game.revealCell({ row: safeRow, col: safeCol }), true);

      // Try to flag revealed cell should fail
      assert.strictEqual(
        game.toggleFlag({ row: safeRow, col: safeCol }),
        false,
      );
    });

    test("should return false for out of bounds flag attempts", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 10,
      });

      assert.strictEqual(game.toggleFlag({ row: -1, col: 0 }), false);
      assert.strictEqual(game.toggleFlag({ row: 0, col: -1 }), false);
      assert.strictEqual(game.toggleFlag({ row: 5, col: 0 }), false);
      assert.strictEqual(game.toggleFlag({ row: 0, col: 5 }), false);
    });
  });

  describe("Adjacent Bomb Counting", () => {
    test("should correctly count adjacent bombs", () => {
      // Create a game and verify adjacent bomb counts are reasonable
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 20,
      });
      const state = game.getGameState();

      // Verify that all cells have valid adjacent bomb counts (0-8)
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const cell = state.grid[row][col];
          assert(
            cell.adjacentBombs >= 0 && cell.adjacentBombs <= 8,
            `Cell at (${row}, ${col}) should have 0-8 adjacent bombs, got ${cell.adjacentBombs}`,
          );

          // Bomb cells should have adjacentBombs = 0 (they don't count themselves)
          if (cell.isBomb) {
            assert.strictEqual(
              cell.adjacentBombs,
              0,
              `Bomb cells should have adjacentBombs = 0`,
            );
          }
        }
      }

      // Test that corner cells have at most 3 neighbors
      const corners = [
        { row: 0, col: 0 }, // top-left
        { row: 0, col: 4 }, // top-right
        { row: 4, col: 0 }, // bottom-left
        { row: 4, col: 4 }, // bottom-right
      ];

      corners.forEach((corner) => {
        const cell = state.grid[corner.row][corner.col];
        if (!cell.isBomb) {
          assert(
            cell.adjacentBombs <= 3,
            `Corner cell at (${corner.row}, ${corner.col}) should have at most 3 adjacent bombs`,
          );
        }
      });
    });
  });

  describe("Flood Fill (Auto-reveal)", () => {
    test("should auto-reveal adjacent empty cells", () => {
      // Create a larger game to test flood fill
      const game = new MinesweeperGame({
        width: 10,
        height: 10,
        bombPercentage: 5,
      });

      // Find a cell with 0 adjacent bombs (likely to trigger flood fill)
      const state = game.getGameState();
      let emptyRow = -1,
        emptyCol = -1;

      for (let row = 1; row < 9; row++) {
        for (let col = 1; col < 9; col++) {
          if (
            !state.grid[row][col].isBomb &&
            state.grid[row][col].adjacentBombs === 0
          ) {
            emptyRow = row;
            emptyCol = col;
            break;
          }
        }
        if (emptyRow !== -1) break;
      }

      if (emptyRow !== -1) {
        const initialRevealed = game.getGameState().revealedCells;
        game.revealCell({ row: emptyRow, col: emptyCol });
        const finalRevealed = game.getGameState().revealedCells;

        // Should have revealed more than just one cell
        assert(
          finalRevealed > initialRevealed + 1,
          "Flood fill should reveal multiple cells",
        );
      }
    });
  });

  describe("Win Condition", () => {
    test("should win when all safe cells are revealed", () => {
      // Create a small game with predictable bomb placement
      const game = new MinesweeperGame({
        width: 3,
        height: 3,
        bombPercentage: 11.11,
      }); // 1 bomb
      const state = game.getGameState();

      // Find the bomb and reveal all other cells
      let bombRow = -1,
        bombCol = -1;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (state.grid[row][col].isBomb) {
            bombRow = row;
            bombCol = col;
            break;
          }
        }
        if (bombRow !== -1) break;
      }

      // Reveal all non-bomb cells
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (row !== bombRow || col !== bombCol) {
            game.revealCell({ row, col });
          }
        }
      }

      const finalState = game.getGameState();
      assert.strictEqual(finalState.status, GameStatus.WON);
    });
  });

  describe("Game State Management", () => {
    test("should not allow moves after game ends", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 50,
      });

      // Find and reveal a bomb to end the game
      const state = game.getGameState();
      let bombRow = -1,
        bombCol = -1;

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (state.grid[row][col].isBomb) {
            bombRow = row;
            bombCol = col;
            break;
          }
        }
        if (bombRow !== -1) break;
      }

      // End the game
      game.revealCell({ row: bombRow, col: bombCol });
      assert.strictEqual(game.getGameState().status, GameStatus.LOST);

      // Try to make moves after game ended
      assert.strictEqual(game.revealCell({ row: 0, col: 0 }), false);
      assert.strictEqual(game.toggleFlag({ row: 0, col: 0 }), false);
    });

    test("should provide consistent game state", () => {
      const game = new MinesweeperGame({
        width: 8,
        height: 6,
        bombPercentage: 20,
      });
      const state1 = game.getGameState();
      const state2 = game.getGameState();

      // States should be independent objects but with same data
      assert.notStrictEqual(state1, state2);
      assert.strictEqual(state1.status, state2.status);
      assert.strictEqual(state1.revealedCells, state2.revealedCells);
      assert.strictEqual(state1.totalSafeCells, state2.totalSafeCells);
    });
  });

  describe("Edge Cases", () => {
    test("should handle minimum game size", () => {
      const game = new MinesweeperGame({
        width: 3,
        height: 3,
        bombPercentage: 11.11,
      });
      const config = game.getConfig();
      const state = game.getGameState();

      assert.strictEqual(config.width, 3);
      assert.strictEqual(config.height, 3);
      assert.strictEqual(state.grid.length, 3);
      assert.strictEqual(state.grid[0].length, 3);
    });

    test("should handle high bomb percentage", () => {
      const game = new MinesweeperGame({
        width: 5,
        height: 5,
        bombPercentage: 40,
      });
      const state = game.getGameState();

      let bombCount = 0;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (state.grid[row][col].isBomb) {
            bombCount++;
          }
        }
      }

      // 40% of 25 cells = 10 bombs
      assert.strictEqual(bombCount, 10);
      assert.strictEqual(state.totalSafeCells, 15);
    });

    test("should handle corner cell reveals", () => {
      // Test each corner with a fresh game to avoid game state conflicts
      const corners = [
        { row: 0, col: 0 }, // top-left
        { row: 0, col: 4 }, // top-right
        { row: 4, col: 0 }, // bottom-left
        { row: 4, col: 4 }, // bottom-right
      ];

      corners.forEach((corner) => {
        const game = new MinesweeperGame({
          width: 5,
          height: 5,
          bombPercentage: 10,
        });

        const state = game.getGameState();
        const result = game.revealCell(corner);

        // Should always return true for valid positions (whether bomb or safe)
        assert.strictEqual(
          result,
          true,
          `Corner ${corner.row},${corner.col} should be revealable`,
        );

        // Verify the cell state changed appropriately
        const newState = game.getGameState();
        assert.strictEqual(
          newState.grid[corner.row][corner.col].state,
          CellState.REVEALED,
          `Corner ${corner.row},${corner.col} should be revealed after clicking`,
        );
      });
    });
  });

  describe("Configuration Validation", () => {
    test("should return correct configuration", () => {
      const config = { width: 12, height: 8, bombPercentage: 25.5 };
      const game = new MinesweeperGame(config);
      const returnedConfig = game.getConfig();

      assert.strictEqual(returnedConfig.width, 12);
      assert.strictEqual(returnedConfig.height, 8);
      assert.strictEqual(returnedConfig.bombPercentage, 25.5);

      // Should be independent objects
      assert.notStrictEqual(config, returnedConfig);
    });
  });
});
