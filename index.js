console.warn('WARN - async-chainable is still under heavy development');

var async = require('async');

// Import all Async functionality so this module becomes a drop-in replacement {{{
// Collections
module.exports.each = async.each;
module.exports.eachSeries = async.eachSeries;
module.exports.eachLimit = async.eachLimit;
module.exports.map = async.map;
module.exports.mapSeries = async.mapSeries;
module.exports.mapLimit = async.mapLimit;
module.exports.filter = async.filter;
module.exports.filterSeries = async.filterSeries;
module.exports.reject = async.reject;
module.exports.rejectSeries = async.rejectSeries;
module.exports.reduce = async.reduce;
module.exports.reduceRight = async.reduceRight;
module.exports.detect = async.detect;
module.exports.detectSeries = async.detectSeries;
module.exports.sortBy = async.sortBy;
module.exports.some = async.some;
module.exports.every = async.every;
module.exports.concat = async.concat;
module.exports.concatSeries = async.concatSeries;

// Control Flow
// module.exports.series = async.series;
// module.exports.parallel = async.parallel;
module.exports.parallelLimit = async.parallelLimit;
module.exports.whilst = async.whilst;
module.exports.doWhilst = async.doWhilst;
module.exports.until = async.until;
module.exports.doUntil = async.doUntil;
module.exports.forever = async.forever;
module.exports.waterfall = async.waterfall;
module.exports.compose = async.compose;
module.exports.seq = async.seq;
module.exports.applyEach = async.applyEach;
module.exports.applyEachSeries = async.applyEachSeries;
module.exports.queue = async.queue;
module.exports.priorityQueue = async.priorityQueue;
module.exports.cargo = async.cargo;
module.exports.auto = async.auto;
module.exports.retry = async.retry;
module.exports.iterator = async.iterator;
module.exports.apply = async.apply;
module.exports.nextTick = async.nextTick;
module.exports.times = async.times;
module.exports.timesSeries = async.timesSeries;
module.exports.Utils = async.Utils;

// Utils
module.exports.memoize = async.memoize;
module.exports.unmemoize = async.unmemoize;
module.exports.log = async.log;
module.exports.dir = async.dir;
module.exports.noConflict = async.noConflict;
// }}}

var _struct = [];
var _structPointer = 0;
var context = {
	_struct: _struct,
	_structPointer: _structPointer,
};
module.exports.context = context;

/**
* Examines an argument stack and returns all passed arguments as a CSV
* e.g.
*	function test () { getOverload(arguments) };
*	test('hello', 'world') // 'string,string'
*	test(function() {}, 1) // 'function,number'
*
* @param object args The special JavaScript 'arguments' object
* @return string CSV of all passed arguments
*/
var getOverload = function(args) {
	var i = 0;
	var out = [];
	while(1) {
		var argType = typeof args[i];
		if (argType == 'undefined') break;
		if (argType == 'object' && Object.prototype.toString.call(args[i]) == '[object Array]') // Special case for arrays being classed as objects
			argType = 'array';
		out.push(argType);
		i++;
	}
	return out.toString();
};

module.exports.series = module.exports.then = function() {
	switch(getOverload(arguments)) {
		case 'function': // Form: series(func)
			_struct.push({ type: 'seriesArray', payload: [arguments[0]] });
			break;
		case  'string,function': // Form: series(String <id>, func)
			var payload = {};
			payload[arguments[0]] = arguments[1];
			_struct.push({ type: 'seriesObject', payload: payload});
			break;
		case 'array': // Form: series(Array <funcs>)
			_struct.push({ type: 'seriesArray', payload: arguments[0] });
			break;
		case 'object': // Form: series(Object <funcs>)
			_struct.push({ type: 'seriesObject', payload: arguments[0] });
			break;
		case 'string,string,function': // Form: series(String <prereq>, String <name>, func)
		case 'array,string,function': // Form: series(Array <prereq>, string <name>, func)
			var payload = {};
			payload[arguments[1]] = arguments[2];
			_struct.push({ type: 'seriesArray', prereq: [arguments[1]], payload: payload });
			break;
		default:
			console.error('Unknown call style for .series():', calledAs);
	}

	return this;
};

module.exports.parallel = function() {
	switch (getOverload(arguments)) {
		case 'function': // Form: parallel(func)
			_struct.push({ type: 'parallelArray', payload: [arguments[0]] });
			break;
		case 'string,function': // Form: parallel(String <id>, func)
			var payload = {};
			payload[arguments[0]] = arguments[1];
			_struct.push({ type: 'parallelArray', payload: payload });
			break;
		case 'array': // Form: parallel(Array <funcs>)
			_struct.push({ type: 'parallelArray', payload: arguments[0] });
			break;
		case 'object': // Form: series(Object <funcs>)
			_struct.push({ type: 'parallelObject', payload: arguments[0] });
			break;
		case 'string,string,function': // Form: parallel(String <prereq>, String <name>, func)
		case 'array,string,function': //Form: parallel(Array <prereqs>, String <name>, func)
			var payload = {};
			payload[arguments[1]] = arguments[2];
			_struct.push({ type: 'parallelArray', prereq: [arguments[0]], payload: payload });
			break;
		default:
			console.error('Unknown call style for .parallel():', calledAs);
	}

	return this;
};

var finalize = function(err) {
	console.log('FINALIZE WITH CONTEXT', context);
};

var execute = function(err) {
	if (_structPointer >= _struct.length) { // Finished executing
		finalize(err);
		return this;
	}
	console.log('EXECUTE', err, 'POINTER AT', _structPointer);
	var currentExec = _struct[_structPointer];
	// Sanity checks {{{
	if (!currentExec.type) {
		console.error('No type is specified for async-chainable structure at position', _structPointer, currentExec);
		return;
	}
	// }}}
	_structPointer++;
	// Execute based on currentExec.type {{{
	switch (currentExec.type) {
		case 'parallelArray':
			async.parallel(currentExec.payload.map(function(task) {
				return function(next) {
					task.call(context, next);
				};
			}), execute);
			break;
		case 'parallelObject':
			var tasks = [];
			Object.keys(currentExec.payload).forEach(function(key) {
				tasks.push(function(next, err) {
					currentExec.payload[key].call(context, function(err, value) {
						console.log('Finished parallel object item', key, '=', value);
						context[key] = value;
						next(err);
					})
				});
			});
			async.parallel(tasks, execute);
			break;
		case 'seriesArray':
			async.series(currentExec.payload.map(function(task) {
				return function(next) {
					task.call(context, next);
				};
			}), execute);
			break;
		default:
			console.error('Unknown async-chainable exec type:', currentExec);
			return;
	}
	// }}}
};

module.exports.end = function() { 
	switch (getOverload(arguments)) {
		case '': // No functions passed - do nothing
			// Pass
			break;
		case 'function': // Form: end(func) -> redirect as if called with series(func)
			_struct.push({ type: 'seriesArray', payload: [arguments[0]] });
			break;
		case 'array': // Form: end(Array <funcs>) -> redirect as if called with series(funcs)
			_struct.push({ type: 'seriesArray', payload: arguments[0] });
			break;
		case 'object': // Form: end(Object <funcs>) -> redirect as if called with series(funcs)
			_struct.push({ type: 'seriesObject', payload: arguments[0] });
			break;
		default:
			console.error('Unknown call style for .end():', calledAs);
	}

	console.log('FINAL STRUCT IS', _struct);
	execute();
	return this;
};
