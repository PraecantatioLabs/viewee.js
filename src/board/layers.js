/*
this.visibleLayers = {};
this.visibleLayers[ViewEE.LayerId.BOTTOM_COPPER]        = true;
this.visibleLayers[ViewEE.LayerId.BOTTOM_SILKSCREEN]    = true;
this.visibleLayers[ViewEE.LayerId.BOTTOM_DOCUMENTATION] = true;
this.visibleLayers[ViewEE.LayerId.DIM_BOARD]            = true;
this.visibleLayers[ViewEE.LayerId.TOP_COPPER]           = true;
this.visibleLayers[ViewEE.LayerId.TOP_SILKSCREEN]       = true;
this.visibleLayers[ViewEE.LayerId.TOP_DOCUMENTATION]    = true;
this.visibleLayers[ViewEE.LayerId.VIAS]                 = true;
this.visibleLayers[ViewEE.LayerId.OUTLINE]              = true;
*/

const DESIGN_LAYERS = {
	"drills": { // thru board drills
		"3d": {isMilling: true}

	},
	"holes": { // thru board drills for mount
		"3d": {isMilling: true}
	},
	"milling": { // thru board milling
		"3d": {isMilling: true}
	},
	"outline": { // board outline
		manufacturing: {
			order: 0,
			draw: 'plain.wires'.split (' ')
		},
		"3d": {isOutline: true}
	},
	"docs": { // board docs

	},
	"front-test": { // test points

	},
	"front-docs": { // documentation
		manufacturing: {
			order: 500,
			draw: 'elements plain.wires plain.texts'.split (' ')
		}
	},
	"front-keepout": { // don't place the components here
		manufacturing: {order: 500}
	},
	"front-glue": { // glue placement

	},
	"front-finish": { // gold finish

	},
	"front-origins": { // component origin, used for placement
		// manufacturing: {order: 300}
	},
	"front-silk-place": {// silkscreen outline for components
		manufacturing: {order: 300}
	},
	"front-silk-values": { // silkscreen values for components
		manufacturing: {order: 300}
	},
	"front-silk-names": { // silkscreen names for components
		manufacturing: {order: 300}
	},
	"front-paste-stencil": { // cutout for paste stencil

	},
	"front-mask-stop": { // component placement open for mask
		// manufacturing: {order: 2, invert: true},

	},
	"vias": { // vias layer
		manufacturing: {
			order: 200,
			draw: 'signal.vias'.split (' ')
		}
	},
	"vias-restrict": { // copper restrict

	},
	"pads": { // pads layer

	},
	"front-restrict": { // copper restrict

	},
	"front-copper": { // top copper layer
		manufacturing: {
			order: 100,
			draw: 'signal.wires elements plain.wires plain.texts'.split (' ')
		},
		isCopper: true,
	},
	"inner": { // inner copper layers
		isCopper: true,
	},
	"back-copper": { // bottom copper layer
		manufacturing: {
			order: -100,
			draw: 'signal.wires elements plain.wires plain.texts'.split (' ')
		},
		isCopper: true
	},
	"back-restrict": { // copper restrict

	},
	"back-keepout": { // component keepout

	},
	"back-mask-stop": {  // component placement open for mask

	},
	"back-paste-stencil": { // cutout for paste stencil

	},
	"back-silk-names": { // silkscreen names for components

	},
	"back-silk-values": { // silkscreen values for components

	},
	"back-silk-place": { // silkscreen outline for components

	},
	"back-origins": {// component origin
		manufacturing: {order: 300}
	},

	"back-finish": { // gold finish

	},
	"back-glue": { // glue placement

	},
	"back-test": { // test points

	},
	"back-keepout": { // don't place the components here
		manufacturing: {
			order: -500,
			draw: 'elements plain.wires plain.texts'.split (' ')
		}
	},
	"back-docs": { // documentation
		manufacturing: {
			order: -500,
			draw: 'elements plain.wires plain.texts'.split (' ')
		}
	},
}

// manufacturing is too long to write
const MAKE_LAYERS = {
	"front-silk": {

	},
	"front-mask": {

	},
	"front-copper": {

	},
	"back-copper": {

	},
	"back-mask": {

	},
	"back-silk": {

	}
}

const VIEW_LAYERS = {
	"outline": {
		flipOrder: 1000,
		order: 1000,
		design: {
			layers: 'outline milling'.split (' '),
			draw: 'plain.holes plain.wires'.split (' ')
		}
	},
	"front-docs": {
		design: {
			layers: 'front-docs front-keepout'.split (' '),
			draw: 'elements plain.wires plain.texts'.split (' ')
		},
		order: 600
	},
	"front-silk": {
		design: {
			layers: 'front-silk-names front-silk-values front-silk-places'.split (' '),
			draw: 'elements plain.wires plain.texts'.split (' ')
		},
		order: 500
	},
	"front-mask": {
		make: {
			layers: 'front-mask'
		},
		order: 400
	},
	"front-copper": {
		design: {
			// TODO: eagle copper polygons
			layers: 'front-copper',
			draw: 'elements signal.wires plain.texts'.split (' ')
		},
		order: 200
	},
	"vias": {
		flipOrder: 300,
		order: 300,
		design: {
			// TODO: eagle copper polygons
			layers: 'front-copper back-copper'.split (' '),
			draw: 'signal.vias'.split (' ')
		},
	},
	"dim": {
		flipOrder: 100,
		order: 100,
		design: {
			layers: '*',
			draw: 'dimCanvas'
		}
	},
	"back-copper": {
		design: {
			// TODO: eagle copper polygons
			layers: 'back-copper',
			draw: 'elements signal.wires plain.texts'.split (' ')
		},
		order: -200
	},
	"back-mask": {
		order: -400
	},
	"back-silk": {
		design: {
			layers: 'back-silk-names back-silk-values back-silk-places'.split (' '),
			draw: 'elements plain.wires plain.texts'.split (' ')
		},
		order: -500
	},
	"back-docs": {
		design: {
			layers: 'back-docs back-keepout'.split (' '),
			draw: 'elements plain.wires plain.texts'.split (' ')
		},
		order: -600
	}

}


export default class Layers {
	// [CAD](https://en.wikipedia.org/wiki/Computer-aided_design)
	// [EDA](https://en.wikipedia.org/wiki/Electronic_design_automation)
	// and [CAM](https://en.wikipedia.org/wiki/Computer-aided_manufacturing)
	//
	// Boards usually contains D-Layers, which helps to separate design things
	// like top names and top values. When exporting design to the manufacturing,
	// some layers merges (copper and via for that copper layer or
	// silkscreen parts). I'll name that entity as M(anufacturing)-Layer

	// Board format or CAD software usually specify how to assign D-Layers to the
	// M-Layers; code below belongs to board format, not the base board class

	constructor (sourceType) {
		switch (sourceType.toLowerCase()) {
			case 'make':
			case 'manufacturing':
				this.sourceType = 'make';
				this.sourceLayers = MAKE_LAYERS;
				break;
			case 'design':
				this.sourceType = 'design';
				this.sourceLayers = DESIGN_LAYERS;
				break;
			case 'image':
				this.sourceType = 'image';
				this.sourceLayers = IMAGE_LAYERS;
				break;
			default:
				throw `Cannot instantiate layer object with sourceType === ${sourceType}`;
		}
	}

	enable (layers) {

	}

	disable (layers) {

	}

	flip () {

	}

	CADOrder () {

	}

	mirrorFor (layerName) {
		if (layerName.match (/^front-/))
			return layerName.replace (/^front-/, 'back-');
		if (layerName.match (/^back-/))
			return layerName.replace (/^back-/, 'front-');
		// TODO: inner layers?
		return layerName;
	}

	item (sourceType, layerName) {
		// return layer info from sourceType layer information
		if (arguments.length === 1) {
			return this.sourceLayers[sourceType];
		}

		switch (sourceType) {
			case 'view':
				return VIEW_LAYERS[layerName];
				break;
			case 'make':
			case 'manufacturing':
				return MAKE_LAYERS[layerName];
				break;
			case 'design':
				return DESIGN_LAYERS[layerName];
				break;
			default:
				return;
		}
	}

	viewOrder (flip) {
		var flipMod = flip ? -1 : 1;
		return Object.keys (VIEW_LAYERS).filter (
			l => VIEW_LAYERS[l][this.sourceType] && Object.keys(VIEW_LAYERS[l][this.sourceType]).length
		).sort (
			(l1, l2) => (VIEW_LAYERS[l1].flipOrder || VIEW_LAYERS[l1].order * flipMod || 0) - (VIEW_LAYERS[l2].flipOrder || VIEW_LAYERS[l2].order * flipMod || 0)
		)
	}

	CAMOrder () {

		return Object.keys (MAKE_LAYERS)
			.filter (layerName => MAKE_LAYERS[layerName].manufacturing)
			.sort ((l1, l2) => MAKE_LAYERS[l1].manufacturing.order - MAKE_LAYERS[l2].manufacturing.order)
			//.reduce ((acc, layerName) => {
			//	acc[layerName] = layersMeta[layerName].manufacturing
			//	return acc;
			//}, {})

		/*
		this.renderLayerOrder = [];
		this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_DOCUMENTATION);
		this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_SILKSCREEN);
		this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_COPPER);
		this.renderLayerOrder.push(ViewEE.LayerId.DIM_BOARD);
		this.renderLayerOrder.push(ViewEE.LayerId.OUTLINE);
		this.renderLayerOrder.push(ViewEE.LayerId.TOP_COPPER);
		this.renderLayerOrder.push(ViewEE.LayerId.VIAS);
		this.renderLayerOrder.push(ViewEE.LayerId.TOP_SILKSCREEN);
		this.renderLayerOrder.push(ViewEE.LayerId.TOP_DOCUMENTATION);
		*/
	}


/*

	// [CAD](https://en.wikipedia.org/wiki/Computer-aided_design)
	// and [CAM](https://en.wikipedia.org/wiki/Computer-aided_manufacturing)
	//
	// Boards usually contains D-Layers, which helps to separate design things
	// like top names and top values. When exporting design to the manufacturing,
	// some layers merges (copper and via for that copper layer or
	// silkscreen parts). I'll name that entity as M(anufacturing)-Layer

	// Board format or CAD software usually specify how to assign D-Layers to the
	// M-Layers; code below belongs to board format, not the base board class

	this.visibleLayers = {};
	this.visibleLayers[ViewEE.LayerId.BOTTOM_COPPER]        = true;
	this.visibleLayers[ViewEE.LayerId.BOTTOM_SILKSCREEN]    = true;
	this.visibleLayers[ViewEE.LayerId.BOTTOM_DOCUMENTATION] = true;
	this.visibleLayers[ViewEE.LayerId.DIM_BOARD]            = true;
	this.visibleLayers[ViewEE.LayerId.TOP_COPPER]           = true;
	this.visibleLayers[ViewEE.LayerId.TOP_SILKSCREEN]       = true;
	this.visibleLayers[ViewEE.LayerId.TOP_DOCUMENTATION]    = true;
	this.visibleLayers[ViewEE.LayerId.VIAS]                 = true;
	this.visibleLayers[ViewEE.LayerId.OUTLINE]              = true;

	this.renderLayerOrder = [];
	this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_DOCUMENTATION);
	this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_SILKSCREEN);
	this.renderLayerOrder.push(ViewEE.LayerId.BOTTOM_COPPER);
	this.renderLayerOrder.push(ViewEE.LayerId.DIM_BOARD);
	this.renderLayerOrder.push(ViewEE.LayerId.OUTLINE);
	this.renderLayerOrder.push(ViewEE.LayerId.TOP_COPPER);
	this.renderLayerOrder.push(ViewEE.LayerId.VIAS);
	this.renderLayerOrder.push(ViewEE.LayerId.TOP_SILKSCREEN);
	this.renderLayerOrder.push(ViewEE.LayerId.TOP_DOCUMENTATION);

	this.reverseRenderLayerOrder = [];
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.TOP_DOCUMENTATION);
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.TOP_SILKSCREEN);
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.TOP_COPPER);
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.DIM_BOARD);
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.OUTLINE);
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.BOTTOM_COPPER);
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.VIAS);
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.BOTTOM_SILKSCREEN);
	this.reverseRenderLayerOrder.push(ViewEE.LayerId.BOTTOM_DOCUMENTATION);

	this.layerRenderFunctions = {};

	this.layerRenderFunctions[ViewEE.LayerId.BOTTOM_COPPER] = function (renderer, board, ctx) {
		renderer.drawSignalWires(board.eagleLayersByName['Bottom'],ctx);
		renderer.drawElements(board.eagleLayersByName['Bottom'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['Bottom'],ctx);
	}

	this.layerRenderFunctions[ViewEE.LayerId.BOTTOM_SILKSCREEN] = function(renderer, board, ctx) {
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

	this.layerRenderFunctions[ViewEE.LayerId.BOTTOM_DOCUMENTATION] = function(renderer, board, ctx) {
		renderer.drawElements(board.eagleLayersByName['bKeepout'],ctx);
		renderer.drawElements(board.eagleLayersByName['bDocu'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['bKeepout'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['bDocu'],ctx);
	}

	this.layerRenderFunctions[ViewEE.LayerId.TOP_COPPER] = function(renderer, board, ctx) {
		renderer.drawSignalWires(board.eagleLayersByName['Top'],ctx);
		renderer.drawElements   (board.eagleLayersByName['Top'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['Top'],ctx);
	}

	this.layerRenderFunctions[ViewEE.LayerId.TOP_SILKSCREEN] = function(renderer, board, ctx) {
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

	this.layerRenderFunctions[ViewEE.LayerId.TOP_DOCUMENTATION] = function(renderer, board, ctx) {
		renderer.drawElements(board.eagleLayersByName['tKeepout'],ctx);
		renderer.drawElements(board.eagleLayersByName['tDocu'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['tKeepout'],ctx);
		renderer.drawPlainTexts(board.eagleLayersByName['tDocu'],ctx);
	}

	this.layerRenderFunctions[ViewEE.LayerId.DIM_BOARD] = function(renderer, board, ctx) {
		renderer.dimCanvas(board.dimBoardAlpha, ctx);
	}

	this.layerRenderFunctions[ViewEE.LayerId.VIAS] = function(renderer, board, ctx) {
		renderer.drawSignalVias('1-16',ctx, board.viaPadColor());
	}

	this.layerRenderFunctions[ViewEE.LayerId.OUTLINE] = function(renderer, board, ctx) {
		renderer.drawPlainWires(board.eagleLayersByName['Dimension'],ctx);
		renderer.drawPlainHoles(board.eagleLayersByName['Dimension'],ctx);
	}

	this.hitTestFunctions = {};

	this.hitTestFunctions[ViewEE.LayerId.BOTTOM_COPPER] = function(x,y) {
		return this.hitTestElements (this.eagleLayersByName['Bottom'],x,y)
			|| this.hitTestSignals  (this.eagleLayersByName['Bottom'],x,y);
	}.bind (this);

	this.hitTestFunctions[ViewEE.LayerId.TOP_COPPER] = function(x,y) {
		return this.hitTestElements (this.eagleLayersByName['Top'],x,y)
			|| this.hitTestSignals  (this.eagleLayersByName['Top'],x,y);
	}.bind (this);
*/
}
