(function (root, factory) {
	if(typeof define === "function" && define.amd) {
		define(function(){
			return factory();
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.EagleCanvas = factory();
	}
}(this, function () {

var p = function(o){ console.log(o) }

// -------------------
// --- CONSTRUCTOR ---
// -------------------

// parser just fill out board/scheme obect
// board/scheme object can load data and check what parser is applicable,
// also contains board data and can draw using renderer

function EagleCanvas (targetSelector) {
	if (targetSelector instanceof HTMLCanvasElement) {
		this.canvas = targetSelector;
	} else if (targetSelector instanceof SVGElement) {
		this.svg = targetSelector;
	} else if (targetSelector.constructor && targetSelector.constructor === String) {
		var target = document.querySelector (targetSelector);
		return EagleCanvas (target);
	} else {
		console.error ('Cannot instantiate board for ', targetSelector);
		return;
	}

	this.visibleLayers = {};
	this.visibleLayers[EagleCanvas.LayerId.BOTTOM_COPPER]        = true;
	this.visibleLayers[EagleCanvas.LayerId.BOTTOM_SILKSCREEN]    = true;
	this.visibleLayers[EagleCanvas.LayerId.BOTTOM_DOCUMENTATION] = true;
	this.visibleLayers[EagleCanvas.LayerId.DIM_BOARD]            = true;
	this.visibleLayers[EagleCanvas.LayerId.TOP_COPPER]           = true;
	this.visibleLayers[EagleCanvas.LayerId.TOP_SILKSCREEN]       = true;
	this.visibleLayers[EagleCanvas.LayerId.TOP_DOCUMENTATION]    = true;
	this.visibleLayers[EagleCanvas.LayerId.VIAS]                 = true;
	this.visibleLayers[EagleCanvas.LayerId.OUTLINE]              = true;

	this.renderLayerOrder = [];
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_DOCUMENTATION);
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_SILKSCREEN);
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_COPPER);
	this.renderLayerOrder.push(EagleCanvas.LayerId.DIM_BOARD);
	this.renderLayerOrder.push(EagleCanvas.LayerId.OUTLINE);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_COPPER);
	this.renderLayerOrder.push(EagleCanvas.LayerId.VIAS);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_SILKSCREEN);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_DOCUMENTATION);

	this.reverseRenderLayerOrder = [];
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_DOCUMENTATION);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_SILKSCREEN);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_COPPER);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.DIM_BOARD);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.OUTLINE);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_COPPER);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.VIAS);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_SILKSCREEN);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_DOCUMENTATION);

	this.layerRenderFunctions = {};

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function (renderer, board, ctx) {
		renderer.drawSignalWires(board.eagleLayersByName['Bottom'],ctx);
		renderer.drawElements(board.eagleLayersByName['Bottom'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['Bottom'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_SILKSCREEN] = function(renderer, board, ctx) {
		renderer.drawElements(board.eagleLayersByName['bNames'],ctx);
		renderer.drawElements(board.eagleLayersByName['bValues'],ctx);
		renderer.drawElements(board.eagleLayersByName['bPlace'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['bNames'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['bValues'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['bPlace'],ctx);
		renderer.drawPlainWires(board.eagleLayersByName['bNames'],ctx);
		renderer.drawPlainWires(board.eagleLayersByName['bValues'],ctx);
		renderer.drawPlainWires(board.eagleLayersByName['bPlace'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_DOCUMENTATION] = function(renderer, board, ctx) {
		renderer.drawElements(board.eagleLayersByName['bKeepout'],ctx);
		renderer.drawElements(board.eagleLayersByName['bDocu'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['bKeepout'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['bDocu'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_COPPER] = function(renderer, board, ctx) {
		renderer.drawSignalWires(board.eagleLayersByName['Top'],ctx);
		renderer.drawElements   (board.eagleLayersByName['Top'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['Top'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_SILKSCREEN] = function(renderer, board, ctx) {
		renderer.drawElements(board.eagleLayersByName['tNames'],ctx);
		renderer.drawElements(board.eagleLayersByName['tValues'],ctx);
		renderer.drawElements(board.eagleLayersByName['tPlace'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['tNames'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['tValues'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['tPlace'],ctx);
		renderer.drawPlainWires(board.eagleLayersByName['tNames'],ctx);
		renderer.drawPlainWires(board.eagleLayersByName['tValues'],ctx);
		renderer.drawPlainWires(board.eagleLayersByName['tPlace'],ctx);


	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_DOCUMENTATION] = function(renderer, board, ctx) {
		renderer.drawElements(board.eagleLayersByName['tKeepout'],ctx);
		renderer.drawElements(board.eagleLayersByName['tDocu'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['tKeepout'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['tDocu'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.DIM_BOARD] = function(renderer, board, ctx) {
		renderer.dimCanvas(ctx,board.dimBoardAlpha);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.VIAS] = function(renderer, board, ctx) {
		renderer.drawSignalVias('1-16',ctx, board.viaPadColor());
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.OUTLINE] = function(renderer, board, ctx) {
		renderer.drawPlainWires(board.eagleLayersByName['Dimension'],ctx);
		renderer.drawPlainHoles(board.eagleLayersByName['Dimension'],ctx);
	}

	this.hitTestFunctions = {};

	this.hitTestFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function(x,y) {
		return this.hitTestElements (this.eagleLayersByName['Bottom'],x,y)
			|| this.hitTestSignals  (this.eagleLayersByName['Bottom'],x,y);
	}.bind (this);

	this.hitTestFunctions[EagleCanvas.LayerId.TOP_COPPER] = function(x,y) {
		return this.hitTestElements (this.eagleLayersByName['Top'],x,y)
			|| this.hitTestSignals  (this.eagleLayersByName['Top'],x,y);
	}.bind (this);


}

// -----------------------
// --- ENUMS, DEFAULTS ---
// -----------------------

EagleCanvas.LayerId = {
	'BOTTOM_COPPER' : 1,
	'BOTTOM_SILKSCREEN' : 2,
	'BOTTOM_DOCUMENTATION' : 3,
	'DIM_BOARD' : 4,
	'TOP_COPPER' : 5,
	'TOP_SILKSCREEN' : 6,
	'TOP_DOCUMENTATION' : 7,
	'VIAS' : 8,
	'OUTLINE' : 9
}

EagleCanvas.LARGE_NUMBER = 99999;

EagleCanvas.warnings = {};

EagleCanvas.prototype.scale = 1;
EagleCanvas.prototype.minScale = 0.1;
EagleCanvas.prototype.maxScale = 10;
EagleCanvas.prototype.minLineWidth = 0.05;
EagleCanvas.prototype.boardFlipped = false;
EagleCanvas.prototype.dimBoardAlpha = 0.7;

// -------------------------
// --- GENERIC ACCESSORS ---
// -------------------------

/** sets an element id to which the drawing should be initially scaled */
EagleCanvas.prototype.setScaleToFit = function(elementSelector) {
	this.scaleToFitSelector = elementSelector;
}

EagleCanvas.prototype.getScale = function(scale) {
	return this.scale;
}

/** sets the scale factor, triggers resizing and redrawing */
EagleCanvas.prototype.setScale = function (scale, noResize) {
	// console.log (scale, this.scale, this.baseScale);

	this.scale = scale // * (this.scale || 1);

	if ('svg' in this) {
		// TODO: svg scaling
		this.svg.style.width  = scale * this.baseScale * this.nativeSize[0] + "px";
		this.svg.style.height = scale * this.baseScale * this.nativeSize[1] + "px";

	} else if ('canvas' in this) {

	var canvas = this.canvas;
	var context = canvas.getContext('2d'),
		devicePixelRatio = window.devicePixelRatio || 1,
		backingStoreRatio =
			context.webkitBackingStorePixelRatio ||
			context.mozBackingStorePixelRatio ||
			context.msBackingStorePixelRatio ||
			context.oBackingStorePixelRatio ||
			context.backingStorePixelRatio || 1,
		ratio = devicePixelRatio / backingStoreRatio;

	if (!noResize) {
		canvas.width  = scale * this.baseScale * this.nativeSize[0] * ratio;
		canvas.height = scale * this.baseScale * this.nativeSize[1] * ratio;

		canvas.style.width  = scale * this.baseScale * this.nativeSize[0] + "px";
		canvas.style.height = scale * this.baseScale * this.nativeSize[1] + "px";
	}

	this.canvasWidth  = scale * this.baseScale * this.nativeSize[0] * ratio;
	this.canvasHeight = scale * this.baseScale * this.nativeSize[0] * ratio;

	this.ratio = ratio;

	}
	this.draw();
}


/** Returns whether a given layer is visible or not */
EagleCanvas.prototype.isLayerVisible = function (layerId) {
	return this.visibleLayers[layerId] ? true : false;
}

/** Turns a layer on or off */
EagleCanvas.prototype.setLayerVisible = function (layerId, on) {
	if (this.isLayerVisible(layerId) == on) { return; }
	this.visibleLayers[layerId] = on ? true : false;
	this.draw();
}

/** Returns whether the board is flipped (bottom at fromt) or not */
EagleCanvas.prototype.isBoardFlipped = function () {
	return this.boardFlipped;
}

/** Turns top or bottom to the front */
EagleCanvas.prototype.setBoardFlipped = function (flipped) {
	if (this.boardFlipped == flipped) { return; }
	this.boardFlipped = flipped ? true : false;
	this.draw();
}

EagleCanvas.prototype.setHighlightedItem = function(item) {
	this.highlightedItem = item;
	this.draw();
}

EagleCanvas.prototype.draw = function () {
	if ('svg' in this) {
		var renderer = new ViewEESVGRenderer (this);
		renderer.draw ();
	} else if ('canvas' in this) {
		var renderer = new ViewEECanvasRenderer (this);
		renderer.draw ();
	}
}

// ---------------
// --- PARSERS ---
// ---------------

EagleCanvas.parsers = [
];

if ("EagleXMLParser" in window) {
	EagleCanvas.parsers.push (window.EagleXMLParser);
}

if ("KicadNewParser" in window) {
	EagleCanvas.parsers.push (window.KicadNewParser);
}

if ("AltiumParser" in window) {
	EagleCanvas.parsers.push (window.AltiumParser);
}


EagleCanvas.prototype.loadText = function (text) {
	this.text = text;

	EagleCanvas.parsers.some (function (parser) {
		if (!parser) return;

		if (parser.supports (text)) {
			console.log (parser.name, "can parse this file");
			var parser = new parser (this);
			parser.parse (text);
			return true;
		}
	}, this)

	this.nativeBounds = this.calculateBounds();
	this.nativeSize   = [this.nativeBounds[2]-this.nativeBounds[0],this.nativeBounds[3]-this.nativeBounds[1]];
	this.scaleToFit();
}


// ---------------
// --- LOADING ---
// ---------------

EagleCanvas.prototype.loadURL = function (url, cb) {
	this.url = url;
	var request = new XMLHttpRequest(),
		self = this;
	request.open('GET', this.url, true);
	request.onreadystatechange = function () {
		if (request.readyState == 4) {
			self.loadText(request.responseText);
			cb && cb(self);
		}
	};
	request.send(null);
};



// -------------------
// --- HIT TESTING ---
// -------------------

EagleCanvas.prototype.hitTest = function(x,y) {
	var canvas = this.canvas;
	//Translate screen to model coordinates
	var rx = x / (this.scale * this.baseScale);
	var ry = (this.coordYFlip ? y : canvas.height / this.ratio - y) / (this.scale * this.baseScale);
	ry += this.nativeBounds[1];
	rx = this.boardFlipped ? (this.nativeBounds[2]-rx) : (rx+this.nativeBounds[0]);

	var layerOrder = (this.boardFlipped) ? this.reverseRenderLayerOrder : this.renderLayerOrder;
	for (var i = layerOrder.length-1; i >= 0; i--) {
		var layerId = layerOrder[i];
		if (!this.visibleLayers[layerId]) { continue; }
		var hitTestFunc = this.hitTestFunctions[layerId];
		if (!hitTestFunc) { continue; }
		var hit = hitTestFunc (rx, ry);
		if (hit) { return hit; }
	}
	return null;
}

EagleCanvas.prototype.hitTestElements = function(layer, x, y) {
	if (!layer) { return; }

	for (var elemKey in this.elements) {
		var elem = this.elements[elemKey],
			pkg = typeof elem.pkg === "string" ? this.packagesByName[elem.pkg] : elem.pkg;

		var rotMat = elem.matrix;

		var bbox = pkg.bbox;
		if (bbox) {
			var layerNum = this.eagleLayersByName['Top'].number;
			if (elem.mirror) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;
			var x1 = elem.x + rotMat[0]*bbox[0] + rotMat[1]*bbox[1],	//top left
				y1 = elem.y + rotMat[2]*bbox[0] + rotMat[3]*bbox[1],
				x2 = elem.x + rotMat[0]*bbox[2] + rotMat[1]*bbox[1],	//top right
				y2 = elem.y + rotMat[2]*bbox[2] + rotMat[3]*bbox[1],
				x3 = elem.x + rotMat[0]*bbox[2] + rotMat[1]*bbox[3],	//bottom right
				y3 = elem.y + rotMat[2]*bbox[2] + rotMat[3]*bbox[3],
				x4 = elem.x + rotMat[0]*bbox[0] + rotMat[1]*bbox[3],	//bottom left
				y4 = elem.y + rotMat[2]*bbox[0] + rotMat[3]*bbox[3];
			if (this.pointInRect(x,y,x1,y1,x2,y2,x3,y3,x4,y4)) {
				return {'type':'element','name':elem.name, description: pkg.description};
			}
		}

		for (var smdIdx in pkg.smds) {
			if (!pkg.smds.hasOwnProperty(smdIdx)) continue;
			var smd = pkg.smds[smdIdx];
			var layerNum = smd.layer;
			if (elem.mirror) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;
			var x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1,	//top left
				y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1,
				x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y1,	//top right
				y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y1,
				x3 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2,	//bottom right
				y3 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2,
				x4 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y2,	//bottom left
				y4 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y2;
			if (this.pointInRect(x,y,x1,y1,x2,y2,x3,y3,x4,y4)) {
				var padName = smd.name;
				if (padName) {
					var signalName = elem.padSignals[padName];
					if (signalName) { return {'type':'signal','name':signalName}; }
				}
				return {'type':'element','name':elem.name};
			}
		}
	}
	return null;
}

EagleCanvas.prototype.hitTestSignals = function(layer, x, y) {
	for (var signalName in this.signalItems) {
		var signalLayers = this.signalItems[signalName];
		if (!signalLayers) { continue; }
		var layerItems = signalLayers[layer.number];
		if (!layerItems) { continue; }
		var layerWires = layerItems['wires'];
		if (!layerWires) { continue; }
		for (var wireIdx in layerWires) {
			if (!layerWires.hasOwnProperty(wireIdx)) continue;
			var wire = layerWires[wireIdx],
				x1 = wire.x1,
				y1 = wire.y1,
				x2 = wire.x2,
				y2 = wire.y2,
				width = wire.width;
			if (this.pointInLine(x,y,x1,y1,x2,y2,width)) {
				return {'type':'signal','name':signalName};
			}
		}
	}
	return null;
}

EagleCanvas.prototype.pointInLine = function(x, y, x1, y1, x2, y2, width) {
	var width2 = width * width;

	if (((x-x1)*(x-x1)+(y-y1)*(y-y1)) < width2) { return true; }	//end 1
	if (((x-x2)*(x-x2)+(y-y2)*(y-y2)) < width2) { return true; }	//end 2

	var length2 = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
	if (length2 <= 0) { return false; }

	var s = ((y - y1) * (y2-y1) - (x - x1) * (x1-x2)) / length2;				// s = param of line p1..p2 (0..1)
	if ((s >= 0) && (s <= 1)) {													//between p1 and p2
		var px = x1 + s * (x2-x1),
			py = y1 + s * (y2-y1);
		if (((x-px)*(x-px)+(y-py)*(y-py)) < width2) {
			return true;	//end 2
		}
	}
	return false;
}

EagleCanvas.prototype.pointInRect = function(x, y, x1, y1, x2, y2, x3, y3, x4, y4) {
	//p1..p4 in clockwise or counterclockwise order
	//Do four half-area tests
	return (((x-x1)*(x2-x1)+(y-y1)*(y2-y1)) >= 0)
		&& (((x-x1)*(x4-x1)+(y-y1)*(y4-y1)) >= 0)
		&& (((x-x3)*(x2-x3)+(y-y3)*(y2-y3)) >= 0)
		&& (((x-x3)*(x4-x3)+(y-y3)*(y4-y3)) >= 0);
}


// --------------------
// --- COMMON UTILS ---
// --------------------

EagleCanvas.prototype.calcBBox = function (wires) {
	var bbox = [
		EagleCanvas.LARGE_NUMBER,
		EagleCanvas.LARGE_NUMBER,
		-EagleCanvas.LARGE_NUMBER,
		-EagleCanvas.LARGE_NUMBER
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


EagleCanvas.prototype.colorPalette = [
	[127,127,127],
	[ 35, 35,141],
	[ 35,141, 35],
	[ 35,141,141],
	[141, 35, 35],
	[141, 35,141],
	[141,141, 35],
	[141,141,141],
	[ 39, 39, 39],
	[  0,  0,180],
	[  0,180,  0],
	[  0,180,180],
	[180,  0,  0],
	[180,  0,180],
	[180,180,  0],
	[ 63, 63, 63],
	//[  0,  0,  0]
];

EagleCanvas.prototype.layerColor = function(colorIdx) {
	var rgb = this.colorPalette[colorIdx];
	if (!rgb) {
		console.warn ("color %s not defined, using default color", colorIdx, this.colorPalette[0]);
		rgb = this.colorPalette[colorIdx] = this.colorPalette[0];
	}
	return 'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
}

EagleCanvas.prototype.highlightColor = function(colorIdx) {
	var rgb = this.colorPalette[colorIdx];
	if (!rgb) {
		console.warn ("color %s not defined, using default color", colorIdx, this.colorPalette[0]);
		rgb = this.colorPalette[colorIdx] = this.colorPalette[0];
	}
	return 'rgb('+(rgb[0]+50)+','+(rgb[1]+50)+','+(rgb[2]+50)+')';
}

EagleCanvas.prototype.viaPadColor = function () {
	return "#0b0";
}

EagleCanvas.prototype.angleForRot = function (rot) {
	var spin    = (rot.indexOf('S') >= 0), // TODO: spin rotate
		flipped = (rot.indexOf('M') >= 0),
		degrees = parseFloat (rot.split ('R')[1]);
	return {spin: spin, flipped: flipped, degrees: degrees};
}

EagleCanvas.prototype.matrixForRot = function(rot) {
	var angle = this.angleForRot (rot);
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

EagleCanvas.prototype.mirrorLayer = function(layerIdx) {
	if (layerIdx == 1) {
		return 16;
	} else if (layerIdx == 16) {
		return 1;
	}
	var name   = this.layersByNumber[layerIdx].name,
		prefix = name.substring(0,1);
	if (prefix == 't') {
		var mirrorName  = 'b' + name.substring(1),
			mirrorLayer = this.eagleLayersByName[mirrorName];
		if (mirrorLayer) {
			return mirrorLayer.number;
		}
	} else if (prefix == 'b') {
		var mirrorName = 't' + name.substring(1),
			mirrorLayer = this.eagleLayersByName[mirrorName];
		if (mirrorLayer) {
			return mirrorLayer.number;
		}
	}
	return layerIdx;
}

EagleCanvas.prototype.calculateBounds = function() {
	var minX = EagleCanvas.LARGE_NUMBER,
		minY = EagleCanvas.LARGE_NUMBER,
		maxX = -EagleCanvas.LARGE_NUMBER,
		maxY = -EagleCanvas.LARGE_NUMBER;
	//Plain elements
	for (var layerKey in this.plainWires) {
		var lines = this.plainWires[layerKey];
		for (var lineKey in lines) {
			var line = lines[lineKey],
				x1 = line.x1,
				x2 = line.x2,
				y1 = line.y1,
				y2 = line.y2,
				width = line.width;
			if (x1-width < minX) { minX = x1-width; } if (x1+width > maxX) { maxX = x1+width; }
			if (x2-width < minX) { minX = x2-width; } if (x2+width > maxX) { maxX = x2+width; }
			if (y1-width < minY) { minY = y1-width; } if (y1+width > maxY) { maxY = y1+width; }
			if (y2-width < minY) { minY = y2-width; } if (y2+width > maxY) { maxY = y2+width; }
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
			if (x1 < minX) { minX = x1; } if (x1 > maxX) { maxX = x1; }
			if (x2 < minX) { minX = x2; } if (x2 > maxX) { maxX = x2; }
			if (y1 < minY) { minY = y1; } if (y1 > maxY) { maxY = y1; }
			if (y2 < minY) { minY = y2; } if (y2 > maxY) { maxY = y2; }
		}
		for (var wireIdx in pkg.wires) {
			var wire = pkg.wires[wireIdx],
				x1 = elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1,
				y1 = elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1,
				x2 = elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2,
				y2 = elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2,
				width = wire.width;
			if (x1-width < minX) { minX = x1-width; } if (x1+width > maxX) { maxX = x1+width; }
			if (x2-width < minX) { minX = x2-width; } if (x2+width > maxX) { maxX = x2+width; }
			if (y1-width < minY) { minY = y1-width; } if (y1+width > maxY) { maxY = y1+width; }
			if (y2-width < minY) { minY = y2-width; } if (y2+width > maxY) { maxY = y2+width; }
			if (x1 < minX) { minX = x1; } if (x1 > maxX) { maxX = x1; }
			if (x2 < minX) { minX = x2; } if (x2 > maxX) { maxX = x2; }
			if (y1 < minY) { minY = y1; } if (y1 > maxY) { maxY = y1; }
			if (y2 < minY) { minY = y2; } if (y2 > maxY) { maxY = y2; }
		}
	}
	return [minX, minY, maxX, maxY];
}

EagleCanvas.prototype.scaleToFit = function(a) {
	// if (!this.scaleToFitSelector) { return; }
	var fitElement = this.scaleToFitSelector ? document.querySelector (this.scaleToFitSelector) : this.canvas;
	if (!fitElement) { return; }
	var fitWidth  = fitElement.offsetWidth,
		fitHeight = fitElement.offsetHeight,
		scaleX    = fitWidth / this.nativeSize[0],
		scaleY    = fitHeight / this.nativeSize[1],
		scale     = Math.min(scaleX, scaleY);
	scale *= 0.9;
	this.baseScale = scale;
	this.minScale = scale / 10;
	this.maxScale = scale * 10;
	this.setScale (1);
}

	return EagleCanvas;

}));
