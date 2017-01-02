function angleForRot (rot) {
  if (!rot) return {degrees: 0};
  var spin    = (rot.indexOf('S') >= 0), // TODO: spin rotate
      flipped = (rot.indexOf('M') >= 0),
      degrees = parseFloat (rot.split ('R')[1]);
  return {spin: spin, flipped: flipped, degrees: degrees};
}

function matrixForRot (rot) {
  var angle        = angleForRot (rot);
  var spin         = angle.spin, // TODO: spin rotate
      flipped      = angle.flipped,
      degrees      = angle.degrees,
      rad          = degrees * Math.PI / 180.0,
      flipSign     = flipped ? -1 : 1,
      matrix       = [
        flipSign * Math.cos(rad),
        flipSign * -Math.sin(rad),
        Math.sin(rad),
        Math.cos(rad)
      ];
  return matrix;
}

var LARGE_NUMBER = 99999;

function calcBBox (wires) {
  var bbox = [
    LARGE_NUMBER,
    LARGE_NUMBER,
    -LARGE_NUMBER,
    -LARGE_NUMBER
  ];
  wires.forEach (function (wireDict) {
    if (wireDict.x1 < bbox[0]) { bbox[0] = wireDict.x1; }
    if (wireDict.x1 > bbox[2]) { bbox[2] = wireDict.x1; }
    if (wireDict.y1 < bbox[1]) { bbox[1] = wireDict.y1; }
    if (wireDict.y1 > bbox[3]) { bbox[3] = wireDict.y1; }
    if (wireDict.x2 < bbox[0]) { bbox[0] = wireDict.x2; }
    if (wireDict.x2 > bbox[2]) { bbox[2] = wireDict.x2; }
    if (wireDict.y2 < bbox[1]) { bbox[1] = wireDict.y2; }
    if (wireDict.y2 > bbox[3]) { bbox[3] = wireDict.y2; }
  });
  if ((bbox[0] >= bbox[2]) || (bbox[1] >= bbox[3])) {
    bbox = null;
  }

  return bbox;
}

function max() {
  var args = [].slice.call(arguments);
  return Math.max.apply(Math, args.filter(function(val) {
    return !isNaN(val);
  }));
}

function min() {
  var args = [].slice.call(arguments);
  return Math.min.apply(Math, args.filter(function(val) {
    return !isNaN(val);
  }));
}

module.exports = {
  angleForRot: angleForRot,
  matrixForRot: matrixForRot,
  calcBBox: calcBBox,
  min: min,
  max: max
}
