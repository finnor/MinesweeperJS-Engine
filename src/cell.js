/**
 * A cell in the board
 */
export default class Cell
{
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.value = 0;
    this.isVisible = false;
    this.isFlagged = false;
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  getValue() {
    // values greater than 10 are a mine, and returned as an X
    return ((this.value>=10) ? "X" : this.value);
  }

  setValue(value) {
    this.value = value;
  }

  getIsVisible() {
    return this.isVisible;
  }

  setIsVisible(isVisible) {
    this.isVisible = isVisible;
  }

  getIsFlagged() {
    return this.isFlagged;
  }

  setIsFlagged(isFlagged) {
    this.isFlagged = isFlagged;
  }

  /**
   * Increments the value of the cell
   */
  increment() {
    this.value++;
  }

  /**
   * Decrements the cell value if not a mine(>=10)
   */
  decrement() {
    if(this.value<10)
      this.value--;
  }

  /**
   * Switches the flag state on and off
   */
  toggleFlag() {
    this.isFlagged = !this.isFlagged;
  }

  /**
   * Is the space not visible and not flagged -> clickable
   */
  getIsClickable() {
    return !this.isFlagged && !this.isVisible;
  }
}
