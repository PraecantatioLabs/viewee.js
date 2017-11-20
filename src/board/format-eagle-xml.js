import * as xmldom from '../../lib/xmldom';

import {calcBBox, matrixForRot, angleForRot} from '../util';

var DOMParser = xmldom.DOMParser;

var newLayerMapping = {
	"drills": "Drills", // thru board drills
	"milling": "Milling", // thru board milling
	"outline": "Dimension", // board outline
	"front-glue": "tGlue", // glue placement
	"front-finish": "tFinish", // gold finish
	"front-silk-place": "tPlace",  // silkscreen outline for components
	"front-silk-values": "tValues", // silkscreen values for components
	"front-silk-names": "tNames",  // silkscreen names for components
	"front-mask-paste": "tCream", // cutout for paste stencil
	"front-mask-stop": "tStop",  // component placement open for mask
	"front-restrict": "tRestrict", // copper restrict
	"front-copper": "Top", // top copper layer
	"inner": "Route", // inner copper layers
	"back-copper": "Bottom", // bottom copper layer
	"vias": "Vias", // vias "virtual" layer
	"vias-restrict": "vRestrict", // copper restrict
	"pads": "Pads", // pads "virtual" layer
	"back-restrict": "bRestrict", // copper restrict
	"back-keepout": "bKeepout", // component keepout
	"back-mask-stop": "bStop",  // component placement open for mask
	"back-mask-paste": "bCream", // cutout for paste stencil
	"back-silk-names": "bNames",  // silkscreen names for components
	"back-silk-values": "bValues", // silkscreen values for components
	"back-silk-place": "bPlace",  // silkscreen outline for components
	"back-finish": "bFinish", // gold finish
	"back-glue": "bGlue", // glue placement
};

var LAYER_MAP = {
	"1":   { "color":  4, "name": "front-copper", },
	"2":   { "color": 16, "name": "inner-2", },
	"3":   { "color": 16, "name": "inner-3", },
	"4":   { "color": 16, "name": "inner-4", },
	"5":   { "color": 16, "name": "inner-5", },
	"6":   { "color": 16, "name": "inner-6", },
	"7":   { "color": 16, "name": "inner-7", },
	"8":   { "color": 16, "name": "inner-8", },
	"9":   { "color": 16, "name": "inner-9", },
	"10":  { "color": 16, "name": "inner-10", },
	"11":  { "color": 16, "name": "inner-11", },
	"12":  { "color": 16, "name": "inner-12", },
	"13":  { "color": 16, "name": "inner-13", },
	"14":  { "color": 16, "name": "inner-14", },
	"15":  { "color": 16, "name": "inner-15", },
	"16":  { "color":  1, "name": "back-copper", },
	"17":  { "color":  2, "name": "pads", },
	"18":  { "color":  2, "name": "vias", },
	// "Unrouted":  { "color":  6, "name": "Unrouted", },
	"20":  { "color": 15, "name": "outline", },
	"21":  { "color":  7, "name": "front-silk-place", },
	"22":  { "color":  7, "name": "back-silk-place", },
	"23":  { "color": 15, "name": "front-origins", },
	"24":  { "color": 15, "name": "back-origins", },
	"25":  { "color":  7, "name": "front-silk-names", },
	"26":  { "color":  7, "name": "back-silk-names", },
	"27":  { "color":  7, "name": "front-silk-values", },
	"28":  { "color":  7, "name": "back-silk-values", },
	"29":  { "color":  7, "name": "front-mask-stop", },
	"30":  { "color":  7, "name": "back-mask-stop", },
	"31":  { "color":  7, "name": "front-paste-stencil", },
	"32":  { "color":  7, "name": "back-paste-stencil", },
	"33":  { "color":  6, "name": "front-finish", },
	"34":  { "color":  6, "name": "back-finish", },
	"35":  { "color":  7, "name": "front-glue",  },
	"36":  { "color":  7, "name": "back-glue",  },
	"37":  { "color":  7, "name": "front-test",  },
	"38":  { "color":  7, "name": "back-test",  },
	"39":  { "color":  4, "name": "front-keepout",  },
	"40":  { "color":  1, "name": "back-keepout",  },
	"41":  { "color":  4, "name": "front-restrict",  },
	"42":  { "color":  1, "name": "back-restrict",  },
	"43":  { "color":  2, "name": "via-restrict",  },
	"44":  { "color":  7, "name": "drills",  },
	"45":  { "color":  7, "name": "holes",  },
	"46":  { "color":  3, "name": "milling",  },
	"47":  { "color":  7, "name": "measures",  },
	"48":  { "color":  7, "name": "docs",  },
	"49":  { "color":  7, "name": "reference",  },
	"50":  { "color":  7, "name": "vector",  },
	"51":  { "color":  7, "name": "front-docs",  },
	"52":  { "color":  7, "name": "back-docs", }
};

var eagleLayers = {
	"Top":       { "number":  1, "color":  4, "name": "Top", },
	"Inner1":    { "number":  2, "color": 16, "name": "Inner1", },
	"Inner2":    { "number":  3, "color": 16, "name": "Inner2", },
	"Inner3":    { "number":  4, "color": 16, "name": "Inner3", },
	"Inner4":    { "number":  5, "color": 16, "name": "Inner4", },
	"Inner5":    { "number":  6, "color": 16, "name": "Inner5", },
	"Inner6":    { "number":  7, "color": 16, "name": "Inner6", },
	"Inner7":    { "number":  8, "color": 16, "name": "Inner7", },
	"Inner8":    { "number":  9, "color": 16, "name": "Inner8", },
	"Inner9":    { "number": 10, "color": 16, "name": "Inner9", },
	"Inner10":   { "number": 11, "color": 16, "name": "Inner10", },
	"Inner11":   { "number": 12, "color": 16, "name": "Inner11", },
	"Inner12":   { "number": 13, "color": 16, "name": "Inner12", },
	"Inner13":   { "number": 14, "color": 16, "name": "Inner13", },
	"Inner14":   { "number": 15, "color": 16, "name": "Inner14", },
	"Bottom":    { "number": 16, "color":  1, "name": "Bottom", },
	"Pads":      { "number": 17, "color":  2, "name": "Pads", },
	"Vias":      { "number": 18, "color":  2, "name": "Vias", },
	"Unrouted":  { "number": 19, "color":  6, "name": "Unrouted", },
	"Dimension": { "number": 20, "color": 15, "name": "Dimension", },
	"tPlace":    { "number": 21, "color":  7, "name": "tPlace", },
	"bPlace":    { "number": 22, "color":  7, "name": "bPlace", },
	"tOrigins":  { "number": 23, "color": 15, "name": "tOrigins", },
	"bOrigins":  { "number": 24, "color": 15, "name": "bOrigins", },
	"tNames":    { "number": 25, "color":  7, "name": "tNames", },
	"bNames":    { "number": 26, "color":  7, "name": "bNames", },
	"tValues":   { "number": 27, "color":  7, "name": "tValues", },
	"bValues":   { "number": 28, "color":  7, "name": "bValues", },
	"tStop":     { "number": 29, "color":  7, "name": "tStop", },
	"bStop":     { "number": 30, "color":  7, "name": "bStop", },
	"tCream":    { "number": 31, "color":  7, "name": "tCream", },
	"bCream":    { "number": 32, "color":  7, "name": "bCream", },
	"tFinish":   { "number": 33, "color":  6, "name": "tFinish", },
	"bFinish":   { "number": 34, "color":  6, "name": "bFinish", },
	"tGlue":     { "number": 35, "color":  7, "name": "tGlue",  },
	"bGlue":     { "number": 36, "color":  7, "name": "bGlue",  },
	"tTest":     { "number": 37, "color":  7, "name": "tTest",  },
	"bTest":     { "number": 38, "color":  7, "name": "bTest",  },
	"tKeepout":  { "number": 39, "color":  4, "name": "tKeepout",  },
	"bKeepout":  { "number": 40, "color":  1, "name": "bKeepout",  },
	"tRestrict": { "number": 41, "color":  4, "name": "tRestrict",  },
	"bRestrict": { "number": 42, "color":  1, "name": "bRestrict",  },
	"vRestrict": { "number": 43, "color":  2, "name": "vRestrict",  },
	"Drills":    { "number": 44, "color":  7, "name": "Drills",  },
	"Holes":     { "number": 45, "color":  7, "name": "Holes",  },
	"Milling":   { "number": 46, "color":  3, "name": "Milling",  },
	"Measures":  { "number": 47, "color":  7, "name": "Measures",  },
	"Document":  { "number": 48, "color":  7, "name": "Document",  },
	"Reference": { "number": 49, "color":  7, "name": "Reference",  },
	"dxf":       { "number": 50, "color":  7, "name": "dxf",  },
	"tDocu":     { "number": 51, "color":  7, "name": "tDocu",  },
	"bDocu":     { "number": 52, "color":  7, "name": "bDocu", }
};

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
		rad11 = Math.atan2 (y1 - cy1, cx1 - x1),
		rad12 = Math.atan2 (y2 - cy1, cx1 - x2),
		rad21 = Math.atan2 (y1 - cy2, cx2 - x1),
		rad22 = Math.atan2 (y2 - cy2, cx2 - x2),
		angle1 = (rad11 - rad12)/Math.PI*180,
		angle2 = (rad21 - rad22)/Math.PI*180,
		dAngle1 = (angle - angle1) % 360,
		dAngle2 = (angle - angle2) % 360;

	if (-0.0000001 < dAngle1 && dAngle1 < 0.0000001) {
		return [cx1, cy1, rad11, r];
	} else if (-0.0000001 < dAngle2 && dAngle2 < 0.0000001) {
		return [cx2, cy2, rad21, r];
	} else {
		console.log ("something wrong: angle:", angle, "angle1:", angle1, "dangle1", (-0.0000001 < dAngle1 && dAngle1 < 0.0000001), "angle2:", angle2, "dangle2:", (-0.0000001 < dAngle2 && dAngle2 < 0.0000001));
		return [cx2, cy2, rad21, r];
	}

	// return [cx1, cy1, cx2, cy2];
}

function layerNameByNumber (layerNum) {
	// it is via?
	var via = layerNum.match (/^(\d+)-(\d+)$/);
	if (via) {
		return [
			LAYER_MAP[via[1]].name,
			LAYER_MAP[via[2]].name
		]
	}
	if (!LAYER_MAP[layerNum]) {
		console.trace ('Skipping layer ' + layerNum);
	}
	return LAYER_MAP[layerNum].name;
}

export default class EagleXML {
	constructor (board) {
		this.context = [];
		this.chunk = ""; // TODO: use a node compatible Buffers

		this.cmd = null;
		this.context = [];
		this.args = false;
		this.stringContext = false;
		this.token = "";

		this.netByNumber = {};
		this.netByName   = {};
		this.netClass    = {};

		// store by eagle name
		board.eagleLayersByName = {};
		// store by eagle number
		board.layersByNumber = {};

		board.elements = {};

		board.signals = {};

		board.packagesByName = {};

		board.plain = {
			wires: {},
			texts: {},
		};

		board.coordYFlip = false;

		board.sourceType = 'design';

		this.board = board;
	}

	static canParse (text) {
		if (typeof Buffer !== 'undefined' && text instanceof Buffer)  {
			text = text.toString ('utf8');
		}
		if (text.match (/\<\?xml/) && text.match (/\<eagle/)) return true;
	}

	static name () {
		return "eagle xml brd"
	}

	get layerMapping () {

	}



	eagleLayer (layerName) {
		// eagle draw will replace layer info accordingly
		if (layerName === "*.Cu") layerName = "Front";
		if (layerName === "*.Mask") layerName = "F.Mask";
		if (!layerMaps[layerName]) return;
		return eagleLayers [layerMaps[layerName]];
	}

	parse (text) {
		if (typeof Buffer !== 'undefined' && text instanceof Buffer)  {
			text = text.toString ('utf8');
		}
		var parser = new DOMParser ();
		var boardXML = parser.parseFromString (text, "text/xml");
		this.parseDOM (boardXML);
	}

	parseDOM (boardXML) {

		var board = this.board;
		// store by eagle name
		board.eagleLayersByName = {};
		// store by eagle number
		board.layersByNumber = {};

		var layers = boardXML.getElementsByTagName('layer');
		for (var layerIdx = 0; layerIdx < layers.length; layerIdx++) {
			var layerDict = this.parseLayer (layers[layerIdx]);
			board.eagleLayersByName[layerDict.name] = layerDict;
			board.layersByNumber[layerDict.number]  = layerDict;
		}

		board.elements = {};
		var elements = boardXML.getElementsByTagName('element');
		for (var elementIdx = 0; elementIdx < elements.length; elementIdx++) {
			var elemDict = this.parseElement (elements[elementIdx])
			board.elements[elemDict.name] = elemDict;
		}

		board.designRules = {};
		//hashmap signal name -> hashmap layer number -> hashmap 'wires'->wires array, 'vias'->vias array
		var rules = boardXML.getElementsByTagName('designrules');
		for (var ruleIdx = 0; ruleIdx < rules.length; ruleIdx++) {
			var rule = rules[ruleIdx];

			var ruleParams = rule.getElementsByTagName('param');
			for (var ruleParamIdx = 0; ruleParamIdx < ruleParams.length; ruleParamIdx++) {
				var ruleParam = ruleParams[ruleParamIdx];
				var ruleParamVal = ruleParam.getAttribute ("value");
				var m;
				if (m = ruleParamVal.match (/^([\d\.]+)mil$/))
					ruleParamVal = parseFloat(m[1])*0.0254;
				board.designRules[ruleParam.getAttribute ("name")] = ruleParamVal;
			}
		}

		board.signals = {};
		//hashmap signal name -> hashmap layer number -> hashmap 'wires'->wires array, 'vias'->vias array
		var signals = boardXML.getElementsByTagName('signal');
		for (var sigIdx = 0; sigIdx < signals.length; sigIdx++) {
			var signal = signals[sigIdx];
			var name = signal.getAttribute('name');
			var signalLayers = {};
			board.signals[name] = signalLayers;

			var wires = signal.getElementsByTagName('wire');
			for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
				var wireDict = this.parseWire( wires[wireIdx] );
				var layer = wireDict.layer;
				var layerItems = signalLayers[layer] = signalLayers[layer] || {};
				var layerWires = layerItems['wires'] = layerItems['wires'] || [];
				layerWires.push(wireDict);

			}

			var vias = signal.getElementsByTagName('via');
			for (var viaIdx = 0; viaIdx < vias.length; viaIdx++) {
				var viaDict = this.parseVia(vias[viaIdx]);
				var layers = layerNameByNumber (viaDict.layers);
				layers.forEach (layer => {
					var layerItems = signalLayers[layer] = signalLayers[layer] || {};
					var layerVias  = layerItems['vias'] = layerItems['vias'] || [];
					layerVias.push(viaDict);
				})
			}

			var contacts = signal.getElementsByTagName('contactref');
			for (var contactIdx = 0; contactIdx < contacts.length; contactIdx++) {
				var contact = contacts[contactIdx];
				var elemName = contact.getAttribute('element');
				var padName = contact.getAttribute('pad');
				var elem = board.elements[elemName];
				if (elem) elem.padSignals[padName] = name;
			}
		}

		board.packagesByName = {};
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

			var packageRects = [];
			var rects = pkg.getElementsByTagName('rectangle');
			for (var rectIdx = 0; rectIdx < rects.length; rectIdx++) {
				var rect = rects[rectIdx];
				packageRects.push(this.parseRect(rect));
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

			var bbox = calcBBox (packageWires);

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
				rects: packageRects,
				description: description
			};
			board.packagesByName[packageName] = packageDict;
		}

		board.plain.wires = {};
		board.plain.texts = {};
		board.plain.holes = [];
		var plains = boardXML.getElementsByTagName('plain');    //Usually only one
		for (var plainIdx = 0; plainIdx < plains.length; plainIdx++) {
			var plain = plains[plainIdx],
				wires = plain.getElementsByTagName('wire'),
				texts = plain.getElementsByTagName('text'),
				holes = plain.getElementsByTagName('hole');
			for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
				var wire = wires[wireIdx],
					wireDict = this.parseWire(wire),
					layer = wireDict.layer;
				if (!board.plain.wires[layer]) board.plain.wires[layer] = [];
				board.plain.wires[layer].push(wireDict);
			}

			for (var textIdx = 0; textIdx < texts.length; textIdx++) {
				var text = texts[textIdx],
					textDict = this.parseText(text),
					layer = textDict.layer;
				if (!board.plain.texts[layer]) board.plain.texts[layer] = [];
				board.plain.texts[layer].push(textDict);
			}

			for (var holeIdx = 0; holeIdx < holes.length; holeIdx++) {
				var hole = holes[holeIdx],
					holeDict = this.parseHole(hole);
				board.plain.holes.push(holeDict);
			}
		}
	}

	parseSmd (smd) {
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
			roundness: roundness,
			name:  smd.getAttribute('name'),
			layer: layerNameByNumber (smd.getAttribute('layer'))
		};
	}

	parseRect (rect) {
		return {
			'x1'   : parseFloat(rect.getAttribute('x1')),
			'y1'   : parseFloat(rect.getAttribute('y1')),
			'x2'   : parseFloat(rect.getAttribute('x2')),
			'y2'   : parseFloat(rect.getAttribute('y2')),
			'layer': layerNameByNumber (rect.getAttribute('layer'))
		};
	}


	parsePoly (poly) {
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
			layer: layerNameByNumber (poly.getAttribute('layer')),
			width: width
		};
	}


	parsePad (pad) {
		var drill = parseFloat(pad.getAttribute('drill'));
		var diameter = parseFloat(pad.getAttribute('diameter'));
		// TODO: use proper measurements
		// designrules contains such parameters:
		// restring in pads and vias are defined in percent of the drill diameter
		// rvPadTop, rvPadInner, rvPadBottom — is a restring for top, inner and bottom layers
		// rlMinPadTop, rlMaxPadTop — min and max limits for top layer and so on

		if (isNaN (diameter)) diameter = drill * 1.5;
		var padRot = pad.getAttribute('rot') || "R0"
		return {
			x:     parseFloat(pad.getAttribute('x')),
			y:     parseFloat(pad.getAttribute('y')),
			drill: drill,
			name:  pad.getAttribute('name'),
			shape: pad.getAttribute('shape'),
			diameter: diameter,
			rot:   padRot
		};
	}

	parseVia (via) {
		// TODO: use proper measurements
		// designrules contains such parameters:
		// restring in pads and vias are defined in percent of the drill diameter
		// rvViaOuter, rvViaInner — is a restring for top/bottom and inner layers
		// rlMinViaOuter, rlMaxViaOuter — min and max limits for top layer and so on

		// TODO: check for inner vias
		var drill = parseFloat(via.getAttribute('drill'));
		var viaType = 'Outer';
		var dr = this.board.designRules;
		var viaMult = parseFloat (dr['rvVia' + viaType]);
		var viaMax  = parseFloat (dr['rlMaxVia' + viaType]);
		var viaMin  = parseFloat (dr['rlMinVia' + viaType]);
		var viaRest = drill * viaMult;
		if (viaRest < viaMin) {
			viaRest = viaMin;
		} else if (viaRest > viaMax) {
			viaRest = viaMax;
		}

		return {
			x:        parseFloat(via.getAttribute('x')),
			y:        parseFloat(via.getAttribute('y')),
			drill:    drill,
			diameter: drill + viaRest*2,
			layers:   via.getAttribute('extent'),
			shape:    via.getAttribute('shape')
		};
	}

	parseHole (hole) {
		return {
			'x':parseFloat(hole.getAttribute('x')),
			'y':parseFloat(hole.getAttribute('y')),
			'drill':parseFloat(hole.getAttribute('drill'))
		};
	}

	parseWire (wire) {
		var width = parseFloat(wire.getAttribute('width'));
		if (width <= 0.0) width = this.minLineWidth;

		var layer = layerNameByNumber (wire.getAttribute('layer'));

		var x1 = parseFloat(wire.getAttribute('x1')),
			y1 = parseFloat(wire.getAttribute('y1')),
			x2 = parseFloat(wire.getAttribute('x2')),
			y2 = parseFloat(wire.getAttribute('y2'));

		var style = wire.getAttribute ("style");

		var curve = parseInt(wire.getAttribute('curve'));

		if (curve) {

			var center = circleCenter (x1, y1, x2, y2, curve);

			var angle = Math.PI * (curve/180);

			if (angle < 0) {
				center[2] += - angle;
				angle = - angle;
			}

			return {
				x: center[0],
				y: center[1],
				radius: center[3],
				start: Math.PI - center[2],
				angle: angle,
				curve: curve,
				width: width,
				layer: layer,
				style: style,
				cap: wire.getAttribute('cap'),
				rot: wire.getAttribute('rot') || "R0"
			}
		}

		return {
			x1: x1,
			y1: y1,
			x2: x2,
			y2: y2,
			style: style,
			width: width,
			layer: layer
		};

	}

	parseCircle (wire) {
		var width = parseFloat(wire.getAttribute('width'));
		if (width <= 0.0) width = this.minLineWidth;

		var layer = layerNameByNumber (wire.getAttribute('layer'));

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


	parseText (text) {
		var content = text.textContent;
		if (!content) content = "";
		var textRot = text.getAttribute('rot') || "R0";
		var textAlign = text.getAttribute('align') || "",
			align,
			valign,
			textAngle = angleForRot (textRot);

		if (textAlign === "center") {
			align = "center";
			valign = "middle";
		} else {
			if (textAlign.match (/\-right$/)) {
				align = "right";
			} else if (textAlign.match (/\-left$/)) {
				align = "left";
			} else if (textAlign.match (/\-center$/)) {
				align = "center";
			}
			if (textAlign.match (/^top\-/)) {
				valign = "top";
			} else if (textAlign.match (/^bottom\-/)) {
				valign = "bottom";
			} else if (textAlign.match (/^center\-/)) {
				valign = "middle";
			}
		}

		return {
			x:       parseFloat(text.getAttribute('x')),
			y:       parseFloat(text.getAttribute('y')),
			size:    parseFloat(text.getAttribute('size')),
			layer:   layerNameByNumber (text.getAttribute('layer')),
			ratio:   parseInt(text.getAttribute('ratio')),
			interlinear: parseInt(text.getAttribute('distance')) || 50,
			align:   align,
			valign:  valign,
			rot:     textRot,
			flipText: ((textAngle.degrees > 90) && (textAngle.degrees <=270)),
			font:    text.getAttribute('font'),
			content: content
		};
	}

	parseElement (elem) {
		var elemRot    = elem.getAttribute('rot') || "R0",
			elemMatrix = matrixForRot (elemRot);

		var attribs = {},
			elemAngle = angleForRot (elemRot),
			flipText = (elemAngle.degrees >= 90) && (elemAngle.degrees <= 270),
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
				if (elemAttrib.getAttribute('layer')) { attribDict.layer = layerNameByNumber (elemAttrib.getAttribute('layer')); }
				attribDict.font = elemAttrib.getAttribute('font');

				var rot = elemAttrib.getAttribute('rot');
				if (!rot) { rot = "R0"; }
				var attribAngle = angleForRot (rot);
				attribDict.flipText = (attribAngle.degrees >= 90) && (attribAngle.degrees <= 270);
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
			'flipText'  : flipText,
			'smashed'   : elem.getAttribute('smashed') && (elem.getAttribute('smashed').toUpperCase() == 'YES'),
			'attributes': attribs,
			'padSignals': {}			//to be filled later
		};
	};

	parseLayer (layer) {
		return {
			'name'  : layer.getAttribute('name'),
			'number': parseInt(layer.getAttribute('number')),
			'color' : parseInt(layer.getAttribute('color'))
		};
	}

}
