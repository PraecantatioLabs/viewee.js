(function (root, factory) {
	if(typeof define === "function" && define.amd) {
		define(function(){
			return factory();
		});
	} else if(typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		var exports = factory();
		root.HtmlEl = exports.HtmlEl;
		root.SvgEl  = exports.SvgEl;
	}
}(this, function () {

function HtmlEl (name, attrs) {
	attrs = attrs || {};
	if (typeof document === "undefined")
		document = this.document;
	var el = attrs.xmlns ? document.createElementNS (attrs.xmlns, name) : document.createElement (name);
	for (var i in attrs) {
		if (i === 'xmlns') continue;
		el.setAttributeNS (null, i, attrs[i]);
		if (i.toLowerCase() == 'class') {
			el.className = attrs[i];  // for IE compatibility
		} else if (i.toLowerCase() == 'style') {
			el.style.cssText = attrs[i]; // for IE compatibility
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

function SvgEl (name, attrs) {
	attrs = Object.create (attrs || {});
	attrs.xmlns = "http://www.w3.org/2000/svg";
	var args = [].slice.call (arguments, 2);
	return HtmlEl.apply (this && this.document ? this : window, [].concat ([name, attrs], args));
}

	function mixin (obj) {
		obj.HtmlEl = HtmlEl;
		obj.SvgEl  = SvgEl;
	}

	mixin.HtmlEl = HtmlEl;
	mixin.SvgEl  = SvgEl;

	return mixin;

}));
