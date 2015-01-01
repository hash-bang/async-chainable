var asyncChainable = require('./index');

// Setup test functions {{{
var fooFunc = function(next) {
	var name = 'Foo';
	console.log('START', name);
	setTimeout(function() {
		console.log('END', name);
		next(null, name + ' value');
	}, Math.random() * 1000); // Random wait of up to a second
};

var barFunc = function(next) {
	var name = 'Bar';
	console.log('START', name);
	setTimeout(function() {
		console.log('END', name);
		next(null, name + ' value');
	}, Math.random() * 1000);
};

var bazFunc = function(next) {
	var name = 'Baz';
	console.log('START', name);
	setTimeout(function() {
		console.log('END', name);
		next(null, name + ' value');
	}, Math.random() * 1000);
};
// }}}

// Classic parallel call {{{
// asyncChainable.parallel([fooFunc, barFunc, bazFunc]);
// }}}

// Regular usage {{{
/*
asyncChainable
	.then(function(next) { console.log('Going into series mode 1'); next() })
	.series([fooFunc, barFunc, bazFunc])
	.then(function(next) { console.log('Going into parallel mode 1'); next() })
	.parallel([fooFunc, barFunc, bazFunc])
	.end(function() { console.log('All done') });
*/
// }}}

// Regular usage - with named object {{{
/*
asyncChainable
	.parallel({
		foo: fooFunc,
		bar: barFunc,
		baz: bazFunc
	})
	.then(function(next) {
		console.log('Foo =', this.foo);
		next();
	})
	.end();
*/
// }}}

// Defer & Await {{{
asyncChainable
	.defer('foo', fooFunc)
	.defer('bar', barFunc)
	.defer('baz', bazFunc)
	.await('foo', 'bar')
	.then(function(next) {
		console.log('Await stage one', 'foo=', this.foo, 'bar=', this.bar);
		next();
	})
	.await()
	.end(function() {
		console.log('Completed everything', this);
	});
// }}}
