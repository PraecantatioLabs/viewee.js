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

EagleCanvas.prototype.scale = 25;
EagleCanvas.prototype.minScale = 2.5;
EagleCanvas.prototype.maxScale = 250;
EagleCanvas.prototype.minLineWidth = 0.05;
EagleCanvas.prototype.boardFlipped = false;
EagleCanvas.prototype.dimBoardAlpha = 0.7;

// -------------------
// --- CONSTRUCTOR ---
// -------------------

function EagleCanvas(canvasSelector) {
	this.canvasSelector = canvasSelector;

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
EagleCanvas.prototype.setScale = function(scale) {
	this.scale = scale;
	var canvas = document.querySelector (this.canvasSelector);
	var context = canvas.getContext('2d'),
		devicePixelRatio = window.devicePixelRatio || 1,
		backingStoreRatio =
			context.webkitBackingStorePixelRatio ||
			context.mozBackingStorePixelRatio ||
			context.msBackingStorePixelRatio ||
			context.oBackingStorePixelRatio ||
			context.backingStorePixelRatio || 1,
		ratio = devicePixelRatio / backingStoreRatio;

	canvas.width  = scale * this.nativeSize[0] * ratio;
	canvas.height = scale * this.nativeSize[1] * ratio;

	canvas.style.width  = scale * this.nativeSize[0] + "px";
	canvas.style.height = scale * this.nativeSize[1] + "px";

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
	EagleCanvas.EagleParser
];

if ("KicadNewParser" in window) {
	EagleCanvas.parsers.push (window.KicadNewParser);
}

EagleCanvas.EagleParser.supports = function (text) {
	if (text.match (/\<\?xml/) && text.match (/\<eagle/)) return true;
}

EagleCanvas.EagleParser.name = "eagle brd";


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
// --- PARSING ---
// ---------------

EagleCanvas.prototype.parse = function (text) {
	var parser = new DOMParser ();
	var boardXML = parser.parseFromString (this.text,"text/xml");
	this.parseDOM (boardXML)
}

EagleCanvas.prototype.parseDOM = function(boardXML) {
  // store by eagle name
	this.eagleLayersByName = {};
  // store by eagle number
	this.layersByNumber = {};

	var layers = boardXML.getElementsByTagName('layer');
	for (var layerIdx = 0; layerIdx < layers.length; layerIdx++) {
		var layerDict = this.parseLayer( layers[layerIdx] );
		this.eagleLayersByName[layerDict.name] = layerDict;
		this.layersByNumber[layerDict.number]  = layerDict;
	}

	this.elements = {};
	var elements = boardXML.getElementsByTagName('element');
	for (var elementIdx = 0; elementIdx < elements.length; elementIdx++) {
		var elemDict = this.parseElement( elements[elementIdx] )
		this.elements[elemDict.name] = elemDict;
	}

	this.designRules = {};
	//hashmap signal name -> hashmap layer number -> hashmap 'wires'->wires array, 'vias'->vias array
	var rules = boardXML.getElementsByTagName('designrules');
	for (var ruleIdx = 0; ruleIdx < rules.length; ruleIdx++) {
		var rule = rules[ruleIdx];

		var ruleParams = rule.getElementsByTagName('param');
		for (var ruleParamIdx = 0; ruleParamIdx < ruleParams.length; ruleParamIdx++) {
			var ruleParam = ruleParams[ruleParamIdx];
			this.designRules[ruleParam.getAttribute ("name")] = ruleParam.getAttribute ("value");
		}
	}


	this.signalItems = {};
	//hashmap signal name -> hashmap layer number -> hashmap 'wires'->wires array, 'vias'->vias array
	var signals = boardXML.getElementsByTagName('signal');
	for (var sigIdx = 0; sigIdx < signals.length; sigIdx++) {
		var signal = signals[sigIdx];
		var name = signal.getAttribute('name');
		var signalLayers = {};
		this.signalItems[name] = signalLayers;

		var wires = signal.getElementsByTagName('wire');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wireDict = this.parseWire( wires[wireIdx] );
			var layer = wireDict.layer;
			if (!(signalLayers[layer])) signalLayers[layer] = {};
			var layerItems = signalLayers[layer];
			if (!(layerItems['wires'])) layerItems['wires'] = [];
			var layerWires = layerItems['wires'];
			layerWires.push(wireDict);
		}

		var vias = signal.getElementsByTagName('via');
		for (var viaIdx = 0; viaIdx < vias.length; viaIdx++) {
			var viaDict = this.parseVia(vias[viaIdx]);
			var layers = viaDict.layers;
			if (!(signalLayers[layers])) signalLayers[layers] = {};
			var layerItems = signalLayers[layers];
			if (!(layerItems['vias'])) layerItems['vias'] = [];
			var layerVias = layerItems['vias'];
			layerVias.push(viaDict);
		}

		var contacts = signal.getElementsByTagName('contactref');
		for (var contactIdx = 0; contactIdx < contacts.length; contactIdx++) {
			var contact = contacts[contactIdx];
			var elemName = contact.getAttribute('element');
			var padName = contact.getAttribute('pad');
			var elem = this.elements[elemName];
			if (elem) elem.padSignals[padName] = name;
		}
	}

	this.packagesByName = {};
	var packages = boardXML.getElementsByTagName('package');
	for (var packageIdx = 0; packageIdx < packages.length; packageIdx++) {
		var pkg = packages[packageIdx];
		var packageName = pkg.getAttribute('name');

		var descriptionEls = pkg.getElementsByTagName('description');
		if (descriptionEls && descriptionEls.length)
			var description = descriptionEls[0].textContent;

		var packageSmds = [];
		var smds = pkg.getElementsByTagName('smd');
		for (var smdIdx = 0; smdIdx < smds.length; smdIdx++) {
			var smd = smds[smdIdx];
			packageSmds.push(this.parseSmd(smd));
		}

		var packagePads = [];
		var pads = pkg.getElementsByTagName('pad');
		for (var padIdx = 0; padIdx < pads.length; padIdx++) {
			var pad = pads[padIdx];
			packagePads.push(this.parsePad(pad));
		}

		var packagePolys = [];
		var polys = pkg.getElementsByTagName('polygon');
		for (var polyIdx = 0; polyIdx < polys.length; polyIdx++) {
			var poly = polys[polyIdx];
			packagePolys.push (this.parsePoly (poly));
		}

		var packageWires = [];
		var wires = pkg.getElementsByTagName('wire');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wire = wires[wireIdx];
			var wireDict = this.parseWire(wire);
			packageWires.push(wireDict);
		}

		var wires = pkg.getElementsByTagName('circle');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wire = wires[wireIdx];
			var wireDict = this.parseCircle(wire);
			packageWires.push(wireDict);
		}

		var packageHoles = [];
		var holes = pkg.getElementsByTagName('hole');
		for (var holeIdx = 0; holeIdx < holes.length; holeIdx++) {
			var hole = holes[holeIdx];
			var holeDict = this.parseHole(hole);
			packageHoles.push(holeDict);
		}

		var bbox = this.calcBBox (packageWires);

		var packageTexts = [],
			texts        = pkg.getElementsByTagName('text');
		for (var textIdx = 0; textIdx < texts.length; textIdx++) {
			var text = texts[textIdx];
			packageTexts.push(this.parseText(text));
		}


		var packageDict = {
			smds:  packageSmds,
			wires: packageWires,
			texts: packageTexts,
			bbox:  bbox,
			pads:  packagePads,
			polys: packagePolys,
			holes: packageHoles,
			description: description
		};
		this.packagesByName[packageName] = packageDict;
	}

	this.plainWires = {};
	this.plainTexts = {};
	this.plainHoles = [];
	var plains = boardXML.getElementsByTagName('plain');	//Usually only one
	for (var plainIdx = 0; plainIdx < plains.length; plainIdx++) {
		var plain = plains[plainIdx],
			wires = plain.getElementsByTagName('wire'),
			texts = plain.getElementsByTagName('text'),
			holes = plain.getElementsByTagName('hole');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wire = wires[wireIdx],
				wireDict = this.parseWire(wire),
				layer = wireDict.layer;
			if (!this.plainWires[layer]) this.plainWires[layer] = [];
			this.plainWires[layer].push(wireDict);
		}

		for (var textIdx = 0; textIdx < texts.length; textIdx++) {
			var text = texts[textIdx],
				textDict = this.parseText(text),
				layer = textDict.layer;
			if (!this.plainTexts[layer]) this.plainTexts[layer] = [];
			this.plainTexts[layer].push(textDict);
		}

		for (var holeIdx = 0; holeIdx < holes.length; holeIdx++) {
			var hole = holes[holeIdx],
				holeDict = this.parseHole(hole);
			this.plainHoles.push(holeDict);
		}
	}
}

EagleCanvas.prototype.calcBBox = function (wires) {
	var bbox = [EagleCanvas.LARGE_NUMBER,EagleCanvas.LARGE_NUMBER,-EagleCanvas.LARGE_NUMBER,-EagleCanvas.LARGE_NUMBER];
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

EagleCanvas.prototype.parseSmd = function(smd) {
	var smdX  = parseFloat(smd.getAttribute('x')),
		smdY  = parseFloat(smd.getAttribute('y')),
		smdDX = parseFloat(smd.getAttribute('dx')),
		smdDY = parseFloat(smd.getAttribute('dy')),
		rot   = smd.getAttribute('rot') || "R0",
		roundness = parseInt (smd.getAttribute('roundness'));

	return {
		x1:    smdX-0.5*smdDX,
		y1:    smdY-0.5*smdDY,
		x2:    smdX+0.5*smdDX,
		y2:    smdY+0.5*smdDY,
		rot:   rot,
		round: roundness,
		name:  smd.getAttribute('name'),
		layer: smd.getAttribute('layer')
	};
}

EagleCanvas.prototype.parseRect = function(rect) {
	return {'x1'   : parseFloat(rect.getAttribute('x1')),
			'y1'   : parseFloat(rect.getAttribute('y1')),
			'x2'   : parseFloat(rect.getAttribute('x2')),
			'y2'   : parseFloat(rect.getAttribute('y2')),
			'layer': rect.getAttribute('layer')};
}


EagleCanvas.prototype.parsePoly = function(poly) {
	var width = parseFloat(poly.getAttribute('width'));
	var vertexes = [];
	[].slice.apply (poly.getElementsByTagName ('vertex')).forEach (function (vertexEl) {
		vertexes.push ({
			'x':parseFloat (vertexEl.getAttribute ('x')),
			'y':parseFloat (vertexEl.getAttribute ('y'))
		});
	});

	return {
		vertexes: vertexes,
		layer: poly.getAttribute('layer'),
		width: width
	};
}


EagleCanvas.prototype.parsePad = function(pad) {
	var drill = parseFloat(pad.getAttribute('drill'));
	var diameter = parseFloat(pad.getAttribute('diameter'));
	// TODO: use proper measurements
	if (isNaN (diameter)) diameter = drill * 1.5;
	var padRot = pad.getAttribute('rot') || "R0"
	return {
		'x':parseFloat(pad.getAttribute('x')),
		'y':parseFloat(pad.getAttribute('y')),
		'drill':drill,
		'name': pad.getAttribute('name'),
		'diameter':diameter,
		'rot': padRot
	};
}

EagleCanvas.prototype.parseVia = function(via) {
	return {'x':parseFloat(via.getAttribute('x')),
			'y':parseFloat(via.getAttribute('y')),
			 'drill':parseFloat(via.getAttribute('drill')),
			'layers':via.getAttribute('extent'),
			'shape': via.getAttribute('shape')
		   };
}

EagleCanvas.prototype.parseHole = function(hole) {
	return {
		'x':parseFloat(hole.getAttribute('x')),
		'y':parseFloat(hole.getAttribute('y')),
		'drill':parseFloat(hole.getAttribute('drill'))
	};
}

// special thanks to http://paulbourke.net/geometry/circlesphere/
function circleCenter (x1, y1, x2, y2, angle) {

	/* dx and dy are the vertical and horizontal distances between
	* the circle centers.
	*/
	var dx = x2 - x1;
	var dy = y2 - y1;

	if (Math.abs(angle) === 180) {
		var cx = x1 + dx/2,
			cy = y1 + dy/2,
			angle1 = Math.atan2 (y1 - cy, cx - x1),
			angle2 = Math.atan2 (y2 - cy, cx - x2);
		return [cx, cy, angle1, Math.sqrt (dx*dx/4 + dy*dy/4)];
	}

	/* Determine the straight-line distance between the centers. */
	//d = sqrt((dy*dy) + (dx*dx));
	//d = hypot(dx,dy); // Suggested by Keith Briggs
	var d = Math.sqrt (dx*dx + dy*dy);

	var r = Math.abs (d / 2 / Math.sin (angle/180/2*Math.PI)),
		r0 = r,
		r1 = r;

	/* Check for solvability. */
	if (d > (r0 + r1)) {
		/* no solution. circles do not intersect. */
		console.log ("no solution. circles do not intersect", d, r0, r1);
		return;
	}

	if (d < Math.abs (r0 - r1)) {
		/* no solution. one circle is contained in the other */
		console.log ("no solution. one circle is contained in the other", d, r0, r1);
		return;
	}

	/* 'point 2' is the point where the line through the circle
	* intersection points crosses the line between the circle
	* centers.
	*/

	/* Determine the distance from point 0 to point 2. */
	var a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

	/* Determine the coordinates of point 2. */
	var x3 = x1 + (dx * a/d);
	var y3 = y1 + (dy * a/d);

	/* Determine the distance from point 2 to either of the
	* intersection points.
	*/
	var h = Math.sqrt((r0*r0) - (a*a));

	/* Now determine the offsets of the intersection points from
	* point 2.
	*/

	var rx = -dy * (h/d),
		ry = dx * (h/d);

	/* Determine the absolute intersection points. */
	var cx1 = x3 + rx,
		cy1 = y3 + ry,
		cx2 = x3 - rx,
		cy2 = y3 - ry,
		angle11 = Math.atan2 (y1 - cy1, cx1 - x1),
		angle12 = Math.atan2 (y2 - cy1, cx1 - x2),
		angle21 = Math.atan2 (y1 - cy2, cx2 - x1),
		angle22 = Math.atan2 (y2 - cy2, cx2 - x2);

	if (angle11 - angle12 === angle/180*Math.PI) {
		return [cx1, cy1, angle11, r];
	} else {
		return [cx2, cy2, angle21, r];
	}

	// return [cx1, cy1, cx2, cy2];
}

EagleCanvas.prototype.parseWire = function(wire) {
	var width = parseFloat(wire.getAttribute('width'));
	if (width <= 0.0) width = this.minLineWidth;

	var layer = parseInt(wire.getAttribute('layer'));

	var x1 = parseFloat(wire.getAttribute('x1')),
		y1 = parseFloat(wire.getAttribute('y1')),
		x2 = parseFloat(wire.getAttribute('x2')),
		y2 = parseFloat(wire.getAttribute('y2'));

	var curve = parseInt(wire.getAttribute('curve'));

	if (curve) {

		var center = circleCenter (x1, y1, x2, y2, curve);

		var angle = Math.PI * (curve/180);

		if (angle < 0) {
			center[2] += - angle;
			angle = -angle;
		}

		return {
			x: center[0],
			y: center[1],
			radius: center[3],
			start: Math.PI-center[2],
			angle: angle,
			curve: curve,
			width: width,
			layer: layer
		}
	}

	return {
		'x1':x1,
		'y1':y1,
		'x2':x2,
		'y2':y2,
		'width':width,
		'layer':layer
	};

}

EagleCanvas.prototype.parseCircle = function(wire) {
	var width = parseFloat(wire.getAttribute('width'));
	if (width <= 0.0) width = this.minLineWidth;

	var layer = parseInt(wire.getAttribute('layer'));

	var tagName = wire.tagName;

	return {
		x: parseFloat(wire.getAttribute ("x")),
		y: parseFloat(wire.getAttribute ("y")),
		radius: parseFloat(wire.getAttribute ("radius")),
		start: 0,
		angle: Math.PI * 2,
		curve: 360,
		width: width,
		layer: layer
	}
}


EagleCanvas.prototype.parseText = function(text) {
	var content = text.textContent;
	if (!content) content = "";
	var textRot = text.getAttribute('rot') || "R0"
	return {'x'      : parseFloat(text.getAttribute('x')),
			'y'      : parseFloat(text.getAttribute('y')),
			'size'   : parseFloat(text.getAttribute('size')),
			'layer'  : parseInt(text.getAttribute('layer')),
			'ratio'  : parseInt(text.getAttribute('ratio')),
			'rot'    : textRot,
			'font'   : text.getAttribute('font'),
			'content': content};
}

EagleCanvas.prototype.parseElement = function(elem) {
	var elemRot    = elem.getAttribute('rot') || "R0",
	    elemMatrix = this.matrixForRot(elemRot);
	
	var attribs = {},
	    elemAttribs = elem.getElementsByTagName('attribute');
	for (var attribIdx = 0; attribIdx < elemAttribs.length; attribIdx++) {

		var elemAttrib = elemAttribs[attribIdx],
		    attribDict = {},
		    name = elemAttrib.getAttribute('name');

		if (name) {
			attribDict.name = name;
			if (elemAttrib.getAttribute('x'))     { attribDict.x = parseFloat(elemAttrib.getAttribute('x')); }
			if (elemAttrib.getAttribute('y'))     { attribDict.y = parseFloat(elemAttrib.getAttribute('y')); }
			if (elemAttrib.getAttribute('size'))  { attribDict.size = parseFloat(elemAttrib.getAttribute('size')); }
			if (elemAttrib.getAttribute('layer')) { attribDict.layer = parseInt(elemAttrib.getAttribute('layer')); }
			attribDict.font = elemAttrib.getAttribute('font');

			var rot = elemAttrib.getAttribute('rot');
			if (!rot) { rot = "R0"; }
			attribDict.rot = rot;
			attribDict.display = elemAttrib.getAttribute('display');
			attribs[name] = attribDict;
		}
	}
	return {
		'pkg'   : elem.getAttribute('package'),
		'name'      : elem.getAttribute('name'),
		'value'     : elem.getAttribute('value'),
		'x'         : parseFloat(elem.getAttribute('x')),
		'y'         : parseFloat(elem.getAttribute('y')),
		'rot'       : elemRot,
		'matrix'    : elemMatrix,
		'mirror'    : elemRot.indexOf('M') == 0,
		'smashed'   : elem.getAttribute('smashed') && (elem.getAttribute('smashed').toUpperCase() == 'YES'),
		'attributes': attribs,
		'padSignals': {}			//to be filled later
	};
};

EagleCanvas.prototype.parseLayer = function(layer) {
	return {'name'  : layer.getAttribute('name'), 
	        'number': parseInt(layer.getAttribute('number')), 
	        'color' : parseInt(layer.getAttribute('color'))};
}

// ---------------
// --- DRAWING ---
// ---------------

EagleCanvas.prototype.draw = function() {
	var canvas = document.querySelector (this.canvasSelector),
		ctx    = canvas.getContext('2d');

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();

	ctx.transform(
		this.scale * this.ratio * (this.boardFlipped ? -1.0 : 1.0),
		0,
		0,
		(this.coordYFlip ? 1 : -1) * this.scale*this.ratio,
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
	if (wire.curve) {

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
		ctx.arc(0, 0, 1, wire.start, wire.start + wire.angle); //, antiClockwise
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
		ctx.beginPath();
		this.drawWire (wire, ctx);
		ctx.lineWidth = wire.width;
		ctx.stroke();
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
		})
	}
}

EagleCanvas.prototype.drawPlainTexts = function (layer, ctx) {

	if (!layer) return;

	var layerTexts = this.plainTexts[layer.number] || [];

	var color = this.layerColor(layer.color);

	layerTexts.forEach (function (text) {
	var x = text.x,
		y = text.y,
		rot = text.rot || "",
		size = text.size;

	//rotation from 90.1 to 270 causes Eagle to draw labels 180 degrees rotated with top right anchor point
	var degrees  = parseFloat(rot.substring((rot.indexOf('M')==0) ? 2 : 1)),
		flipText = ((degrees > 90) && (degrees <=270)),
		textRot  = this.matrixForRot(rot),
		fontSize = 10;

	var content = text.content

	ctx.save();
	ctx.fillStyle = color;
	ctx.font = ''+fontSize+'pt vector';	//Use a regular font size - very small sizes seem to mess up spacing / kerning
	ctx.translate(x,y);
	ctx.transform(textRot[0],textRot[2],textRot[1],textRot[3],0,0);
	var scale = size / fontSize;
	ctx.scale(scale,(this.coordYFlip ? 1 : -1)*scale);
	if (flipText) {
		var metrics = ctx.measureText(content);
		ctx.translate(metrics.width,-fontSize);	//Height is not calculated - we'll use the font's 10pt size and hope it fits
		ctx.scale(-1,-1);
	}
	if (text.align)  ctx.textAlign = text.align;
	if (text.valign) ctx.textBaseline = text.valign;
	ctx.fillText(content, 0, 0);
	ctx.restore();
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
				var smdRotMat = this.matrixForRot (smd.rot);
				var smdX = smd.x1 + (smd.x2-smd.x1)/2,
					smdY = smd.y1 + (smd.y2-smd.y1)/2,
					smdX1 = smdX + smdRotMat[0]*(-smd.x1 + smdX) + smdRotMat[1]*(-smd.y1 + smdY),	//top left
					smdY1 = smdY + smdRotMat[2]*(-smd.x1 + smdX) + smdRotMat[3]*(-smd.y1 + smdY),
					smdX2 = smdX + smdRotMat[0]*(-smd.x2 + smdX) + smdRotMat[1]*(-smd.y2 + smdY),	//top right
					smdY2 = smdY + smdRotMat[2]*(-smd.x2 + smdX) + smdRotMat[3]*(-smd.y2 + smdY);

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

				ctx.fillStyle = highlightPad ? this.highlightColor(layer.color) : color;
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
			this.drawWire ({
				curve: wire.curve,
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

			ctx.beginPath();
			// TODO: make sure calculations is correct
			ctx.lineWidth = (pad.diameter - pad.drill) / 2;
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
			if (smashed && text.display === "off") continue;
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
				size = text.size;

			if (!text.size) continue;

			//rotation from 90.1 to 270 causes Eagle to draw labels 180 degrees rotated with top right anchor point
			var degrees  = parseFloat(rot.substring((rot.indexOf('M')==0) ? 2 : 1)),
				flipText = ((degrees > 90) && (degrees <=270)),
				textRot  = this.matrixForRot(rot),
				fontSize = 10;

			ctx.save();
			ctx.fillStyle = color;
			ctx.font = ''+fontSize+'pt vector';	//Use a regular font size - very small sizes seem to mess up spacing / kerning
			ctx.translate(x,y);
			ctx.transform(textRot[0],textRot[2],textRot[1],textRot[3],0,0);
			var scale = size / fontSize;
			ctx.scale(scale,(this.coordYFlip ? 1 : -1)*scale);
			if (flipText) {
				var metrics = ctx.measureText(content);
				ctx.translate(metrics.width,-fontSize);	//Height is not calculated - we'll use the font's 10pt size and hope it fits
				ctx.scale(-1,-1);
			}
			ctx.fillText(content, 0, 0);
			ctx.restore();
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
	var canvas = document.querySelector (this.canvasSelector);
	//Translate screen to model coordinates
	var rx = x / this.scale;
	var ry = (this.coordYFlip ? y : canvas.height / this.ratio - y) / this.scale;
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

EagleCanvas.prototype.matrixForRot = function(rot) {
	var spin         = (rot.indexOf('S') === 0), // TODO: spin rotate
		flipped      = (rot.indexOf('M') === 0),
		degreeString = rot.substring(flipped | spin ? 2 : 1),
		degrees      = parseFloat(degreeString),
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
	var fitElement = document.querySelector (this.scaleToFitSelector || this.canvasSelector);
	if (!fitElement) { return; }
	var fitWidth  = fitElement.offsetWidth,
	    fitHeight = fitElement.offsetHeight,
	    scaleX    = fitWidth / this.nativeSize[0],
	    scaleY    = fitHeight / this.nativeSize[1],
	    scale     = Math.min(scaleX, scaleY);
	scale *= 0.9;
	this.minScale = scale / 10;
	this.maxScale = scale * 10;
	this.setScale(scale);
}

	return EagleCanvas;

}));
