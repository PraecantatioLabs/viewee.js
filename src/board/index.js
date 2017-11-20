import * as Util from '../util';

import EagleXMLFormat from './format-eagle-xml';
// import KicadPcbParser from './parser-kicad-pcb';
// import GedaParser     from './parser-geda';
import EasyEDAPCBFormat from './format-easyeda';

import Layers from './layers';

/**
 * Board's data container. It can contain Engineering data (such as pcb or schematics),
 * Manufacturing data (gerber layers or 3d model data).
 */
export default class ViewEEBoard {

	constructor () {

		// layers initialized after board data arrival from parser

	}

	/**
	 * Find a parser which supports data
	 * @param   {String|Buffer} data string or binary data
	 * @returns {Array}         compatible parsers
	 */
	static findParsers (data) {
		const parsers = [
			EagleXMLFormat,
			// KicadPcbParser,
			// GedaParser,
			EasyEDAPCBFormat
		];

		return parsers.filter (parser => {
			if (!parser) return;

			if (!parser.canParse (data))
				return;

			return true;
		});
	}

	static fromData (data, options) {
		const parsers = ViewEEBoard.findParsers (data);

		const board = new ViewEEBoard (options);

		const timerLabel = `parsing using ${parsers[0].name}`;
		board.verbose && console.time (timerLabel);

		// use first one, ignore others
		const parser = new (parsers[0]) (board);

		parser.parse (data);

		board.layers = new Layers (board.sourceType);

		board.verbose && console.timeEnd (timerLabel);

		board.calculateBounds();

		return board;

		board.scaleToFit();
		board.draw();

		return board;
	}

	static fromFilename (filename) {

	}

	calculateBounds () {
		var minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;

		function minMaxWires (wire) {
			const {curve} = wire;

			if (!curve) {
				const {x1, x2, y1, y2} = wire, width = wire.width || this.minLineWidth;

				minX = Math.min (...[minX, x1 - width, x1 + width, x2 - width, x2 + width]);
				maxX = Math.max (...[maxX, x1 - width, x1 + width, x2 - width, x2 + width]);
				minY = Math.min (...[minY, y1 - width, y1 + width, y2 - width, y2 + width]);
				maxY = Math.max (...[maxY, y1 - width, y1 + width, y2 - width, y2 + width]);
			} else {
				const {x, y, radius} = wire;

				minX = Math.min (...[minX, x - radius, x + radius]);
				maxX = Math.max (...[maxX, x - radius, x + radius]);
				minY = Math.min (...[minY, y - radius, y + radius]);
				maxY = Math.max (...[maxY, y - radius, y + radius]);
			}
		}

		// Plain elements
		Object.keys (this.plain.wires).forEach (layerKey => {
			const lines = this.plain.wires[layerKey];
			Object.keys (lines).forEach (lineKey => minMaxWires (lines[lineKey]))
		})

		Object.keys (this.signals).forEach (netName => {
			Object.keys (this.signals[netName]).forEach (layerKey => {
				var lines = this.signals[netName][layerKey].wires;
				lines && Object.keys (lines).forEach (lineKey => minMaxWires (lines[lineKey]))
			})
		})

		//Elements
		Object.keys (this.elements).forEach (elemKey => {
			var elem = this.elements[elemKey];
			var pkg = typeof elem.pkg === "string" ? this.packagesByName[elem.pkg] : elem.pkg;
			var rotMat = elem.matrix;

			Object.keys (pkg.smds).forEach (smdIdx => {
				var smd = pkg.smds[smdIdx],
					x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1,
					y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1,
					x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2,
					y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2;
				minX = Math.min (...[minX, x1, x2]);
				maxX = Math.max (...[maxX, x1, x2]);
				minY = Math.min (...[minY, y1, y2]);
				maxY = Math.max (...[maxY, y1, y2]);
			})

			Object.keys (pkg.wires).forEach (wireIdx => {
				var wire = pkg.wires[wireIdx],
					{curve, radius, width} = wire;

				if (curve) {
					minMaxWires ({
						x: elem.x + rotMat[0]*wire.x + rotMat[1]*wire.y,
						y: elem.y + rotMat[2]*wire.x + rotMat[3]*wire.y,
						curve,
						radius
					})
				} else {
					minMaxWires ({
						x1: elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1,
						y1: elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1,
						x2: elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2,
						y2: elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2,
						width
					})
				}
			})
		})

		// console.log ("board size:", [minX, minY, maxX, maxY]);

		this.nativeBounds = [minX, minY, maxX, maxY];
		this.nativeSize   = [
			maxX - minX,
			maxY - minY
		];

		return [minX, minY, maxX, maxY];
	}
}

/**
 * Function to fill out the data object. Parser should decide itself
 * what data to fill or clean up.
 * @param   {string}  text data to fill the board object
 */
ViewEEBoard.prototype.parseFile = function (text) {
	var parserFound = ViewEE.parsers.some (function (parser) {
		if (!parser) return;

		if (parser.supports (text)) {
			var timerLabel = 'parsing using ' + parser.name;
			this.verbose && console.time && console.time (timerLabel);
			var parser = new parser (this);
			parser.parse (text);
			this.verbose && console.timeEnd && console.timeEnd (timerLabel);

			this.emit ('parse-end');

			this.nativeBounds = this.calculateBounds();
			this.nativeSize   = [
				this.nativeBounds[2] - this.nativeBounds[0],
				this.nativeBounds[3] - this.nativeBounds[1]
			];
			this.scaleToFit();
			this.draw();
			return true;
		}
	}, this);

	if (!parserFound)
		alert ('cannot find parser for selected file');
}
