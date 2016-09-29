var argy = require('/home/mc/Dropbox/Projects/Node/argy');
var debug = require('debug')('async-chainable');

// Utility functions {{{
/**
* Try and return a value from a deeply nested object by a dotted path
* This is functionally the same as lodash's own _.get() function
* @param {*} obj The array or object to traverse
* @param {string} path The path to find
* @param {*} [defaultValue=undefined] The value to return if nothing is found
*/
function getPath(obj, path, defaultValue) {
	var pointer = obj;
	path.split('.').every(function(slice) {
		if (pointer[slice]) {
			pointer = pointer[slice];
			return true;
		} else {
			pointer = defaultValue;
			return false;
		}
	});
	return pointer;
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
* @param {array|Object|function} The function(s) to execute
* @return {Object} This chainable object
*/
function series() {
	var self = this;
	argy(arguments)
		.ifForm('', function() {})
		.ifForm('function', function(callback) {
			self._struct.push({ type: 'seriesArray', payload: [callback] });
		})
		.ifForm('string function', function(id, callback) { 
			var payload = {};
			payload[id] = callback;
			self._struct.push({ type: 'seriesObject', payload: payload});
		})
		.ifForm('array', function(tasks) {
			self._struct.push({ type: 'seriesArray', payload: tasks });
		})
		.ifForm('object', function(tasks) {
			self._struct.push({ type: 'seriesObject', payload: tasks });
		})
		// Async library compatibility {{{
		.ifForm('array function', function(tasks, callback) {
			self._struct.push({ type: 'seriesArray', payload: tasks });
			self.end(callback);
		})
		.ifForm('object function', function(tasks, callback) {
			self._struct.push({ type: 'seriesObject', payload: tasks });
			self.end(callback);
		})
		// }}}
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .series(): ' + form);
		});

	return self;
};


/**
* Queue up a function(s) to execute in parallel
* @param {array|Object|function} The function(s) to execute
* @return {Object} This chainable object
*/
function parallel() {
	var self = this;
	argy(arguments)
		.ifForm('', function() {})
		.ifForm('function', function(callback) {
			self._struct.push({ type: 'parallelArray', payload: [callback] });
		})
		.ifForm('string function', function(id, callback) {
			var payload = {};
			payload[id] = callback;
			self._struct.push({ type: 'parallelArray', payload: payload });
		})
		.ifForm('array', function(tasks) {
			self._struct.push({ type: 'parallelArray', payload: tasks });
		})
		.ifForm('object', function(tasks) {
			self._struct.push({ type: 'parallelObject', payload: tasks });
		})
		// Async library compatibility {{{
		.ifForm('array function', function(tasks, callback) {
			self._struct.push({ type: 'parallelArray', payload: tasks });
			this.end(callback);
		})
		.ifForm('object function', function(tasks, callback) {
			self._struct.push({ type: 'parallelObject', payload: tasks });
			self.end(callback);
		})
		// }}}
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .parallel(): ' + form);
		})

	return self;
};


/**
* Like parallel but only return the first, non-undefined, non-null result
* @param {string} The ID to set when the first function returns a non-undefined, non-null result
* @param {array} The functions to execute
* @return {Object} This chainable object
*/
function race() {
	var self = this;

	argy(arguments)
		.ifForm('', function() {})
		.ifForm('array', function(tasks) {
			self._struct.push({ type: 'race', payload: tasks });
		})
		.ifForm('string array', function(id, tasks) {
			self._struct.push({ type: 'race', id: arguments[0], payload: arguments[1] });
		})
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .parallel(): ' + form);
		})

	return self;
};


/**
* Run an array/object though a function
* This is similar to the async native .each() function but chainable
*/
function forEach() {
	var self = this;

	argy(arguments)
		.ifForm('', function() {})
		.ifForm('array function', function(tasks, callback) {
			self._struct.push({ type: 'forEachArray', payload: tasks, callback: callback });
		})
		.ifForm('object function', function(tasks, callback) {
			self._struct.push({ type: 'forEachObject', payload: tasks, callback: callback });
		})
		.ifForm('string function', function(tasks, callback) {
			self._struct.push({ type: 'forEachLateBound', payload: tasks, callback: callback });
		})
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .forEach(): ' + form);
		});

	return self;
}


// Defer functionality - Here be dragons! {{{
/**
* Collection of items that have been deferred
* @type {array} {payload: function, id: null|String, prereq: [dep1, dep2...]}
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

			// Work out what arguments to pass to the defer function by taking the return value of each preReq
			var args = (parentChain.prereq || []).map(function(pre) {
				return self._context[pre];
			});

			args.unshift(function(err, value) { // Glue callback function to first arg
				if (id) self._context[id] = value;

				self._deferredRunning--;

				if (--parentChain.waitingOn == 0) {
					parentChain.completed = true;

					if (self._struct.length && self._struct[self._structPointer].type == 'await') self._execute(err);
				}

				self._execute(err);
			});

			task.apply(self._options.context, args);
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
* @param {array|Object|function} The function(s) to execute as a defer
* @return {Object} This chainable object
*/
function defer() {
	var self = this;
	argy(arguments)
		.ifForm('', function() {})
		.ifForm('function', function(callback) {
			self._struct.push({ type: 'deferArray', payload: [callback] });
		})
		.ifForm('string function', function(id, callback) {
			var payload = {};
			payload[id] = callback;
			self._struct.push({ type: 'deferObject', payload: payload });
		})
		.ifForm('array', function(tasks) {
			self._struct.push({ type: 'deferArray', payload: tasks });
		})
		.ifForm('object', function(tasks) {
			self._struct.push({ type: 'deferObject', payload: tasks });
		})
		.ifForm('array function', function(preReqs, callback) {
			self._struct.push({ type: 'deferArray', prereq: preReqs, payload: [callback] });
		})
		.ifForm('string string function', function(preReq, id, callback) {
			var payload = {};
			payload[id] = callback;
			self._struct.push({ type: 'deferObject', prereq: [preReq], payload: payload });
		})
		.ifForm('array string function', function(preReqs, id, callback) {
			var payload = {};
			payload[id] = callback;
			self._struct.push({ type: 'deferObject', prereq: preReqs, payload: payload });
		})
		.ifForm('string array function', function(id, preReqs, callback) {
			var payload = {};
			payload[id] = callback;
			self._struct.push({ type: 'deferObject', prereq: preReqs, payload: payload });
		})
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .defer():' + form);
		});

	return self;
};


/**
* Queue up an await point
* This stops the execution queue until its satisfied that dependencies have been resolved
* @param {array,...} The dependencies to check resolution of. If omitted all are checked
* @return {Object} This chainable object
*/
function await() {
	var payload = [];

	// Slurp all args into payload
	argy(arguments)
		.getForm()
		.split(',')
		.forEach(function(type, offset) {
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

	this._struct.push({ type: 'await', payload: payload });

	return this;
};


/**
* Queue up a timeout setter
* @param {number|function|false} Either a number (time in ms) of the timeout, a function to set the timeout handler to or falsy to disable
* @return {Object} This chainable object
*/
function timeout(newTimeout) {
	var self = this;
	argy(arguments)
		.ifForm('', function() {
			self._struct.push({ type: 'timeout', payload: false });
		})
		.ifForm('boolean', function(setTimeout) {
			if (setTimeout) throw new Error('When calling .timeout(Boolean) only False is accepted to disable the timeout');
			self._struct.push({ type: 'timeout', payload: false });
		})
		.ifForm(['function', 'number'], function(value) {
			self._struct.push({ type: 'timeout', payload: newTimeout });
		})
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .timeout():' + form);
		});

	return self;
}


/**
* The default timeout handler
*/
function _timeoutHandler() {
	var currentTaskIndex = this._struct.findIndex(function(task) { return ! task.completed });

	if (!currentTaskIndex < 0) {
		console.log('Async-Chainable timeout on unknown task');
		console.log('Full structure:', this._struct);
	} else {
		console.log('Async-Chainable timeout: Task #', currentTaskIndex + 1, '(' + this._struct[currentTaskIndex].type + ')', 'elapsed timeout of', this._options.timeout + 'ms');
	}
}


/**
* Queue up a limit setter
* @param {number|null|false} Either the number of defer processes that are allowed to execute simultaniously or falsy values to disable
* @return {Object} This chainable object
*/
function setLimit(setLimit) {
	this._struct.push({ type: 'limit', payload: setLimit });
	return this;
};


/**
* Queue up a context setter
* @param {Object} newContext The new context to pass to all subsequent functions via `this`
* @return {Object} This chainable object
*/
function setContext(newContext) {
	this._struct.push({ type: 'context', payload: newContext });
	return this;
};


/**
* Queue up a varable setter (i.e. set a hash of variables in context)
* @param {string} The named key to set
* @param {*} The value to set
* @return {Object} This chainable object
*/
function set() {
	var self = this;
	argy(arguments)
		.ifForm('', function() {})
		.ifForm('string scalar|array|object|date|null', function(id, value) {
			var payload = {};
			payload[id] = value;
			self._struct.push({ type: 'set', payload: payload });
		})
		.ifForm('object', function(obj) {
			self._struct.push({ type: 'set', payload: obj });
		})
		.ifForm('function', function(callback) {
			self._struct.push({ type: 'seriesArray', payload: [callback] });
		})
		.ifForm('string function', function(id, callback) {
			var payload = {};
			payload[id] = callback;
			self._struct.push({ type: 'seriesObject', payload: payload});
		})
		.ifForm(['string', 'string undefined'], function(id) {
			var payload = {};
			payload[id] = undefined;
			self._struct.push({ type: 'set', payload: payload });
		})
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .set():' + form);
		});

	return self;
};


/**
* Set a context items value
* Not to be confused with `set()` which is the chainable external visible version of this
* Unlike `set()` this function sets an item of _context immediately
* @access private
* @see _setRaw()
*/
function _set() {
	var self = this;
	argy(arguments)
		.ifForm('', function() {})
		.ifForm('string scalar|array|object|date|null', function(id, value) {
			self._setRaw(id, value);
		})
		.ifForm('object', function(obj) {
			for (var key in obj)
				self._setRaw(key, obj[key]);
		})
		.ifForm('string function', function(id, callback) {
			self._setRaw(id, callback.call(this));
		})
		.ifForm('function', function(callback) { // Expect func to return something which is then processed via _set
			self._set(callback.call(this));
		})
		.ifForm(['string', 'string undefined'], function(id) {
			self._setRaw(id, undefined);
		})
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .set():' + form);
		});

	return self;
}


/**
* Actual raw value setter
* This function is the internal version of _set which takes exactly two values, the key and the value to set
* Override this function if some alternative _context platform is required
* @param {string} key The key within _context to set the value of
* @param {*} value The value within _context[key] to set the value of
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
	var self = this;
	this.fire('end', function(hookErr) {
		self._struct[self._struct.length-1].payload.call(self._options.context, err || hookErr);
		if (self._options.autoReset) self.reset();
	});
};


/**
* Internal function to execute the next pending queue item
* This is usually called after the completion of every asyncChainable.run call
* @access private
*/
function _execute(err) {
	var self = this;
	if (err) return this._finalize(err); // An error has been raised - stop exec and call finalize now

	if (!self._executing) { // Never before run this object - run fire('start') and defer until it finishes
		self._executing = true;
		return self.fire.call(self, 'start', self._execute.bind(self));
	}

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
				(argy.isType(currentExec.payload, 'array') && !currentExec.payload.length) || // An empty array
				(argy.isType(currentExec.payload, 'object') && !Object.keys(currentExec.payload).length) // An empty object
			)
		) {
			currentExec.completed = true;
			redo = true;
			continue;
		}
		// }}}

		switch (currentExec.type) {
			case 'parallelArray':
				self.run(currentExec.payload.map(function(task) {
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
				self.run(tasks, self._options.limit, function(err) {
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
				self.run(tasks, self._options.limit, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'forEachArray':
				self.run(currentExec.payload.map(function(item, iter) {
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
				self.run(tasks, self._options.limit, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'forEachLateBound':
				if (!currentExec.payload || !currentExec.payload.length) { // Payload is blank
					// Goto next chain
					currentExec.completed = true;
					redo = true;
					break;
				}

				var resolvedPayload = self.getPath(self._context, currentExec.payload);
				if (!resolvedPayload) { // Resolved payload is blank
					// Goto next chain
					currentExec.completed = true;
					redo = true;
					break;
				}

				// Replace own exec array with actual type of payload now we know what it is {{{
				if (argy.isType(resolvedPayload, 'array')) {
					currentExec.type = 'forEachArray';
				} else if (argy.isType(resolvedPayload, 'object')) {
					currentExec.type = 'forEachObject';
				} else {
					throw new Error('Cannot perform forEach over unknown object type: ' + argy.getType(resolvedPayload));
				}
				currentExec.payload = resolvedPayload;
				self._structPointer--; // Force re-eval of this chain item now its been replace with its real (late-bound) type
				redo = true;
				// }}}
				break;
			case 'seriesArray':
				self.run(currentExec.payload.map(function(task) {
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
				self.run(tasks, 1, function(err) {
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
				self.run(tasks, 1, function(err) {
					currentExec.completed = true;
					self._execute(err);
				});
				break;
			case 'race':
				var hasResult = false;
				var hasError = false;
				self.run(currentExec.payload.map(function(task) {
					return function(next) {
						task.call(self._options.context, function(err, taskResult) {
							if (err) {
								hasError = true
								next(err, taskResult);
							} else if (!hasResult && !hasError && taskResult !== null && typeof taskResult !== 'undefined') {
								self._set(currentExec.id, taskResult); // Allocate returned value to context
								hasResult = true;
								next('!RACEDONE!', taskResult); // Force an error to stop the run() function
							} else {
								next(err, taskResult);
							}
						});
					};
				}), self._options.limit, function(err, val) {
					currentExec.completed = true;

					// Override race finish error as it was just to stop the race and not a real one
					if (err == '!RACEDONE!') return self._execute();

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
			case 'timeout': // Set the timeout function or its timeout value
				if (typeof currentExec.payload == 'function') { // Set the timeout handler
					self._options.timeoutHandler = currentExec.payload;
				} else if (! currentExec.payload) { // Clear the timeout
					self._options.timeout = false;
				} else {
					self._options.timeout = currentExec.payload;
				}
				currentExec.completed = true;
				redo = true; // Move to next action
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


// run() - central task runner {{{
/**
* Internal function to run an array of functions (usually in parallel)
* Functions can be run in series by passing limit=1
* NOTE: Since this function is the central bottle-neck of the application code here is designed to run as efficiently as possible. This can make it rather messy and unpleasent to read in order to maximize thoughput.
* Series execution can be obtained by setting limit = 1
* @param {array} tasks The array of tasks to execute
* @param {number} limit The limiter of tasks (if limit==1 tasks are run in series, if limit>1 tasks are run in limited parallel, else tasks are run in parallel)
* @param {function} callback(err) The callback to fire on finish
*/
function run(tasks, limit, callback) {
	var self = this;
	var nextTaskOffset = 0;
	var running = 0;
	var err;

	// Empty
	if (!tasks || !tasks.length) return callback();

	// Timeout functionality {{{
	var _timeoutTimer;
	var resetTimeout = function(setAgain) {
		if (_timeoutTimer) clearTimeout(_timeoutTimer);
		if (setAgain) _timeoutTimer = self._options.timeout ? setTimeout(self._options.timeoutHandler.bind(self), self._options.timeout) : null;
	};
	// }}}

	var taskFinish = function(taskErr, taskResult) {
		if (taskErr) err = taskErr;
		--running;
		if (err && !running) {
			resetTimeout(false);
			callback(err);
		} else if (err) { // Has an err - stop allocating until we empty
			resetTimeout(false);
			// Pass
		} else if (!running && nextTaskOffset > tasks.length - 1) { // Finished everything
			resetTimeout(false);
			callback(err);
		} else if (nextTaskOffset < tasks.length) { // Still more to alloc
			running++;
			resetTimeout(true);
			tasks[nextTaskOffset++](taskFinish);
		}
	};

	var maxTasks = limit && limit <= tasks.length ? limit : tasks.length;
	for (var i = 0; i < maxTasks; i++) {
		running++;

		setTimeout(tasks[i].bind(this, taskFinish));

	}
	resetTimeout(true); // Start initial timeout

	nextTaskOffset = maxTasks;
}
// }}}


/**
* Reset all state variables and return the object into a pristine condition
* @return {Object} This chainable object
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
		hook: this.hook.bind(this),
		fire: this.fire.bind(this),
	};

	if (reAttachContext) this._options.context = this._context;
};

/**
* Set up a hook
* @param {string} hook The hook name
* @param {function} callback Callback to run when hook fires (each callback takes a next paramter which must be called)
* @return {Object} This chainable object
*/
function hook() {
	var self = this;
	argy(arguments)
		.ifForm('', function() {})
		.ifForm('string function', function(id, callback) { // Attach to one hook
			if (!self._hooks[id]) self._hooks[id] = [];
			self._hooks[id].push(callback);
		})
		.ifForm('array function', function(ids, callback) { // Attach to many hooks
			ids.forEach(function(hook) {
				if (!self._hooks[hook]) self._hooks[hook] = [];
				self._hooks[hook].push(callback);
			});
		})
		.ifFormElse(function(form) {
			throw new Error('Unknown call style for .on(): ' + form);
		});

	return self;
};

/**
* Fire a hook and run all callbacks in _series_
* NOTE: The calback will fire even if there are no entities matching that hook
* @param {string} hook The hook name to run
* @param {function} [callback] Optional callback to execute on completion
* @return {Object} this chainable object
*/
var fire = argy('string [function]', function fire(hook, callback) {
	this.run(this._hooks[hook] || [], 1, callback);

	return this;
});


/**
* Queue up an optional single function for execution on completion
* This function also starts the queue executing
* @param {function} [final] Optional final function to run. This is passed the optional error state of the chain
* @return {Object} This chainable object
*/
var end = argy('[function]', function end(callback) { 
	if (!callback) {
		this._struct.push({ type: 'end', payload: function() {} }); // .end() called with no args - make a noop()
	} else {
		this._struct.push({ type: 'end', payload: callback });
	}

	this._execute();
	return this;
});

/**
* Alternative to end() which returns a JS standard Promise
* @return {Promise} A promise representing the async chain
*/
function promise() {
	var defer = Promise.defer();

	this._struct.push({type: 'end', payload: function(err) {
		if (err) {
			defer.reject(err);
		} else {
			defer.resolve();
		}
	}});

	this._execute();

	return defer.promise;
};


var objectInstance = function() {
	// Variables {{{
	this._struct = [];
	this._structPointer = 0;
	this._context = {};
	this._hooks = {};

	this._options = {
		autoReset: true, // Run asyncChainable.reset() after finalize. Disable this if you want to see a post-mortem on what did run
		limit: 10, // Number of defer functions that are allowed to execute at once
		context: this._context, // The context item passed to the functions (can be changed with .context())
		timeout: false, // Whether we should support timeouts (any number >0 will trigger after domant for that number of ms)
		timeoutHandler: _timeoutHandler, // The timeout function to run if timeout expires
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
	this._plugins = _plugins;
	// }}}

	this.await = await;
	this.context = setContext;
	this.defer = defer;
	this.end = end;
	this.fire = fire;
	this.forEach = forEach;
	this.getPath = getPath;
	this.hook = hook;
	this.limit = setLimit;
	this.new = function() { return new objectInstance };
	this.parallel = parallel;
	this.promise = promise;
	this.race = race;
	this.reset = reset;
	this.run = run;
	this.series = series;
	this._setRaw = _setRaw;
	this._set = _set;
	this.set = set;
	this.then = series;
	this._timeoutHandler = _timeoutHandler;
	this.timeout = timeout;
	this.use = use;
	// }}}

	// Detect and act on debug mode {{{
	if (debug.enabled) {
		this._options.timeout = 5000;
		this._options.timeoutHandler = _timeoutHandler;
	}
	// }}}

	this.reset();
	return this;
}

// Return the output object
module.exports = function asyncChainable() {
	return new objectInstance;
};
