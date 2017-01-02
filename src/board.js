var Util = require ('./util');

var ViewEEBoard = function () {

  this.angleForRot  = Util.angleForRot;
  this.matrixForRot = Util.matrixForRot;
  this.calcBBox     = Util.calcBBox;

}

var min = Util.min,
    max = Util.max;

var LARGE_NUMBER = 99999;

ViewEEBoard.prototype.calculateBounds = function() {
  var minX = LARGE_NUMBER,
      minY = LARGE_NUMBER,
      maxX = -LARGE_NUMBER,
      maxY = -LARGE_NUMBER;
  //Plain elements
  for (var layerKey in this.plainWires) {
    var lines = this.plainWires[layerKey];
    for (var lineKey in lines) {
      var line = lines[lineKey],
          x1 = line.x1,
          x2 = line.x2,
          y1 = line.y1,
          y2 = line.y2,
          width = line.width || this.minLineWidth;
      minX = min (minX, x1-width, x1+width, x2-width, x2+width);
      maxX = max (maxX, x1-width, x1+width, x2-width, x2+width);
      minY = min (minY, y1-width, y1+width, y2-width, y2+width);
      maxY = max (maxY, y1-width, y1+width, y2-width, y2+width);
    }
  }

  for (var netName in this.signalItems) {
    for (var layerKey in this.signalItems[netName]) {
      var lines = this.signalItems[netName][layerKey].wires;
      for (var lineKey in lines) {
        var line = lines[lineKey],
            x1 = line.x1,
            x2 = line.x2,
            y1 = line.y1,
            y2 = line.y2,
            width = line.width || this.minLineWidth;
        minX = min (minX, x1-width, x1+width, x2-width, x2+width);
        maxX = max (maxX, x1-width, x1+width, x2-width, x2+width);
        minY = min (minY, y1-width, y1+width, y2-width, y2+width);
        maxY = max (maxY, y1-width, y1+width, y2-width, y2+width);
      }
    }
  }

  //Elements
  for (var elemKey in this.elements) {
    var elem = this.elements[elemKey];
    var pkg = typeof elem.pkg === "string" ? this.packagesByName[elem.pkg] : elem.pkg;
    var rotMat = elem.matrix;
    for (var smdIdx in pkg.smds) {
      var smd = pkg.smds[smdIdx],
          x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1,
          y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1,
          x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2,
          y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2;
      minX = min (minX, x1, x2);
      maxX = max (maxX, x1, x2);
      minY = min (minY, y1, y2);
      maxY = max (maxY, y1, y2);
    }
    for (var wireIdx in pkg.wires) {
      var wire = pkg.wires[wireIdx],
          x1 = elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1,
          y1 = elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1,
          x2 = elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2,
          y2 = elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2,
          width = wire.width || this.minLineWidth;
      minX = min (minX, x1-width, x1+width, x2-width, x2+width);
      maxX = max (maxX, x1-width, x1+width, x2-width, x2+width);
      minY = min (minY, y1-width, y1+width, y2-width, y2+width);
      maxY = max (maxY, y1-width, y1+width, y2-width, y2+width);
    }
  }

  // console.log ("board size:", [minX, minY, maxX, maxY]);

  return [minX, minY, maxX, maxY];
}

module.exports = ViewEEBoard;
