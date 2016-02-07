(function (root, factory) {
	if(typeof define === "function" && define.amd) {
		define(function(){
			return factory();
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.ViewEERenderer = factory();
	}
}(this, function () {

	// ---------------
	// --- DRAWING ---
	// ---------------

	function ViewEERenderer (board) {
		var canvas = board.canvas,
			ctx    = canvas.getContext('2d');

		this.canvas = canvas;
		this.board  = board;

		this.warnings = [];
	}

	/**
	 * Returns scope of current rendering — layer, element/package
	 * @param {object} ctx   Rendering context
	 * @param {object} attrs Attributes attached to the rendering context
	 */
	ViewEERenderer.prototype.getScope = function (ctx, attrs) {
		throw "not implemented";
	}

	ViewEERenderer.prototype.drawPlainWires = function(layer, ctx) {
		if (!layer) { return; }

		var board = this.board;

		var layerWires = board.plainWires[layer.number] || [];
		layerWires.forEach (function (wire) {
			this.drawSingleWire (Object.assign (
				{}, wire,
				{cap: 'round', strokeStyle: board.layerColor (layer.color)}
			), ctx);
		}, this);
	}

	ViewEERenderer.prototype.drawSignalWires = function(layer, ctx) {
		if (!layer) { return; }
		var layerNumber = layer.number;

		var board = this.board;

		for (var signalKey in board.signalItems) {

			var highlight = (board.highlightedItem && (board.highlightedItem.type=='signal') && (board.highlightedItem.name==signalKey));
			var color = highlight ? board.highlightColor(layer.color) : board.layerColor(layer.color);

			var signalLayers = board.signalItems[signalKey],
				layerItems = signalLayers[layer.number];
			if (!layerItems) { continue; }
			var layerWires = layerItems['wires'] || [];
			layerWires.forEach(function(wire) {
				this.drawSingleWire (Object.assign (
					{}, wire,
					{cap: 'round', strokeStyle: color}
				), ctx);
			}, this)
		}
	}

	ViewEERenderer.prototype.drawPlainHoles = function(layer, ctx) {
		if (!layer) { return; }

		var board = this.board;

		var layerHoles = board.plainHoles || [];
		layerHoles.forEach(function(hole){
			this.drawHole (Object.assign ({}, hole, {
				strokeStyle: board.layerColor (layer.color),
				strokeWidth: board.minLineWidth, // TODO: bad width
			}), ctx);
		}, this);
	}

	ViewEERenderer.prototype.drawSignalVias = function(layersName, ctx, color) {
		if (!layersName) return;

		ctx.strokeStyle = color;

		var board = this.board;

		for (var signalKey in board.signalItems) {
			var signalLayers = board.signalItems[signalKey],
				layerItems = signalLayers[layersName];
			if (!layerItems) {continue;}
			var layerVias = layerItems['vias'] || [];
			layerVias.forEach (function (via) {

				this.drawHole (Object.assign ({}, via, {
					strokeStyle: color,
					strokeWidth: 0.5 * via.drill, // TODO: bad width
				}), ctx);

				if (via.shape && via.shape !== "circle") {
					if (!this.warnings["via_shape_" + via.shape]) {
						this.warnings["via_shape_" + via.shape] = true;
						console.warn ("via shape '%s' is not supported yet", via.shape);
					}
				}

			}, this)
		}
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

		ctx.save();
		ctx.fillStyle = color;
		ctx.font = ''+fontSize+'pt vector';	//Use a regular font size - very small sizes seem to mess up spacing / kerning
		ctx.translate(x,y);

		// TODO: board object is a bad place for this
		var d = board.fontTestCpan = (board.fontTestCpan || document.createElement("span"));
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
			ctx.fillStyle = board.viaPadColor();
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
		ctx.scale (scale, (board.coordYFlip ? 1 : -1)*scale);
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

	ViewEERenderer.prototype.drawPlainTexts = function (layer, ctx) {

		if (!layer) return;

		var board = this.board;

		var layerTexts = board.plainTexts[layer.number] || [];

		var color = board.layerColor(layer.color);

		layerTexts.forEach (function (text) {

			var content = text.content;

			var attrs = {
				color: color,
				content: content
			};

			this.drawText (attrs, text, ctx);

		}, this)
	}

	ViewEERenderer.prototype.drawElements = function(layer, ctx) {
		if (!layer) return;

		var board = this.board;

		for (var elemKey in board.elements) {
			var elem = board.elements[elemKey];

			var highlight = (board.highlightedItem && (board.highlightedItem.type=='element') && (board.highlightedItem.name==elem.name));
			var color     = highlight ? board.highlightColor(layer.color) : board.layerColor(layer.color);

			var pkg    = typeof elem.pkg === "string" ? board.packagesByName[elem.pkg] : elem.pkg;
			var rotMat = elem.matrix;
			pkg.smds.forEach(function(smd) {
				var layerNum = smd.layer;
				if (elem.mirror) { layerNum = board.mirrorLayer(layerNum); }
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

				var smdRotMat = board.matrixForRot (smd.rot);
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
					highlightPad = (board.highlightedItem && (board.highlightedItem.type=='signal') && (board.highlightedItem.name==signalName));

				if (drawSmdCircle) {
					this.drawFilledCircle (Object.assign ({}, smd, {
						x: x1 - (x2 - x1) / 2,
						y: y1 - (y2 - y1) / 2,
						radius: borderRadius,
						fillStyle: color,
						strokeWidth: borderRadius * 2,
						strokeStyle: smd.roundness ? color : null,
					}), ctx);
				} else {
					var points = [{x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3}, {x: x4, y: y4}];

					this.drawFilledPoly (Object.assign ({}, smd, {
						points: points,
						fillStyle: color,
						strokeWidth: borderRadius * 2,
						strokeStyle: smd.roundness ? color : null,
					}), ctx);
				}

			}, this)

			if (pkg.rects) pkg.rects.forEach(function(rect) {
				var layerNum = rect.layer;
				if (elem.mirror) { layerNum = board.mirrorLayer(layerNum); }
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
					highlightPad = (board.highlightedItem && (board.highlightedItem.type=='signal') && (board.highlightedItem.name==signalName)),
					points = [{x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3}, {x: x4, y: y4}];

				this.drawFilledPoly (Object.assign ({}, rect, {
					points: points,
					fillStyle: highlightPad ? board.highlightColor(layer.color) : color,
					// strokeStyle: color,
				}), ctx);

			}, this)

			pkg.polys.forEach(function(poly) {
				var layerNum = poly.layer;
				if (elem.mirror) { layerNum = board.mirrorLayer(layerNum); }
				if (layer.number != layerNum) { return ; }

				var points = [];

				for (var vId = 0; vId < poly.vertexes.length; vId ++) {
					var vertex = poly.vertexes[vId],
						x1  = elem.x + rotMat[0]*vertex.x  + rotMat[1]*vertex.y,
						y1  = elem.y + rotMat[2]*vertex.x  + rotMat[3]*vertex.y;

					points.push ({x: x1, y: y1});
				}

				this.drawFilledPoly (Object.assign ({}, poly, {
					points: points,
					fillStyle: color,
				}), ctx);

			}, this)

			pkg.wires.forEach(function(wire) {
				var layerNum = wire.layer;
				if (elem.mirror) { layerNum = board.mirrorLayer(layerNum); }
				if (layer.number != layerNum) { return ; }
				var x  = elem.x + rotMat[0]*wire.x  + rotMat[1]*wire.y,
					y  = elem.y + rotMat[2]*wire.x  + rotMat[3]*wire.y,
					x1 = elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1,
					y1 = elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1,
					x2 = elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2,
					y2 = elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2;

				this.drawSingleWire ({
					cap: wire.cap, width: wire.width,
					curve: wire.curve, rot: elem.rot,
					x1: x1, y1: y1, x2: x2, y2: y2,
					x: x, y: y, radius: wire.radius, angle: wire.angle, start: wire.start,
					strokeStyle: color
				}, ctx);
			}, this)

			// TODO: pads can be rotated too
			pkg.pads.forEach(function(pad) {
				var layerNum = pad.layer;
				// We don't need to check layers, pads is pass through all layers
				var x = elem.x + rotMat[0]*pad.x + rotMat[1]*pad.y,
					y = elem.y + rotMat[2]*pad.x + rotMat[3]*pad.y;

				if (pad.shape && pad.shape !== "circle") {
					if (!this.warnings["pad_shape_" + pad.shape]) {
						this.warnings["pad_shape_" + pad.shape] = true;
						console.warn ("pad shape '%s' is not supported yet", pad.shape);
					}
				}

				var lineWidth = (pad.diameter - pad.drill) / 2;
				if (lineWidth <= 0) lineWidth = board.minLineWidth;

				// TODO: make sure calculations is correct
				this.drawHole (Object.assign ({}, pad, {
					x: x,
					y: y,
					strokeWidth: lineWidth,
					strokeStyle: board.viaPadColor(), // ouline/dimension color
				}), ctx);
			}, this)

			pkg.holes.forEach(function(hole) {
				var layerNum = hole.layer;
				// We don't need to check layers, holes is pass through all layers
				var x = elem.x + rotMat[0]*hole.x + rotMat[1]*hole.y,
					y = elem.y + rotMat[2]*hole.x + rotMat[3]*hole.y;

				this.drawHole (Object.assign ({}, hole, {
					x: x,
					y: y,
					strokeWidth: board.minLineWidth,
					strokeStyle: board.layerColor(15), // ouline/dimension color
				}), ctx);

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
					layerNum = board.mirrorLayer(layerNum);
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

	ViewEERenderer.prototype.dimCanvas = function(ctx, alpha) {
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = 'rgba(0,0,0,'+alpha+')'
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.restore();
	};

	return ViewEERenderer;

}));
