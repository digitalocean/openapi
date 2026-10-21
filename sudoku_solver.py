"""
=============================================================================
Program  : Sudoku Solver (Backtracking Algorithm)
Author   : Suravi Sehgal (GitHub: @suravisehgal)
Email    : suravisehgal@gmail.com
License  : MIT
Date     : 2026-10-20
Purpose  : Hacktoberfest 2026 Contribution to souravjain540/Basic-Python-Programs
=============================================================================
Description:
A standalone Python program that solves any valid 9x9 Sudoku puzzle using the 
backtracking algorithm. Displays the grid with a clean ASCII visualizer.

How Sudoku Works:
- The board consists of a 9x9 grid (81 cells in total).
- The board is divided into nine 3x3 subgrids (boxes).
- Each row, column, and 3x3 box must contain digits 1 through 9 without repetition.
- Empty cells are represented by the number 0.

How Backtracking Works:
Backtracking is like exploring a maze with trial-and-error:
1. Find an empty cell.
2. Try placing numbers 1 through 9 one by one.
3. Check if placing that number is valid according to Sudoku rules.
4. If valid, place the number and recursively try to solve the rest of the board.
5. If we reach a point where no number from 1 to 9 fits, we "backtrack"
   (reset the cell back to 0) and try the next alternative in the previous cell.
6. Once every cell is filled correctly, the puzzle is solved!
=============================================================================
"""

from typing import List, Optional, Tuple


def print_board(board: List[List[int]]) -> None:
    """
    Prints the 9x9 Sudoku board in the console with formatted boundaries.
    
    - Draws horizontal dashes every 3 rows.
    - Draws vertical bars '|' every 3 columns.
    - Converts empty cells (0) to '.' for a cleaner, readable view.
    """
    # Loop through each row (0 to 8)
    for i in range(len(board)):
        # Every 3 rows (after row 0), draw a horizontal line to separate 3x3 blocks
        if i % 3 == 0 and i != 0:
            print("- - - - - - - - - - - - -")

        # Loop through each column in the current row (0 to 8)
        for j in range(len(board[0])):
            # Every 3 columns (after col 0), draw a vertical separator '|'
            if j % 3 == 0 and j != 0:
                print(" | ", end="")

            # If the cell is 0, display a dot '.' for readability; otherwise show the number
            val = str(board[i][j]) if board[i][j] != 0 else "."

            # If we're at the last column in the row, print with a newline
            if j == 8:
                print(val)
            else:
                # Otherwise, print number with a space and stay on the same line
                print(f"{val} ", end="")


def find_empty(board: List[List[int]]) -> Optional[Tuple[int, int]]:
    """
    Finds the first empty cell on the board (marked by 0).
    
    Returns:
        (row, col) tuple if an empty cell is found, or None if the board is completely full.
    """
    # Scan each row from top (0) to bottom (8)
    for r in range(9):
        # Scan each column from left (0) to right (8)
        for c in range(9):
            # 0 represents an unassigned/empty cell
            if board[r][c] == 0:
                return r, c  # Return coordinates immediately when found
                
    # If no 0 was found anywhere, the board is full!
    return None


def is_valid(board: List[List[int]], num: int, pos: Tuple[int, int]) -> bool:
    """
    Checks whether placing 'num' at position 'pos' (row, col) is valid
    according to the 3 standard rules of Sudoku:
    
    1. Row Rule   : The number must not already exist in the same row.
    2. Column Rule: The number must not already exist in the same column.
    3. Box Rule   : The number must not already exist in its 3x3 subgrid.
    
    Returns:
        True if the placement is valid, False otherwise.
    """
    row, col = pos

    # -------------------------------------------------------------
    # 1. Check Row: Scan all 9 columns in the current row
    # -------------------------------------------------------------
    for j in range(9):
        # If the number exists in this row and is not the cell we are placing
        if board[row][j] == num and col != j:
            return False

    # -------------------------------------------------------------
    # 2. Check Column: Scan all 9 rows in the current column
    # -------------------------------------------------------------
    for i in range(9):
        # If the number exists in this column and is not the cell we are placing
        if board[i][col] == num and row != i:
            return False

    # -------------------------------------------------------------
    # 3. Check 3x3 Subgrid (Box)
    # -------------------------------------------------------------
    # We find the starting (top-left) index of the 3x3 block using integer division.
    # Examples:
    #   Row 0, 1, 2  // 3 = 0 -> 0 * 3 = 0 (top block)
    #   Row 3, 4, 5  // 3 = 1 -> 1 * 3 = 3 (middle block)
    #   Row 6, 7, 8  // 3 = 2 -> 2 * 3 = 6 (bottom block)
    box_row = (row // 3) * 3
    box_col = (col // 3) * 3

    # Iterate through the 3 rows and 3 columns of this specific 3x3 box
    for i in range(box_row, box_row + 3):
        for j in range(box_col, box_col + 3):
            # If the number is already present in this box
            if board[i][j] == num and (i, j) != pos:
                return False

    # If all three checks passed, placing 'num' here is currently valid!
    return True


def solve_sudoku(board: List[List[int]]) -> bool:
    """
    Solves the 9x9 Sudoku board in-place using the recursive Backtracking algorithm.
    
    Steps:
      1. Base Case: Find an empty cell. If none exists, board is solved!
      2. Try placing digits 1 through 9.
      3. If a digit is valid, place it tentatively.
      4. Recursively call solve_sudoku() to solve remaining cells.
      5. If that choice leads to a solution, return True.
      6. Backtrack: If it leads to a dead end, reset cell to 0 and try next digit.
      7. Return False if no digit 1-9 works (triggers backtracking in previous call).
    """
    # Step 1: Find next empty cell
    empty_cell = find_empty(board)
    if not empty_cell:
        # Base case: No empty cells left, puzzle is completely solved!
        return True

    row, col = empty_cell

    # Step 2: Try digits from 1 to 9
    for num in range(1, 10):
        # Step 3: Check if digit obeys Sudoku constraints
        if is_valid(board, num, (row, col)):
            # Tentatively place 'num' in this cell
            board[row][col] = num

            # Step 4: Recursively attempt to solve the rest of the board
            if solve_sudoku(board):
                return True

            # Step 6: BACKTRACKING STEP
            # If placing 'num' did not lead to a valid solution down the line,
            # reset the cell back to 0 (empty) and test the next number.
            board[row][col] = 0

    # Step 7: None of the numbers 1-9 worked for this cell -> dead end!
    return False


def get_sample_board() -> List[List[int]]:
    """
    Returns a classic 9x9 Sudoku puzzle matrix for testing.
    0 represents empty cells to be solved by the algorithm.
    """
    return [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ]


def main():
    """
    Command-Line Interface (CLI) for running the Sudoku Solver.
    Offers three options:
      1. Solve the benchmark puzzle with step-by-step display.
      2. Run automated verification tests using assertions.
      3. Enter and solve a custom user-provided 9x9 puzzle.
    """
    print("=" * 45)
    print("       SUDOKU SOLVER (BACKTRACKING CLI)       ")
    print("=" * 45)
    print("1. Solve benchmark puzzle")
    print("2. Run automated self-test verification")
    print("3. Enter custom 9x9 puzzle")
    
    choice = input("\nEnter choice (1/2/3): ").strip()

    # -------------------------------------------------------------
    # Option 1: Benchmark Puzzle
    # -------------------------------------------------------------
    if choice == '1':
        board = get_sample_board()
        print("\n--- Original Puzzle ---")
        print_board(board)

        print("\nSolving puzzle with backtracking algorithm...")
        if solve_sudoku(board):
            print("\n--- Solved Puzzle ---")
            print_board(board)
        else:
            print("\n[!] No valid solution exists for this board.")

    # -------------------------------------------------------------
    # Option 2: Automated Self-Test Verification
    # -------------------------------------------------------------
    elif choice == '2':
        board = get_sample_board()
        # Verify solver returns True (solution found)
        assert solve_sudoku(board) is True, "Solver verification failed!"
        # Verify no empty cells (0) remain
        assert find_empty(board) is None, "Incomplete solution board!"
        print("\n[✓] Self-test passed! All rows, cols, and 3x3 boxes verified.")

    # -------------------------------------------------------------
    # Option 3: Custom 9x9 Puzzle Input
    # -------------------------------------------------------------
    elif choice == '3':
        print("\nEnter 9 rows (use 0 for empty cells, separated by spaces):")
        print("Example row: 5 3 0 0 7 0 0 0 0")
        custom_board = []
        try:
            for i in range(9):
                # Read row numbers split by spaces
                row = list(map(int, input(f"Row {i+1}: ").strip().split()))
                if len(row) != 9:
                    raise ValueError("Each row must have exactly 9 digits.")
                custom_board.append(row)

            print("\n--- Your Puzzle ---")
            print_board(custom_board)

            # Solve the user-provided board
            if solve_sudoku(custom_board):
                print("\n--- Solution ---")
                print_board(custom_board)
            else:
                print("\n[!] No valid solution exists for this configuration.")
        except Exception as e:
            print(f"\n[Error]: {e}")

    else:
        print("Invalid choice. Exiting.")


if __name__ == "__main__":
    main()
