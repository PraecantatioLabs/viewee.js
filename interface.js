var eaglecanvas;

var itemHints = {
	'element:MCU' : 'The central processing unit. A NXP LPC 1343.',
	'element:X1' : 'A 12 MHz crystal. Provides a precise clock source in combination with C1 and C2. The processor has its own RC clock source, but a quartz is required to fulfill the strict timing requirements of USB.',
	'element:T1' : 'A MOSFET transistor that enables or disables the R3 pullup resistor by software, allowing the device to logically connect and disconnect from the USB. This feature is called "soft connect".',
	'element:R1' : 'A termination resistor (33Ω) for USB, preventing signal reflections in the USB wire.',
	'element:R2' : 'A termination resistor (33Ω) for USB, preventing signal reflections in the USB wire.',
	'element:R3' : 'A pullup resistor (1.5kΩ) that slightly pulls the USB D+ level towards 3.3V. This pullup signals the USB host that a device is connected to USB.',
	'element:R4' : 'A pullup resistor (10kΩ) for the programming pin, ensuring a HIGH level when the PGM button is not pressed.',
	'element:R5' : 'A pullup resistor (10kΩ) for the reset pin, ensuring a HIGH level when the PGM button is not pressed.',
	'element:R6' : 'The LED current limiting resistor(100Ω), ensuring that the LED current does not exceed 10mA.',
	'element:R7' : 'Forms a voltage divider (1.5kΩ) in combination with R8. Generates a signal for the MCU to detect a USB connection.',
	'element:R8' : 'Forms a voltage divider (10kΩ) in combination with R7. Generates a signal for the MCU to detect a USB connection.',
	'element:C1' : 'Crystal load capacitor (18pF). Tunes the capacitive load for the crystal to work properly.',
	'element:C2' : 'Crystal load capacitor (10pF). Tunes the capacitive load for the crystal to work properly.',
	'element:C3' : 'Input buffer capacitor (1µF) for the voltage regulator. Smoothes the voltage, prevents oscillation of the voltage regulator.',
	'element:C4' : 'Output buffer capacitor (1µF) for the voltage regulator. Smoothes the voltage, prevents oscillation of the voltage regulator.',
	'element:C5' : 'Power supply buffer (100nF) for the microcontroller. Stabilizes supply voltage, prevents digital noise from spreading.',
	'element:C6' : 'Power supply buffer (100nF) for the microcontroller. Stabilizes supply voltage, prevents digital noise from spreading.',
	'element:VREG' : '3.3V voltage regulator (LDO). Generates 3.3V for the microcontroller from 5V USB and higher voltages',
	'element:D1' : 'A double common cathode diode package. Prevents damage from reverse voltage, prevents current flow from higher voltage sources to lower voltage sources when more than one power supply is connected.',
	'element:RST' : "Reset button. Pulls the PIO0_0 pin low. Can be reconfigured as a user button (if you don't need a reset button).",
	'element:PGM' : 'Program button. Pulls the PIO0_1 pin low. At startup, this causes the microcontroller to boot into the bootloader in ROM. Can be used as an application button during normal operation.',
	'element:LED' : 'A light emitting diode. Emits light, controllable by software.',
	'element:USB' : 'Micro USB-B port. Power supply, host communication, programming.'

};

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

function ViewEE (options) {

	if (ViewEE.initialized)
		return ViewEE.initialized;

	if (!options) options = {};

	this.canvasSelector = options.canvasSelector || '#canvas';

	this.scaleSelector  = options.scaleSelector || '#outer';

	this.formSelector = options.formSelector || "form";

	var form = document.querySelector (this.formSelector);
	var radios = [].slice.apply (form.querySelectorAll ('input[name=side]'));
	radios.forEach (function (radio) {
		radio.addEventListener ('click', function (e) {
			e = e || window.event;
			if (e) e.stopPropagation();
			var ff = getFormFields (form);
			eaglecanvas.setBoardFlipped (ff.side === 'back');
		});
	});

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

	ViewEE.initialized = this;

	var resizeHandler = function () {
		eaglecanvas.scaleToFit ();
		eaglecanvas.draw ();
	}.bind (this);

	var resizeTimer;
	window.addEventListener ("resize", function() {
		clearTimeout (resizeTimer);
		resizeTimer = setTimeout (resizeHandler, 100);
	});

	loadWebFonts (function () {
		ViewEE.fontReady = true;
		if (this.loadUrl.delayed) {
			eaglecanvas.loadURL (this.loadUrl.delayed);
		} else if (this.loadText.delayed) {
			eaglecanvas.loadText (this.loadText.delayed);
		}
	}.bind (this));

}

ViewEE.prototype.loadUrl = function (url) {

	var defaultUrl = 'lpcprog.kicad_pcb';

	eaglecanvas = new EagleCanvas (this.canvasSelector);

	eaglecanvas.setScaleToFit (this.scaleSelector);
	if (!ViewEE.fontReady) {
		this.loadUrl.delayed = url || defaultUrl;
	} else {
		eaglecanvas.loadURL(url || defaultUrl, function () {});
	}

}

ViewEE.prototype.loadText = function (text) {

	eaglecanvas = new EagleCanvas (this.canvasSelector);

	eaglecanvas.setScaleToFit (this.scaleSelector);
	if (!ViewEE.fontReady) {
		this.loadText.delayed = text;
	} else {
		eaglecanvas.loadText (text);
	}
}


function zoomIn(e) {
	e = e || window.event;
	if (e) e.stopPropagation();
	eaglecanvas.setScale(eaglecanvas.getScale()*1.2);
}

function zoomOut(e) {
	e = e || window.event;
	if (e) e.stopPropagation();
	eaglecanvas.setScale(eaglecanvas.getScale()/1.2);
}

ViewEE.prototype.toggleLayer = function (e, layer) {
	e = e || window.event;
	if (e) e.stopPropagation();
	if (!layer) layer = parseInt (e.target.getAttribute ('data-layer'));
	var shown = eaglecanvas.isLayerVisible(layer);
	shown = !shown;
	eaglecanvas.setLayerVisible(layer,shown);
	this.updateCheckboxes();
}

ViewEE.prototype.updateCheckboxes = function () {
	for (var layerKey in EagleCanvas.LayerId) {
		var layerId = EagleCanvas.LayerId[layerKey];
		var form = document.querySelector (this.formSelector);
		var chk = form.querySelector ('input[data-layer="'+layerId+'"]');
		if (!chk) continue;
		chk.checked = (eaglecanvas.isLayerVisible(layerId)) ? "checked" : "";
	}
}

function canvasClick(e) {
	e = e || window.event;
	if (!e) return;
	e.stopPropagation();
	var canvas = document.getElementById('canvas');
	var x = e.clientX - canvas.getBoundingClientRect().left - canvas.clientLeft + canvas.scrollLeft;
	var y = e.clientY - canvas.getBoundingClientRect().top - canvas.clientTop + canvas.scrollTop;
	var hit = eaglecanvas.hitTest(x,y);
	selectItem(hit);
}

function selectItem(hit) {
	eaglecanvas.setHighlightedItem(hit);
	var hintsbox = document.getElementById('hintsbox');
	hintsbox.style.display = (hit) ? 'block' : 'none';
	if (hit) {
		var hintstitle = document.getElementById('hintstitle');
		while (hintstitle.childNodes.length > 0) hintstitle.removeChild(hintstitle.firstChild);
		var title = "";
		if (hit.type=='element') title = "Element: "+hit.name;
		else if (hit.type=='signal') title = "Signal: "+hit.name;
		hintstitle.appendChild(document.createTextNode(title));

		var hintstext = document.getElementById('hintstext');
		while (hintstext.childNodes.length > 0) hintstext.removeChild(hintstext.firstChild);
		var desc = "";
		if (hit.description) {
			desc = hit.description;
		} else if (typeof itemHints !== "undefined") {
			desc = itemHints[hit.type+":"+hit.name];
		}
		if (!desc) desc = "";
		hintstext.appendChild(document.createTextNode(desc));
	}
}

function init (url) {
	if (typeof viewee === "undefined") var viewee = new ViewEE ();
	viewee.loadUrl (url);
}
