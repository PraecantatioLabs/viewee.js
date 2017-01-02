var assert = require ('assert');
var crypto = require ('crypto');
var fs     = require ("fs");

var DOMParser     = require ('xmldom').DOMParser;
var XMLSerializer = require ('xmldom').XMLSerializer;

var testCommon = require ('./common.js');

var baseName = testCommon.baseName (__filename);

// var ViewEE = require ('../');
var Util = require ('../src/util');

var ViewEEBoard = require ('../src/board');

var EagleXMLParser = require ('../src/eagle_xml_parser');

var SVGRenderer = require ('../src/svg_renderer');

describe (baseName + " running", () => {

	var doc = new DOMParser ().parseFromString ('<html><body></body></html>', 'text/html');

	var board = new ViewEEBoard ();
	// TODO: remove hacks
	board.svg = doc.createElementNS ('http://www.w3.org/2000/svg', 'svg');

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

		console.log (board);

		done ();

	});


	it ("should generate svg from board", function (done) {
		var svgRenderer = new SVGRenderer (board);

		svgRenderer.draw ();

		// console.log (new XMLSerializer ().serializeToString (board.svg));

		done ();
	});


});
