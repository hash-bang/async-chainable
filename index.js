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

// Utility functions {{{
/**
* Return true if a variable is an array
* @param mixed thing The varable to examine
* @return bool True if the item is a classic JS array and not an object
*/
function isArray(thing) {
	return (
		typeof thing == 'object' &&
		Object.prototype.toString.call(thing) == '[object Array]'
	);
}


/**
* Return true if a variable is an object
* @param mixed thing The varable to examine
* @return bool True if the item is a classic JS array and not an object
*/
function isObject(thing) {
	return (
		typeof thing == 'object' &&
		Object.prototype.toString.call(thing) != '[object Array]'
	);
}
// }}}

// Plugin functionality - via `use()`
var _plugins = {};
function use(module) {
	module.call(this);
	return this;
};
// }}}

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
			throw new Error('Unknown call style for .series(): ' + calledAs);
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
		case 'object': // Form: parallel(Object <funcs>)
			this._struct.push({ type: 'parallelObject', payload: arguments[0] });
			break;
		case 'collection': // Form: parallel(Collection <funcs>)
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
			throw new Error('Unknown call style for .parallel(): ' + calledAs);
	}

	return this;
};


/**
* Run an array/object/collection though a function
* This is similar to the async native .each() function but chainable
*/
function forEach() {
	var calledAs = getOverload(arguments)
	switch (calledAs) {
		case '':
			// Pass
			break;
		case 'collection,function': // Form: forEach(Collection func)
		case 'array,function': // Form: forEach(Array, func)
			this._struct.push({ type: 'forEachArray', payload: arguments[0], callback: arguments[1] });
			break;
		case 'object,function': // Form: forEach(Object, func)
			this._struct.push({ type: 'forEachObject', payload: arguments[0], callback: arguments[1] });
			break;
		case 'string,function': // Form: forEach(String <set lookup>, func)
			this._struct.push({ type: 'forEachLateBound', payload: arguments[0], callback: arguments[1] });
			break;
		default:
			throw new Error('Unknown call style for .forEach(): ' + calledAs);
	}

	return this;
}


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
			self._context._id = id;
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
		case 'array,function': // Form: defer(Array <prereqs>, func)
			this._struct.push({ type: 'deferArray', prereq: arguments[0], payload: [arguments[1]] });
			break;
		case 'string,string,function': // Form: defer(String <prereq>, String <name>, func)
			var payload = {};
			payload[arguments[1]] = arguments[2];
			this._struct.push({ type: 'deferObject', prereq: [arguments[0]], payload: payload });
			break;
		case 'array,string,function': //Form: defer(Array <prereqs>, String <id>, func)
			var payload = {};
			payload[arguments[1]] = arguments[2];
			this._struct.push({ type: 'deferObject', prereq: arguments[0], payload: payload });
			break;
		default:
			throw new Error('Unknown call style for .defer():' + calledAs);
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
				throw new Error('Unknown argument type passed to .await(): ' + type);
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
		case 'string,string': // Form: set(String <key>, String <value>)
		case 'string,number': // Form: set(String <key>, Number <value>)
		case 'string,boolean': // Form: set(String <key>, Boolean <value>)
		case 'string,array': // Form: set(String <key>, Array <value>)
		case 'string,collection': // Form: set(String <key>, Collection <value>)
		case 'string,object': // Form: set(String <key>, Object <value>)
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
		case 'string': // Set to undefined
			this._setRaw(arguments[0], undefined);
			break;
		default:
			throw new Error('Unknown call style for .set():' + calledAs);
	}

	return this;
};


/**
* Set a context items value
* Not to be confused with `set()` which is the chainable external visible version of this
* Unlike `set()` this function sets an item of _context immediately
* @access private
* @see _setRaw()
*/
function _set() {
	var calledAs = getOverload(arguments);
	switch(calledAs) {
		case '':
			// Pass
			break;
		case 'string,string': // Form: set(String <key>, String <value>)
		case 'string,number': // Form: set(String <key>, Number <value>)
		case 'string,boolean': // Form: set(String <key>, Boolean <value>)
		case 'string,array': // Form: set(String <key>, Array <value>)
		case 'string,collection': // Form: set(String <key>, Collection <value>)
		case 'string,object': // Form: set(String <key>, Object <value>)
			this._setRaw(arguments[0], arguments[1]);
			break;
		case 'object': // Form: set(Object)
			for (var key in arguments[0])
				this._setRaw(key, arguments[0][key]);
			break;
		case  'string,function': // Form: set(String, func) -> series(String <id>, func)
			this._setRaw(arguments[0], arguments[1].call(this));
			break;
		case 'function': // Form: _set(func) // Expect func to return something which is then processed to _set
			this._set(arguments[1].call(this));
			break;
		case 'string': // Set to undefined
			this._setRaw(arguments[0], undefined);
			break;
		default:
			throw new Error('Unknown call style for .set():' + calledAs);
	}

	return this;
}


/**
* Actual raw value setter
* This function is the internal version of _set which takes exactly two values, the key and the value to set
* Override this function if some alternative _context platform is required
* @param string key The key within _context to set the value of
* @param mixed value The value within _context[key] to set the value of
* @access private
*/
function _setRaw(key, value) {
	this._context[key] = value;
	return this;
}


/**
* Internal function executed at the end of the chain
* This can occur either in sequence (i.e. no errors) or a jump to this position (i.e. an error happened somewhere)
* @access private
*/
function _finalize(err) {
	// Sanity checks {{{
	if (this._struct.length == 0) return; // Finalize called on dead object - probably a defer() fired without an await()
	if (this._struct[this._struct.length - 1].type != 'end') {
		throw new Error('While trying to find an end point in the async-chainable structure the last item in the this._struct does not have type==end!');
		return;
	}
	// }}}
	this._struct[this._struct.length-1].payload.call(this._options.context, err);
	if (this._options.autoReset)
		this.reset();
};


/**
* Internal function to execute the next pending queue item
* This is usually called after the completion of every async.series() / async.parallel() / asyncChainable._run call
* @access private
*/
function _execute(err) {
	var self = this;
	if (err) return this._finalize(err); // An error has been raised - stop exec and call finalize now
	do {
		var redo = false;
		if (self._structPointer >= self._struct.length) return this._finalize(err); // Nothing more to execute in struct
		self._deferCheck(); // Kick off any pending deferred items
		var currentExec = self._struct[self._structPointer];
		// Sanity checks {{{
		if (!currentExec.type) {
			throw new Error('No type is specified for async-chainable structure at offset ' + self._structPointer);
			return self;
		}
		// }}}
		self._structPointer++;

		// Skip step when function supports skipping if the argument is empty {{{
		if (
			[
				'parallelArray', 'parallelObject', 'parallelCollection',
				'forEachArray', 'forEachObject',
				'seriesArray', 'seriesObject', 'seriesCollection',
				'deferArray', 'deferObject', 'deferCollection',
				'set'
			].indexOf(currentExec.type) > -1 &&
			(
				!currentExec.payload || // Not set OR
				(isArray(currentExec.payload) && !currentExec.payload.length) || // An empty array
				(isObject(currentExec.payload) && !Object.keys(currentExec.payload).length) // An empty object
			)
		) {
			currentExec.completed = true;
			redo = true;
			continue;
		}
		// }}}

		switch (currentExec.type) {
			case 'parallelArray':
				self._run(currentExec.payload.map(function(task) {
					return function(next) {
						task.call(self._options.context, next);
					};
				}), self._options.limit, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'parallelObject':
				var tasks = [];
				Object.keys(currentExec.payload).forEach(function(key) {
					tasks.push(function(next) {
						currentExec.payload[key].call(self._options.context, function(err, value) {
							self._set(key, value); // Allocate returned value to context
							next(err);
						})
					});
				});
				self._run(tasks, self._options.limit, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'parallelCollection':
				var tasks = [];
				currentExec.payload.forEach(function(task) {
					Object.keys(task).forEach(function(key) {
						tasks.push(function(next, err) {
							if (typeof task[key] != 'function') throw new Error('Collection item for parallel exec is not a function', currentExec.payload);
							task[key].call(self._options.context, function(err, value) {
								self._set(key, value); // Allocate returned value to context
								next(err);
							})
						});
					});
				});
				self._run(tasks, self._options.limit, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'forEachArray':
				self._run(currentExec.payload.map(function(item, iter) {
					self._context._item = item;
					self._context._key = iter;
					return function(next) {
						currentExec.callback.call(self._options.context, next, item, iter);
					};
				}), self._options.limit, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'forEachObject':
				var tasks = [];
				Object.keys(currentExec.payload).forEach(function(key) {
					tasks.push(function(next) {
						self._context._item = currentExec.payload[key];
						self._context._key = key;
						currentExec.callback.call(self._options.context, function(err, value) {
							self._set(key, value); // Allocate returned value to context
							next(err);
						}, currentExec.payload[key], key);
					});
				});
				self._run(tasks, self._options.limit, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'forEachLateBound':
				if (
					(!currentExec.payload || !currentExec.payload.length) || // Payload is blank
					(!self._context[currentExec.payload]) // Payload doesnt exist within context
				) { // Goto next chain
					currentExec.completed = true;
					redo = true;
					break;
				}

				// Replace own exec array with actual type of payload now we know what it is {{{
				var overloadType = getOverload([self._context[currentExec.payload]]);
				switch (overloadType) {
					case 'collection':
					case 'array':
						currentExec.type = 'forEachArray';
						break;
					case 'object':
						currentExec.type = 'forEachObject';
						break;
					default:
						throw new Error('Cannot perform forEach over unknown object type: ' + overloadType);
				}
				currentExec.payload = self._context[currentExec.payload];
				self._structPointer--; // Force re-eval of this chain item now its been replace with its real (late-bound) type
				redo = true;
				// }}}
				break;
			case 'seriesArray':
				self._run(currentExec.payload.map(function(task) {
					return function(next) {
						task.call(self._options.context, next);
					};
				}), 1, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'seriesObject':
				var tasks = [];
				Object.keys(currentExec.payload).forEach(function(key) {
					tasks.push(function(next) {
						currentExec.payload[key].call(self._options.context, function(err, value) {
							self._set(key, value); // Allocate returned value to context
							next(err);
						})
					});
				});
				self._run(tasks, 1, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'seriesCollection':
				var tasks = [];
				currentExec.payload.forEach(function(task) {
					Object.keys(task).forEach(function(key) {
						tasks.push(function(next, err) {
							if (typeof task[key] != 'function') throw new Error('Collection item for series exec is not a function', currentExec.payload);
							task[key].call(self._options.context, function(err, value) {
								self._set(key, value); // Allocate returned value to context
								next(err);
							})
						});
					});
				});
				self._run(tasks, 1, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'deferArray':
				currentExec.payload.forEach(function(task) {
					self._deferAdd(null, task, currentExec);
				});

				redo = true;
				break;
			case 'deferObject':
				Object.keys(currentExec.payload).forEach(function(key) {
					self._deferAdd(key, currentExec.payload[key], currentExec);
				});

				redo = true;
				break;
			case 'deferCollection':
				currentExec.payload.forEach(function(task) {
					Object.keys(task).forEach(function(key) {
						self._deferAdd(key, task[key], currentExec);
					});
				});
				redo = true;
				break;
			case 'await': // Await can operate in two modes, either payload=[] (examine all) else (examine specific keys)
				if (!currentExec.payload.length) { // Check all tasks are complete
					if (self._struct.slice(0, self._structPointer - 1).every(function(stage) { // Examine all items UP TO self one and check they are complete
						return stage.completed;
					})) { // All tasks up to self point are marked as completed
						currentExec.completed = true;
						redo = true;
					} else {
						self._structPointer--; // At least one task is outstanding - rewind to self stage so we repeat on next resolution
					}
				} else { // Check certain tasks are complete by key
					if (currentExec.payload.every(function(dep) { // Examine all named dependencies
						return !! self._context[dep];
					})) { // All are present
						currentExec.completed = true;
						redo = true;
					} else {
						self._structPointer--; // At least one dependency is outstanding - rewind to self stage so we repeat on next resolution
					}
				}
				break;
			case 'limit': // Set the options.limit variable
				self._options.limit = currentExec.payload;
				currentExec.completed = true;
				redo = true; // Move on to next action
				break;
			case 'context': // Change the self._options.context object
				self._options.context = currentExec.payload ? currentExec.payload : self._context; // Set context (if null use internal context)
				currentExec.completed = true;
				redo = true; // Move on to next action
				break;
			case 'set': // Set a hash of variables within context
				Object.keys(currentExec.payload).forEach(function(key) {
					self._set(key, currentExec.payload[key]);
				});
				currentExec.completed = true;
				redo = true; // Move on to next action
				break;
			case 'end': // self should ALWAYS be the last item in the structure and indicates the final function call
				this._finalize();
				break;
			default:
				if (this._plugins[currentExec.type]) { // Is there a plugin that should manage this?
					this._plugins[currentExec.type].call(this, currentExec);
				} else {
					throw new Error('Unknown async-chainable exec type: ' + currentExec.type);
				}
				return;
		}
	} while (redo);
};


/**
* Internal function to run an array of functions (usually in parallel)
* Series execution can be obtained by setting limit = 1
* @param array tasks The array of tasks to execute
* @param int limit The limiter of tasks (if limit==1 tasks are run in series, if limit>1 tasks are run in limited parallel, else tasks are run in parallel)
* @param function callback(err) The callback to fire on finish
*/
function _run(tasks, limit, callback) {
	if (limit == 1) {
		async.series(tasks, callback);
	} else if (limit > 0) {
		async.parallelLimit(tasks, limit, callback);
	} else {
		async.parallel(tasks, callback);
	}
}


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
			throw new Error('Unknown call style for .end(): ' + calledAs);
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
	this._run = _run;
	this._deferCheck = _deferCheck;
	this._deferAdd = deferAdd;
	this._deferred = [];
	this._deferredRunning = 0;
	this._finalize = _finalize;
	this._getOverload = getOverload; // So this function is accessible by plugins
	this._plugins = _plugins;
	// }}}

	this.await = await;
	this.context = setContext;
	this.defer = defer;
	this.end = end;
	this.forEach = forEach;
	this.limit = setLimit;
	this.parallel = parallel;
	this.reset = reset;
	this.series = series;
	this.set = set;
	this._set = _set;
	this._setRaw = _setRaw;
	this.then = series;
	this.new = function() { return new objectInstance };
	this.use = use;
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
	return this;
}

// Return the output object
module.exports = function asyncChainable() {
	return new objectInstance;
};
