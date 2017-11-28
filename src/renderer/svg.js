import {DOMParser, XMLSerializer} from '../../lib/xmldom';

import PCBRenderer from './base';

import {SvgEl as SVGEl, HtmlEl} from '../../lib/htmlel.js';

import {angleForRot, matrixForRot} from '../util';

// ---------------
// --- HELPERS ---
// ---------------

const significantDigits = 4;

function polarToCartesian(centerX, centerY, radius, angleInDegrees, angleInRadians) {
	if (angleInRadians === null || angleInRadians === undefined) {
		angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
	} else {
		// angleInRadians -= Math.PI/2;
	}

	return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians))
	};
}

function describeArc(x, y, radius, startAngle, endAngle){

	return describeArcRadians (x, y, radius, startAngle * Math.PI / 180.0, endAngle * Math.PI / 180.0);

	var start = polarToCartesian(x, y, radius, startAngle);
	var end   = polarToCartesian(x, y, radius, endAngle);

//		var start = polarToCartesian(x, y, radius, endAngle);
//		var end   = polarToCartesian(x, y, radius, startAngle);

	var largeArcFlag = endAngle - startAngle <= 180 ? "1" : "0";
	var rotation = 0;
	var sweepFlag = 0;

	var d = [
		"M", start.x.toFixed (significantDigits), start.y.toFixed (significantDigits),
		"A", radius, radius, rotation, largeArcFlag, sweepFlag, end.x.toFixed (significantDigits), end.y.toFixed (significantDigits)
	].join(" ");

	return d;
}

function describeArcRadians (x, y, radius, startAngle, endAngle){

//		var start = polarToCartesian(x, y, radius, null, startAngle);
//		var end   = polarToCartesian(x, y, radius, null, endAngle);

	//while (endAngle < startAngle) endAngle += 2*Math.PI;

	// var start = polarToCartesian(x, y, radius, null, endAngle + 2*Math.PI);
	// var end   = polarToCartesian(x, y, radius, null, startAngle + 2*Math.PI);

	var start = polarToCartesian(x, y, radius, null, endAngle);
	var end   = polarToCartesian(x, y, radius, null, startAngle);

	var largeArcFlag = (endAngle - startAngle <= Math.PI) ? "0" : "1";
	var rotation = 0;
	var sweepFlag = 0;

	var d = [
		"M", start.x.toFixed (significantDigits), start.y.toFixed (significantDigits),
		"A", radius, radius, rotation, largeArcFlag, sweepFlag, end.x.toFixed (significantDigits), end.y.toFixed (significantDigits)
	].join(" ");

	if (d.match (/NaN/))
		console.warn ("Arc conversion error");

	return d;
}

function svg2canvas () {
	var canvas = document.getElementById("canvas"),
		ctx = canvas.getContext("2d"),
		image = document.getElementById("art"),
		svgImage = document.getElementById("svg-art"),
		s = new XMLSerializer().serializeToString(svgImage);

	image.src = 'data:image/svg+xml;utf8,' + s;

	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

	function step() {
		ctx.drawImage(image,0,0,80,80);
		window.requestAnimationFrame(step);
	}

	window.requestAnimationFrame(step);

	/*  OR https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas  */

	/*
		var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
		   '<foreignObject width="100%" height="100%">' +
		   '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:40px">' +
			 '<em>I</em> like ' +
			 '<span style="color:white; text-shadow:0 0 2px blue;">' +
			 'cheese</span>' +
		   '</div>' +
		   '</foreignObject>' +
		   '</svg>';

var DOMURL = window.URL || window.webkitURL || window;

var img = new Image();
var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
var url = DOMURL.createObjectURL(svg);

img.onload = function () {
  ctx.drawImage(img, 0, 0);
  DOMURL.revokeObjectURL(url);
}

img.src = url;
		*/
}


// ---------------
// --- DRAWING ---
// ---------------

export default class SVGRenderer extends PCBRenderer {
	constructor (board, svg) {
		/*
		if (!board.svg) {
			var doc = new DOMParser ().parseFromString ('<html><body></body></html>', 'text/html');
			board.svg = doc.createElementNS ('http://www.w3.org/2000/svg', 'svg');
		}
		*/

		super ();

		if (typeof document === 'undefined') {
			this.document = new DOMParser ().parseFromString ('<html><body></body></html>', 'text/html');
		} else {
			this.document = document;
		}

		this.SVGEl = SVGEl;

		if (!svg) {
			svg = this.document.createElementNS ('http://www.w3.org/2000/svg', 'svg');
		}

		this.el = svg;

		/*
		if (document === void 0) {
			document = svg.ownerDocument;
			this.SVGEl = function (name, attrs) {
				attrs = Object.create (attrs || {});
				attrs.xmlns = "http://www.w3.org/2000/svg";
				var args = [].slice.call (arguments, 2);
				return HtmlEl.apply ({document: document}, [].concat ([name, attrs], args));
			}
		}
		*/

		this.board = board;

		this.warnings = [];
	}


	getScope (ctx, attrs) {

		var groups = [].slice.apply (ctx.childNodes).filter (
			g => {
				// console.log ('=====', Object.keys(g));
				// console.log ('type %s localName %s @name %s', g.nodeType, g.localName)//, g.getAttribute ('name'))
				return g.nodeType === 1 && g.localName === 'g' && g.getAttribute ('name') === attrs.name
			}
		);
		var g;
		// var g = ctx.querySelector ('g[name="'+attrs.name+'"]');
		if (groups.length) {
			g = groups[0];
		} else {
			g = this.SVGEl ('g', {name: attrs.name});
			ctx.appendChild (g);
			ctx.appendChild ((ctx.ownerSVGElement || ctx.ownerDocument).createTextNode ("\n"));
		}

		for (var a in attrs) {
			g.setAttributeNS (null, a, attrs[a]);
		}

		return g;
	}

	redraw () {
		// TODO: layer visibility

		// flip board

		if (this.svgCtx) {
			var layerNodes = [].slice.apply (this.svgCtx.childNodes);
			var isFlipped;
			layerNodes.some (function (layerNode) {
				var layerName = layerNode.getAttribute ('name');
				// console.log (layerName);
				if (layerName === 'back-copper') {
					isFlipped = false;
					return true;
				} else if (layerName === 'front-copper') {
					isFlipped = true;
					return true;
				}
			});

			// console.log ('is render flipped? %s is board flipped? %s', isFlipped, this.board.boardFlipped);
			if (isFlipped !== this.board.boardFlipped) {
				var layerNodesCount = layerNodes.length;
				var viaLayer;
				for (var i = layerNodesCount - 1; i >= 0; i--) {
					var layerNode = layerNodes[i];
					var layerName = layerNode.getAttribute ('name');
					var n = this.svgCtx.removeChild (layerNodes[i]);
					if (layerName === 'via') {
						viaLayer = n;
					} else {
						this.svgCtx.appendChild (n);
					}

					if (layerName === 'front-copper' && isFlipped === true) {
						this.svgCtx.appendChild (viaLayer);
					} else if (layerName === 'back-copper' && isFlipped === false) {
						this.svgCtx.appendChild (viaLayer);
					}
				}
			}
		}

		// TODO: element selection

		// scale change
		this.rescale ();
	}

	render () {
		this.draw ();

		// create layers for that renderer

		// iterate over existing board things

		// renderer.drawElements
		// renderer.drawPlainTexts
		// renderer.drawPlainWires
		// renderer.drawPlainHoles

		// renderer.dimCanvas(board.dimBoardAlpha, ctx);
		// renderer.drawSignalVias('1-16',ctx, board.viaPadColor());
		// renderer.drawPlainHoles(board.eagleLayersByName['Dimension'],ctx);

		// render thing

		return this.el;
	}

	toString () {
		return new XMLSerializer ().serializeToString (this.el);
	}

	rescale () {

		if (!this.svgCtx) return;

		var board = this.board;

		board.ratio = 1;

		var scale = 1; // board.scale;

		var baseScale = 1; // board.baseScale;

		var scaleX = (scale * baseScale * board.ratio * (board.boardFlipped ? -1.0 : 1.0)).toFixed (significantDigits);
		var scaleY = ((board.coordYFlip ? 1 : -1) * scale  * baseScale * board.ratio).toFixed (significantDigits);
		var scaleTransY = board.coordYFlip ? 0 : (board.nativeBounds[3] - board.nativeBounds[1]).toFixed (significantDigits);

		var transX = (board.boardFlipped ? -board.nativeBounds[2] : -board.nativeBounds[0]).toFixed (significantDigits);
		var transY = (-board.nativeBounds[1]).toFixed (significantDigits); //board.coordYFlip ? 0 : board.nativeBounds[1]; //-board.nativeBounds[1];

		this.svgCtx.setAttributeNS (
			null,
			'transform',
			'translate('+transX+', '+transY+')'
		);

		this.svgCtx.parentNode.setAttributeNS (
			null,
			'transform',
			'matrix('+scaleX+', 0, 0, '+scaleY+', 0, '+scaleTransY+')' // board.scale*board.baseScale
		);

	}

	draw () {
		var svg = this.el;

		var board = this.board;

		if (board.interactive && board.interactive.destroy)
			board.interactive.destroy ();

		while (svg.firstChild) {
			svg.removeChild (svg.firstChild);
		}

		this.el.setAttributeNS (null, 'preserveAspectRatio', 'xMinYMin meet');

		this.el.setAttributeNS (null, 'viewBox', [
			0,
			0,
			board.nativeSize[0].toFixed (significantDigits),
			board.nativeSize[1].toFixed (significantDigits)
		].join (','));

		var g;

		svg.appendChild (this.SVGEl (
			'g', {
				className: 'viewport'
			}, this.SVGEl (
				'g', {}, g = this.SVGEl (
					'g', {
						className: 'container',
					})
			)
		));

		this.svgCtx = g;

		this.rescale ();

		this.drawLayers (g);

		return this.el;

	}

	drawSingleWire (wire, ctx) {
		var path = this.drawWire (wire, ctx);
		path.setAttributeNS (null, 'stroke', wire.strokeStyle);
		path.setAttributeNS (null, 'stroke-width', wire.width);
		if (!path.getAttributeNS (null, 'fill'))
			path.setAttributeNS (null, 'fill', "none");
	}

	drawWire (wire, ctx) {

		var attrs = {};

		var lineDash;
		if (wire.style === "longdash") {
			lineDash = [3];
		} else if (wire.style === "shortdash") {
			lineDash = [1];
		} else if (wire.style === "dashdot") {
			lineDash = [3, 1, 1, 1];
		}

		if (lineDash) attrs["stroke-dasharray"] = lineDash.join (', ');

		if (wire.cap && wire.cap === "flat") {
			attrs["stroke-linecap"] = "butt";
		} else {
			attrs["stroke-linecap"] = "round";
		}

		if (wire.curve === undefined) {
			attrs.d = [
				'M',
				wire.x1.toFixed (significantDigits),
				wire.y1.toFixed (significantDigits),
				'L',
				wire.x2.toFixed (significantDigits),
				wire.y2.toFixed (significantDigits)
			].join (' ');

		} else if (wire.curve === 360) {

			attrs.cx = wire.x;
			attrs.cy = wire.y;

			if (wire.filled) {
				attrs.fill = wire.strokeStyle;
			}

			attrs.r  = wire.radius.constructor === Array ? wire.radius[0] : wire.radius;

			var circle = this.SVGEl ('circle', attrs);
			ctx.appendChild (circle);
			return circle;

		} else {

			var angle = angleForRot (wire.rot);

			var rotate = angle.degrees / 180 * Math.PI;

			var mirror = angle.flipped;

			var startAngle = rotate + wire.start;
			var endAngle   = rotate + wire.start + wire.angle;

			if (mirror) {
				// startAngle = rotate - wire.start;
				// endAngle   = rotate - wire.start - wire.angle;
			}

			var radiusX, radiusY;
			radiusX = radiusY = wire.radius;
			if (wire.radius.constructor === Array) {
				radiusX = wire.radius[0];
				radiusY = wire.radius[1];
			}

			// attrs.json = JSON.stringify (wire);

			attrs.d = describeArcRadians (wire.x, wire.y, radiusX, startAngle, endAngle);

			// attrs.transform = 'scale('+radiusX+','+radiusY+') translate('+wire.x+', '+wire.y+')';

			// DEBUG
			// var c = this.SVGEl ('circle', {cx: wire.x, cy: wire.y, r: wire.width});
			// ctx.appendChild (c);
		}

		var path = this.SVGEl ('path', attrs);
		ctx.appendChild (path);
		return path;

	}

	drawHole (hole, ctx) {

		var board = this.board;

		// TODO: rotation

		var attrs = {
			fill: hole.strokeStyle,
			'fill-rule': 'even-odd'
		};

		hole.shape = hole.shape || 'circle';

		// TODO: get rid of strokeWidth

		var drillRadius = hole.drill/2;
		var shapeRadius = hole.diameter/2 || drillRadius + hole.strokeWidth/2;

		var dShapeAttr = '';
		if (hole.shape === 'square') {
			var poly = {points: [
				{x: hole.x + shapeRadius, y: hole.y + shapeRadius},
				{x: hole.x - shapeRadius, y: hole.y + shapeRadius},
				{x: hole.x - shapeRadius, y: hole.y - shapeRadius},
				{x: hole.x + shapeRadius, y: hole.y - shapeRadius}
			]};
			dShapeAttr = this.polyToD (poly);

		} else if (hole.shape === 'octagon') {
			// TODO: support rotation
			var mult = .4;
			var poly = {points: [
				{x: hole.x + shapeRadius, y: hole.y + shapeRadius*mult},
				{x: hole.x + shapeRadius*mult, y: hole.y + shapeRadius},
				{x: hole.x - shapeRadius*mult, y: hole.y + shapeRadius},
				{x: hole.x - shapeRadius, y: hole.y + shapeRadius*mult},
				{x: hole.x - shapeRadius, y: hole.y - shapeRadius*mult},
				{x: hole.x - shapeRadius*mult, y: hole.y - shapeRadius},
				{x: hole.x + shapeRadius*mult, y: hole.y - shapeRadius},
				{x: hole.x + shapeRadius, y: hole.y - shapeRadius*mult}
			]};
			dShapeAttr = this.polyToD (poly);

		// shape long is without hole
//		} else if (hole.shape === 'long') {
//
//			dShapeAttr = [
//				describeArcRadians (
//					hole.x - shapeRadius, hole.y, shapeRadius, Math.PI*.5, Math.PI*1.5
//				),
//				//'M', hole.x + shapeRadius, hole.y + shapeRadius,
//				'L', hole.x + shapeRadius, hole.y + shapeRadius,
//				describeArcRadians (
//					hole.x + shapeRadius, hole.y, shapeRadius, Math.PI*1.5, Math.PI*2.5
//				).replace (
//					/M.*A/, 'A'
//				),
//				'L', hole.x - shapeRadius, hole.y - shapeRadius,
////				'z'
//			].join (' ');
//
//			attrs.d = dShapeAttr// + ' ' + dAttr;
//
//			ctx.appendChild (this.SVGEl ('path', attrs));
//			return;

//		} else if (hole.shape === 'oval') {
//
//			dShapeAttr = [
//				describeArcRadians (
//					hole.x - shapeRadius, hole.y, shapeRadius, Math.PI*.5, Math.PI*1.5
//				),
//				//'M', hole.x + shapeRadius, hole.y + shapeRadius,
//				'L', hole.x + shapeRadius, hole.y + shapeRadius,
//				describeArcRadians (
//					hole.x + shapeRadius, hole.y, shapeRadius, Math.PI*1.5, Math.PI*2.5
//				).replace (
//					/M.*A/, 'A'
//				),
//				'L', hole.x - shapeRadius, hole.y - shapeRadius,
////				'z'
//			].join (' ');

//			dAttr = [
//				describeArcRadians (
//					hole.x - drillRadius, hole.y, drillRadius, Math.PI*.5, Math.PI*1.5
//				),
//				//'M', hole.x + drillRadius, hole.y + drillRadius,
//				'L', hole.x + drillRadius, hole.y + drillRadius,
//				describeArcRadians (
//					hole.x + drillRadius, hole.y, drillRadius, Math.PI*1.5, Math.PI*2.5
//				).replace (
//					/M.*A/, 'A'
//				),
//				'L', hole.x - drillRadius, hole.y - drillRadius,
////				'z'
//			].join (' ');
//
//			attrs.d = dShapeAttr// + ' ' + dAttr;
//
//			ctx.appendChild (this.SVGEl ('path', attrs));
//			return;


		} else {
			if (hole.shape !== 'circle') {

				if (!this.warnings["pad_shape_" + hole.shape]) {
					this.warnings["pad_shape_" + hole.shape] = true;
					console.warn ("pad shape '%s' is not supported yet", hole.shape);
				}
			}

			attrs.fill = "none";
			attrs.stroke = hole.strokeStyle;
			var restring = (hole.diameter - hole.drill)/2 || hole.strokeWidth;
			attrs['stroke-width'] = restring;
			drillRadius = (hole.drill + restring)/2 || hole.drill/2 + hole.strokeWidth/2;

			if (isNaN (restring))
				console.log ('RESTRING is NaN', hole.diameter, hole.drill, hole.strokeWidth, drillRadius);
		}

		// two arcs
		var dAttr = describeArcRadians (
			hole.x, hole.y, drillRadius, 0, Math.PI
		) + describeArcRadians (
			hole.x, hole.y, drillRadius, Math.PI, Math.PI*2
		).replace (
			/M.*A/, 'A'
		) + 'z';

		attrs.d = dShapeAttr + ' ' + dAttr;

		ctx.appendChild (this.SVGEl ('path', attrs));
	}


	drawText (attrs, text, ctx) {
		var x = attrs.x || text.x,
			y = attrs.y || text.y,
			rot = attrs.rot || text.rot || "R0",
			size = text.size,
			flipText = attrs.flipText !== undefined ? attrs.flipText : text.flipText;

		var board = this.board;

		var content = attrs.content || text.content;
		var color   = attrs.color;

		var textAngle = angleForRot (rot);

		//rotation from 90.1 to 270 causes Eagle to draw labels 180 degrees rotated with top right anchor point
		var degrees  = textAngle.degrees,
			textRot  = matrixForRot(rot),
			fontSize = 10;

		var font = ''+fontSize+'pt vector';	//Use a regular font size - very small sizes seem to mess up spacing / kerning

		var strings = content.split (/\r?\n/);
		var stringOffset = (text.interlinear || 50) * fontSize / 100;

		var textCtx;

		ctx.appendChild (this.SVGEl ('g', {
			className: 'text',
			transform: 'matrix('+[textRot[0],textRot[2],textRot[1],textRot[3], x, y].join(', ')+')'
		}, textCtx = this.SVGEl ('g', {

		})));

		if (0) { // enable to draw zero points for text origin
			textCtx.appendChild (this.SVGEl ('circle', {cx: 0, cy: 0, r: 0.2, fill: textAngle.spin ? "grey" : flipText ? "blue" : "red"}));
		}

		var textEl;

		var textBlockHeight = (strings.length - 1) * (stringOffset + fontSize);
		var textBlockWidth = 0;

		var textAttrs = {
			'font-size': fontSize + 'pt',
			'font-family': 'vector',
			fill: color
		};

		var svgAlign = {left: 'start', center: 'middle', right: 'end'};
		var svgBaseline = {top: 'start', middle: 'middle', bottom: 'end'};

		if (text.align)  textAttrs['text-anchor'] = svgAlign[text.align];
		//if (text.valign) textAttrs['dominant-baseline'] = text.valign;
		if (text.valign) textAttrs['alignment-baseline'] = text.valign;

		textCtx.appendChild (textEl = this.SVGEl ('text', textAttrs));

		var xOffset = 0;

		strings.forEach (function (string, idx) {
			var yOffset = idx * (stringOffset + fontSize);
			if (text.valign === "middle") {
				yOffset -= textBlockHeight/2;
			} else if (text.valign === "bottom") {
				yOffset -= textBlockHeight;
			}
			var tspan = this.SVGEl ('tspan', {x: xOffset, y: yOffset}, string);
			textEl.appendChild (tspan);
			// TODO: getComputedTextLength
			textBlockWidth = Math.max (textBlockWidth, tspan.getComputedTextLength ? tspan.getComputedTextLength() : 0);
			// ctx.fillText(string, xOffset, yOffset);
		}, this);

		var translateX = 0;
		var translateY = 0;

		var scale = (size / fontSize).toFixed (significantDigits);
		var scaleX = (scale * 1.25).toFixed (significantDigits),
			scaleY = ((board.coordYFlip ? 1 : -1) * scale).toFixed (significantDigits);

		if (flipText) {
			var xMult = {center: 0, left: 1, right: 1};
			var yMult = {middle: 0, bottom: -1, top: 1};

			translateX = xMult[text.align || "left"] * textBlockWidth;
			translateY = yMult[text.valign || "bottom"] * (textBlockHeight + fontSize);

			if (!textAngle.spin) {
				//textCtx.setAttributeNS (null, 'transform', 'matrix('+[-textRot[0],textRot[2],textRot[1],-textRot[3], x, y].join(', ')+')');
				scaleX = -scaleX;
				scaleY = -scaleY;
				translateX = -translateX;
				translateY = -translateY;
			};
		}

		textEl.setAttributeNS (null, 'transform', 'scale('+scaleX+', '+scaleY+') translate('+translateX+', '+translateY+')');

	}

	polyToD (poly) {
		var dAttr = [];
		poly.points.forEach (function (point, idx) {
			if (idx === 0)
				dAttr.push ('M')
			else
				dAttr.push ('L')
				dAttr.push (point.x.toFixed (significantDigits));
			dAttr.push (point.y.toFixed (significantDigits));
		});
		dAttr.push ('z');

		return dAttr.join (' ');
	}

	drawFilledPoly (poly, ctx) {
		var dAttr = this.polyToD (poly);

		ctx.appendChild (this.SVGEl ('path', {
			className: 'package-rect',
			d: dAttr,
			fill: poly.fillStyle,
			"stroke-width": poly.strokeWidth,
			"stroke": poly.strokeStyle,
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		}));
	}

	drawFilledCircle (circle, ctx) {

		ctx.appendChild (this.SVGEl ('circle', {
			className: 'package-circle',
			cx: circle.x,
			cy: circle.y,
			r: circle.radius,
			fill: circle.fillStyle,
			//"stroke-width": board.minLineWidth,
			"stroke-linecap": "round"
		}));
	}

	dimCanvas (alpha, ctx) {

		var board = this.board;

		ctx.appendChild (this.SVGEl ('rect', {
			x: board.boardFlipped ? board.nativeBounds[2] : board.nativeBounds[0],
			y: board.nativeBounds[1],
			width: board.nativeSize[0],
			height: board.nativeSize[1],
			fill: 'rgba(255,255,255,0.5)'
		}));
//		ctx.save();
//		ctx.setTransform(1, 0, 0, 1, 0, 0);
//		ctx.globalCompositeOperation = 'destination-out';
//		ctx.fillStyle =
//		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//		ctx.restore();
	}
}
