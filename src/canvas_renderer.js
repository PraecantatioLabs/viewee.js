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
