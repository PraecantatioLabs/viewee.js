function KicadNewParser (board) {
	this.context = [];
	this.chunk = ""; // TODO: use a node compatible Buffers

	this.cmd = null;
	this.context = [];
	this.args = false;
	this.stringContext = false;
	this.token = "";

	this.netNameByNumer = {};

	// store by eagle name
	board.eagleLayersByName = {};
	// store by eagle number
	board.layersByNumber = {};

	board.elements = {};

	board.signalItems = {};

	board.packagesByName = {};

	board.plainWires = {};
	board.plainTexts = {};

	this.board = board;
}

var layerMaps = {
	"Front": "Top",
	"Back": "Bottom",
	"B.Adhes": "bGlue",
	"F.Adhes": "tGlue",
	"B.Paste": "bCream",
	"F.Paste": "tCream",
	"B.SilkS": "bNames",
	"F.SilkS": "tNames",
	"B.Mask": "bStop",
	"F.Mask": "tStop",
	"Dwgs.User": "tValues",
	//(41 Cmts.User user)
	//(42 Eco1.User user)
	//(43 Eco2.User user)
	"Edge.Cuts": "Dimension"
};

var eagleLayers = {
	"Top": { "name": "Top", "number": 1, "color": 4 },
	"Bottom": { "name": "Bottom", "number": 16, "color": 1 },
	"Pads": { "name": "Pads", "number": 17, "color": 2 },
	"Vias": { "name": "Vias", "number": 18, "color": 2 },
	"Unrouted": { "name": "Unrouted", "number": 19, "color": 6 },
	"Dimension": { "name": "Dimension", "number": 20, "color": 15 },
	"tPlace": { "name": "tPlace", "number": 21, "color": 7 },
	"bPlace": { "name": "bPlace", "number": 22, "color": 7 },
	"tOrigins": { "name": "tOrigins", "number": 23, "color": 15 },
	"bOrigins": { "name": "bOrigins", "number": 24, "color": 15 },
	"tNames": { "name": "tNames", "number": 25, "color": 7 },
	"bNames": { "name": "bNames", "number": 26, "color": 7 },
	"tValues": { "name": "tValues", "number": 27, "color": 7 },
	"bValues": { "name": "bValues", "number": 28, "color": 7 },
	"tStop": { "name": "tStop", "number": 29, "color": 7 },
	"bStop": { "name": "bStop", "number": 30, "color": 7 },
	"tCream": { "name": "tCream", "number": 31, "color": 7 },
	"bCream": { "name": "bCream", "number": 32, "color": 7 },
	"tFinish": { "name": "tFinish", "number": 33, "color": 6 },
	"bFinish": { "name": "bFinish", "number": 34, "color": 6 },
	"tGlue": { "name": "tGlue", "number": 35, "color": 7 },
	"bGlue": { "name": "bGlue", "number": 36, "color": 7 },
	"tTest": { "name": "tTest", "number": 37, "color": 7 },
	"bTest": { "name": "bTest", "number": 38, "color": 7 },
	"tKeepout": { "name": "tKeepout", "number": 39, "color": 4 },
	"bKeepout": { "name": "bKeepout", "number": 40, "color": 1 },
	"tRestrict": { "name": "tRestrict", "number": 41, "color": 4 },
	"bRestrict": { "name": "bRestrict", "number": 42, "color": 1 },
	"vRestrict": { "name": "vRestrict", "number": 43, "color": 2 },
	"Drills": { "name": "Drills", "number": 44, "color": 7 },
	"Holes": { "name": "Holes", "number": 45, "color": 7 },
	"Milling": { "name": "Milling", "number": 46, "color": 3 },
	"Measures": { "name": "Measures", "number": 47, "color": 7 },
	"Document": { "name": "Document", "number": 48, "color": 7 },
	"Reference": { "name": "Reference", "number": 49, "color": 7 },
	"dxf": { "name": "dxf", "number": 50, "color": 7 },
	"tDocu": { "name": "tDocu", "number": 51, "color": 7 },
	"bDocu": { "name": "bDocu", "number": 52, "color": 7 },
	"tGND_GNDA": { "name": "tGND_GNDA", "number": 53, "color": 7 },
	"bGND_GNDA": { "name": "bGND_GNDA", "number": 54, "color": 1 },
	"wert": { "name": "wert", "number": 56, "color": 7 },
	"Nets": { "name": "Nets", "number": 91, "color": 2 },
	"Busses": { "name": "Busses", "number": 92, "color": 1 },
	"Pins": { "name": "Pins", "number": 93, "color": 2 },
	"Symbols": { "name": "Symbols", "number": 94, "color": 4 },
	"Names": { "name": "Names", "number": 95, "color": 7 },
	"Values": { "name": "Values", "number": 96, "color": 7 },
	"Info": { "name": "Info", "number": 97, "color": 7 },
	"Guide": { "name": "Guide", "number": 98, "color": 6 },
	"Muster": { "name": "Muster", "number": 100, "color": 7 },
	"Patch_Top": { "name": "Patch_Top", "number": 101, "color": 12 },
	"Vscore": { "name": "Vscore", "number": 102, "color": 7 },
	"fp3": { "name": "fp3", "number": 103, "color": 7 },
	"Name": { "name": "Name", "number": 104, "color": 7 },
	"Beschreib": { "name": "Beschreib", "number": 105, "color": 9 },
	"BGA-Top": { "name": "BGA-Top", "number": 106, "color": 4 },
	"BD-Top": { "name": "BD-Top", "number": 107, "color": 5 },
	"fp8": { "name": "fp8", "number": 108, "color": 7 },
	"fp9": { "name": "fp9", "number": 109, "color": 7 },
	"fp0": { "name": "fp0", "number": 110, "color": 7 },
	"Patch_BOT": { "name": "Patch_BOT", "number": 116, "color": 9 },
	"_tsilk": { "name": "_tsilk", "number": 121, "color": 7 },
	"_bsilk": { "name": "_bsilk", "number": 122, "color": 7 },
	"tTestmark": { "name": "tTestmark", "number": 123, "color": 7 },
	"bTestmark": { "name": "bTestmark", "number": 124, "color": 7 },
	"tAdjust": { "name": "tAdjust", "number": 131, "color": 7 },
	"bAdjust": { "name": "bAdjust", "number": 132, "color": 7 },
	"HeatSink": { "name": "HeatSink", "number": 151, "color": 7 },
	"200bmp": { "name": "200bmp", "number": 200, "color": 1 },
	"201bmp": { "name": "201bmp", "number": 201, "color": 2 },
	"202bmp": { "name": "202bmp", "number": 202, "color": 3 },
	"203bmp": { "name": "203bmp", "number": 203, "color": 4 },
	"204bmp": { "name": "204bmp", "number": 204, "color": 5 },
	"205bmp": { "name": "205bmp", "number": 205, "color": 6 },
	"206bmp": { "name": "206bmp", "number": 206, "color": 7 },
	"207bmp": { "name": "207bmp", "number": 207, "color": 8 },
	"208bmp": { "name": "208bmp", "number": 208, "color": 9 },
	"209bmp": { "name": "209bmp", "number": 209, "color": 7 },
	"210bmp": { "name": "210bmp", "number": 210, "color": 7 },
	"Descript": { "name": "Descript", "number": 250, "color": 3 },
	"SMDround": { "name": "SMDround", "number": 251, "color": 12 },
	"cooling": { "name": "cooling", "number": 254, "color": 7 }
};

KicadNewParser.prototype.eagleLayer = function (layerName) {
	return eagleLayers [layerMaps[layerName]];
}

KicadNewParser.prototype.parse = function (text) {

	text = text.toString();

	text.split(/[\r\n]+/g).forEach (this.parseChunk, this);

	this.cmdCb = function (cmd, context) {

	}
}

KicadNewParser.prototype.parseChunk = function (chunk) {
	this.chunk += chunk;

	this.chunk.split (/[\s]/).forEach (function (token) {
		//if ()
	}, this);
}

KicadNewParser.prototype.parseChunk = function (chunk) {
	var str = chunk.toString();
	var l = str.length;

	for (var i = 0; i<l; i++) {
		var c = str[i];

		if (c === '"') {
			this.stringContext = !this.stringContext;
			continue;
		}

		if (this.stringContext) {
			this.token += c;
			continue;
		}

		if (c === '(') {
			this.args = false;

			if (!this.cmd) {
				this.cmd = {name: "", args: []};
			} else {
				var newCmd = {name: "", args: []};
				this.cmd.args.push (newCmd);
				this.cmd = newCmd;
			}

			this.context.push(this.cmd);
		} else if (c === ')') {

			this.handleToken();

			if (this.context.length === 1) {
				// TODO: this.parseCompleted ();
				return;
			}

			this.context.pop();

			this.cmdDone (this.cmd);

			this.cmd = this.context[this.context.length-1];

		} else if (c === ' ') {
			this.handleToken();
		} else {
			this.token += c;
		}
	}
}

KicadNewParser.prototype.handleToken = function () {
	var trimmed = this.token.trim();

	if (!this.args) {
		this.args = true;
		this.cmd.name = this.token;
	} else if (trimmed) {
		this.cmd.args.push (trimmed);
	}
	this.token = "";
}

KicadNewParser.prototype.extractAttrs = function (args) {
	var attrs = {};
	args.forEach (function (arg) {
		if (!arg.name) {
			return;
		}

		attrs[arg.name] = arg.args;
	}, this);
	return attrs;
}

KicadNewParser.prototype.parseGrLine = function (cmd) {
	cmd.attrs = this.extractAttrs (cmd.args);
	var line = {
		x1: parseFloat (cmd.attrs.start[0]),
		y1: parseFloat (cmd.attrs.start[1]),
		x2: parseFloat (cmd.attrs.end[0]),
		y2: parseFloat (cmd.attrs.end[1]),
		width: parseFloat (cmd.attrs.width[0]),
		layer: cmd.attrs.layer[0]
	};
	if (cmd.name === "gr_arc") {
		line.curve = parseFloat (cmd.attrs.angle[0]);
	}
	return line;
}

KicadNewParser.prototype.parseGrText = function (cmd) {
	cmd.attrs = this.extractAttrs (cmd.args);

	// semantics, oh my: font size contained in effects/font/size
	var effects = cmd.attrs.effects;
	cmd.attrs.effects = {};
	effects.forEach (function (eff) {
		if (eff.name === "font") {
			cmd.attrs.effects[eff.name] = this.extractAttrs (eff.args);
		} else {
			cmd.attrs.effects[eff.name] = eff.args;
		}
	}, this);
	var text = {
		x: parseFloat (cmd.attrs.at[0]),
		y: parseFloat (cmd.attrs.at[1]),
		// TODO: size has two children, do something if those don't match
		size: parseFloat (cmd.attrs.effects.font.size[0]),
		layer: cmd.attrs.layer[0],
		content: cmd.args[0]
	};

	var rotate = parseFloat (cmd.attrs.at[2]) || 0;
	text.rot = "R" + rotate;

	if (cmd.attrs.effects.justify) {
		if (cmd.attrs.effects.justify.indexOf ("mirror") > -1)
		text.rot = "M"+text.rot;
	}

	// TODO: effects.attrs.thickness, effects.attrs.justify
	// TODO: rotated text?

	return text;
}

KicadNewParser.prototype.parseVia = function (cmd) {
	cmd.attrs = this.extractAttrs (cmd.args);
	var via = {
		x: parseFloat (cmd.attrs.at[0]),
		y: parseFloat (cmd.attrs.at[1]),
		// TODO: size has two children, do something if those don't match
		drill: parseFloat (cmd.attrs.size[0]),
		layers: cmd.attrs.layers
		// shape?
	};
	return via;
}


KicadNewParser.prototype.cmdDone = function () {
	var contextPath = this.context.map (function (cmd) {return cmd.name}).join (">");
	// console.log (contextPath, this.cmd);

	if (contextPath !== "kicad_pcb") {
		return;
	}

	// layers
	if (this.cmd.name === "layers") {
		this.cmd.args.forEach (function (arg) {
			var eagleLayer = this.eagleLayer (arg.args[0]);

			if (!eagleLayer) return;

			// TODO: make a parser interface for this
			this.board.eagleLayersByName[eagleLayer.name] = eagleLayer;
			this.board.layersByNumber[eagleLayer.number]  = eagleLayer;
		}, this);
		// console.log (this.cmd, line);
	}

	// nets
	if (this.cmd.name === "net") {
		var net = {number: this.cmd.args[0], name: this.cmd.args[1]};
		this.netNameByNumer[net.number] = net.name;
	}

	// regular wires
	if (this.cmd.name === "gr_line" || this.cmd.name === "gr_arc") {
		var line = this.parseGrLine (this.cmd);
		// console.log (this.cmd, line);
		var eagleLayerNumber = this.eagleLayer (line.layer).number;
		if (!this.board.plainWires[eagleLayerNumber]) this.board.plainWires[eagleLayerNumber] = [];
		this.board.plainWires[eagleLayerNumber].push (line);
	}

	// signal wires
	if (this.cmd.name === "segment" || this.cmd.name === "via") {
		var entity;
		var entType;
		if (this.cmd.name === "segment") {
			entity = this.parseGrLine (this.cmd);
			entType = "wires";
		} else {
			entity = this.parseVia (this.cmd);
			entType = "vias";
		}
		var netNum = this.cmd.attrs.net;
		var netName = this.netNameByNumer[netNum];
		// console.log (this.cmd, line, netName);
		if (!this.board.signalItems[netName]) this.board.signalItems[netName] = {};
		var signalLayerItems = this.board.signalItems[netName];
		var eagleLayerNumber;
		if (entity.layers) {
			eagleLayerNumber = entity.layers.map (function (layer) {
				return this.eagleLayer (layer).number;
			}, this).join ("-");
		} else {
			eagleLayerNumber = this.eagleLayer (entity.layer).number;
		}

		if (!signalLayerItems[eagleLayerNumber])
			signalLayerItems[eagleLayerNumber] = {wires: [], vias: []};
		signalLayerItems[eagleLayerNumber][entType].push (entity);

		if (entType === 'vias') {
			console.log (entity.drill);
		}
	}

	if (this.cmd.name === "gr_text") {
		var text = this.parseGrText (this.cmd);
		var eagleLayerNumber = this.eagleLayer (text.layer).number;
		// console.log (this.cmd, text, this.cmd.attrs.effects, eagleLayerNumber);
		if (!this.board.plainTexts[eagleLayerNumber]) this.board.plainTexts[eagleLayerNumber] = [];
		this.board.plainTexts[eagleLayerNumber].push (text);
	}

	return;

	if (contextPath === "kicad_pcb>segment") {

	}
	if (contextPath === "kicad_pcb>module") {

	}
	if (contextPath === "kicad_pcb>via") {

	}
	if (contextPath === "kicad_pcb>zone") {

	}
}


if (typeof process !== "undefined") {
	var kp = new KicadNewParser ();
	var fs = require ("fs");
	kp.parse (fs.readFileSync (process.argv[2]));
}
