import Cell from "./cell";

/**
 * The playing board
 */
export default class Game
{
  constructor(x, y, mines) {
    this.newGame(x, y, mines);
  }

  /**
   * Starts a new game
   * @param {Number} x
   * @param {Number} y
   * @param {Number} mines
   */
  newGame(x, y, mines) {
    this.board = new Array(y);
    for(let i=0; i<y; i++) {
      this.board[i] = new Array(x);
      for(let j=0; j<x; j++) {
        this.board[i][j] = new Cell(j, i);
      }
    }
    this.x = x;
    this.y = y;
    this.addMines(mines);
    this.mineCount = mines;
    this.started = false;
    this.over = false;
    this.squaresLeft = (x * y) - mines;
    this.moveCount = 0;
    this.edges = this.createEdgesBoard(x, y);
    this.lastXPlayed = -1;
    this.lastYPlayed = -1;
    this.time = null;
  }

  getCell(x, y) {
    return this.board[y][x];
  }

  getWidth() {
    return this.x;
  }

  getLength() {
    return this.y;
  }

  getLastPositionPlayed() {
    return { x: this.lastXPlayed, y: this.lastYPlayed };
  }

  getNeighborCount(x, y) {
    return this.edges[y][x];
  }

  getBoard() {
    return this.board;
  }

  /**
   * Adds mines to the board
   * @param {Number} mineNumber
   */
  addMines(mineNumber) {
    //Adds mines until enough have been added
    while (mineNumber>0) {
      let specX = Math.floor((Math.random() * this.x));
      let specY = Math.floor((Math.random() * this.y));
      if(this.board[specY][specX].getValue()!=="X") {
        mineNumber--;
        //A mine is indicated by a value >= 10
        this.board[specY][specX].setValue(10);
        this.getNeighbors(specX, specY).forEach(cell => {
          cell.increment();
        });
      }
    }
  }

  /**
   * Gets the neighbors of the cell at x, y
   * @param {Number} x
   * @param {Number} y
   */
  getNeighbors(x, y) {
    let neighbors = [];
    for(let i=Math.max(0, y-1); i<Math.min(y+2, this.y); i++) {
      for(let j=Math.max(0, x-1); j<Math.min(x+2, this.x); j++) {
        if(!(i===y && j===x)) {
          neighbors.push(this.board[i][j]);
        }
      }
    }

    return neighbors;
  }

  /**
   * Creates a matrix of not visible neighbor counts
   * @param {Number} x
   * @param {Number} y
   */
  createEdgesBoard(x, y) {
    let edges = new Array(this.y).fill(null).map(() => Array(this.x).fill(0));

    for (let i=0; i<y; i++) {
      for (let j=0; j<x; j++) {
        // counts the number of neighboring cells that are NOT visible
        edges[i][j] = this.getNeighbors(j, i)
          .reduce((sum, cell) => (sum + !cell.getIsVisible()), 0);
      }
    }

    return edges;
  }

  /**
   * Determines whether this is an edge or not
   * (does it border unclicked spaces and is visible)
   * @param {Number} x
   * @param {Number} y
   */
  isEdge(x, y) {
    return this.board[y][x].getIsVisible() && this.edges[y][x]>0;
  }

  /**
   * Updates the edges board after a cell is clicked
   * decrements neighbors edge value
   * @param {Number} x
   * @param {Number} y
   */
  updateEdges(x, y) {
    // updates neighbors and decrements edges if not a mine
    for(let i=Math.max(0, y-1); i<Math.min(y+2, this.y); i++) {
      for(let j=Math.max(0, x-1); j<Math.min(x+2, this.x); j++) {
        if(!(i===y && j===x) && this.board[i][j].getValue()!=="X") {
          this.edges[i][j]--;
        }
      }
    }
  }

  /**
   * Handles the case where the first button clicked is a mine
   * in which case the mine should be moved
   *
   * @param {Number} x The column clicked
   * @param {Number} y The row clicked
   */
  changeBoard(x, y) {
    //Move mine to another location
    let spotFound=false;

    //Try moving the mine until we find a spot without a mine
    while(!spotFound) {
      let specY = Math.floor((Math.random() * this.y));
      let specX = Math.floor((Math.random() * this.x));
      //If found a non mine spot
      if (this.board[specY][specX].getValue()!=="X") {
        spotFound = true;
        this.board[specY][specX].setValue(10);

        // increment values in neighboring cells on new spot
        this.getNeighbors(specX, specY).forEach(cell => {
          cell.increment();
        });

        // decrements value in cells neighboring old spot
        let oldNeighbors = this.getNeighbors(x, y);
        this.getNeighbors(x, y).forEach(cell => {
          cell.decrement();
        });

        // set value in old spot
        this.board[y][x].setValue(
          oldNeighbors.reduce((sum, cell) => sum + (cell.getValue()==="X"), 0)
        );
      }
    }
  }

  /**
   * Returns what cells would be clicked by right+left click
   *
   * @param {Number} x The column clicked
   * @param {Number} y The row clicked
   */
  getClickableNeighbors(x, y) {
    let cells = [];
    if(this.board[y][x].getIsVisible() && this.getNeighboringFlagCount(x, y)===this.board[y][x].getValue()) {
      cells = this.getNeighbors(x, y).filter(cell => cell.getIsClickable())
        .map(cell => ({x: cell.getX(), y: cell.getY()}));
    }

    return cells;
  }

  /**
   * Counts the number of flags in neighboring cells
   *
   * @param {Number} x The column clicked
   * @param {Number} y The row clicked
   */
  getNeighboringFlagCount(x, y) {
    return this.getNeighbors(x, y).reduce((sum, cell) => sum + cell.getIsFlagged(), 0);
  }

  /**
   * Clears all neighbors if the number of flags equals the spot clicked
   *
   * @param {Number} x The column clicked
   * @param {Number} y The row clicked
   */
  clearNeighbors(x, y) {
    this.lastXPlayed = x;
    this.lastYPlayed = y;

    const cells = this.getClickableNeighbors(x, y);
    let outcomes = [];
    cells.forEach(cell => {
      outcomes = outcomes.concat(this.click(cell.x, cell.y));
    });
    // sort outcomes to put game wins and losses at bottom
    outcomes.sort((a, b) => {
      if(a.state) {
        return -1;
      }
      if(b.state) {
        return 1;
      }
      return 0;

    });
    return outcomes;
  }

  /**
   * Toggles the flag on a cell
   * @param {Number} x
   * @param {Number} y
   */
  toggleFlag(x, y) {
    this.lastXPlayed = x;
    this.lastYPlayed = y;

    this.board[y][x].toggleFlag();
    return [{x: x, y: y, value: this.board[y][x].getIsFlagged()}];
  }

  /**
   * Directs response to actions based on value of clicked cell
   *
   * @param {Number} x The column clicked
   * @param {Number} y The row clicked
   */
  click(x, y) {
    let outcome = [];

    // if playable button
    if(this.board[y][x].getIsClickable()) {
      this.moveCount++;
      outcome = this.gameMechanics(x, y);
      this.lastXPlayed = x;
      this.lastYPlayed = y;
    }
    return outcome;
  }

  /**
   * Directs response to actions based on value of clicked cell
   *
   * @param {Number} x The column clicked
   * @param {Number} y The row clicked
   */
  gameMechanics(x, y) {
    let outcome = [];
    let value = this.board[y][x].getValue();
    this.board[y][x].setIsVisible(true);
    this.board[y][x].setIsFlagged(false);

    // if first move start timer
    if(this.moveCount===1) {
      this.startTimer();

      // if first move is a mine, then adjust board so that the mine is moved
      if(value==="X") {
        this.changeBoard(x, y);
        value = this.board[y][x].getValue();
      }
    }

    // if mine
    if(value==="X") {
      return this.gameOver(x, y);
      // else if empty
    } else if(value===0) {
      outcome = this.explode(x, y, []);
      // else numbered square
    } else {
      outcome.push({x: x, y: y, value: value});
      this.squaresLeft--;
      this.updateEdges(x, y);
    }

    // if last square, then game is over and won
    if (this.squaresLeft===0) {
      outcome = outcome.concat(this.gameWon(x, y));
    }

    return outcome;
  }

  /**
   * Recursively reveals all neighbors of zeros when one is clicked
   *
   * @param {Number} x The column clicked
   * @param {Number} y The row clicked
   * @param {array} outcome The cells that are revealed
   */
  explode(x, y, outcome) {
    this.board[y][x].setIsVisible(true);
    this.squaresLeft--;
    this.updateEdges(x, y);
    let value = this.board[y][x].getValue();
    outcome.push({x: x, y: y, value: value});

    if (value===0) {
      this.getNeighbors(x, y).forEach(cell => {
        if(!cell.getIsVisible())
          outcome = this.explode(cell.getX(), cell.getY(), outcome);
      });
    }
    return outcome;
  }

  /**
   * Reveals all, stops the timer, and announces the game loss
   * @param {Number} x The column clicked
   * @param {Number} y The row clicked
   */
  gameOver(x, y) {
    this.over=true;
    let outcome = [];
    for (let i=0; i<this.y; i++) {
      for (let j=0; j<this.x; j++) {
        if(!this.board[i][j].getIsVisible()) {
          outcome.push({x: j, y: i, value: this.board[i][j].getValue()});
        }
      }
    }
    outcome.push({x: x, y: y, state: "LOSE", time: this.stopTimer()});
    return outcome;
  }

  /**
   * Reveals all, stops the timer, and announces the game win
   */
  gameWon(x, y) {
    this.over=true;
    let outcome = [];
    for (let i=0; i<this.y; i++) {
      for (let j=0; j<this.x; j++) {
        if(!this.board[i][j].getIsVisible()) {
          outcome.push({x: j, y: i, value: this.board[i][j].getValue()});
        }
      }
    }
    outcome.push({x: x, y: y, state: "WIN", time: this.stopTimer()});
    return outcome;
  }

  /**
   * Starts the timer
   */
  startTimer() {
    this.started = true;
    this.time = new Date();
  }

  /**
   * Stops the timer
   */
  stopTimer() {
    return Math.floor((new Date() - this.time) / 1000);
  }

  /**
   * Creates a string representation of the board
   */
  toString() {
    let output = "---".repeat(this.x+2);
    for(let i=0; i<this.y; i++) {
      output+= "\n|  ";
      for(let j=0; j<this.x; j++) {
        let cell = "*";
        if(this.board[i][j].getIsVisible()) {
          cell = this.board[i][j].getValue();
        } else if (this.board[i][j].getIsFlagged()) {
          cell = "F";
        }
        output+= " " + cell + " ";
      }
      output+="  |";
    }
    output += "\n" + "---".repeat(this.x+2);
    return output;
  }
}
