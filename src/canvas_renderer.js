import PCBRenderer from './renderer/base';

// import { createCanvas, loadImage } from 'canvas'; //canvas@2.x
import Canvas from 'canvas'; //canvas@1.6.x

import {angleForRot, matrixForRot} from './util';

// ---------------
// --- DRAWING ---
// ---------------

export default class CanvasRenderer extends PCBRenderer {

	constructor (board, canvas) {

	super();

	var bounds = board.calculateBounds (),
		width  = Math.abs(bounds[2] - bounds[0]) * board.scale * board.baseScale,
		height = Math.abs(bounds[3] - bounds[1]) * board.scale * board.baseScale;

	if (!canvas) {

		// console.log ('DOCUMENT', Object.keys (document));
		if (typeof window === 'undefined') {
			canvas = new Canvas (width, height); // canvas@1.6.x
			// canvas = createCanvas (width, height); // canvas@2.x

		} else {
			canvas = document.createElement ('canvas');
			canvas.width = width;
			canvas.height = height;
		}

	}

	var ctx    = canvas.getContext('2d');

	this.canvas = canvas;
	this.board  = board;

	this.warnings = [];
}

// CanvasRenderer.prototype = Object.create (PCBRenderer.prototype);

	getScope (ctx, attrs) {
	// canvas have no usable rendering context, like svg grouping
	return ctx;
}

	scaleCanvas () {
	var canvas = this.canvas,
		ctx    = canvas.getContext('2d'),
		board  = this.board;

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();

	ctx.transform(
		board.scale * board.baseScale * board.ratio * (board.boardFlipped ? -1.0 : 1.0),
		0,
		0,
		(board.coordYFlip ? 1 : -1) * board.scale  * board.baseScale * board.ratio,
		0,
		board.coordYFlip ? 0 : ctx.canvas.height
	);
	ctx.translate(
		(board.boardFlipped ? -board.nativeBounds[2] : -(board.nativeBounds[0])),
		-board.nativeBounds[1]
	);
}

	draw () {

	var canvas = this.canvas,
		ctx    = canvas.getContext('2d'),
		board  = this.board;

	// if (!this.cacheDrawingOperations)
	// 	return;

	this.scaleCanvas();

	this.drawLayers (ctx);

//	ctx.restore ();

	return;

	this._currentLayerDrawRoutines = [];
	this.layerDrawRoutines = {};

	var layerOrder = board.boardFlipped ? board.reverseRenderLayerOrder : board.renderLayerOrder;
	for (var layerKey in layerOrder) {
		var layerId = layerOrder[layerKey];

		// prerender every layer
		// if (!board.visibleLayers[layerId]) { continue };

		board.layerRenderFunctions[layerId](this, board, ctx);

		this.layerDrawRoutines[layerId] = this._currentLayerDrawRoutines;

		this._currentLayerDrawRoutines.forEach (function (routine) {
			var method = routine[0];
			this[method].apply (this, routine.slice(1).concat ([ctx]));
		}, this);

		this._currentLayerDrawRoutines = [];
	}

	ctx.restore ();
}

	redraw () {
	var canvas = this.canvas,
		ctx    = canvas.getContext('2d'),
		board  = this.board;


	this.scaleCanvas ();

	var layerOrder = board.boardFlipped ? board.reverseRenderLayerOrder : board.renderLayerOrder;
	if (this.layerDrawRoutines || !this.cacheDrawingOperations)
	for (var layerKey in layerOrder) {
		var layerId = layerOrder[layerKey];
		if (!board.visibleLayers[layerId]) { continue };

		if (this.cacheDrawingOperations) {
			this.layerDrawRoutines[layerId].forEach (function (routine) {
				var method = routine[0];
				this[method].apply (this, routine.slice(1).concat ([ctx]));
			}, this);
		} else {
			board.layerRenderFunctions[layerId](this, board, ctx);
		}
	}

	ctx.restore();
}

// primitives drawings is cached, actual drawing functions called on redraw

	drawSingleWire (wire, ctx) {
	ctx.save();
	ctx.beginPath();

	var lineDash;
	if (wire.style === "longdash") {
		lineDash = [3];
	} else if (wire.style === "shortdash") {
		lineDash = [1];
	} else if (wire.style === "dashdot") {
		lineDash = [3, 1, 1, 1];
	}

	if (wire.cap && wire.cap === "flat") {
		ctx.lineCap = "butt";
	} else {
		ctx.lineCap = "round";
	}

	if (lineDash) ctx.setLineDash (lineDash);

	this.drawWire (wire, ctx);

	ctx.lineWidth = wire.width;
	ctx.strokeStyle = wire.strokeStyle;
	ctx.stroke();
	ctx.restore();
}

drawWire (wire, ctx) {

	ctx.save();

	if (wire.curve) {

		var angle = angleForRot (wire.rot);

		var rotate = angle.degrees / 180 * Math.PI;

		var mirror = angle.flipped;

		var radiusX, radiusY;
		radiusX = radiusY = wire.radius;
		if (wire.radius.constructor === Array) {
			radiusX = wire.radius[0];
			radiusY = wire.radius[1];
		}

		ctx.translate(wire.x, wire.y);
		// ctx.rotate(rotation);
		ctx.scale(mirror ? -radiusX : radiusX, radiusY);
		ctx.arc(0, 0, 1, rotate + wire.start, rotate + wire.start + wire.angle); //, antiClockwise

		if (wire.filled) {
			ctx.fill();
		}

	} else {
		ctx.moveTo(wire.x1, wire.y1);
		ctx.lineTo(wire.x2, wire.y2);
	}

	ctx.restore();
}

drawHole (hole, ctx) {

	var board = this.board;

	// http://stackoverflow.com/questions/6271419/how-to-fill-the-opposite-shape-on-canvas
	hole.shape = hole.shape || 'circle';

	// TODO: get rid of strokeWidth
	var drillRadius = hole.drill/2;
	var shapeRadius = hole.diameter/2 || drillRadius + hole.strokeWidth/2;

	ctx.beginPath();

	var poly;
	if (hole.shape === 'square') {
		poly = {points: [
			{x: hole.x + shapeRadius, y: hole.y + shapeRadius},
			{x: hole.x - shapeRadius, y: hole.y + shapeRadius},
			{x: hole.x - shapeRadius, y: hole.y - shapeRadius},
			{x: hole.x + shapeRadius, y: hole.y - shapeRadius}
		]};

		ctx.fillStyle = hole.strokeStyle;
		this.drawRawPoly (poly, ctx);

	} else if (hole.shape === 'octagon') {
		// TODO: support rotation
		var mult = .4;
		poly = {points: [
			{x: hole.x + shapeRadius, y: hole.y + shapeRadius*mult},
			{x: hole.x + shapeRadius*mult, y: hole.y + shapeRadius},
			{x: hole.x - shapeRadius*mult, y: hole.y + shapeRadius},
			{x: hole.x - shapeRadius, y: hole.y + shapeRadius*mult},
			{x: hole.x - shapeRadius, y: hole.y - shapeRadius*mult},
			{x: hole.x - shapeRadius*mult, y: hole.y - shapeRadius},
			{x: hole.x + shapeRadius*mult, y: hole.y - shapeRadius},
			{x: hole.x + shapeRadius, y: hole.y - shapeRadius*mult}
		]};

		ctx.fillStyle = hole.strokeStyle;
		this.drawRawPoly (poly, ctx);

	} else {
		if (hole.shape !== 'circle') {

			if (!this.warnings["pad_shape_" + hole.shape]) {
				this.warnings["pad_shape_" + hole.shape] = true;
				console.warn ("pad shape '%s' is not supported yet", hole.shape);
			}
		}

		ctx.strokeStyle = hole.strokeStyle;
		var restring = (hole.diameter - hole.drill)/2 || hole.strokeWidth;
		ctx.lineWidth = restring;
		drillRadius = (hole.drill + restring)/2 || hole.drill/2 + hole.strokeWidth/2;

		//if (isNaN (restring))
		//	console.log (hole.diameter, hole.drill, hole.strokeWidth, drillRadius);
	}

	ctx.lineCap = 'round';

	ctx.arc(hole.x, hole.y, drillRadius, 2 * Math.PI, 0, true);

	if (poly) {
		ctx.fill();
	} else {
		ctx.stroke();
	}
}

drawRawPoly (poly, ctx) {

	ctx.lineJoin = 'round';
	ctx.lineCap  = 'round';

	poly.points.forEach (function (point, idx) {
		if (idx === 0)
			ctx.moveTo(point.x, point.y);
		else
			ctx.lineTo(point.x, point.y);
	}, this);

	ctx.closePath();
}

drawFilledPoly (poly, ctx) {
	ctx.beginPath();
	ctx.lineWidth = poly.strokeWidth;

	this.drawRawPoly (poly, ctx);

	ctx.strokeStyle = poly.strokeStyle;
	if (poly.strokeStyle) ctx.stroke();
	ctx.fillStyle = poly.fillStyle;
	ctx.fill();

}

drawFilledCircle (circle, ctx) {

	ctx.fillStyle = circle.fillStyle;
	ctx.lineJoin  = "round";
	ctx.lineWidth = circle.radius;
	ctx.beginPath();

	ctx.arc (circle.x, circle.y, circle.radius, 0, Math.PI*2, false);
	ctx.closePath();

	ctx.fill();

}

drawText (attrs, text, ctx) {
	var x = attrs.x || text.x,
		y = attrs.y || text.y,
		rot = attrs.rot || text.rot || "R0",
		size = text.size,
		flipText = attrs.flipText !== undefined ? attrs.flipText : text.flipText;

	var board = this.board;

	var content = attrs.content || text.content;
	var color   = attrs.color;

	var textAngle = angleForRot (rot);

	//rotation from 90.1 to 270 causes Eagle to draw labels 180 degrees rotated with top right anchor point
	var degrees  = textAngle.degrees,
		textRot  = matrixForRot(rot),
		fontSize = 10;

	var font = ''+fontSize+'pt vector';	//Use a regular font size - very small sizes seem to mess up spacing / kerning

	var strings = content.split (/\r?\n/);
	var stringOffset = (text.interlinear || 50) * fontSize / 100;

	if (0) { // enable to draw zero points for text
		ctx.save();
		ctx.translate(x,y);
		ctx.beginPath();
		ctx.arc(0, 0, 1, 0, 2 * Math.PI, false);
		ctx.fillStyle = board.viaPadColor();
		ctx.fill();
		ctx.restore();
	}

	var textCtx = this.getScope (ctx, {name: 'text'});

	ctx.save();
	ctx.fillStyle = color;
	ctx.font = font;
	ctx.translate(x,y);

	// TODO: move text rotation to the parser?
	ctx.transform (textRot[0],textRot[2],textRot[1],textRot[3],0,0);
	var textBlockHeight = (strings.length - 1) * (stringOffset + fontSize);
	var textBlockWidth = 0;
	strings.forEach (function (string, idx) {
		textBlockWidth = Math.max (textBlockWidth, ctx.measureText(string).width);
	}, this);
	var scale = size / fontSize;
	ctx.scale (scale * 1.35, (board.coordYFlip ? 1 : -1)*scale);
	var xOffset = 0;
	if (flipText) {
		var xMult = {center: 0, left: 1, right: 1};
		var yMult = {middle: 0, bottom: -1, top: 1};
		ctx.translate (
			xMult[text.align || "left"] * textBlockWidth,
			yMult[text.valign || "bottom"] * (textBlockHeight + fontSize)
		);
		if (!textAngle.spin) ctx.scale(-1,-1);
	}

	if (0) { // enable to draw zero points for text origin
		ctx.save();
		ctx.beginPath();
		ctx.arc(0, 0, 1, 0, 2 * Math.PI, false);
		ctx.fillStyle = "b00";
		ctx.fill();
		ctx.restore();
	}

	if (text.align)  ctx.textAlign = text.align;
	if (text.valign) ctx.textBaseline = text.valign;

	strings.forEach (function (string, idx) {
		var yOffset = idx * (stringOffset + fontSize);
		if (text.valign === "middle") {
			yOffset -= textBlockHeight/2;
		} else if (text.valign === "bottom") {
			yOffset -= textBlockHeight;
		}
		ctx.fillText(string, xOffset, yOffset);
	}, this);

	ctx.restore();
}


	dimCanvas (alpha, ctx) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = 'rgba(0,0,0,0.5)'
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.restore();
}

}

/*
	Object.keys (CanvasRenderer.prototype).forEach (function (method) {
		if (method.charAt (0) === '_' && CanvasRenderer.prototype.hasOwnProperty (method)) {
			CanvasRenderer.prototype[method.substring (1)] = function () {
				if (!this.cacheDrawingOperations) {
					this[method].apply (this, arguments);
					return;
				}
				var routine = [method].concat ([].slice.call (arguments).filter (function (arg) {return !(arg instanceof CanvasRenderingContext2D)}));
				// console.log (routine);
				this._currentLayerDrawRoutines.push (routine);
			};
		}
	});
*/
