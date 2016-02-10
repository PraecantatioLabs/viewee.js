(function (root, factory) {
	if(typeof define === "function" && define.amd) {
		define(function(){
			return factory();
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.ViewEECanvasRenderer = factory();
	}
}(this, function () {

// ---------------
// --- DRAWING ---
// ---------------

function CanvasRenderer (board) {
	var canvas = board.canvas,
		ctx    = canvas.getContext('2d');

	this.canvas = canvas;
	this.board  = board;

	this.warnings = [];
}

CanvasRenderer.prototype = Object.create (ViewEERenderer.prototype);

CanvasRenderer.prototype.getScope = function (ctx, attrs) {
	// canvas have no usable rendering context, like svg grouping
	return ctx;
}

CanvasRenderer.prototype.draw = function() {}

CanvasRenderer.prototype.redraw = function () {
	var canvas = this.canvas,
		ctx    = canvas.getContext('2d');

	var board = this.board;

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

	var layerOrder = board.boardFlipped ? board.reverseRenderLayerOrder : board.renderLayerOrder;
	for (var layerKey in layerOrder) {
		var layerId = layerOrder[layerKey];
		if (!board.visibleLayers[layerId]) { continue };
		board.layerRenderFunctions[layerId](this, board, ctx);
	}

	ctx.restore();
}

CanvasRenderer.prototype.drawSingleWire = function (wire, ctx) {
	ctx.beginPath();
	this.drawWire (wire, ctx);
	ctx.lineWidth = wire.width;
	ctx.strokeStyle = wire.strokeStyle;
	ctx.stroke();
}

CanvasRenderer.prototype.drawWire = function (wire, ctx) {

	ctx.save();

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

	if (wire.curve) {

		var rotate = (wire.rot ? parseFloat(wire.rot.substr (wire.rot.indexOf ("R") + 1)) : 0)/180*Math.PI;

		var radiusX, radiusY;
		radiusX = radiusY = wire.radius;
		if (wire.radius.constructor === Array) {
			radiusX = wire.radius[0];
			radiusY = wire.radius[1];
		}

		ctx.translate(wire.x, wire.y);
		// ctx.rotate(rotation);
		ctx.scale(radiusX, radiusY);
		ctx.arc(0, 0, 1, rotate + wire.start, rotate + wire.start + wire.angle); //, antiClockwise

	} else {
		ctx.moveTo(wire.x1, wire.y1);
		ctx.lineTo(wire.x2, wire.y2);
	}

	ctx.restore();

}

CanvasRenderer.prototype.drawHole = function (hole, ctx) {

	var board = this.board;

	// TODO: use following answer to draw shapes with holes:
	// http://stackoverflow.com/questions/6271419/how-to-fill-the-opposite-shape-on-canvas
	// TODO: make sure calculations is correct

	// TODO: hole.shape !!!

	if (hole.shape && hole.shape !== "circle") {
		if (!this.warnings["pad_shape_" + hole.shape]) {
			this.warnings["pad_shape_" + hole.shape] = true;
			console.warn ("pad shape '%s' is not supported yet", hole.shape);
		}
	}

	ctx.lineCap = 'round';
	ctx.strokeStyle = hole.strokeStyle;

	ctx.beginPath();
	ctx.arc(hole.x, hole.y, hole.drill/2 + hole.strokeWidth/2, 0, 2 * Math.PI, false);
	ctx.lineWidth = hole.strokeWidth;
	ctx.stroke();
}


CanvasRenderer.prototype.drawFilledPoly = function (poly, ctx) {
	ctx.beginPath();
	ctx.lineWidth = poly.strokeWidth;

	poly.points.forEach (function (point, idx) {
		if (idx === 0)
			ctx.moveTo(point.x, point.y);
		else
			ctx.lineTo(point.x, point.y);
	}, this);

	ctx.lineJoin  = "round";

	ctx.closePath();
	ctx.strokeStyle = poly.strokeStyle;
	if (poly.strokeStyle) ctx.stroke();
	ctx.fillStyle = poly.fillStyle;
	ctx.fill();

}

CanvasRenderer.prototype.drawFilledCircle = function (circle, ctx) {

	ctx.fillStyle = circle.fillStyle;
	ctx.lineJoin  = "round";
	ctx.lineWidth = circle.radius;
	ctx.beginPath();

	ctx.arc (circle.x, circle.y, circle.radius, 0, Math.PI*2, false);
	ctx.closePath();

	ctx.fill();

}

ViewEERenderer.prototype.drawText = function (attrs, text, ctx) {
	var x = attrs.x || text.x,
		y = attrs.y || text.y,
		rot = attrs.rot || text.rot || "R0",
		size = text.size,
		flipText = attrs.flipText !== undefined ? attrs.flipText : text.flipText;

	var board = this.board;

	var content = attrs.content || text.content;
	var color   = attrs.color;

	var textAngle = board.angleForRot (rot);

	//rotation from 90.1 to 270 causes Eagle to draw labels 180 degrees rotated with top right anchor point
	var degrees  = textAngle.degrees,
		textRot  = board.matrixForRot(rot),
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


CanvasRenderer.prototype.dimCanvas = function(ctx, alpha) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = 'rgba(0,0,0,'+alpha+')'
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.restore();
};

	return CanvasRenderer;

}));
