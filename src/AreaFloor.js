/**
 * Representation of a z-index floor of an area
 * 
 * NOTE: If you absolutely need to iterate over a floor in a tight (nested) loop you
 * should use the low/high properties like so.
 *
 * ```javascript
 * const floor = area.map.get(2);
 * for (let x = floor.lowX; x <= floor.highX; x++) {
 *  for (let y = floor.lowY; y <= floor.highY; y++) {
 *    const room = floor.getRoom(x, y);
 *
 *    if (!room) {
 *      continue;
 *    }
 *  }
 * }
 * ```
 *
 * Use `<=` to avoid fenceposting the loop
 *
 * @property {number} lowX The lowest x value
 * @property {number} highX The highest x value
 * @property {number} lowY The lowest y value
 * @property {number} highY The highest y value
 * @property {number} z This floor's z index
 */
class AreaFloor {
  constructor(z) {
    this.z = z;
    this.lowX = this.highX = this.lowY = this.highY = 0;
    this.map = [];
  }

  /**
   * Get room by coordinate
   * @param {integer} x x coordinate
   * @param {integer} y y coordinate
   * @param {Room} Room room
   * @return {Room|boolean} the newly-added room
   */
  addRoom(x, y, room) {
    // if no room provided
    if (!room) {
      throw new Error('Invalid room given to AreaFloor.addRoom');
    }

    // if a room already exists at those coordinates
    if (this.getRoom(x, y)) {
      throw new Error(`AreaFloor.addRoom: trying to add room at filled coordinates: ${x}, ${y}`);
    }

    // update the boundaries of the x-axis for this floor
    if (x < this.lowX) {
      this.lowX = x;
    } else if (x > this.highX) {
      this.highX = x;
    }

    // update the boundaries of the y-axis for this floor
    if (y < this.lowY) {
      this.lowY = y;
    } else if (y > this.highY) {
      this.highY = y;
    }

    // assign the x-coordinate Array to the map, if it doesn't already
    // exist, to hold the rooms along the y-axis
    if (!Array.isArray(this.map[x])) {
      this.map[x] = [];
    }

    // add the room to the map grid
    this.map[x][y] = room;
  }

  /**
   * Get room by coordinates
   * @param {integer} x x coordinate
   * @param {integer} y y coordinate
   * @return {Room|boolean}
   */
  getRoom(x, y) {
    return this.map[x] && this.map[x][y];
  }

  /**
   * Remove room at coordinates
   * @param {integer} x x coordinate
   * @param {integer} y y coordinate
   * @return {Room|boolean}
   */
  removeRoom(x, y) {
    // if the room doesn't exist
    if (!this.map[x] || !this.map[x][y]) {
      throw new Error('AreaFloor.removeRoom: trying to remove non-existent room');
    }

    // remove the room from the map grid
    this.map[x][y] = undefined;
  }
}

module.exports = AreaFloor;
