import { GameConfig, GameState, CellState } from "./types";

/**
 * Render the current game board as a CLI-style ASCII string
 * Used for both API and web frontend output
 * @param config - Game configuration
 * @param state - Current game state
 * @returns string representation of the board
 */
export function renderBoardText(config: GameConfig, state: GameState): string {
  let out = "\n" + "=".repeat(config.width * 4 + 4) + "\n";

  // Print column headers
  out += "   ";
  for (let col = 0; col < config.width; col++) {
    const colLetter = String.fromCharCode("A".charCodeAt(0) + col);
    out += ` ${colLetter} `;
  }
  out += "\n";

  // Print each row
  for (let row = 0; row < config.height; row++) {
    out += `${row + 1}`.padStart(2, " ") + " ";
    for (let col = 0; col < config.width; col++) {
      const cell = state.grid[row][col];
      let symbol = "";
      if (cell.state === CellState.FLAGGED) {
        symbol = " F ";
      } else if (cell.state === CellState.HIDDEN) {
        symbol = " . ";
      } else if (cell.state === CellState.REVEALED) {
        if (cell.isBomb) {
          symbol = " * ";
        } else if (cell.adjacentBombs === 0) {
          symbol = "   ";
        } else {
          symbol = ` ${cell.adjacentBombs} `;
        }
      }
      out += symbol;
    }
    out += "\n";
  }
  out += "=".repeat(config.width * 4 + 4) + "\n";
  return out;
}
