// unusable https://github.com/garretfick/easyeda-importer/blob/master/src/easyeda/arc.js

var DOCTYPE = {
	SCH:'1',
	SCHLIB:'2',
	PCB:'3',
	PCBLIB:'4',
	PRJ:'5',
	SUBPART:'6',
	SPICESYMBOL:'7',
	SUBCKT:'8',
	WAVEFORM:'10'
};

var LAYER_NAMES = {
	TopLayer:          {color: "#FF0000", name: "front-copper"},
	BottomLayer:       {color: "#33CCFF", name: "back-copper"},
	TopSilkLayer:      {color: "#FFFF00", name: "front-silk"},
	BottomSilkLayer:   {color: "#808000", name: "back-silk"},
	TopPasterLayer:    {color: "#808080", name: "front-paste-stencil"},
	BottomPasterLayer: {color: "#800000", name: "back-paste-stencil"},
	TopSolderLayer:    {color: "#800080", name: "front-mask-stop"},
	BottomSolderLayer: {color: "#AA00FF", name: "back-mask-stop"},
	Ratlines:          {color: "#33FFFF"}, // unrouted?
	BoardOutline:      {color: "#FF00FF", name: "outline"},
	All:               {color: "#C0C0C0"}, // displayed on every layer (title: Multi-Layer)
	Document:          {color: "#FFFFFF", name: "docs"},
	TopAssembly:       {color: "#33CC99"},
	BottomAssembly:    {color: "#5555FF"},
	Mechanical:        {color: "#F022F0"},
	Inner1:            {color: "#FF9966", name: "inner-1"},
	Inner2:            {color: "#FF33CC", name: "inner-2"},
	Inner3:            {color: "#00FF00", name: "inner-3"},
	Inner4:            {color: "#000080", name: "inner-4"},
	Hole:              {color: "#663399", name: "holes"},
	DRCError:          {color: "#FFFFFF"}
};

export default class EasyEDAPCB {
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
			holes: []
		};

		board.coordYFlip = false;

		this.board = board;

		this.LAYER_IDS = {};
	}

	static get sourceType () {
		return 'design';
	}

	static canParse (text) {
		if (typeof Buffer !== 'undefined' && text instanceof Buffer)  {
			text = text.toString ('utf8');
		}

		// we should check for real JSON
		if (text.match (/^\{/) && text.match (/\"head\"\s*:\s*\"3/m)) return true;
	}

	static name () {
		return "easyeda pcb"
	}

	static props (str) {
		return str.split ('~');
	}

	static layerByNumber () {
		var layer = this.LAYER_IDS[layerNum] ? LAYER_NAMES[this.LAYER_IDS[layerNum].name] : undefined;
		if (layer) {

		}
	}

	layerNameByNumber (layerNum) {
		// it is via?
		var via = layerNum.match (/^(\d+)-(\d+)$/);
		if (via) {
			return [
				LAYER_NAMES[via[1]].name,
				LAYER_NAMES[via[2]].name
			]
		}
		if (!this.LAYER_IDS[layerNum] && !LAYER_NAMES[this.LAYER_IDS[layerNum].name]) {
			console.trace ('Skipping layer ' + layerNum);
		}
		return LAYER_NAMES[this.LAYER_IDS[layerNum].name].name;
	}

	layerByNumber (layerNum) {
		// it is via?
		var via = layerNum.match (/^(\d+)-(\d+)$/);
		if (via) {
			return [
				LAYER_NAMES[via[1]],
				LAYER_NAMES[via[2]]
			]
		}
		if (!this.LAYER_IDS[layerNum] && !LAYER_NAMES[this.LAYER_IDS[layerNum].name]) {
			console.trace ('Skipping layer ' + layerNum);
		}
		return LAYER_NAMES[this.LAYER_IDS[layerNum].name];
	}

	parse (text) {
		if (typeof Buffer !== 'undefined' && text instanceof Buffer)  {
			text = text.toString ('utf8');
		}

		var pcbData;

		// this can be problematic for large JSON files
		// TODO: check another way
		try {
			pcbData = JSON.parse (text);
		} catch (e) {

		}

		var [docType, edaVersion, docAttrData] = EasyEDAPCB.props (pcbData.head);

		console.log (docType, edaVersion, docAttrData);

		// CA~2400~2400~#000000~yes~#FFFFFF~10~1200~1200~line~5~mil~9~45~visible~0.5
		var canvasData = EasyEDAPCB.props (pcbData.canvas);

		if (canvasData[0] !== 'CA') {
			return null;
		}

		var viewBox = {
				width:  canvasData[1], //: 2400(24000 mil), View Box Width / Canvas width = scaleX = 2
				height: canvasData[2], //: 2400(24000 mil),View Box Height / Canvas Height = scaleY = 2
			},
			backgroundColor = canvasData[3],
			grid = {
				visible: canvasData[4] === 'yes',
				color:   canvasData[5],
				size:    canvasData[6], // 10 = 100 mil
				style:   canvasData[9], // line/dot
			},
			canvas = {
				width:  canvasData[7], //: 1200(12000 mil)
				height: canvasData[8], //: 1200(12000 mil)
			},
			snapSize = canvasData[10],
			unit = canvasData[11], // mil(inch, mil, mm)
			routing = {
				width: canvasData[12], // 1 (10mil)
				angle: canvasData[13], // 45 degree( 45 90 free)
			},
			copper = canvasData[14],
			altSnapSize = canvasData[15],
			origin = {
				x: canvasData[16],
				y: canvasData[17]
			};

		// 1~TopLayer~#FF0000~true~true~true
		pcbData.layers.forEach (layerStr => {
			// TODO
			var layerProps = EasyEDAPCB.props (layerStr);

			this.LAYER_IDS[layerProps[0]] = {
				name:    layerProps[1],
				color:   layerProps[2],
				visible: layerProps[3],
				active:  layerProps[4],
				config:  layerProps[5] === "true"
			}
			/*
			layer id: 1
			layer name: TopLayer
			layer color: #FF0000
			visible: true, hints the objects in this layer show or hide
			active: false. active layer
			config: true. if be set false, you can't see it on the layer toolbar.
			*/


		});

		/*
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
				var layerItems = signalLayers[layers] = signalLayers[layers] || {};
				var layerVias  = layerItems['vias'] = layerItems['vias'] || [];
				layerVias.push(viaDict);
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
		*/

		this.board.signals = {};

		pcbData.shape.forEach (shapeStr => {

			var shapeProps = EasyEDAPCB.props (shapeStr);

			switch (shapeProps[0]) {
				case "TRACK":
					var wires = this.parseTrack (shapeProps);

					wires.forEach (wire => {
						var layer = this.layerByNumber (wire.layer);
						//if (layer.isCopper) {
							var signalLayers = this.board.signals[wire.signal] = this.board.signals[wire.signal] || {};

							var layerItems = signalLayers[layer.name] = signalLayers[layer.name] || {};
							var layerWires = layerItems['wires'] = layerItems['wires'] || [];
							layerWires.push (wire);
						//}
					});

					break;

				/*
				case "COPPERAREA":
					var poly = this.parsePolygon (shapeProps);
				case "RECT":
					var rect = this.parseRect (shapeProps);
				case "CIRCLE":
					var circle = this.parseCircle (shapeProps);
				case "SOLIDREGION":
					var poly = this.parsePolygon (shapeProps);
				case "TEXT":
					var text = this.parseText (shapeProps);
				case "ARC":
					var arc = this.parseArc (shapeProps);
				case "PAD":
					var pad = this.parsePad (shapeProps);
				case "VIA":
					var via = this.parseVia (shapeProps);
				case "HOLE":
					var hole = this.parseHole (shapeProps);
				case "DIMENSION":
					var dimension = this.parseDimension (shapeProps);
				case "LIB":
					var el = this.parseElement (shapeProps);
				*/
				default:
					console.log ("unknown shape", shapeProps[0]);
			}
			/*
			layer id: 1
			layer name: TopLayer
			layer color: #FF0000
			visible: true, hints the objects in this layer show or hide
			active: false. active layer
			config: true. if be set false, you can't see it on the layer toolbar.
			*/


		});

	}

	parseTrack (args) {
		var common = {
			width: args[1],
			layer: args[2],
			signal: args[3],
			// id: args[5],
			// locked: args[6],
		};

		return args[4].split (' ').reduce ((acc, item, idx, arr) => {
			if (idx % 2 !== 0)
				return acc;
			if (arr.length - idx < 3)
				return acc;
			return acc.concat (Object.assign ({
				x1: parseInt (arr[idx]),
				y1: parseInt (arr[idx+1]),
				x2: parseInt (arr[idx+2]),
				y2: parseInt (arr[idx+3]),
			}, common))
		}, [])
	}
}
