async-chainable
===============
An extension to the otherwise excellent [Async](https://www.npmjs.com/package/async) library adding better handling of mixed Series / Parallel tasks via object chaining.


	var asyncChainable = require('async-chainable')();

	asyncChainable
		.parallel([fooFunc, barFunc, bazFunc]) // Do these operations in parallel THEN
		.series([fooFunc, barFunc, bazFunc]) // Do these in series (NOTE: these only run when the above has resolved)
		.end(console.log)


	asyncChainable
		.limit(2) // Allow only 2 defer items to run at once from this point on
		.defer('foo', fooFunc) // Run this now and continue on...
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we don't care about 'baz' yet
		.then(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
		.await() // Wait for everything else
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}


	asyncChainable
		.parallel('foo', fooFunc)
		.prereq('foo', 'bar', barFunc) // Only let this function run when 'foo' has completed
		.prereq(['foo', 'bar'], 'baz', bazFunc) // Only let this function run when both 'foo' and 'bar' have completed
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}


	// Or use contexts (i.e. `this`) - see Contexts section for more information
	asyncChainable
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
	asyncChainable.defer('foo', fooFunc);

	asyncChainable.defer('bar', barFunc);

	if (/* some internal logic */) {
		asyncChainable.defer('bar', 'baz', bazFunc); // Only start 'baz' when 'bar' has completed
	}

	asyncChainable.end(); // Kick everything off



	// Specify prerequisites and let async-chainable figure everything out automatically
	// This method replaces async.auto() which is a bit ugly

	asyncChainable

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


This module extends the existing async object so you can use it as a drop in replacement for Async:

	var async = require('async-chainable')();

	async.waterfall([fooFunc, barFunc, bazFunc], console.log); // Async goodness

	// With new async-chainable flexibility
	async
		.parallel([fooFunc, barFunc, bazFunc]) // Do these operations in parallel THEN
		.series([fooFunc, barFunc, bazFunc]) // Do these in series (note these only run when the above has resolved)
		.end(console.log)

	// Or just like async
	// NOTE: This style cannot be chained in order to maintain compability with async
	async.parallel([fooFunc, barFunc, bazFunc], console.log);


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

	var asyncChainable = require('async-chainable')();

	// Simple nesting of series and parallel operations
	asyncChainable
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

	asyncChainable
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
	asyncChainable
		.series({foo: fooFunc, bar: barFunc, baz: bazFunc})
		.end(console.log);

	// Named function style syntax - series only
	asyncChainable
		.then('foo', fooFunc)
		.then('bar', barFunc)
		.then('baz', bazFunc)
		.end(console.log);

	// Named function style syntax - parallel only
	asyncChainable
		.defer('foo', fooFunc) // Start this function immediately and continue on
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await() // Resolve all deferred functions before continuing
		.end(console.log);

	// Named function style syntax - parallel only
	// This works the same as above where if parallel() is NOT passed a hash or array it will act as if called with defer()
	asyncChainable
		.parallel('foo', fooFunc) // Start this function immediately and continue on
		.parallel('bar', barFunc)
		.parallel('baz', bazFunc)
		.await() // Resolve all deferred functions before continuing
		.end(console.log);

	asyncChainable
		.limit(2) // Allow only 2 defer operations to run at once
		.defer('foo', fooFunc)
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we don't care about 'baz' yet
		.then(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
		.await() // Wait for everything else
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}



	// Classic asyncChainable functionality is still available

	asyncChainable
		.waterfall([
			function(next) { next(null, 'foo') };
			function(next, fooResult) { console.log(fooResult); next(); } // Output = 'foo'
		]);



	// Regular asyncChainable functionality is all there but is now chainable

	asyncChainable
		.each()
		.eachSeries()
		.map()
		.mapSeries()
		.mapLimit()
		.filter()
		.filterSeries()
		.reject()
		.rejectSeries()
		.reduce()
		.reduceRight()
		.detect()
		.detectSeries()
		.sortBy()
		.some()
		.every()
		.concat()
		.concatSeries()

	asyncChainable
		.parallelLimit()
		.whilst()
		.doWhilst()
		.until()
		.doUntil()
		.forever()
		.waterfall()
		.compose()
		.seq()
		.applyEach()
		.applyEachSeries()
		.queue()
		.priorityQueue()
		.cargo()
		.auto()
		.retry()
		.iterator()
		.apply()
		.nextTick()
		.times()
		.timesSeries()

	asyncChainable
		.memoize()
		.unmemoize()
		.log()
		.dir()
		.noConflict()


API
===

.series() / .parallel()
-----------------------
Execute an array or object of functions either in series or parallel.

There are a variety of ways of calling these functions:


	asyncChainable
		.parallel(Array) // Execute all items in the array in parallel
		.parallel(Object) // Execute all items in the object in parallel storing any return against the object key
		.parallel(Collection) // i.e. an array of objects - this is to work around JS not maintaining hash key orders
		.parallel(String, function) // Execute function now and await output, then store in object against key specified by String
		.parallel(function) // Exactly the same functionality as `defer()`
		.end()

	asyncChainable
		.series(Array) // Execute all items in the array in parallel
		.series(Object) // Execute all items in the object in series storing any return against the object key
		.series(Collection) // i.e. an array of objects - this is to work around JS not maintaining hash key orders
		.series(String, function) // Execute function now and await output, then store in object against key specified by String
		.series(function) // Exactly the same functionality as `then()`
		.end()


.defer()
--------
Execute a function and continue down the asyncChainable chain.
Use `await()` to gather the parallel functions.
This can be considered the parallel process twin to `then()`.

	asyncChainable
		.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
		.then(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
		.await() // Wait for everything else
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}

.await()
--------
Wait for one or more fired defer functions to complete before containing down the asyncChainable chain.

	// Wait for everything
	asyncChainable
		.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await() // Wait for all defers to finish
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}


	// Wait for certain defers
	asyncChainable
		.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}


	// Wait for certain defers - array syntax
	asyncChainable
		.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await(['foo', 'bar']) // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}


.limit()
--------
Restrict the number of defer operations that can run at any one time.
This function can be used in the pipeline as many times as needed to change the limit as we work down the execution chain.

	asyncChainable
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


.then()
-------
Execute a function, wait for it to complete and continue down the asyncChainable chain.
This can be considered the series process twin to `then()`.

	asyncChainable.
		.then('foo', fooFunc) // Execute and wait for fooFunc() to complete
		.then('bar', barFunc) // Likewise barFunc()
		.then('baz', bazFunc) // Likewise bazFunc()
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}


.end()
------
The final stage in the chain, `.end()` must be called to execute the queue of actions.
If given arguments it functions the same as `.then(func).reset()` (i.e. execute the action in series and then reset).

While similar to `then()` this function is used as the *last* thing a chain should resolve as it can also catch errors.

	asyncChainable.
		.then('foo', fooFunc) // Execute and wait for fooFunc() to complete
		.then('bar', barFunc) // Likewise barFunc()
		.then('baz', bazFunc) // Likewise bazFunc()
		.end(console.log) // Output: null, {foo: 'foo value', bar: 'bar value', baz: 'baz value'}


In the above if fooFunc, barFunc or bazFunc call next with a first parameter that is true execution will stop and continue on passing the error to `end()`:

	asyncChainable.
		.then('foo', fooFunc) // Assuming fooFunc calls next('This is an error')
		.then('bar', barFunc) // Gets skipped as we have an error
		.then('baz', bazFunc) // Gets skipped as we have an error
		.end(console.log) // Output: 'This is an error'


If an error is caused in the middle of execution the result object is still available:

	asyncChainable.
		.then('foo', fooFunc) // Assuming this calls `next()` with next(null, 'foo value')
		.then('bar', barFunc) // Assuming this calls next('Error in bar')
		.then('baz', bazFunc) // Gets skipped as we have an error
		.end(console.log) // Output: 'Error in bar', {foo: 'foo value'}


.new()
------
Async-chainable operates as an instanciated object. In order to get a new instance (e.g. for nesting invokations) call `.new()` to get a fresh object which wont interfear with any currently live versions.

The below example uses two versions of async-chainable. The default outer item wraps a new instance of the inner one.

	asyncChainable
		.series([
			fooFunc,
			function(outerNext) { 
				asyncChainable.new() // Make new instance of async-chainable so we can nest
					.series([
						barFunc,
						bazFunc,
						quzFunc,
					])
					.end(function(err) {
						outerNext(err);
					});
			},
		])
		.end(function(err) {
			done();
		});


.reset()
---------
Clear the result buffer, releasing all results held in memory.

	asyncChainable
		.defer('foo', fooFunc) // Execute fooFunc() and immediately move on
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await('foo', 'bar') // Wait for 'foo' and 'bar' parallel functions to finish but we dont care about 'baz' yet
		.then(console.log) // Output: null, {foo: 'foo value', bar: 'bar value'}
		.reset()
		.defer('quz', quzFunc)
		.end(console.log) // Output: null, {quz: 'quz value'}


.context()
----------
Set the context used by async-chainable during subsequent function calls.
In effect this sets what `this` is for each call.
Omiting an argument or supplying a 'falsy' value will instruct async-chainable to use its own default context object.

	asyncChainable
		.then({foo: fooFunc}) // `this` is async-chainables own context object
		.context({hello: 'world'})
		.then({bar: barFunc}) // `this` is now {hello: 'world'}
		.context()
		.then({baz: bazFunc}) // `this` is now async-chainables own context object again
		.end(this) // Output: null, {foo: 'foo value', bar: 'bar value', quz: 'quz value'}

Note that even if the context is switched async-chainable still stores any named values in its own context for later retreival (in the above example this is `barFunc()` returning a value even though the context has been changed to a custom object).

See the [Context Section](#context) for further details on what the async-chainable context object contains.


.set()
------
Set is a helper function to quickly allocate the value of a context item as we move down the chain.
It can be used as a named single item key/value or as a setter object.

	asyncChainable
		.set('foo', 'foo value'])
		.then(function(next) { console.log(this.foo); next() }) // this.foo is now 'foo value'
		.set({bar: 'bar value']) 
		.then(function(next) { console.log(this.foo); next() }) // this.bar is now 'bar value' (as well as .foo being also set)
		.set(baz, function(next) { next(null, 'baz value') }) // this.baz is now 'baz value' (this is actually just an alias for .series())
		.then(function(next) { console.log(this.foo); next() }) // this.baz is now 'baz value' (as well as .foo, .bar being also set)
		.end()



Context
=======
Unless overridden by a call to `.context()`, async-chainable will use its own context object which can be accessed via `this` inside any callback function.
The context contains the results of any *named* functions as well as some meta data.


	asyncChainable
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


In addition to storing all named values the context object also provides the following meta object values.

| Key                                  | Type           |  Description                                                             |
|--------------------------------------|----------------|--------------------------------------------------------------------------|
| `this._struct`                       | Collection     | The structure of the async chain constructed by the developer            |
| `this._structPointer`                | Int            | Offset in the `this._struct` collection as to the current executing function. Change this if you wish to move up and down |
| `this._options`                      | Object         | Various options used by async-chainable including things like the defer limit |
| `this._deferredRunning`              | Int            | The number of running deferred tasks (limit this using .limit())         |


Each item in the `this._struct` object is composed of the following keys:


| Key                                  | Type           |  Description                                                             |
|--------------------------------------|----------------|--------------------------------------------------------------------------|
| `completed`                          | Boolean        | An indicator as to whether this item has been executed yet               |
| `payload`                            | Mixed          | The options for the item, in parallel or series modes this is an array or object of the tasks to execute |
| `type`                               | String         | A supported internal execution type                                      |
| `waitingOn`                          | Int            | When the type is a defer operation this integer tracks the number of defers that have yet to resolve |


Gotchas
=======
**Forgetting a final `await()` when using `end()`**
By default Async-chainable will not *imply* an `.await()` call before each `.end()` call. For example:

	asyncChainable
		.defer('foo', fooFunc)
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.end(console.log);

In the above no `.await()` call is made before `.end()` so this chain will *immediately* complete - async-chainable will **not** wait for the deferred tasks to complete.

	asyncChainable
		.defer('foo', fooFunc)
		.defer('bar', barFunc)
		.defer('baz', bazFunc)
		.await()
		.end(console.log);

In the above async-chainable will wait for the deferred tasks to complete before firing the end condition.


**Forgetting the `()` when using require**

Async-chainable needs to store state as it processes the task stack, to do this it instanciates itself as an object. This means you must declare it with an additional `()` after the `require()` statement if you wish to use it straight away. For example:


	var asyncChainable = require('async-chainable')(); // NOTE '()'
	asyncChainable
		.parallel([fooFunc, barFunc, bazFunc])
		.series([fooFunc, barFunc, bazFunc])
		.end(console.log)


If you want to use multiple instances you can use either:


	var asyncChainable = require('async-chainable'); // NOTE: this returns the libray not the instance

	asyncChainable()
		.parallel([fooFunc, barFunc, bazFunc])
		.series([fooFunc, barFunc, bazFunc])
		.end(console.log)

	asyncChainable()
		.parallel([fooFunc, barFunc, bazFunc])
		.series([fooFunc, barFunc, bazFunc])
		.end(console.log)

Or you can use the built in `.new()` variable to get a new instance:

	var asyncChainable = require('async-chainable')(); // NOTE: this returns an instance

	asyncChainable()
		.parallel([fooFunc, barFunc, bazFunc])
		.series([fooFunc, barFunc, bazFunc])
		.end(console.log)

	asyncChainable().new() // NOTE: 'new' request
		.parallel([fooFunc, barFunc, bazFunc])
		.series([fooFunc, barFunc, bazFunc])
		.end(console.log)


Its annoying we have to do this but without hacking around how Nodes module system works its not possible to return a singleton object like the async library does *and also* work with nested instances (i.e. having one .js file require() another that uses async-chainable and the whole thing not end up in a messy stack trace as the second instance inherits the first's state).


Useful techniques
=================

Make a variable number of tasks then execute them
-------------------------------------------------
Since JavaScript passes everything via pointers you can pass in an array or object to a .parallel() or .series() call which will get evaluated only when that chain item gets executed. This means that preceding items can rewrite the actual tasks conducted during that call.

For example in the below `otherTasks` is an array which is passed into the .parallel() call (the second chain item). However the initial .then() callback actually writes the items that that parallel call should make.

	var otherTasks = [];

	asyncChainable
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


TODO
====
* Nested instance tests
* Better error resolution when calling series/parallel/defer/set with weird and wonderful overloads - use `throw new Error()` instead of console.log
* Ability to pipe input via function like async.cargo() e.g. `.parallel(Array <items>, func)`
* README: Exampe of .set() / .then() with something like downloading a stream of data
* `this.next()` as a possible way to call the next handler?
