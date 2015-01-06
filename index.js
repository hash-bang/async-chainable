var async = require('async');

/**
* Examines an argument stack and returns all passed arguments as a CSV
* e.g.
*	function test () { getOverload(arguments) };
*	test('hello', 'world') // 'string,string'
*	test(function() {}, 1) // 'function,number'
*	test('hello', 123, {foo: 'bar'}, ['baz'], [{quz: 'quzValue'}, {quuz: 'quuzValue'}]) // 'string,number,object,array,collection'
*
* @param object args The special JavaScript 'arguments' object
* @return string CSV of all passed arguments
*/
function getOverload(args) {
	var i = 0;
	var out = [];
	while(1) {
		var argType = typeof args[i];
		if (argType == 'undefined') break;
		if (argType == 'object' && Object.prototype.toString.call(args[i]) == '[object Array]') { // Special case for arrays being classed as objects
			argType = 'array';
			if (args[i].length && args[i].every(function(item) {
				return (typeof item == 'object' && Object.prototype.toString.call(item) == '[object Object]');
			}))
				argType = 'collection';
		}
		out.push(argType);
		i++;
	}
	return out.toString();
};

/**
* Queue up a function(s) to execute in series
* @param array,object,function The function(s) to execute
* @return object This chainable object
*/
function series() {
	var calledAs = getOverload(arguments);
	switch(calledAs) {
		case '':
			// Pass
			break;
		case 'function': // Form: series(func)
			this._struct.push({ type: 'seriesArray', payload: [arguments[0]] });
			break;
		case  'string,function': // Form: series(String <id>, func)
			var payload = {};
			payload[arguments[0]] = arguments[1];
			this._struct.push({ type: 'seriesObject', payload: payload});
			break;
		case 'array': // Form: series(Array <funcs>)
			this._struct.push({ type: 'seriesArray', payload: arguments[0] });
			break;
		case 'object': // Form: series(Object <funcs>)
			this._struct.push({ type: 'seriesObject', payload: arguments[0] });
			break;
		case 'collection': // Form: series(Collection <funcs>)
			this._struct.push({ type: 'seriesCollection', payload: arguments[0] });
			break;

		// Async library compatibility {{{
		case 'array,function':
			this._struct.push({ type: 'seriesArray', payload: arguments[0] });
			this.end(arguments[1]);
			break;
		case 'object,function':
			this._struct.push({ type: 'seriesObject', payload: arguments[0] });
			this.end(arguments[1]);
			break;
		// }}}
		default:
			console.error('Unknown call style for .series():', calledAs);
	}

	return this;
};


/**
* Queue up a function(s) to execute in parallel
* @param array,object,function The function(s) to execute
* @return object This chainable object
*/
function parallel() {
	var calledAs = getOverload(arguments)
	switch (calledAs) {
		case '':
			// Pass
			break;
		case 'function': // Form: parallel(func)
			this._struct.push({ type: 'parallelArray', payload: [arguments[0]] });
			break;
		case 'string,function': // Form: parallel(String <id>, func)
			var payload = {};
			payload[arguments[0]] = arguments[1];
			this._struct.push({ type: 'parallelArray', payload: payload });
			break;
		case 'array': // Form: parallel(Array <funcs>)
			this._struct.push({ type: 'parallelArray', payload: arguments[0] });
			break;
		case 'object': // Form: series(Object <funcs>)
			this._struct.push({ type: 'parallelObject', payload: arguments[0] });
			break;
		case 'collection': // Form: series(Collection <funcs>)
			this._struct.push({ type: 'parallelCollection', payload: arguments[0] });
			break;

		// Async library compatibility {{{
		case 'array,function':
			this._struct.push({ type: 'parallelArray', payload: arguments[0] });
			this.end(arguments[1]);
			break;
		case 'object,function':
			this._struct.push({ type: 'parallelObject', payload: arguments[0] });
			this.end(arguments[1]);
			break;
		// }}}
		default:
			console.error('Unknown call style for .parallel():', calledAs);
	}

	return this;
};


// Defer functionality - Here be dragons! {{{
/**
* Collection of items that have been deferred
* @type collection {payload: function, id: null|String, prereq: [dep1, dep2...]}
* @access private
*/
function deferAdd(id, task, parentChain) {
	var self = this;
	parentChain.waitingOn = (parentChain.waitingOn || 0) + 1;

	if (! parentChain.waitingOnIds)
		parentChain.waitingOnIds = [];
	parentChain.waitingOnIds.push(id);

	self._deferred.push({
		id: id || null,
		prereq: parentChain.prereq || [],
		payload: function(next) {
			task.call(self._options.context, function(err, value) {
				if (id)
					self._context[id] = value;
				self._deferredRunning--;
				if (--parentChain.waitingOn == 0) {
					parentChain.completed = true;
					if (self._struct.length && self._struct[self._structPointer].type == 'await')
						self._execute(err);
				}
				self._execute(err);
			});
		}
	});
};


function _deferCheck() {
	var self = this;
	if (self._options.limit && self._deferredRunning >= self._options.limit) return; // Already over limit
	self._deferred = self._deferred.filter(function(item) {
		if (self._options.limit && self._deferredRunning >= self._options.limit) {
			return true; // Already over limit - all subseqent items should be left in place
		}
		if (
			item.prereq.length == 0 || // No pre-reqs - can execute now
			item.prereq.every(function(dep) { // All pre-reqs are satisfied
				return self._context.hasOwnProperty(dep);
			})
		) { 
			self._deferredRunning++;
			setTimeout(item.payload);
			return false;
		} else { // Can't do anything with self right now
			return true;
		}
	});
};
// }}}


/**
* Queue up a function(s) to execute as deferred - i.e. dont stop to wait for it
* @param array,object,function The function(s) to execute as a defer
* @return object This chainable object
*/
function defer() {
	var calledAs = getOverload(arguments);
	switch (calledAs) {
		case '':
			// Pass
			break;
		case 'function': // Form: defer(func)
			this._struct.push({ type: 'deferArray', payload: [arguments[0]] });
			break;
		case 'string,function': // Form: defer(String <id>, func)
			var payload = {};
			payload[arguments[0]] = arguments[1];
			this._struct.push({ type: 'deferObject', payload: payload });
			break;
		case 'array': // Form: defer(Array <funcs>)
			this._struct.push({ type: 'deferArray', payload: arguments[0] });
			break;
		case 'object': // Form: defer(Object <funcs>)
			this._struct.push({ type: 'deferObject', payload: arguments[0] });
			break;
		case 'collection': // Form defer(Collection <funcs>)
			this._struct.push({ type: 'deferCollection', payload: arguments[0] });
			break;
		case 'string,string,function': // Form: defer(String <prereq>, String <name>, func)
			var payload = {};
			payload[arguments[1]] = arguments[2];
			this._struct.push({ type: 'deferObject', prereq: [arguments[0]], payload: payload });
			break;
			break;
		case 'array,string,function': //Form: defer(Array <prereqs>, String <name>, func)
			var payload = {};
			payload[arguments[1]] = arguments[2];
			this._struct.push({ type: 'deferObject', prereq: arguments[0], payload: payload });
			break;
		default:
			console.error('Unknown call style for .defer():', calledAs);
	}

	return this;
};


/**
* Queue up an await point
* This stops the execution queue until its satisfied that dependencies have been resolved
* @param array,... The dependencies to check resolution of. If omitted all are checked
* @return object This chainable object
*/
function await() {
	var payload = [];

	// Slurp all args into payload {{{
	var args = arguments;
	getOverload(arguments).split(',').forEach(function(type, offset) {
		switch (type) {
			case '': // Blank arguments - do nothing
				// Pass
				break;
			case 'string':
				payload.push(args[offset]);
				break;
			case 'array':
				payload.concat(args[offset]);
				break;
			default:
				console.error('Unknown argument type passed to .await():', type);
		}
	});
	// }}}

	this._struct.push({ type: 'await', payload: payload });

	return this;
};


/**
* Queue up a limit setter
* @param int|null|false Either the number of defer processes that are allowed to execute simultaniously or falsy values to disable
* @return object This chainable object
*/
function setLimit(setLimit) {
	this._struct.push({ type: 'limit', payload: setLimit });
	return this;
};


/**
* Queue up a context setter
* @param object newContext The new context to pass to all subsequent functions via `this`
* @return object This chainable object
*/
function setContext(newContext) {
	this._struct.push({ type: 'context', payload: newContext });
	return this;
};


/**
* Queue up a varable setter (i.e. set a hash of variables in context)
* @param string The named key to set
* @param mixed The value to set
* @return object This chainable object
*/
function set() {
	var calledAs = getOverload(arguments);
	switch(calledAs) {
		case '':
			// Pass
			break;
		case 'string,string': // Form: set(String <key>, String <value)
			var payload = {};
			payload[arguments[0]] = arguments[1];
			this._struct.push({ type: 'set', payload: payload });
			break;
		case 'object': // Form: set(Object)
			this._struct.push({ type: 'set', payload: arguments[0] });
			break;
		case 'function': // Form: set(func) -> series(func)
			this._struct.push({ type: 'seriesArray', payload: [arguments[0]] });
			break;
		case  'string,function': // Form: set(String, func) -> series(String <id>, func)
			var payload = {};
			payload[arguments[0]] = arguments[1];
			this._struct.push({ type: 'seriesObject', payload: payload});
			break;
		default:
			console.error('Unknown call style for .set():', calledAs);
	}

	return this;
};


/**
* Internal function executed at the end of the chain
* This can occur either in sequence (i.e. no errors) or a jump to this position (i.e. an error happened somewhere)
* @access private
*/
function _finalize(err) {
	// Sanity checks {{{
	if (this._struct.length == 0) return; // Finalize called on dead object - probably a defer() fired without an await()
	if (this._struct[this._struct.length - 1].type != 'end') {
		console.error('While trying to find an end point in the async-chainable structure the last item in the this._struct does not have type==end!');
		return;
	}
	// }}}
	this._struct[this._struct.length-1].payload.call(this._options.context, err);
	if (this._options.autoReset)
		this.reset();
};


/**
* Internal function to execute the next pending queue item
* This is usually called after the completion of every async.series() / async.parallel() call
* @access private
*/
function _execute(err) {
	var self = this;
	if (self._structPointer >= self._struct.length) return this._finalize(err); // Nothing more to execute in struct
	if (err) return this._finalize(err); // An error has been raised - stop exec and call finalize now
	self._deferCheck(); // Kick off any pending deferred items
	var currentExec = self._struct[self._structPointer];
	// Sanity checks {{{
	if (!currentExec.type) {
		console.error('No type is specified for async-chainable structure at position', self._structPointer, currentExec);
		return self;
	}
	// }}}
	self._structPointer++;
	// self._struct exec - Execute based on currentExec.type {{{
	switch (currentExec.type) {
		case 'parallelArray':
			if (!currentExec.payload || !currentExec.payload.length) { currentExec.completed = true; return self._execute() };
			async.parallel(currentExec.payload.map(function(task) {
				return function(next) {
					task.call(self._options.context, next);
				};
			}), function(err) {
				currentExec.completed = true;
				self._execute(err);
			});
			break;
		case 'parallelObject':
			var tasks = [];
			var keys = Object.keys(currentExec.payload);
			if (!keys || !keys.length) { currentExec.completed = true; return self._execute() };
			keys.forEach(function(key) {
				tasks.push(function(next, err) {
					currentExec.payload[key].call(self._options.context, function(err, value) {
						self._context[key] = value; // Allocate returned value to context
						next(err);
					})
				});
			});
			async.parallel(tasks, function(err) {
				currentExec.completed = true;
				self._execute(err);
			});
			break;
		case 'parallelCollection':
			if (!currentExec.payload || !currentExec.payload.length) { currentExec.completed = true; return self._execute() };
			var tasks = [];
			currentExec.payload.forEach(function(task) {
				Object.keys(task).forEach(function(key) {
					tasks.push(function(next, err) {
						if (typeof task[key] != 'function') throw new Error('Collection item for parallel exec is not a function', currentExec.payload);
						task[key].call(self._options.context, function(err, value) {
							self._context[key] = value; // Allocate returned value to context
							next(err);
						})
					});
				});
			});
			async.parallel(tasks, function(err) {
				currentExec.completed = true;
				self._execute(err);
			});
			break;
		case 'seriesArray':
			if (!currentExec.payload || !currentExec.payload.length) { currentExec.completed = true; return self._execute() };
			async.series(currentExec.payload.map(function(task) {
				return function(next) {
					task.call(self._options.context, next);
				};
			}), function(err) {
				currentExec.completed = true;
				self._execute(err);
			});
			break;
		case 'seriesObject':
			var tasks = [];
			var keys = Object.keys(currentExec.payload);
			if (!keys || !keys.length) { currentExec.completed = true; return self._execute() };
			keys.forEach(function(key) {
				tasks.push(function(next, err) {
					currentExec.payload[key].call(self._options.context, function(err, value) {
						self._context[key] = value; // Allocate returned value to context
						next(err);
					})
				});
			});
			async.series(tasks, function(err) {
				currentExec.completed = true;
				self._execute(err);
			});
			break;
		case 'seriesCollection':
			if (!currentExec.payload || !currentExec.payload.length) { currentExec.completed = true; return self._execute() };
			var tasks = [];
			currentExec.payload.forEach(function(task) {
				Object.keys(task).forEach(function(key) {
					tasks.push(function(next, err) {
						if (typeof task[key] != 'function') throw new Error('Collection item for series exec is not a function', currentExec.payload);
						task[key].call(self._options.context, function(err, value) {
							self._context[key] = value; // Allocate returned value to context
							next(err);
						})
					});
				});
			});
			async.series(tasks, function(err) {
				currentExec.completed = true;
				self._execute(err);
			});
			break;
		case 'deferArray':
			if (!currentExec.payload || !currentExec.payload.length) { currentExec.completed = true; return self._execute() };
			currentExec.payload.forEach(function(task) {
				self._deferAdd(null, task, currentExec);
			});
			self._execute(); // Move on immediately
			break;
		case 'deferObject':
			var tasks = [];
			var keys = Object.keys(currentExec.payload);
			if (!keys || !keys.length) { currentExec.completed = true; return self._execute() };
			keys.forEach(function(key) {
				self._deferAdd(key, currentExec.payload[key], currentExec);
			});
			self._execute(); // Move on immediately
			break;
		case 'deferCollection':
			if (!currentExec.payload || !currentExec.payload.length) { currentExec.completed = true; return self._execute() };
			var tasks = [];
			currentExec.payload.forEach(function(task) {
				Object.keys(task).forEach(function(key) {
					self._deferAdd(key, task[key], currentExec);
				});
			});
			self._execute(); // Move on immediately
			break;
		case 'await': // Await can operate in two modes, either payload=[] (examine all) else (examine specific keys)
			if (!currentExec.payload.length) { // Check all tasks are complete
				if (self._struct.slice(0, self._structPointer - 1).every(function(stage) { // Examine all items UP TO self one and check they are complete
					return stage.completed;
				})) { // All tasks up to self point are marked as completed
					currentExec.completed = true;
					self._execute(); // Go onto next stage
				} else {
					self._structPointer--; // At least one task is outstanding - rewind to self stage so we repeat on next resolution
				}

			} else { // Check certain tasks are complete by key
				var allOk = true;
				if (currentExec.payload.every(function(dep) { // Examine all named dependencies
					return !! self._context[dep];
				})) { // All are present
					currentExec.completed = true;
					self._execute(); // Go onto next stage
				} else {
					self._structPointer--; // At least one dependency is outstanding - rewind to self stage so we repeat on next resolution
				}
			}
			break;
		case 'limit': // Set the options.limit variable
			self._options.limit = currentExec.payload;
			currentExec.completed = true;
			self._execute(); // Move on to next action
			break;
		case 'context': // Change the self._options.context object
			self._options.context = currentExec.payload ? currentExec.payload : self._context; // Set context (if null use internal context)
			currentExec.completed = true;
			self._execute(); // Move on to next action
			break;
		case 'set': // Set a hash of variables within context
			var keys = Object.keys(currentExec.payload);
			if (!keys || !keys.length) { currentExec.completed = true; return self._execute() };
			keys.forEach(function(key) {
				self._context[key] = currentExec.payload[key];
			});
			currentExec.completed = true;
			self._execute(); // Move on to next action
			break;
		case 'end': // self should ALWAYS be the last item in the structure and indicates the final function call
			this._finalize();
			break;
		default:
			console.error('Unknown async-chainable exec type:', currentExec);
			return;
	}
	// }}}
};


/**
* Reset all state variables and return the object into a pristine condition
* @return object This chainable object
*/
function reset() {
	this._struct = [];
	this._structPointer = 0;

	var reAttachContext = (this._options.context == this._context); // Reattach the context pointer after reset?
	this._context = {
		_struct: this._struct,
		_structPointer: this._structPointer,
		_options: this._options,
		_deferredRunning: this._deferredRunning,
	};

	if (reAttachContext) this._options.context = this._context;
};

/**
* Queue up an optional single function for execution on completion
* This function also starts the queue executing
* @return object This chainable object
*/
function end() { 
	var calledAs = getOverload(arguments);
	switch (calledAs) {
		case '': // No functions passed - do nothing
			this._struct.push({ type: 'end', payload: function() {} }); // .end() called with no args - make a noop()
			break;
		case 'function': // Form: end(func) -> redirect as if called with series(func)
			this._struct.push({ type: 'end', payload: arguments[0] });
			break;
		default:
			console.error('Unknown call style for .end():', calledAs);
	}

	this._execute();
	return this;
};

var objectInstance = function() {
	// Variables {{{
	this._struct = [];
	this._structPointer = 0;
	this._context = {};

	this._options = {
		autoReset: true, // Run asyncChainable.reset() after finalize. Disable this if you want to see a post-mortem on what did run
		limit: 10, // Number of defer functions that are allowed to execute at once
		context: this._context, // The context item passed to the functions (can be changed with .context())
	};
	// }}}

	// Async-Chainable functions {{{
	// Private {{{
	this._execute = _execute;
	this._deferCheck = _deferCheck;
	this._deferAdd = deferAdd;
	this._deferred = [];
	this._deferredRunning = 0;
	this._finalize = _finalize;
	// }}}

	this.await = await;
	this.context = setContext;
	this.defer = defer;
	this.end = end;
	this.limit = setLimit;
	this.parallel = parallel;
	this.reset = reset;
	this.series = series;
	this.set = set;
	this.then = series;
	this.new = newObjectInstance;
	this.examine = function() {
		console.log('EXAMINE', this);
		return this;
	};
	// }}}

	// Async compat functionality - so this module becomes a drop-in replacement {{{
	// Collections
	this.each = async.each;
	this.eachSeries = async.eachSeries;
	this.eachLimit = async.eachLimit;
	this.map = async.map;
	this.mapSeries = async.mapSeries;
	this.mapLimit = async.mapLimit;
	this.filter = async.filter;
	this.filterSeries = async.filterSeries;
	this.reject = async.reject;
	this.rejectSeries = async.rejectSeries;
	this.reduce = async.reduce;
	this.reduceRight = async.reduceRight;
	this.detect = async.detect;
	this.detectSeries = async.detectSeries;
	this.sortBy = async.sortBy;
	this.some = async.some;
	this.every = async.every;
	this.concat = async.concat;
	this.concatSeries = async.concatSeries;

	// Control Flow
	// See main .series() and .parallel() code for async compatibility
	this.parallelLimit = async.parallelLimit;
	this.whilst = async.whilst;
	this.doWhilst = async.doWhilst;
	this.until = async.until;
	this.doUntil = async.doUntil;
	this.forever = async.forever;
	this.waterfall = async.waterfall;
	this.compose = async.compose;
	this.seq = async.seq;
	this.applyEach = async.applyEach;
	this.applyEachSeries = async.applyEachSeries;
	this.queue = async.queue;
	this.priorityQueue = async.priorityQueue;
	this.cargo = async.cargo;
	this.auto = async.auto;
	this.retry = async.retry;
	this.iterator = async.iterator;
	this.apply = async.apply;
	this.nextTick = async.nextTick;
	this.times = async.times;
	this.timesSeries = async.timesSeries;
	this.Utils = async.Utils;

	// Utils
	this.memoize = async.memoize;
	this.unmemoize = async.unmemoize;
	this.log = async.log;
	this.dir = async.dir;
	this.noConflict = async.noConflict;
	// }}}

	this.reset();
}

function newObjectInstance() {
	// Really nasty hack to ensure that a subsequent require() gets a new object instance
	// This is to prevent nested calls spanned over requires() (i.e. in different modules / controllers / models) from getting the 'global' parent object
	// This is annoying but the only way the one-instance-per-require() pattern can work
	// See the `/tests/nesting#nesting via require()` test to see this in action
	// If anyone knows of a away around this please contact me
	// @author Matt Carter <m@ttcarter.com>
	// @date 2015-01-06
	require.cache[require.resolve(__filename)].exports = new objectInstance;

	return new objectInstance;
}

// Return the output object
module.exports = newObjectInstance();
