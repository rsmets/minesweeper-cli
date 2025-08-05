// Core game types and interfaces for Minesweeper CLI

export interface GameConfig {
  width: number;
  height: number;
  bombPercentage: number;
}

export interface Position {
  row: number;
  col: number;
}

export enum CellState {
  HIDDEN = 'HIDDEN',
  REVEALED = 'REVEALED',
  FLAGGED = 'FLAGGED'
}

export interface Cell {
  isBomb: boolean;
  adjacentBombs: number;
  state: CellState;
}

export enum GameStatus {
  PLAYING = "PLAYING",
  QUIT = "QUIT",
  WON = 'WON',
  LOST = 'LOST'
}

export interface GameState {
  grid: Cell[][];
  status: GameStatus;
  revealedCells: number;
  totalSafeCells: number;
}
