var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.hooks() - start and end', function() {

	it('should execute simple start, end and start+end hooks ', function(done) {
		var output = [];

		asyncChainable()
			.timeout(100)
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.hook('timeout', function(next) {
				output.push('on(timeout)');
				next();
			})
			.hook('start', function(next) {
				output.push('on(start)');
				next();
			})
			.hook('end', function(next) {
				output.push('on(end)');
				next();
			})
			.hook('end', function(next) {
				output.push('on(end2)');
				next();
			})
			.hook(['start', 'end'], function(next) {
				output.push('on(start,end)');
				next();
			})
			.then(function(next) {
				setTimeout(next, 500); // Force a task to take 500ms so the timeout triggers
			})
			.end(function(err) {
				expect(err).to.be.not.ok;

				expect(output).to.deep.equal([
					'on(start)',
					'on(start,end)',
					'foo',
					'bar',
					'baz',
					'on(timeout)',
					'on(end)',
					'on(end2)',
					'on(start,end)',
				]);

				done();
			});
	});


	it('should throw an error before a chain starts', function(done) {
		var output = [];
		asyncChainable()
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.hook('start', function(next) {
				output.push('on(start)');
				next('FAIL!');
			})
			.hook('end', function(next, err) {
				output.push('on(end)');
				next();
			})
			.end(function(err) {
				expect(err).to.be.equal('FAIL!');

				expect(output).to.deep.equal([
					'on(start)',
					'on(end)',
				]);

				done();
			});
	});


	it('should throw an error before a chain ends', function(done) {
		var output = [];
		asyncChainable()
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.hook('start', function(next) {
				output.push('on(start)');
				next();
			})
			.hook('end', function(next, err) {
				output.push('on(end)');
				next('FAIL2!');
			})
			.end(function(err) {
				expect(err).to.be.equal('FAIL2!');

				expect(output).to.deep.equal([
					'on(start)',
					'foo',
					'bar',
					'baz',
					'on(end)',
				]);

				done();
			});
	});


	it('should fire user defined hooks', function(done) {
		var output = [];
		asyncChainable()
			.forEach(['foo', 'bar', 'baz'], function(next, item) {
				output.push(item);
				this.fire('flarp', next);
			})
			.hook('start', function(next) {
				output.push('on(start)');
				next();
			})
			.hook('end', function(next, err) {
				output.push('on(end)');
				next();
			})
			.hook('flarp', function(next, err) {
				output.push('on(flarp)');
				next();
			})
			.end(function(err) {
				expect(err).to.be.not.ok;

				expect(output).to.deep.equal([
					'on(start)',
					'foo',
					'bar',
					'baz',
					'on(flarp)',
					'on(flarp)',
					'on(flarp)',
					'on(end)',
				]);

				done();
			});
	});

	it('should solve hooks with pre-requisites', done => {
		var output = [];
		asyncChainable()
			.hook('testHook', 'a', ()=> output.push('a'))
			.hook('testHook', 'b', ['a'], ()=> output.push('b'))
			.hook('testHook', 'c', ['a', 'b'], next => next(null, output.push('c')))
			.hook('testHook', 'd', ['c'], ()=> output.push('d'))
			.hook('testHook', 'e', ['a', 'b', 'c', 'd'], ()=> output.push('e'))
			.then(function(next) {
				this.fire('testHook', next);
			})
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(output).to.deep.equal(['a', 'b', 'c', 'd', 'e']);
				done();
			})
	});

});
