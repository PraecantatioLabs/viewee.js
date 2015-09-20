/* globals define, exports, module */

(function(root, definition) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], definition);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but only CommonJS-like
		// environments that support module.exports, like Node.
		module.exports = definition();
	} else {
		// Browser globals (root is window)
		root.ViewEE = definition();
	}
}(window, function() {

var fontLoaded = false;

function stupidWebfontTrick(eagle) {
	if (!fontLoaded) {
		// see http://stackoverflow.com/a/8223543/27408
		var i = new Image()
		i.src = "../fonts/osifont.woff"
		i.onerror = function() {
			eagle.draw()
			setTimeout(function(){eagle.draw()}, 50)
			fontLoaded = true;
		};
	}

	updateCheckboxes()
	selectItem(null)
}

function loadWebFonts (cb) {
	if (typeof FontLoader === "undefined") {
		setTimeout (cb, 500);
		return;
	}

	var fontLoader = new FontLoader(["vector"], {
		"complete": function(error) {
			if (error !== null) {
				// Reached the timeout but not all fonts were loaded
				console.log(error.message);
				console.log(error.notLoadedFonts);
			} else {
				// All fonts were loaded
				// console.log("all fonts were loaded");
			}
			cb();
		}
	}, 500);

	fontLoader.loadFonts();
}

function MakeEl (name, attributes) {
	var el = document.createElement (name);
	if (typeof attributes == 'object') {
		for (var i in attributes) {
			el.setAttribute (i, attributes[i]);
			if (i.toLowerCase() == 'class') {
				el.className = attributes[i];  // for IE compatibility
			} else if (i.toLowerCase() == 'style') {
				el.style.cssText = attributes[i]; // for IE compatibility
			}
		}
	}
	for (var i = 2; i<arguments.length; i++) {
		var val = arguments[i];
		if (typeof val == 'string')
			val = document.createTextNode( val );
		if (el && el.appendChild)
			el.appendChild (val);
	}
	return el;
}

function getFormFields (formEl, formData) {
	formData = formData || {};
	for (var k in formData) {
		delete formData[k];
	}
	for (var i = 0; i < formEl.elements.length; i ++) {
		var formField = formEl.elements[i];
		var checkedType = formField.type.match (/^(?:radio|checkbox)$/);
		if ((checkedType && formField.checked) || !checkedType) {
			formData[formField.name] = formField.value;
		}
	}
	// console.log (formData);
	return formData;
}

var layers = [
	{id: 5, title: "Top Copper"},
	{id: 6, title: "Top silkscreen"},
	{id: 7, title: "Top documentation"},
	{id: 1, title: "Bottom copper"},
	{id: 2, title: "Bottom silkscreen"},
	{id: 3, title: "Bottom documentation"},
	{id: 9, title: "Outline"},
	{id: 8, title: "Vias"},
	{id: 4, title: "Dim backside"},
];

var EagleCanvas;

function ViewEE (options, EagleCanvasClass) {

	if (ViewEE.initialized)
		return ViewEE.initialized;

	EagleCanvas = EagleCanvas || EagleCanvasClass || window.EagleCanvas;

	if (!options) options = {};

	this.node = options.node || document;

	this.canvasSelector = options.canvasSelector || '#canvas';
	this.scaleSelector  = options.scaleSelector  || '#outer';
	this.formSelector   = options.formSelector   || "form";
	this.hintsBoxSel    = options.hintsBoxSel    || '#hintsbox';
	this.hintsTitleSel  = options.hintsTitleSel  || '#hintstitle';
	this.hintsTextSel   = options.hintsTextSel   || '#hintstext';


	var form = this.node.querySelector (this.formSelector);
	var radios = [].slice.apply (form.querySelectorAll ('input[name=side]'));
	radios.forEach (function (radio) {
		radio.addEventListener ('click', function (e) {
			e = e || window.event;
			if (e) e.stopPropagation();
			var ff = getFormFields (form);
			this.canvas.setBoardFlipped (ff.side === 'back');
		}.bind (this));
	}, this);

	var layerList = form.querySelector ('div.dropdown ul.layers');
	layerList.innerHTML = '';

	for (var i = 0; i < layers.length; i++) {
		var layerNum = layers[i].id;
		var chk = MakeEl ('input', {
			type: "checkbox", checked: "true", id: "layer-"+layerNum, "data-layer": layerNum
		});
		var li = MakeEl (
			'li', {},
			chk,
			MakeEl ('label', {for: "layer-"+layerNum}, layers[i].title)
		);

		layerList.appendChild (li);

		chk.addEventListener ('click', this.toggleLayer.bind (this));
	}

	var zoomIn = form.querySelector ('.zoomIn');
	zoomIn.addEventListener ("click", this.zoomInHandler.bind (this), false);

	var zoomOut = form.querySelector ('.zoomOut');
	zoomOut.addEventListener ("click", this.zoomOutHandler.bind (this), false);

	var canvas = this.node.querySelector (this.canvasSelector);
	canvas.addEventListener ("click", this.canvasClick.bind (this), false);

	ViewEE.initialized = this;

	var resizeHandler = function () {
		this.canvas.scaleToFit ();
		this.canvas.draw ();
	}.bind (this);

	var resizeTimer;
	window.addEventListener ("resize", function() {
		clearTimeout (resizeTimer);
		resizeTimer = setTimeout (resizeHandler, 100);
	});

	loadWebFonts (function () {
		ViewEE.fontReady = true;
		if (this.loadUrl.delayed) {
			this.canvas.loadURL (this.loadUrl.delayed);
		} else if (this.loadText.delayed) {
			this.canvas.loadText (this.loadText.delayed);
		}
	}.bind (this));

}

ViewEE.init = function (url) {
	var viewee = new ViewEE ();
	viewee.loadUrl (url);
}

ViewEE.deselect = function () {
	var viewee = new ViewEE ();
	viewee.selectItem (null);
}


ViewEE.prototype.loadUrl = function (url) {

	var defaultUrl; // = 'problems/no holes - lpc1114-valdez-mut-v.04.brd';

	var form = this.node.querySelector (this.formSelector);
	if (form) {
		var option = form.querySelector ("select.board option");
		defaultUrl = option.value;
	}

	this.canvas = new EagleCanvas (this.node.querySelector (this.canvasSelector));

	this.canvas.setScaleToFit (this.scaleSelector);
	if (!ViewEE.fontReady) {
		this.loadUrl.delayed = url || defaultUrl;
	} else {
		this.canvas.loadURL(url || defaultUrl, function () {});
	}

}

ViewEE.prototype.loadText = function (text) {

	this.canvas = new EagleCanvas (this.node.querySelector (this.canvasSelector));

	this.canvas.setScaleToFit (this.scaleSelector);

	if (!ViewEE.fontReady) {
		this.loadText.delayed = text;
	} else {
		this.canvas.loadText (text);
	}
}


ViewEE.prototype.zoomInHandler = function (e) {
	e = e || window.event;
	if (e) e.stopPropagation();
	this.canvas.setScale (this.canvas.getScale()*1.2);
}

ViewEE.prototype.zoomOutHandler = function (e) {
	e = e || window.event;
	if (e) e.stopPropagation();
	this.canvas.setScale (this.canvas.getScale()/1.2);
}

ViewEE.prototype.toggleLayer = function (e, layer) {
	e = e || window.event;
	if (e) e.stopPropagation();
	if (!layer) layer = parseInt (e.target.getAttribute ('data-layer'));
	var shown = this.canvas.isLayerVisible(layer);
	shown = !shown;
	this.canvas.setLayerVisible(layer,shown);
	this.updateCheckboxes();
}

ViewEE.prototype.updateCheckboxes = function () {
	for (var layerKey in EagleCanvas.LayerId) {
		var layerId = EagleCanvas.LayerId[layerKey];
		var form = this.node.querySelector (this.formSelector);
		var chk = form.querySelector ('input[data-layer="'+layerId+'"]');
		if (!chk) continue;
		chk.checked = (this.canvas.isLayerVisible(layerId)) ? "checked" : "";
	}
}

ViewEE.prototype.canvasClick = function (e) {
	e = e || window.event;
	if (!e) return;
	e.stopPropagation();
	var canvas = this.node.querySelector (this.canvasSelector);
	var x = e.clientX - canvas.getBoundingClientRect().left - canvas.clientLeft + canvas.scrollLeft;
	var y = e.clientY - canvas.getBoundingClientRect().top - canvas.clientTop + canvas.scrollTop;
	var hit = this.canvas.hitTest(x,y);
	this.selectItem(hit);
}

ViewEE.prototype.selectItem = function (hit) {
	this.canvas.setHighlightedItem (hit);
	var hintsbox = this.node.querySelector (this.hintsBoxSel);
	hintsbox.style.display = (hit) ? 'block' : 'none';

	if (!hit) return;

	var hintstitle = this.node.querySelector (this.hintsTitleSel);
	while (hintstitle.childNodes.length > 0)
		hintstitle.removeChild(hintstitle.firstChild);
	var title = "";
	if (hit.type=='element') title = "Element: "+hit.name;
	else if (hit.type=='signal') title = "Signal: "+hit.name;
	hintstitle.appendChild (document.createTextNode(title));

	var hintstext = this.node.querySelector (this.hintsTextSel);
	while (hintstext.childNodes.length > 0)
		hintstext.removeChild(hintstext.firstChild);
	var desc = "";
	if (hit.description) {
		desc = hit.description;
	} else if (typeof itemHints !== "undefined") {
		desc = itemHints[hit.type+": "+hit.name];
	}
	if (!desc) desc = "";
	hintstext.appendChild(document.createTextNode(desc));
}

return ViewEE;

}))
