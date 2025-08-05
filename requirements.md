# Requirements:

Grid of arbitrary dimension: Dimension X Dimension
Percent of Grid to be a bomb
Populate the bombs with this information

This game is going to be done through the terminal so user will have to
specify squares via text  e.g. A1

When a player selects a square, the game needs to first see if the square has a bomb.
If it does, reveal the map and end the game.
If it does not, then see how many bombs surround it
If no bomb surround it, then mark the square as blank, and traverse to each node that surrounds it (including diagonals)

ref: https://github.com/CameronCairns/MineSweeper/blob/master/attempt2/requirements.txt
