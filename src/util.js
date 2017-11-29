export function angleForRot (rot) {
	if (!rot) return {degrees: 0};
	var spin    = (rot.indexOf('S') >= 0), // TODO: spin rotate
		flipped = (rot.indexOf('M') >= 0),
		degrees = parseFloat (rot.split ('R')[1]);
	return {spin: spin, flipped: flipped, degrees: degrees};
}

export function matrixForRot (rot) {
	var angle        = angleForRot (rot);
	var spin         = angle.spin, // TODO: spin rotate
		flipped      = angle.flipped,
		degrees      = angle.degrees,
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

// special thanks to http://paulbourke.net/geometry/circlesphere/
export function circleCenter (x1, y1, x2, y2, angle) {

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

var LARGE_NUMBER = 99999;

export function calcBBox (wires) {
	var bbox = [
		LARGE_NUMBER,
		LARGE_NUMBER,
		-LARGE_NUMBER,
		-LARGE_NUMBER
	];
	wires.forEach (function (wireDict) {
		bbox[0] = Math.min (wireDict.x1, wireDict.x2, bbox[0]);
		bbox[1] = Math.min (wireDict.y1, wireDict.y2, bbox[1]);
		bbox[2] = Math.max (wireDict.x1, wireDict.x2, bbox[2]);
		bbox[3] = Math.max (wireDict.y1, wireDict.y2, bbox[3]);
	});
	if ((bbox[0] >= bbox[2]) || (bbox[1] >= bbox[3])) {
		bbox = null;
	}

	return bbox;
}

export function max() {
	var args = [].slice.call(arguments);
	return Math.max.apply(Math, args.filter(function(val) {
		return !isNaN(val);
	}));
}

export function min() {
	var args = [].slice.call(arguments);
	return Math.min.apply(Math, args.filter(function(val) {
		return !isNaN(val);
	}));
}

export function wireFromSVGArc ([lastX, lastY], rx, ry, xAxisRotation,largeArcFlag,sweepFlag, [x, y]) {
	//--------------------
	// rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y
	// are the 6 data items in the SVG path declaration following the A
	//
	// lastX and lastY are the previous point on the path before the arc
	//--------------------
	// useful functions
	var m   = function (   v) {return Math.sqrt (Math.pow (v[0],2) + Math.pow (v[1],2))};
	var r   = function (u, v) {return (u[0]*v[0]+u[1]*v[1]) / (m(u)*m(v))};
	var ang = function (u, v) {return (u[0]*v[1] < u[1]*v[0] ? -1 : 1) * Math.acos (r (u,v))};
	//--------------------

	var chord = {
		middle: { // middle point of the chord
			x: (lastX + x)/2,
			y: (lastY + y)/2
		},
		// projections
		dx: (lastX - x),
		dy: (lastY - y),
		len: Math.sqrt(Math.pow(lastX - x, 2) + Math.pow(lastY - y, 2)),
	}

	// var apothemLen = Math.sqrt(Math.abs (Math.pow(radius, 2) - Math.pow(chord.len, 2)));

	var currpX =  Math.cos (xAxisRotation) * (lastX - x) / 2.0 + Math.sin (xAxisRotation) * (lastY - y) / 2.0 ;
	var currpY = -Math.sin (xAxisRotation) * (lastX - x) / 2.0 + Math.cos (xAxisRotation) * (lastY - y) / 2.0 ;

	var l = Math.pow (currpX,2) / Math.pow (rx,2) + Math.pow (currpY,2) / Math.pow (ry,2);
	if (l > 1) {rx *= Math.sqrt (l); ry *= Math.sqrt (l)};
	var s = (largeArcFlag == sweepFlag ? -1 : 1) * Math.sqrt
	(( (Math.pow (rx,2) * Math.pow (ry    ,2)) - (Math.pow (rx,2) * Math.pow (currpY,2)) - (Math.pow (ry,2) * Math.pow (currpX,2)))
	 / (Math.pow (rx,2) * Math.pow (currpY,2) +   Math.pow (ry,2) * Math.pow (currpX,2)));
	if (isNaN (s)) s = 0 ;

	var cppX = s *  rx * currpY / ry ;
	var cppY = s * -ry * currpX / rx ;
	var centpX = (lastX + x) / 2.0 + Math.cos (xAxisRotation) * cppX - Math.sin (xAxisRotation) * cppY ;
	var centpY = (lastY + y) / 2.0 + Math.sin (xAxisRotation) * cppX + Math.cos (xAxisRotation) * cppY ;

	var ang1 = ang ([1,0], [(currpX-cppX)/rx,(currpY-cppY)/ry]);
	var w = [(  currpX-cppX)/rx,(currpY-cppY)/ry];
	var x = [(-currpX-cppX)/rx,(-currpY-cppY)/ry];
	var angd = ang (w,x);
	if (r (w,x) <= -1) angd = Math.PI;
	if (r (w,x) >=  1) angd = 0;

	var r = rx > ry ? rx : ry;
	var sx = rx > ry ? 1 : rx / ry;
	var sy = rx > ry ? ry / rx : 1;

	var result = {
		x: centpX,
		y: centpY,
		start: ang1,
		angle: angd,
		end: (ang1 + angd),
		curve: angd,
		rX: rx,
		rY: ry,
		rot: "R" + (360 - xAxisRotation/ Math.PI * 180.0) % 360
	};

	if (!sweepFlag) {
		[result.start, result.end, result.angle, result.curve] = [result.end, result.start, -result.angle, -result.curve];
	}

	if (rx === ry) {
		result.radius = rx;
	}

	return result;

}
