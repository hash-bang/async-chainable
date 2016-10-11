async-chainable
===============
Flow control for NodeJS applications.

This builds on the foundations of the [Async](https://www.npmjs.com/package/async) library while adding better handling of mixed Series / Parallel tasks via object chaining.

```javascript
var asyncChainable = require('async-chainable');

asyncChainable() // <- Note '()' as this module is not stateless
	.parallel([fooFunc, barFunc, bazFunc]) // Do these operations in parallel THEN
	.series([fooFunc, barFunc, bazFunc]) // Do these in series (NOTE: these only run when the above has resolved)
	.end(console.log)


asyncChainable()
	.limit(2) // Allow only 2 defer items to run at once from this point on
	.defer('foo', fooFunc) // Run this now and continue on...
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we don't care about 'baz' yet
	.then(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
	.await() // Wait for everything else
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}


asyncChainable()
	.parallel('foo', fooFunc)
	.prereq('foo', 'bar', barFunc) // Only let this function run when 'foo' has completed
	.prereq(['foo', 'bar'], 'baz', bazFunc) // Only let this function run when both 'foo' and 'bar' have completed
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}


asyncChainable()
	.forEach([
		'What do we want?',
		'Race conditions!',
		'When do we want them?',
		'Whenever!',
	], function(next, item) {
		// Prints the above array items to the console in parallel (i.e. whichever resolve first - no gurenteed order)
		console.log(item);
		next();
	})
	.end();



// Or use contexts (i.e. `this`) - see Contexts section for more information
asyncChainable()
	.parallel({
		foo: fooFunc,
		bar: barFunc,
		baz: bazFunc
	})
	.then(function(next) {
		console.log(this); // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value', /* META INFO */}
		console.log('Foo =', this.foo); // Output: 'Foo = ', 'foo value'
		next();
	})
	.end();


// Call in stages without chaining
var tasks = asyncChainable();

tasks.defer('foo', fooFunc);

tasks.defer('bar', barFunc);

if (/* some internal logic */) {
	tasks.defer('bar', 'baz', bazFunc); // Only start 'baz' when 'bar' has completed
}

tasks.end(); // Kick everything off



// Specify prerequisites and let async-chainable figure everything out automatically
// This style replaces async.auto() which is a bit ugly

asyncChainable()

	// Task 'foo' relies on 'quz'
	.defer('quz', 'foo', function(next) { next(null, 'fooValue') })

	// Task 'bar' relies on 'baz' and 'foo'
	.defer(['baz', 'foo'], 'bar', function(next) { next(null, 'barValue') })

	// Task 'bar' doesnt need any pre-requisites
	.defer('baz', function(next) { next(null, 'bazValue') })

	// Task 'quz' relies on 'baz'
	.defer('baz', 'quz', function(next) { next(null, 'quzValue') })
	
	// Wait for everything to finish
	.await()
	.end();


// Use async-chainable within ExpressJS
// This example provides an `/order/123` style URL where the order is fetched and returned as a JSON object

app.get('/order/:id', function(req, res) {
	asyncChainable()
		.then(function(next) { // Sanity checks
			if (!req.params.id) return next('No ID specified');
			next();
		})
		.then('order', function(next) { // Fetch order into this.order
			Orders.findOne({_id: req.params.id}, next);
		})
		.then(function(next) {
			// Do something complicated
			setTimeout(next, 1000);
		})
		.end(function(err) {
			if (err) return res.status(400).send(err);
			res.send(this.order);
		});
});
```

Project Goals
=============
This project has the following goals:

* Be semi-compatible with the [Async](https://www.npmjs.com/package/async) library so existing applications are portable over time
* Provide a readable and dependable model for asynchronous tasks
* Have a 'sane' ([YMMV](http://tvtropes.org/pmwiki/pmwiki.php/Main/YMMV)) syntax that will fit most use cases
* Have an extendible plugin system to allow [additional components](#plugins) to be easily brought into the project


Plugins
=======
There are a number of async-chainable plugins available which can extend the default functionality of the module:

* [async-chainable-cartesian](https://github.com/hash-bang/async-chainable-cartesian) - Compare large numbers of records against one another
* [async-chainable-compat](https://github.com/hash-bang/async-chainable-compat) - [Async](https://www.npmjs.com/package/async) compatibility layer
* [async-chainable-exec](https://github.com/hash-bang/async-chainable-exec) - External program support
* [async-chainable-flush](https://github.com/hash-bang/async-chainable-flush) - Wait for streams to flush before continuing
* [async-chainable-log](https://github.com/hash-bang/async-chainable-log) - Simple logging extension
* [async-chainable-nightmare](https://github.com/hash-bang/async-chainable-nighmare) - Wrapper around [Nightmare](https://github.com/segmentio/nightmare) to automate a scriptable browser
* [async-chainable-progress](https://github.com/hash-bang/async-chainable-progress) - Adds progress bars, spinners, tick lists and other widgets for long running task chains


FAQ
===
Some frequently asked questions:

* **Why not just use Async?** - Async is an excellent library and suitable for 90% of tasks out there but it quickly becomes unmanageable when dealing with complex nests such as a mix of series and parallel tasks.

* **Why was this developed?** - Some research I was doing involved the nesting of ridiculously complex parallel and series based tasks and Async was becoming more of a hindrance than a helper.

* **What alternatives are there to this library?** - The only ones I've found that come close are [node-seq](https://github.com/substack/node-seq) and [queue-async](https://www.npmjs.com/package/queue-async) but both of them do not provide the functionality listed here

* **Is this the module I should use for Async JavaScript?** - If you're doing simple parallel or series based tasks use [Async](https://www.npmjs.com/package/async), if you're doing complex nested operations you might want to take a look at this one

* **Whats license do you use?** - We use the [MIT license](LICENSE), please credit the original library and authors if you wish to fork or share

* **Who wrote this / who do I blame?** - [Matt Carter](https://github.com/hash-bang) and [David Porter](https://github.com/DesertLynx)


More complex examples
=====================

```javascript
var asyncChainable = require('async-chainable');

// Simple nesting of series and parallel operations
asyncChainable()
	// The following 3 functions execute in series
	.series([
		function(next) { setTimeout(function() { console.log('Series 1'); next(); }, 100); },
		function(next) { setTimeout(function() { console.log('Series 2'); next(); }, 200); },
		function(next) { setTimeout(function() { console.log('Series 3'); next(); }, 300); },
	])

	// ...then we run this...
	.then(function(next) {
		console.log('Finished step 1');
	})

	// ...then the next three run in parallel
	.parallel([
		function(next) { setTimeout(function() { console.log('Parallel 1'); next(); }, 300); },
		function(next) { setTimeout(function() { console.log('Parallel 2'); next(); }, 200); },
		function(next) { setTimeout(function() { console.log('Parallel 3'); next(); }, 100); },
	])
	.end(function(next) {
		console.log('Finished simple example');
	});


// Parameters can be passed by using named functions

asyncChainable()
	.series({ // Since this is node we can KINDA rely on it storing the hash in the right order, don't splice or alter the hash past declaring it though or this functionality will break. Alternatively use the below syntax
		foo: function(next) {
			setTimeout(function() { console.log('Series 2-1'); next(null, 'foo result'); }, 100);
		},
		bar: function(next, results) {
			// We can access results from any function
			setTimeout(function() { console.log('Series 2-2'); next(null, 'bar result'); }, 100);
		},
		baz: function(next) {
			setTimeout(function() { console.log('Series 2-3'); next(null, 'baz result'); }, 100);
		},
	})
	.parallel({ // See above comment about Node storing hashes in the right accessible order
		fooParallel: function(next) {
			setTimeout(function() { console.log('Series 2-1'); next(null, 'foo parallel result'); }, 100);
		},
		barParallel: function(next) {
			setTimeout(function() { console.log('Series 2-2'); next(null, 'bar parallel result'); }, 100);
		},
		bazParallel: function(next) {
			setTimeout(function() { console.log('Series 2-3'); next(null, 'baz parallel result'); }, 100);
		},
	})
	.then(function(next, results) {
		// We also get all the results at the end
		console.log("Results", results); // results = {foo: 'foo result', bar: 'bar result'... 'fooParallel': 'foo parallel result'...}
	})
	.reset() // Or we can clear out the results manually
	.end(function(next, results) {
		console.log('Results should be blank', results);
	};


// In the below examples we assume fooFunc, barFunc, bazFunc and quzFunc functions look something like this:
fooFunc = barFunc = bazFunc = quzFunc = function(next) {
	setTimeout(function() {
		next(null, arguments.callee.toString().substr(0, 3) + ' value'); // Continue on with 'foo value', 'bar value' etc.
	}, Math.random() * 1000); // After a random wait of up to a second
};

// Alternative syntaxes
// All of the below are syntactically the same and will output null, 'foo', 'bar', 'baz (first value is error)
// In each we assume 'series' is the rule but 'parallel' could be substituted if we don't care about sequence
// In each case we have named the functions (e.g. 'foo') but we could just omit this and have a function if we don't care about the result

// Hash style syntax
// NOTE: This relies on the hash not changing order of the keys which is a bit of an issue if you're adding / removing from it out of sequence
asyncChainable()
	.series({foo: fooFunc, bar: barFunc, baz: bazFunc})
	.end(console.log);

// Named function style syntax - series only
asyncChainable()
	.then('foo', fooFunc)
	.then('bar', barFunc)
	.then('baz', bazFunc)
	.end(console.log);

// Named function style syntax - parallel only
asyncChainable()
	.defer('foo', fooFunc) // Start this function immediately and continue on
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await() // Resolve all deferred functions before continuing
	.end(console.log);

// Named function style syntax - parallel only
// This works the same as above where if parallel() is NOT passed a hash or array it will act as if called with defer()
asyncChainable()
	.parallel('foo', fooFunc) // Start this function immediately and continue on
	.parallel('bar', barFunc)
	.parallel('baz', bazFunc)
	.await() // Resolve all deferred functions before continuing
	.end(console.log);

asyncChainable()
	.limit(2) // Allow only 2 defer operations to run at once
	.defer('foo', fooFunc)
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we don't care about 'baz' yet
	.then(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
	.await() // Wait for everything else
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}



// Classic asyncChainable functionality is still available

asyncChainable()
	.waterfall([
		function(next) { next(null, 'foo') };
		function(next, fooResult) { console.log(fooResult); next(); } // Output = 'foo'
	]);
```

API
===

.await()
--------
Wait for one or more fired defer functions to complete before containing down the asyncChainable chain.

	await() // Wait for all defered functions to finish
	await(string) // Wait for at least the named defer to finish
	await(string,...) // Wait for the specified named defers to finish
	await(array) // Wait for the specified named defers to finish


Some examples:

```javascript
// Wait for everything
asyncChainable()
	.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await() // Wait for all defers to finish
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}


// Wait for certain defers
asyncChainable()
	.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}


// Wait for certain defers - array syntax
asyncChainable()
	.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await(['foo', 'bar']) // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
```


.context()
----------
Set the context used by async-chainable during subsequent function calls.
In effect this sets what `this` is for each call.
Omitting an argument or supplying a 'falsy' value will instruct async-chainable to use its own default context object.

```javascript
asyncChainable()
	.then({foo: fooFunc}) // `this` is async-chainables own context object
	.context({hello: 'world'})
	.then({bar: barFunc}) // `this` is now {hello: 'world'}
	.context()
	.then({baz: bazFunc}) // `this` is now async-chainables own context object again
	.end(this) // Output: null, {foo: 'foo value', bar: 'bar value', quz: 'quz value'}
```

Note that even if the context is switched async-chainable still stores any named values in its own context for later retrieval (in the above example this is `barFunc()` returning a value even though the context has been changed to a custom object).

See the [Context Section](#context) for further details on what the async-chainable context object contains.


.defer()
--------
Execute a function and continue down the asyncChainable chain.

	defer(function)
	defer(string, function) // Named function (`this.name` gets set to whatever gets passed to `next()`)
	defer(string, string, function) // Named function (name is second arg) with prereq (first arg)
	defer(array, function) // Run an anonymous function with the specified pre-reqs
	defer(array, string, function) // Named function (name is second arg) with prereq array (first arg)
	defer(string, array, function) // Name function (name is first, prereqs second) this is a varient of the above which matches the `gulp.task(id, prereq)` syntax
	defer(array)
	defer(object) // Named function object (each object key gets assigned to this with the value passed to `next()`)
	defer(collection) // See 'object' definition
	defer(null) // Gets skipped automatically


Use `await()` to gather the parallel functions.
This can be considered the parallel process twin to `series()` / `then()`.

```javascript
asyncChainable()
	.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
	.then(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
	.await() // Wait for everything else
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}
```


**NOTE**: All defers take their 'next' handler as the first argument. All subsequent arguments are the resolved value of the prerequisites. In the above example `barFunc` would be called as `barFunc(next, resultOfFoo)` and `bazFunc` would be called as `bazFunc(next, resultOfBaz)`.


.end()
------
The final stage in the chain, `.end()` must be called to execute the queue of actions.

	end(function) // Final function to execute as `function(err)`


While similar to `series()` / `then()` this function will always be executed *last* and be given the error if any occurred in the form `function(err)`.

```javascript
asyncChainable()
	.then('foo', fooFunc) // Execute and wait for fooFunc() to complete
	.then('bar', barFunc) // Likewise barFunc()
	.then('baz', bazFunc) // Likewise bazFunc()
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}
```

In the above if fooFunc, barFunc or bazFunc call next with a first parameter that is true execution will stop and continue on passing the error to `end()`:

```javascript
asyncChainable()
	.then('foo', fooFunc) // Assuming fooFunc calls next('This is an error')
	.then('bar', barFunc) // Gets skipped as we have an error
	.then('baz', bazFunc) // Gets skipped as we have an error
	.end(console.log) // Output: 'This is an error'
```

If an error is caused in the middle of execution the result object is still available:

```javascript
asyncChainable()
	.then('foo', fooFunc) // Assuming this calls `next()` with next(null, 'foo value')
	.then('bar', barFunc) // Assuming this calls next('Error in bar')
	.then('baz', bazFunc) // Gets skipped as we have an error
	.end(console.log) // Output: 'Error in bar', {foo: 'foo value'}
```


.fire()
-------
Trigger a hook. This function will run a callback on completion whether or not any hooks executed.

	fire(string, function) // Fire a hook and run the callback on completion
	this.fire(...) // Same as above invocations but accessible within a chain


```javascript
asyncChainable()
	.forEach(['foo', 'bar', 'baz'], function(next, item, key) { console.log(item) }) // Output: foo, bar and baz in whichever they evaluate
	.hook('hello', function(next) { console.log('Hello world!'); next() })
	.then(function(next) {
		// Trigger a hook then continue on
		this.fire('hello, next);
	})
	.end();
```


.forEach()
----------
The `forEach()` function is a slight variation on the `parallel()` function but with some additional behaviour.


	forEach(fromNumber, toNumber, function) // Call function toNumber-fromNumber times
	forEach(toNumber, function) // Call function toNumber times
	forEach(array, function) // Run each item in the array though `function(next, value)`
	forEach(object, function) // Run each item in the object though `function(next, value, key)`
	forEach(collection,function) // see 'array, function' definition (collections are just treated like an array of objects with 'forEach')
	forEach(string, function) // Lookup `this[string]` then process according to its type (see above type styles) - This is used for late binding
	forEach(null) // Gets skipped automatically (also empty arrays, objects)


It can be given an array, object or collection as the first argument and a function as the second. All items in the array will be iterated over *in parallel* and passed to the function which is expected to execute a next condition returning an error if the forEach iteration should stop.

```javascript
asyncChainable()
	.forEach(['foo', 'bar', 'baz'], function(next, item, key) { console.log(item) }) // Output: foo, bar and baz in whichever they evaluate
	.end();
```

In the above example the simple array is passed to the function with each payload item as a parameter and the iteration key (an offset if its an array or collection, a key if its an object).

`forEach()` has one additional piece of behaviour where if the first argument is a string the context will be examined for a value to iterate over. The string can be a simple key to use within the passed object or a deeply nested path using dotted notation (e.g. `key1.key2.key3`).

```javascript
asyncChainable()
	.set({
		items: ['foo', 'bar', 'baz'],
	})
	.forEach('items', function(next, item, key) { console.log(item) }) // Output: foo, bar and baz in whichever they evaluate
	.end();
```

This allows *late binding* of variables who's content will only be examined when the chain item is executed.


.getOverload()
--------------
Take an `arguments` compatible array and return a CSV string identifying each type of argument.
This is an internal function used to identify the arity of passed arguments.

```javascript
asyncChainable().getOverload(['hello']) // 'string'

asyncChainable().getOverload([function() {}, 123]) // 'function,number'
```


.getPath()
----------
GetPath is the utility function used by `forEach()` to lookup deeply nested objects or arrays to iterate over.
It is functionally similar to the Lodash `get()` function.


.hook()
-------
Attach a callback hook to a named trigger. These callbacks can all fire errors themselves and can fire out of sequence, unlike normal chains.
Hooks can be defined multiple times - if multiple callbacks are registered they are fired in allocation order in *series*. If any hook raises an error the chain is terminated as though a callback raised an error.
Defined hooks can be `start`, `end` as well as any user-defined hooks.
Hooks can also be registered within a callback via `this.hook(hook, callback)` unless context is reset.

	hook(string, function) // Register a callback against a hook
	hook(array, function) // Register a callback against a number of hooks, if any fire the callback is called
	this.hook(...) // Same as above invocations but accessible within a chain


```javascript
asyncChainable()
	.forEach(['foo', 'bar', 'baz'], function(next, item, key) { console.log(item) }) // Output: foo, bar and baz in whichever they evaluate
	.hook('start', function(next) { console.log('Start!'); next()  })
	.hook('end', function(next) { console.log('End!'); next()  })
	.hook(['start', 'end'], function(next) { console.log('Start OR End!'); next()  })
	.end();
```


.limit()
--------
Restrict the number of defer operations that can run at any one time.

	limit() // Allow unlimited parallel / defer functions to execute at once after this chain item
	limit(Number) // Restrict the number of parallel / defer functions after this chain item


This function can be used in the pipeline as many times as needed to change the limit as we work down the execution chain.

```javascript
asyncChainable()
	.limit(2) // Allow only 2 defer operations to run at once from this point onward
	.defer(fooFunc)
	.defer(barFunc)
	.defer(bazFunc)
	.defer(quzFunc)
	.await()
	.limit(3) // Allow 3 defer operations to run at once from this point onward
	.defer(fooFunc)
	.defer(barFunc)
	.defer(bazFunc)
	.defer(quzFunc)
	.await()
	.limit() // Allow unlimited operations to run at once from this point onward (0 / false / null is also permissable as 'unlimited')
	.defer(fooFunc)
	.defer(barFunc)
	.defer(bazFunc)
	.defer(quzFunc)
	.await()
	.end(console.log)
```


.promise()
----------
Alternative to `end()` which returns a JS standard promise instead of using the `.end(callback)` system.

```javascript
asyncChainable()
	.then(doSomethingOne)
	.then(doSomethingTwo)
	.then(doSomethingThree)
	.promise()
	.then(function() { // Everything went well })
	.catch(function(err) { // Something went wrong })
```


.race()
-------
Run multiple functions setting the named key to the first function to return with a non-null, non-undefined value.
If an error is thrown *before or after* the result is achived it will be returned instead.

```javascript
asyncChainable()
	.race('myKey', [
		fooFunc,
		barFunc,
		bazFunc,
	])
	.end(function(err) {
		console.log('myKey =', this.myKey);
	});
```


.reset()
---------
Clear the result buffer, releasing all results held in memory.

```javascript
asyncChainable()
	.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
	.then(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
	.reset()
	.defer('quz', quzFunc)
	.end(console.log) // Output: null, {quz: 'quz value'}
```


.run()
------
Internal callback resolver. Run is used to execute an array of callbacks then run a final callback. This function is NOT chainable, will execute immediately and is documented here as it is useful when writing plugins.

	run(array, limit, callback)


.runWhile()
------
Internal callback resolver until a function returns falsy. This function is NOT chainable, will execute immediately and is documented here as it is useful when writing plugins.
Unlike `run()` this function does not require a precomputed array of items to iterate over which makes it a kind of generator function useful for potencially large data set iterations.

	runWhile(function(next, index) {}, callback)


.series() / .parallel()
-----------------------
Execute an array or object of functions either in series or parallel.

	series(function)
	series(string, function) // Named function (`this.name` gets set to whatever gets passed to `next()`)
	series(array)
	series(object) // Named function object (each object key gets assigned to this with the value passed to `next()`)
	series(collection) // See 'object' definition
	series(array, function) // Backwards compatibility with `async.series`
	series(object, function) // Backwards compatibility with `async.series`

	parallel(function)
	parallel(string, function) // Named function (`this.name` gets set to whatever gets passed to `next()`)
	parallel(array)
	parallel(object) // Named function object (each object key gets assigned to this with the value passed to `next()`)
	parallel(collection) // See 'object' definition
	parallel(array, function) // Backwards compatibility with `parallel.series`
	parallel(object, function) // Backwards compatibility with `parallel.series`


Some examples:

```javascript
asyncChainable()
	.parallel(Array) // Execute all items in the array in parallel
	.parallel(Object) // Execute all items in the object in parallel storing any return against the object key
	.parallel(Collection) // i.e. an array of objects - this is to work around JS not maintaining hash key orders
	.parallel(String, function) // Execute function now and await output, then store in object against key specified by String
	.parallel(function) // Exactly the same functionality as `defer()`
	.end()


asyncChainable()
	.series(Array) // Execute all items in the array in parallel
	.series(Object) // Execute all items in the object in series storing any return against the object key
	.series(Collection) // i.e. an array of objects - this is to work around JS not maintaining hash key orders
	.series(String, function) // Execute function now and await output, then store in object against key specified by String
	.series(function) // Exactly the same functionality as `then()`
	.end()
```


.set()
------
Set is a helper function to quickly allocate the value of a context item as we move down the chain.

	set(string, mixed) // Set the single item in `this` specified the first string to the value of the second arg
	set(object) // Merge the object into `this` to quickly set a number of values
	set(function) // Alias for `series(function)`
	set(string, function) // Alias for `series(string, function)`


It can be used as a named single item key/value or as a setter object.

```javascript
asyncChainable()
	.set('foo', 'foo value')
	.then(function(next) { console.log(this.foo); next() }) // this.foo is now 'foo value'
	.set({bar: 'bar value'}) 
	.then(function(next) { console.log(this.foo); next() }) // this.bar is now 'bar value' (as well as .foo being also set)
	.set(baz, function(next) { next(null, 'baz value') }) // this.baz is now 'baz value' (this is actually just an alias for .series())
	.then(function(next) { console.log(this.foo); next() }) // this.baz is now 'baz value' (as well as .foo, .bar being also set)
	.end()
```


.then()
-------
Execute a function, wait for it to complete and continue down the asyncChainable chain.

This function is an alias for `series()`.

This can be considered the series process twin to `then()`.

```javascript
asyncChainable()
	.then('foo', fooFunc) // Execute and wait for fooFunc() to complete
	.then('bar', barFunc) // Likewise barFunc()
	.then('baz', bazFunc) // Likewise bazFunc()
	.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}
```


Context
=======
Unless overridden by a call to `.context()`, async-chainable will use its own context object which can be accessed via `this` inside any callback function.
The context contains the results of any *named* functions as well as some meta data.

```javascript
asyncChainable()
	.series('foo', fooFunc)
	.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
	.then(function(next) {
		console.log('Context is', this); // Output 'Context is', {foo: 'foo value', bar: 'bar value', /* META FIELDS */}
		next();
	})
	.await('baz')
	.end(function(next) {
		console.log('Context is', this); // Output 'Context is', {foo: 'foo value', bar: 'bar value', baz: 'baz value', /* META FIELDS */}
		next();
	});
```


In addition to storing all named values the context object also provides the following meta object values.

| Key                                  | Type           |  Description                                                             |
|--------------------------------------|----------------|--------------------------------------------------------------------------|
| `this._struct`                       | Collection     | The structure of the async chain constructed by the developer            |
| `this._structPointer`                | Int            | Offset in the `this._struct` collection as to the current executing function. Change this if you wish to move up and down |
| `this._options`                      | Object         | Various options used by async-chainable including things like the defer limit |
| `this._deferredRunning`              | Int            | The number of running deferred tasks (limit this using .limit())         |
| `this._item`                         | Mixed          | During a forEach loop `_item` gets set to the currently iterating item value |
| `this._key`                          | Mixed          | During a forEach loop `_key` gets set to the currently iterating array offset or object key |
| `this._id`                           | Mixed          | During a defer call `_id` gets set to the currently defered task id      |
| `this.fire`                          | Function       | Utility function used to manually fire hooks                             |
| `this.hook`                          | Function       | Utility function used to manually register a hook                        |


Each item in the `this._struct` object is composed of the following keys:


| Key                                  | Type           |  Description                                                             |
|--------------------------------------|----------------|--------------------------------------------------------------------------|
| `completed`                          | Boolean        | An indicator as to whether this item has been executed yet               |
| `payload`                            | Mixed          | The options for the item, in parallel or series modes this is an array or object of the tasks to execute |
| `type`                               | String         | A supported internal execution type                                      |
| `waitingOn`                          | Int            | When the type is a defer operation this integer tracks the number of defers that have yet to resolve |


Gotchas
=======
A list of some common errors when using async-chainable.


Forgetting a final `await()` when using `end()`
-----------------------------------------------

By default async-chainable will not *imply* an `.await()` call before each `.end()` call. For example:

```javascript
asyncChainable()
	.defer('foo', fooFunc)
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.end(console.log);
```

In the above no `.await()` call is made before `.end()` so this chain will *immediately* complete - async-chainable will **not** wait for the deferred tasks to complete.

```javascript
asyncChainable()
	.defer('foo', fooFunc)
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await()
	.end(console.log);
```

In the above async-chainable will wait for the deferred tasks to complete before firing the end condition.


Forgetting the `()` when initializing
-------------------------------------
Async-chainable needs to store state as it processes the task stack, to do this it instantiates itself as an object. This means you must declare it with an additional `()` after the `require()` statement if you wish to use it straight away. For example:


```javascript
var asyncChainable = require('async-chainable')(); // NOTE '()'

asyncChainable()
	.parallel([fooFunc, barFunc, bazFunc])
	.series([fooFunc, barFunc, bazFunc])
	.end(console.log)
```

If you want to use multiple instances you can use either:

```javascript
var asyncChainable = require('async-chainable'); // NOTE: this returns the libray not the instance

asyncChainable()
	.parallel([fooFunc, barFunc, bazFunc])
	.series([fooFunc, barFunc, bazFunc])
	.end(console.log)

asyncChainable()
	.parallel([fooFunc, barFunc, bazFunc])
	.series([fooFunc, barFunc, bazFunc])

	.end(console.log)
```

Its annoying we have to do this but without hacking around how Nodes module system works its not possible to return a singleton object like the async library does *and also* work with nested instances (i.e. having one .js file require() another that uses async-chainable and the whole thing not end up in a messy stack trace as the second instance inherits the firsts return state).


Useful techniques
=================

Debugging
---------
If you find that async-chainable is hanging try setting a `.timeout()` on the object to be notified when something is taking a while.

For one off operations async-chainable will also respond to the `DEBUG=async-chainable` environment variable. For example running your script as:

	DEBUG=async-chainable node myscript.js

... will automatically set a `.timeout(5000)` call on **all** async-chainable objects with the default timeout handler (which should give some useful information on anything that is hanging).


Make a variable number of tasks then execute them
-------------------------------------------------
Since JavaScript passes everything via pointers you can pass in an array or object to a .parallel() or .series() call which will get evaluated only when that chain item gets executed. This means that preceding items can rewrite the actual tasks conducted during that call.

For example in the below `otherTasks` is an array which is passed into the .parallel() call (the second chain item). However the initial .then() callback actually writes the items that that parallel call should make.

```javascript
var otherTasks = [];

asyncChainable()
	.then(function(next) {
		for (var i = 0; i < 20; i++) {
			(function(i) { // Make a closure so 'i' doesnt end up being 20 all the time (since its passed by reference)
				otherTasks.push(function(next) {
					console.log('Hello World', i);
					next();
				});
			})(i);
		}
		next();
	})
	.parallel(otherTasks)
	.end();
```

Compose an array of items then run each though a handler function
-----------------------------------------------------------------
Like the above example async-chainable can be used to prepare items for execution then thread them into a subsequent chain for processing.
This is a neater version of the above that uses a fixed processing function to process an array of data.


```javascript
var asyncChainable = require('./index');

var items = [];

asyncChainable()
	.then(function(next) {
		for (var i = 0; i < 20; i++) {
			items.push({text: 'Hello World ' + i});
		}
		next();
	})
	.forEach(items, function(next, item) {
		console.log(item);
		next();
	})
	.end();
```
