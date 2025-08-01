# Sketch the requirements for the game

Requirements:
Grid of arbitrary dimension: Dimension X Dimension
Percent of Grid to be a bomb

Two ways to populate the bombs:
1. Have first click protected, so generate bombs after first click
2. Generate the bombs before the first click

This game is going to be done through the terminal so user will have to
specify squares via text  e.g. A1

When a player selects a square, the game needs to first see if the square has a bomb.
If it does, reveal the map and end the game.
If it does not, then see how many bombs surround it
If no bomb surround it, then mark the square as blank, and traverse to each node that surrounds it (including diagonals)
