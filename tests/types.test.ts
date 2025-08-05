import { test, describe } from "node:test";
import assert from "node:assert";
import {
  GameConfig,
  Position,
  CellState,
  GameStatus,
  GameState,
  Cell,
} from "../src/types";

describe("Types and Enums", () => {
  describe("CellState Enum", () => {
    test("should have correct enum values", () => {
      assert.strictEqual(CellState.HIDDEN, "HIDDEN");
      assert.strictEqual(CellState.REVEALED, "REVEALED");
      assert.strictEqual(CellState.FLAGGED, "FLAGGED");
    });

    test("should have all expected enum members", () => {
      const expectedValues = ["HIDDEN", "REVEALED", "FLAGGED"];
      const actualValues = Object.values(CellState);

      assert.strictEqual(actualValues.length, expectedValues.length);
      expectedValues.forEach((value) => {
        assert(
          actualValues.includes(value as CellState),
          `CellState should include ${value}`,
        );
      });
    });
  });

  describe("GameStatus Enum", () => {
    test("should have correct enum values", () => {
      assert.strictEqual(GameStatus.PLAYING, "PLAYING");
      assert.strictEqual(GameStatus.QUIT, "QUIT");
      assert.strictEqual(GameStatus.WON, "WON");
      assert.strictEqual(GameStatus.LOST, "LOST");
    });

    test("should have all expected enum members", () => {
      const expectedValues = ["PLAYING", "QUIT", "WON", "LOST"];
      const actualValues = Object.values(GameStatus);

      assert.strictEqual(actualValues.length, expectedValues.length);
      expectedValues.forEach((value) => {
        assert(
          actualValues.includes(value as GameStatus),
          `GameStatus should include ${value}`,
        );
      });
    });
  });

  describe("GameConfig Interface", () => {
    test("should accept valid game configuration", () => {
      const config: GameConfig = {
        width: 10,
        height: 10,
        bombPercentage: 15,
      };

      assert.strictEqual(typeof config.width, "number");
      assert.strictEqual(typeof config.height, "number");
      assert.strictEqual(typeof config.bombPercentage, "number");
    });

    test("should work with different valid configurations", () => {
      const configs: GameConfig[] = [
        { width: 3, height: 3, bombPercentage: 5 },
        { width: 50, height: 50, bombPercentage: 40 },
        { width: 16, height: 9, bombPercentage: 15.5 },
        { width: 30, height: 16, bombPercentage: 20.25 },
      ];

      configs.forEach((config, index) => {
        assert.strictEqual(
          typeof config.width,
          "number",
          `Config ${index} width should be number`,
        );
        assert.strictEqual(
          typeof config.height,
          "number",
          `Config ${index} height should be number`,
        );
        assert.strictEqual(
          typeof config.bombPercentage,
          "number",
          `Config ${index} bombPercentage should be number`,
        );
        assert(config.width > 0, `Config ${index} width should be positive`);
        assert(config.height > 0, `Config ${index} height should be positive`);
        assert(
          config.bombPercentage >= 0,
          `Config ${index} bombPercentage should be non-negative`,
        );
      });
    });
  });

  describe("Position Interface", () => {
    test("should accept valid positions", () => {
      const positions: Position[] = [
        { row: 0, col: 0 },
        { row: 5, col: 10 },
        { row: 49, col: 49 },
      ];

      positions.forEach((pos, index) => {
        assert.strictEqual(
          typeof pos.row,
          "number",
          `Position ${index} row should be number`,
        );
        assert.strictEqual(
          typeof pos.col,
          "number",
          `Position ${index} col should be number`,
        );
        assert(
          Number.isInteger(pos.row),
          `Position ${index} row should be integer`,
        );
        assert(
          Number.isInteger(pos.col),
          `Position ${index} col should be integer`,
        );
      });
    });

    test("should work with boundary positions", () => {
      const boundaryPositions: Position[] = [
        { row: 0, col: 0 }, // top-left
        { row: 0, col: 49 }, // top-right
        { row: 49, col: 0 }, // bottom-left
        { row: 49, col: 49 }, // bottom-right
      ];

      boundaryPositions.forEach((pos) => {
        assert(pos.row >= 0, "Row should be non-negative");
        assert(pos.col >= 0, "Col should be non-negative");
      });
    });
  });

  describe("Cell Interface", () => {
    test("should create valid cell objects", () => {
      const cells: Cell[] = [
        {
          isBomb: false,
          adjacentBombs: 0,
          state: CellState.HIDDEN,
        },
        {
          isBomb: true,
          adjacentBombs: 0,
          state: CellState.FLAGGED,
        },
        {
          isBomb: false,
          adjacentBombs: 3,
          state: CellState.REVEALED,
        },
      ];

      cells.forEach((cell, index) => {
        assert.strictEqual(
          typeof cell.isBomb,
          "boolean",
          `Cell ${index} isBomb should be boolean`,
        );
        assert.strictEqual(
          typeof cell.adjacentBombs,
          "number",
          `Cell ${index} adjacentBombs should be number`,
        );
        assert(
          Number.isInteger(cell.adjacentBombs),
          `Cell ${index} adjacentBombs should be integer`,
        );
        assert(
          cell.adjacentBombs >= 0,
          `Cell ${index} adjacentBombs should be non-negative`,
        );
        assert(
          cell.adjacentBombs <= 8,
          `Cell ${index} adjacentBombs should be <= 8`,
        );
        assert(
          Object.values(CellState).includes(cell.state),
          `Cell ${index} should have valid state`,
        );
      });
    });

    test("should handle all possible adjacent bomb counts", () => {
      for (let i = 0; i <= 8; i++) {
        const cell: Cell = {
          isBomb: false,
          adjacentBombs: i,
          state: CellState.HIDDEN,
        };

        assert.strictEqual(cell.adjacentBombs, i);
        assert(cell.adjacentBombs >= 0 && cell.adjacentBombs <= 8);
      }
    });

    test("should handle all cell states", () => {
      Object.values(CellState).forEach((state) => {
        const cell: Cell = {
          isBomb: false,
          adjacentBombs: 2,
          state: state,
        };

        assert.strictEqual(cell.state, state);
      });
    });
  });

  describe("GameState Interface", () => {
    test("should create valid game state objects", () => {
      const gameState: GameState = {
        grid: [
          [
            { isBomb: false, adjacentBombs: 1, state: CellState.HIDDEN },
            { isBomb: true, adjacentBombs: 0, state: CellState.FLAGGED },
          ],
          [
            { isBomb: false, adjacentBombs: 2, state: CellState.REVEALED },
            { isBomb: false, adjacentBombs: 1, state: CellState.HIDDEN },
          ],
        ],
        status: GameStatus.PLAYING,
        revealedCells: 1,
        totalSafeCells: 3,
      };

      assert(Array.isArray(gameState.grid), "Grid should be an array");
      assert(gameState.grid.length > 0, "Grid should not be empty");
      assert(Array.isArray(gameState.grid[0]), "Grid rows should be arrays");
      assert(
        Object.values(GameStatus).includes(gameState.status),
        "Status should be valid",
      );
      assert.strictEqual(
        typeof gameState.revealedCells,
        "number",
        "revealedCells should be number",
      );
      assert.strictEqual(
        typeof gameState.totalSafeCells,
        "number",
        "totalSafeCells should be number",
      );
      assert(
        gameState.revealedCells >= 0,
        "revealedCells should be non-negative",
      );
      assert(
        gameState.totalSafeCells >= 0,
        "totalSafeCells should be non-negative",
      );
    });

    test("should validate grid structure", () => {
      const createGrid = (height: number, width: number): Cell[][] => {
        const grid: Cell[][] = [];
        for (let row = 0; row < height; row++) {
          grid[row] = [];
          for (let col = 0; col < width; col++) {
            grid[row][col] = {
              isBomb: false,
              adjacentBombs: 0,
              state: CellState.HIDDEN,
            };
          }
        }
        return grid;
      };

      const testCases = [
        { height: 3, width: 3 },
        { height: 10, width: 8 },
        { height: 16, width: 30 },
        { height: 1, width: 50 },
      ];

      testCases.forEach(({ height, width }) => {
        const grid = createGrid(height, width);
        const gameState: GameState = {
          grid,
          status: GameStatus.PLAYING,
          revealedCells: 0,
          totalSafeCells: height * width,
        };

        assert.strictEqual(
          gameState.grid.length,
          height,
          `Grid should have ${height} rows`,
        );
        gameState.grid.forEach((row, rowIndex) => {
          assert.strictEqual(
            row.length,
            width,
            `Row ${rowIndex} should have ${width} columns`,
          );
        });
      });
    });

    test("should handle all game statuses", () => {
      Object.values(GameStatus).forEach((status) => {
        const gameState: GameState = {
          grid: [
            [{ isBomb: false, adjacentBombs: 0, state: CellState.HIDDEN }],
          ],
          status: status,
          revealedCells: 0,
          totalSafeCells: 1,
        };

        assert.strictEqual(gameState.status, status);
      });
    });

    test("should validate cell counts are consistent", () => {
      const grid: Cell[][] = [
        [
          { isBomb: false, adjacentBombs: 1, state: CellState.REVEALED },
          { isBomb: true, adjacentBombs: 0, state: CellState.HIDDEN },
          { isBomb: false, adjacentBombs: 1, state: CellState.REVEALED },
        ],
        [
          { isBomb: false, adjacentBombs: 2, state: CellState.FLAGGED },
          { isBomb: true, adjacentBombs: 0, state: CellState.HIDDEN },
          { isBomb: false, adjacentBombs: 2, state: CellState.HIDDEN },
        ],
      ];

      // Count revealed cells
      let revealedCount = 0;
      let bombCount = 0;
      let totalCells = 0;

      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          totalCells++;
          if (grid[row][col].state === CellState.REVEALED) {
            revealedCount++;
          }
          if (grid[row][col].isBomb) {
            bombCount++;
          }
        }
      }

      const gameState: GameState = {
        grid,
        status: GameStatus.PLAYING,
        revealedCells: revealedCount,
        totalSafeCells: totalCells - bombCount,
      };

      assert.strictEqual(
        gameState.revealedCells,
        revealedCount,
        "Revealed cell count should match",
      );
      assert.strictEqual(
        gameState.totalSafeCells,
        totalCells - bombCount,
        "Safe cell count should match",
      );
    });
  });

  describe("Type Compatibility", () => {
    test("should work with realistic game scenarios", () => {
      // Simulate a typical game configuration
      const config: GameConfig = {
        width: 16,
        height: 16,
        bombPercentage: 15.625,
      }; // 40 bombs

      // Validate config
      assert(
        config.width * config.height > 0,
        "Grid should have positive area",
      );
      assert(
        config.bombPercentage > 0 && config.bombPercentage < 100,
        "Bomb percentage should be reasonable",
      );

      // Simulate position validation
      const validPositions: Position[] = [
        { row: 0, col: 0 },
        { row: config.height - 1, col: config.width - 1 },
        {
          row: Math.floor(config.height / 2),
          col: Math.floor(config.width / 2),
        },
      ];

      validPositions.forEach((pos) => {
        assert(
          pos.row >= 0 && pos.row < config.height,
          "Row should be in bounds",
        );
        assert(
          pos.col >= 0 && pos.col < config.width,
          "Col should be in bounds",
        );
      });

      // Simulate cell states throughout game lifecycle
      const cellStates = [
        CellState.HIDDEN,
        CellState.FLAGGED,
        CellState.REVEALED,
      ];
      cellStates.forEach((state) => {
        const cell: Cell = {
          isBomb: Math.random() < 0.5,
          adjacentBombs: Math.floor(Math.random() * 9),
          state: state,
        };

        assert(
          Object.values(CellState).includes(cell.state),
          "Cell state should be valid",
        );
      });

      // Simulate game status transitions
      const statusTransitions: GameStatus[] = [
        GameStatus.PLAYING,
        GameStatus.QUIT,
        GameStatus.WON,
        GameStatus.LOST,
      ];

      statusTransitions.forEach((status) => {
        assert(
          Object.values(GameStatus).includes(status),
          "Game status should be valid",
        );
      });
    });
  });
});
