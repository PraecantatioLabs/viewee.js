##Here is a list of known issues:

###Eagle

1. Round smd pads (hard)

	NOTE: best approach
	http://rawkes.com/articles/rounded-corners-in-html5-canvas
	http://jsfiddle.net/robhawkes/gHCJt/light/

	Another:
	http://js-bits.blogspot.ru/2010/07/canvas-rounded-corner-rectangles.html
	http://www.html5canvastutorials.com/tutorials/html5-canvas-rounded-corners/

	Now smd pad is drawn by drawing 4 lines by two coordinates. When smd pad is rotated,
	code must rotate two coordinates at shape central point and then rotate using package
	x and y as origin. For round smd pads current drawing must be changed from

	`moveTo, lineTo, lineTo, lineTo, lineTo`

	to something like

	`moveTo, lineTo, arc, lineTo, arc, lineTo, arc, lineTo, arc (or arcTo)`

	Border radius is calculated from roundness this way:

	`radius = (shortSideWidth/2) * roundness;`

2. Wire rotation for arcs in packages

3. Word wrap on line end (easy)

	http://stackoverflow.com/questions/16220562/word-wrapping-in-html5-canvas

	http://sourcoder.blogspot.ru/2012/12/text-wrapping-in-html-canvas.html

4. Text rotation origin, alignment

5. Pad shapes

###Kicad

1. Text alignment

2. Pad shapes
