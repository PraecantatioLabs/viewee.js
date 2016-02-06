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

function EagleCanvas(canvasSelector) {
	if (canvasSelector instanceof HTMLCanvasElement) {
		this.canvas = canvasSelector;
	} else {
		this.canvas = document.querySelector (canvasSelector);
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

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function(that,ctx) {
		that.drawSignalWires(that.eagleLayersByName['Bottom'],ctx);
		that.drawElements(that.eagleLayersByName['Bottom'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['Bottom'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_SILKSCREEN] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['bNames'],ctx);
		that.drawElements(that.eagleLayersByName['bValues'],ctx);
		that.drawElements(that.eagleLayersByName['bPlace'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['bNames'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['bValues'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['bPlace'],ctx);
		that.drawPlainWires(that.eagleLayersByName['bNames'],ctx);
		that.drawPlainWires(that.eagleLayersByName['bValues'],ctx);
		that.drawPlainWires(that.eagleLayersByName['bPlace'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_DOCUMENTATION] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['bKeepout'],ctx);
		that.drawElements(that.eagleLayersByName['bDocu'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['bKeepout'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['bDocu'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_COPPER] = function(that,ctx) {
		that.drawSignalWires(that.eagleLayersByName['Top'],ctx);
		that.drawElements   (that.eagleLayersByName['Top'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['Top'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_SILKSCREEN] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['tNames'],ctx);
		that.drawElements(that.eagleLayersByName['tValues'],ctx);
		that.drawElements(that.eagleLayersByName['tPlace'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['tNames'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['tValues'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['tPlace'],ctx);
		that.drawPlainWires(that.eagleLayersByName['tNames'],ctx);
		that.drawPlainWires(that.eagleLayersByName['tValues'],ctx);
		that.drawPlainWires(that.eagleLayersByName['tPlace'],ctx);


	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_DOCUMENTATION] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['tKeepout'],ctx);
		that.drawElements(that.eagleLayersByName['tDocu'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['tKeepout'],ctx);
		that.drawPlainTexts(that.eagleLayersByName['tDocu'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.DIM_BOARD] = function(that,ctx) {
		that.dimCanvas(ctx,that.dimBoardAlpha);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.VIAS] = function(that,ctx) {
		that.drawSignalVias('1-16',ctx, that.viaPadColor());
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.OUTLINE] = function(that,ctx) {
		that.drawPlainWires(that.eagleLayersByName['Dimension'],ctx);
		that.drawPlainHoles(that.eagleLayersByName['Dimension'],ctx);
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
	console.log (scale, this.scale, this.baseScale);
	this.scale = scale // * (this.scale || 1);
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

// ---------------
// --- PARSERS ---
// ---------------

EagleCanvas.EagleParser = function (board) {
	// TODO: move all parsing to the new class
	return board;
}

EagleCanvas.parsers = [
	// EagleCanvas.EagleParser
];

if ("KicadNewParser" in window) {
	EagleCanvas.parsers.push (window.KicadNewParser);
}

if ("EagleXMLParser" in window) {
	EagleCanvas.parsers.push (window.EagleXMLParser);
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


// ---------------
// --- DRAWING ---
// ---------------

EagleCanvas.prototype.draw = function() {
	var canvas = this.canvas,
		ctx    = canvas.getContext('2d');

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();

	ctx.transform(
		this.scale * this.baseScale * this.ratio * (this.boardFlipped ? -1.0 : 1.0),
		0,
		0,
		(this.coordYFlip ? 1 : -1) * this.scale  * this.baseScale * this.ratio,
		0,
		this.coordYFlip ? 0 : ctx.canvas.height
	);
	ctx.translate(
		(this.boardFlipped ? -this.nativeBounds[2] : -(this.nativeBounds[0])),
		-this.nativeBounds[1]
	);

	var layerOrder = this.boardFlipped ? this.reverseRenderLayerOrder : this.renderLayerOrder;
	for (var layerKey in layerOrder) {
		var layerId = layerOrder[layerKey];
		if (!this.visibleLayers[layerId]) { continue };
		this.layerRenderFunctions[layerId](this,ctx);
	}

	ctx.restore();
}

EagleCanvas.prototype.drawWire = function (wire, ctx) {

	var lineDash;
	if (wire.style === "longdash") {
		lineDash = [3];
	} else if (wire.style === "shortdash") {
		lineDash = [1];
	} else if (wire.style === "dashdot") {
		lineDash = [3, 1, 1, 1];
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
		ctx.save();
		ctx.translate(wire.x, wire.y);
		// ctx.rotate(rotation);
		ctx.scale(radiusX, radiusY);
		ctx.arc(0, 0, 1, rotate + wire.start, rotate + wire.start + wire.angle); //, antiClockwise
		ctx.restore();

	} else {
		ctx.moveTo(wire.x1, wire.y1);
		ctx.lineTo(wire.x2, wire.y2);
	}

}

EagleCanvas.prototype.drawPlainWires = function(layer, ctx) {
	if (!layer) { return; }

	ctx.lineCap = 'round';
	ctx.strokeStyle = this.layerColor(layer.color);

	var layerWires = this.plainWires[layer.number] || [];
	layerWires.forEach(function(wire){

		ctx.save();
		ctx.beginPath();
		this.drawWire (wire, ctx);
		ctx.lineWidth = wire.width;
		ctx.stroke();
		ctx.restore();
	}, this);
}

EagleCanvas.prototype.drawPlainHoles = function(layer, ctx) {
	if (!layer) { return; }

	ctx.lineCap = 'round';
	ctx.strokeStyle = this.layerColor (layer.color);

	var layerHoles = this.plainHoles || [];
	layerHoles.forEach(function(hole){
		ctx.beginPath();
		ctx.arc(hole.x, hole.y, hole.drill/2, 0, 2 * Math.PI, false);
		ctx.lineWidth = this.minLineWidth;
		ctx.stroke();
	}, this);
}


EagleCanvas.prototype.drawSignalWires = function(layer, ctx) {
	if (!layer) { return; }
	var layerNumber = layer.number;

	ctx.lineCap = 'round';

	for (var signalKey in this.signalItems) {

		var highlight = (this.highlightedItem && (this.highlightedItem.type=='signal') && (this.highlightedItem.name==signalKey));
		var color = highlight ? this.highlightColor(layer.color) : this.layerColor(layer.color);
		ctx.strokeStyle = color;


		var signalLayers = this.signalItems[signalKey],
			layerItems = signalLayers[layer.number];
		if (!layerItems) { continue; }
		var layerWires = layerItems['wires'] || [];
		layerWires.forEach(function(wire) {
			ctx.beginPath();
			this.drawWire (wire, ctx);
			ctx.lineWidth = wire.width;
			ctx.stroke();
		}, this)
	}
}

EagleCanvas.prototype.drawSignalVias = function(layersName, ctx, color) {
	if (!layersName) return;

	ctx.strokeStyle = color;

	for (var signalKey in this.signalItems) {
		var signalLayers = this.signalItems[signalKey],
			layerItems = signalLayers[layersName];
		if (!layerItems) {continue;}
		var layerVias = layerItems['vias'] || [];
		layerVias.forEach(function(via) {
			ctx.beginPath();
			// TODO: use following answer to draw shapes with holes:
			// http://stackoverflow.com/questions/6271419/how-to-fill-the-opposite-shape-on-canvas
			// TODO: make sure calculations is correct
			ctx.arc(via.x, via.y, 0.75 * via.drill, 0, 2 * Math.PI, false);
			ctx.lineWidth = 0.5 * via.drill;
			ctx.stroke();

			if (via.shape && via.shape !== "circle") {
				if (!EagleCanvas.warnings["via_shape_" + via.shape]) {
					EagleCanvas.warnings["via_shape_" + via.shape] = true;
					console.warn ("via shape '%s' is not supported yet", via.shape);
				}
			}

		})
	}
}

EagleCanvas.prototype.drawText = function (attrs, text, ctx) {
	var x = attrs.x || text.x,
		y = attrs.y || text.y,
		rot = attrs.rot || text.rot || "R0",
		size = text.size,
		flipText = attrs.flipText !== undefined ? attrs.flipText : text.flipText;

	var content = attrs.content || text.content;
	var color   = attrs.color;

	var textAngle = this.angleForRot (rot);

	//rotation from 90.1 to 270 causes Eagle to draw labels 180 degrees rotated with top right anchor point
	var degrees  = textAngle.degrees,
		textRot  = this.matrixForRot(rot),
		fontSize = 10;

	ctx.save();
	ctx.fillStyle = color;
	ctx.font = ''+fontSize+'pt vector';	//Use a regular font size - very small sizes seem to mess up spacing / kerning
	ctx.translate(x,y);

	var d = this.fontTestCpan = (this.fontTestCpan || document.createElement("span"));
	d.font = ctx.font;
	d.textContent = content;
	//if height is not calculated - we'll use the font's 10pt size and hope it fits
	var emHeight = d.offsetHeight || fontSize;

	var strings = content.split (/\r?\n/);
	var stringOffset = (text.interlinear || 50) * emHeight / 100;


	if (0) { // enable to draw zero points for text
		ctx.save();
		ctx.beginPath();
		ctx.arc(0, 0, 1, 0, 2 * Math.PI, false);
		ctx.fillStyle = this.viaPadColor();
		ctx.fill();
		ctx.restore();
	}

	ctx.transform (textRot[0],textRot[2],textRot[1],textRot[3],0,0);
	var textBlockHeight = (strings.length - 1) * (stringOffset + emHeight);
	var textBlockWidth = 0;
	strings.forEach (function (string, idx) {
		textBlockWidth = Math.max (textBlockWidth, ctx.measureText(string).width);
	}, this);
	var scale = size / fontSize;
	ctx.scale(scale,(this.coordYFlip ? 1 : -1)*scale);
	var xOffset = 0;
	if (flipText) {
		var xMult = {center: 0, left: 1, right: 1};
		var yMult = {middle: 0, bottom: -1, top: 1};
		ctx.translate (
			xMult[text.align || "left"] * textBlockWidth,
			yMult[text.valign || "bottom"] * (textBlockHeight + emHeight)
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
		var yOffset = idx * (stringOffset + emHeight);
		if (text.valign === "middle") {
			yOffset -= textBlockHeight/2;
		} else if (text.valign === "bottom") {
			yOffset -= textBlockHeight;
		}
		ctx.fillText(string, xOffset, yOffset);
	}, this);

	ctx.restore();
}

EagleCanvas.prototype.drawPlainTexts = function (layer, ctx) {

	if (!layer) return;

	var layerTexts = this.plainTexts[layer.number] || [];

	var color = this.layerColor(layer.color);

	layerTexts.forEach (function (text) {

		var content = text.content;

		var attrs = {
			color: color,
			content: content
		};

		this.drawText (attrs, text, ctx);

	}, this)
}

EagleCanvas.prototype.drawElements = function(layer, ctx) {
	if (!layer) return;

	for (var elemKey in this.elements) {
		var elem = this.elements[elemKey];

		var highlight = (this.highlightedItem && (this.highlightedItem.type=='element') && (this.highlightedItem.name==elem.name));
		var color     = highlight ? this.highlightColor(layer.color) : this.layerColor(layer.color);

		var pkg    = typeof elem.pkg === "string" ? this.packagesByName[elem.pkg] : elem.pkg;
		var rotMat = elem.matrix;
			pkg.smds.forEach(function(smd) {
				var layerNum = smd.layer;
				if (elem.mirror) { layerNum = this.mirrorLayer(layerNum); }
				if (layer.number != layerNum) { return; }

				var smdDX = smd.x2-smd.x1,
					smdDY = smd.y2-smd.y1,
					// smd center
					smdX  = smd.x1 + smdDX/2,
					smdY  = smd.y1 + smdDY/2,
					smdXDir = smdDX/Math.abs(smdDX),
					smdYDir = smdDY/Math.abs(smdDY),
					smdDx1 = smd.x1,
					smdDx2 = smd.x2,
					smdDy1 = smd.y1,
					smdDy2 = smd.y2;

				var borderRadius = Math.min (Math.abs (smdDX), Math.abs (smdDY)) / 2;
				if (smd.roundness) {
					borderRadius *= smd.roundness / 100;
					smdDx1 += 1 * smdXDir * borderRadius,
					smdDx2 -= 1 * smdXDir * borderRadius,
					smdDy1 += 1 * smdYDir * borderRadius,
					smdDy2 -= 1 * smdYDir * borderRadius;
					var drawSmdCircle = (smd.roundness === 100 && Math.abs (smdDX) === Math.abs (smdDY));
				}

				var smdRotMat = this.matrixForRot (smd.rot);
				var smdX1 = smdX + smdRotMat[0] * (smdX - smdDx1) + smdRotMat[1] * (smdY - smdDy1),	//top left
					smdY1 = smdY + smdRotMat[2] * (smdX - smdDx1) + smdRotMat[3] * (smdY - smdDy1),
					smdX2 = smdX + smdRotMat[0] * (smdX - smdDx2) + smdRotMat[1] * (smdY - smdDy2),	//top right
					smdY2 = smdY + smdRotMat[2] * (smdX - smdDx2) + smdRotMat[3] * (smdY - smdDy2);


				//Note that rotation might be not axis aligned, so we have do transform all corners
				var x1 = elem.x + rotMat[0]*smdX1 + rotMat[1]*smdY1,	//top left
					y1 = elem.y + rotMat[2]*smdX1 + rotMat[3]*smdY1,
					x2 = elem.x + rotMat[0]*smdX2 + rotMat[1]*smdY1,	//top right
					y2 = elem.y + rotMat[2]*smdX2 + rotMat[3]*smdY1,
					x3 = elem.x + rotMat[0]*smdX2 + rotMat[1]*smdY2,	//bottom right
					y3 = elem.y + rotMat[2]*smdX2 + rotMat[3]*smdY2,
					x4 = elem.x + rotMat[0]*smdX1 + rotMat[1]*smdY2,	//bottom left
					y4 = elem.y + rotMat[2]*smdX1 + rotMat[3]*smdY2;

				var padName = smd.name,
					signalName = elem.padSignals[padName],
					highlightPad = (this.highlightedItem && (this.highlightedItem.type=='signal') && (this.highlightedItem.name==signalName));

				ctx.strokeStyle = ctx.fillStyle = highlightPad ? this.highlightColor(layer.color) : color;
				ctx.lineJoin  = "round";
				ctx.lineWidth = borderRadius * 2;
				ctx.beginPath();
				if (drawSmdCircle) {
					ctx.arc (x1 - (x2-x1)/2, y1 - (y2-y1)/2, borderRadius, 0, Math.PI*2, false);
					ctx.closePath();
				} else {
					ctx.moveTo(x1,y1);
					ctx.lineTo(x2,y2);
					ctx.lineTo(x3,y3);
					ctx.lineTo(x4,y4);
					ctx.closePath();
					if (smd.roundness) ctx.stroke();
				}
				ctx.fill();
			}, this)

		if (pkg.rects) pkg.rects.forEach(function(rect) {
			var layerNum = rect.layer;
			if (elem.mirror) { layerNum = this.mirrorLayer(layerNum); }
			if (layer.number != layerNum) { return; }

			//Note that rotation might be not axis aligned, so we have do transform all corners
			var x1 = elem.x + rotMat[0]*rect.x1 + rotMat[1]*rect.y1,	//top left
				y1 = elem.y + rotMat[2]*rect.x1 + rotMat[3]*rect.y1,
				x2 = elem.x + rotMat[0]*rect.x2 + rotMat[1]*rect.y1,	//top right
				y2 = elem.y + rotMat[2]*rect.x2 + rotMat[3]*rect.y1,
				x3 = elem.x + rotMat[0]*rect.x2 + rotMat[1]*rect.y2,	//bottom right
				y3 = elem.y + rotMat[2]*rect.x2 + rotMat[3]*rect.y2,
				x4 = elem.x + rotMat[0]*rect.x1 + rotMat[1]*rect.y2,	//bottom left
				y4 = elem.y + rotMat[2]*rect.x1 + rotMat[3]*rect.y2;

			var padName = rect.name,
				signalName = elem.padSignals[padName],
				highlightPad = (this.highlightedItem && (this.highlightedItem.type=='signal') && (this.highlightedItem.name==signalName));

			ctx.strokeStyle = ctx.fillStyle = highlightPad ? this.highlightColor(layer.color) : color;
			ctx.lineJoin  = "round";
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			ctx.lineTo(x2,y2);
			ctx.lineTo(x3,y3);
			ctx.lineTo(x4,y4);
			ctx.closePath();
			ctx.fill();
		}, this)

		pkg.polys.forEach(function(poly) {
			var layerNum = poly.layer;
			if (elem.mirror) { layerNum = this.mirrorLayer(layerNum); }
			if (layer.number != layerNum) { return ; }

			ctx.beginPath();
			ctx.lineWidth = poly.width;
			var vertex = poly.vertexes[0];
			var x1  = elem.x + rotMat[0]*vertex.x  + rotMat[1]*vertex.y,
				y1  = elem.y + rotMat[2]*vertex.x  + rotMat[3]*vertex.y;

			ctx.moveTo(x1, y1);
			for (var vId = 1; vId < poly.vertexes.length; vId ++) {
				var vertex = poly.vertexes[vId],
					x1  = elem.x + rotMat[0]*vertex.x  + rotMat[1]*vertex.y,
					y1  = elem.y + rotMat[2]*vertex.x  + rotMat[3]*vertex.y;

				ctx.lineTo(x1, y1);
			}

			ctx.closePath();
			// ctx.strokeStyle = color;
			// ctx.stroke();
			ctx.fillStyle = color;
			ctx.fill();
		}, this)

		pkg.wires.forEach(function(wire) {
			var layerNum = wire.layer;
			if (elem.mirror) { layerNum = this.mirrorLayer(layerNum); }
			if (layer.number != layerNum) { return ; }
			var x  = elem.x + rotMat[0]*wire.x  + rotMat[1]*wire.y,
				y  = elem.y + rotMat[2]*wire.x  + rotMat[3]*wire.y,
				x1 = elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1,
				y1 = elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1,
				x2 = elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2,
				y2 = elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2;
			ctx.beginPath();
			ctx.lineWidth = wire.width;

			if (wire.cap && wire.cap === "flat") {
				ctx.lineCap = "butt";
			} else {
				ctx.lineCap = "round";
			}

			this.drawWire ({
				curve: wire.curve, rot: elem.rot,
				x1: x1, y1: y1, x2: x2, y2: y2,
				x: x, y: y, radius: wire.radius, angle: wire.angle, start: wire.start
			}, ctx);
			ctx.strokeStyle = color;
			ctx.stroke();
		}, this)

		// TODO: pads can be rotated too
		pkg.pads.forEach(function(pad) {
			var layerNum = pad.layer;
			// We don't need to check layers, pads is pass through all layers
			var x = elem.x + rotMat[0]*pad.x + rotMat[1]*pad.y,
				y = elem.y + rotMat[2]*pad.x + rotMat[3]*pad.y;

			if (pad.shape && pad.shape !== "circle") {
				if (!EagleCanvas.warnings["pad_shape_" + pad.shape]) {
					EagleCanvas.warnings["pad_shape_" + pad.shape] = true;
					console.warn ("pad shape '%s' is not supported yet", pad.shape);
				}
			}

			ctx.beginPath();
			// TODO: make sure calculations is correct
			var lineWidth = (pad.diameter - pad.drill) / 2;
			if (lineWidth <= 0) lineWidth = this.minLineWidth;
			ctx.lineWidth = lineWidth;
			ctx.arc(x, y, pad.drill * 0.75, 0, Math.PI * 2, false);
			ctx.strokeStyle = this.viaPadColor();
			ctx.stroke();
		}, this)

		pkg.holes.forEach(function(hole) {
			var layerNum = hole.layer;
			// We don't need to check layers, holes is pass through all layers
			var x = elem.x + rotMat[0]*hole.x + rotMat[1]*hole.y,
				y = elem.y + rotMat[2]*hole.x + rotMat[3]*hole.y;

			ctx.beginPath();

			ctx.lineWidth = this.minLineWidth;
			ctx.arc(x, y, hole.drill / 2, 0, Math.PI * 2, false);
			ctx.strokeStyle = this.layerColor(15); // ouline/dimension color
			ctx.stroke();
		}, this)

		var smashed = elem.smashed,
			absText = elem.absText === undefined ? elem.smashed : elem.absText,
			textCollection = smashed ? elem.attributes : pkg.texts;	//smashed : use element attributes instead of package texts
		for (var textIdx in textCollection) {
			if (!textCollection.hasOwnProperty (textIdx)) continue;
			var text = textCollection[textIdx];
			if (smashed && (text.display === "off" || !text.font)) continue;
			var layerNum = text.layer;
			if ((!elem.smashed) && (elem.mirror)) {
				layerNum = this.mirrorLayer(layerNum);
			}
			if (layer.number != layerNum) { continue; }

			var content = smashed ? null : text.content,
				attribName = smashed ? text.name : ((text.content.indexOf('>') == 0) ? text.content.substring(1) : null);
			if (attribName == "NAME")  { content = elem.name;  }
			if (attribName == "VALUE") { content = elem.value; }
			if (!content) { continue; }

			var x = absText ? text.x : (elem.x + rotMat[0]*text.x + rotMat[1]*text.y),
				y = absText ? text.y : (elem.y + rotMat[2]*text.x + rotMat[3]*text.y),
				rot = smashed ? text.rot : elem.rot,
				flipText = smashed ? text.flipText : elem.flipText,
				size = text.size;

			if (!text.size) continue;

			this.drawText ({
				x: x, y: y, content: content, color: color, rot: rot, flipText: flipText
			}, text, ctx);
		}
	}
}

EagleCanvas.prototype.dimCanvas = function(ctx, alpha) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = 'rgba(0,0,0,'+alpha+')'
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.restore();
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
