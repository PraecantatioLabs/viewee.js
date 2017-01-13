var assert = require ('assert');
var crypto = require ('crypto');
var fs     = require ("fs");

var xmldom        = require ('xmldom');
var DOMParser     = xmldom.DOMParser;
var XMLSerializer = xmldom.XMLSerializer;

var testCommon = require ('./common.js');

var baseName = testCommon.baseName (__filename);

import ViewEEBoard from '../src/board';

import EagleXMLParser from '../src/eagle_xml_parser';

import SVGRenderer from '../src/svg_renderer';

describe (baseName + " running", () => {

	var board = new ViewEEBoard ();

	it ("should parse eagle file", function (done) {

		this.timeout(15000);

		var brdContents = fs.readFileSync ('problems/hm-11.brd').toString();

		var ex = new EagleXMLParser (board);

		assert (EagleXMLParser.supports (brdContents));

		ex.parse (brdContents);

		board.nativeBounds = board.calculateBounds();
		board.nativeSize   = [
			board.nativeBounds[2] - board.nativeBounds[0],
			board.nativeBounds[3] - board.nativeBounds[1]
		];

		// console.log (board);

		done ();

	});


	it ("should generate svg from board", function (done) {
		var svgRenderer = new SVGRenderer (board);

		svgRenderer.draw ();

		console.log (new XMLSerializer ().serializeToString (board.svg));

		var gNodes = board.svg.getElementsByTagNameNS ('http://www.w3.org/2000/svg', 'g');

		// console.log (gNodes.length);
		// console.log (gNodes);

		done ();
	});


});
