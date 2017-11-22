import assert from "assert";
import crypto from "crypto";

import fs     from "fs";

import {DOMParser, XMLSerializer} from 'xmldom';

var testCommon = require ('./common.js');

var baseName = testCommon.baseName (__filename);

import ViewEEBoard from '../src/board';

import EagleXMLParser from '../src/board/format-eagle-xml';

import SVGRenderer from '../src/renderer/svg';
import CanvasRenderer from '../src/renderer/canvas';

describe (baseName + " running", () => {

	var brdContents = fs.readFileSync ('problems/Arduino-DUE-V03.brd').toString();
	//var easyEDAPCBContents = fs.readFileSync ('problems/Bench-power.easyeda').toString();
	var easyEDAPCBContents = fs.readFileSync ('problems/Arduino-DUE-V03.easyeda').toString();
	var kicadContents = fs.readFileSync ('problems/!HDMI2USB.kicad_pcb').toString();
	var board;

	function testBoard (boardData, done) {

		this.timeout (15000);

		board = ViewEEBoard.fromData (boardData);

		var bounds = board.calculateBounds (),
			width  = Math.abs(bounds[2] - bounds[0]),
			height = Math.abs(bounds[3] - bounds[1]);

		console.log ('board dimensions: %sx%s', width, height);

		if (process.env.VERBOSE) console.log ('Signals:', Object.keys (board.signals).join (', '))

		assert.ok (Object.keys (board.signals).length);
		assert.ok (board.signals.GND);

		// console.log (board.signals.GND["back-copper"]);

		assert.ok (
			Object.assign({wires: []}, board.signals.GND["front-copper"]).wires.length
			 + Object.assign({wires: []}, board.signals.GND["back-copper"]).wires.length,
			"Board should have at least one ground wire in front or back layer " + JSON.stringify (board.signals.GND, null, "\t")
		);

		if (process.env.VERBOSE) console.log ('Plain wires:', Object.keys (board.plain.wires).join (', '));

		if (process.env.VERBOSE) console.log ('Board bounds:', board.calculateBounds ());

		assert.ok (board.nativeSize[0] > 0); // width
		assert.ok (board.nativeSize[1] > 0); // height

		// if (process.env.VERBOSE)
			console.log ('Packages:', Object.keys (board.packagesByName).join (', '))

		assert.ok (Object.keys (board.packagesByName).length);
		assert.ok (Object.keys (board.packagesByName).filter (
			pkgName => pkgName.match (/0805|0603|0402/)
		).length);

		// console.log (board.plainWires);

		// have outline
		assert.ok (board.plain.wires.outline.length);

		done ();

	}

	it.skip ("should parse kicad_pcb file", function (done) {
		return testBoard.call (this, kicadContents, done);
	});

	it.skip ("should parse geda file", function (done) {
		return testBoard.call (this, brdContents, done);
	});

	it ("should parse easyeda file", function (done) {
		return testBoard.call (this, easyEDAPCBContents, done);
	});

	it ("should generate svg from easyeda board", function (done) {
		var svgRenderer = new SVGRenderer (board);

		var svgNode = svgRenderer.render ();

		var gNodes = svgNode.getElementsByTagNameNS ('http://www.w3.org/2000/svg', 'g');

		// console.log ([...gNodes].map (node => node.localName));

		fs.writeFile ('./test/Arduino-DUE-03.easyeda.svg', svgRenderer.toString (), done);

		// console.log (gNodes.length);
		// console.log (gNodes);

		// done ();
	});

	it.skip ("should parse fzz file", function (done) {
		return testBoard.call (this, brdContents, done);
	});

	it.skip ("should parse gerber file", function (done) {
		return testBoard.call (this, brdContents, done);
	});

	it ("can parse eagle pcb", function () {
		assert (EagleXMLParser.canParse (brdContents));
	});

	it ("should parse eagle file", function (done) {
		return testBoard.call (this, brdContents, done);
	});

	it ("should generate svg from board", function (done) {
		var svgRenderer = new SVGRenderer (board);

		var svgNode = svgRenderer.draw ();

		var gNodes = svgNode.getElementsByTagNameNS ('http://www.w3.org/2000/svg', 'g');

		// console.log ([...gNodes].map (node => node.localName));

		fs.writeFile ('./test/Arduino-DUE-03.eagle.svg', svgRenderer.toString (), done);

		// console.log (gNodes.length);
		// console.log (gNodes);

		// done ();
	});

	it ("should generate png from board", function (done) {

		this.timeout (15000);

		var bounds = board.calculateBounds (),
			width  = Math.abs(bounds[2] - bounds[0]),
			height = Math.abs(bounds[3] - bounds[1]);

		if (width < 2000 && height < 2000) {
			if (width > height) {
				board.scale = Math.round (2000 / width);
			} else {
				board.scale = Math.round (2000 / height);
			}
		}

		var pngRenderer = new CanvasRenderer (board);

		console.log ('board dimensions: %sx%s, scale: %s', width, height, board.scale);

		pngRenderer.draw ();

		var fileStream = fs.createWriteStream ('./test/Arduino-DUE-03.eagle.png');
		var pngStream = pngRenderer.canvas.pngStream ();

		pngStream.pipe (fileStream);

		fileStream.on ('finish', done);

	});

});
