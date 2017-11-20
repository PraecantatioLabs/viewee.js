import assert from "assert";
import crypto from "crypto";

import fs     from "fs";

import {DOMParser, XMLSerializer} from 'xmldom';

var testCommon = require ('./common.js');

var baseName = testCommon.baseName (__filename);

import layers from '../src/board/layers';

describe (baseName + " running", () => {

	it ("layers order", function () {
		console.log (layers);

		console.log (layers.CAMLayers);
	});

})
