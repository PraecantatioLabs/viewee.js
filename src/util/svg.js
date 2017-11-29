// this code was taken from https://github.com/jkroso/parse-svg-path/blob/master/index.js
// MIT License

/**
 * expected argument lengths
 * @type {Object}
 */

const ARG_COUNT = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0}

/**
 * segment pattern
 * @type {RegExp}
 */

const SEGMENT_MATCH = /([astvzqmhlc])([^astvzqmhlc]*)/ig

/**
 * parse an svg path data string. Generates an Array
 * of commands where each command is an Array of the
 * form `[command, arg1, arg2, ...]`
 *
 * @param {String} path
 * @return {Array}
 */

export function parsePath (path) {
	var data = []
	path.replace(SEGMENT_MATCH, function(_, command, args){
		var type = command.toLowerCase();
		args = parseValues(args);

		// overloaded moveTo
		if (type === 'm' && args.length > 2) {
			data.push([command].concat(args.splice(0, 2)));
			type = 'l';
			command = command === 'm' ? 'l' : 'L';
		}

		while (true) {
			if (args.length === ARG_COUNT[type]) {
				args.unshift(command);
				return data.push(args);
			}
			if (args.length < ARG_COUNT[type])
				throw new Error('malformed path data');
			data.push([command].concat(args.splice(0, ARG_COUNT[type])));
		}
	})
	return data;
}

const NUMBER_MATCH = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig;

function parseValues(args) {
	var numbers = args.match(NUMBER_MATCH);
	return numbers ? numbers.map(Number) : [];
}
