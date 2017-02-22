var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.map() (forEach as an alias)', function() {
	it('should correctly map a simple array', function(done) {
		asyncChainable()
			.map('output', [1, 2, 3, 4, 5], function(next, value) { setTimeout(function() { next(null, value * 2) }, 200 - (value * 10)) })
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this.output).to.be.deep.equal([2, 4, 6, 8, 10]);
				done();
			});
	});

	it('should correctly map a simple object', function(done) {
		asyncChainable()
			.map('output', {foo: 'foo', bar: 'bar', baz: 'baz'}, function(next, value, key) { next(null, value.toUpperCase() + '!', key.toUpperCase()) })
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this.output).to.be.deep.equal({FOO: 'FOO!', BAR: 'BAR!', BAZ: 'BAZ!'});
				done();
			});
	});

	it('should correctly map a late bound array', function(done) {
		asyncChainable()
			.set('myArray', [10, 9, 8, 7, 6])
			.map('output', 'myArray', function(next, value) { setTimeout(function() { next(null, value - 2) }, value * 10) })
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this.myArray).to.be.deep.equal([10, 9, 8, 7, 6]);
				expect(this.output).to.be.deep.equal([8, 7, 6, 5, 4]);
				done();
			});
	});

	it('should correctly map a late bound array (overwriting itself)', function(done) {
		asyncChainable()
			.set('myArray', [10, 9, 8, 7, 6])
			.map('myArray', 'myArray', function(next, value) { setTimeout(function() { next(null, value - 2) }, value * 10) })
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this.myArray).to.be.deep.equal([8, 7, 6, 5, 4]);
				done();
			});
	});

	it('should correctly map a late bound object', function(done) {
		asyncChainable()
			.set('myObject', {foo: 'foo', quz: 'quz', floop: 'floop', fleem: 'fleem'})
			.map('output', 'myObject', function(next, value, key) { next(null, value.toUpperCase() + '!', key.toUpperCase())} )
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this.myObject).to.be.deep.equal({foo: 'foo', quz: 'quz', floop: 'floop', fleem: 'fleem'});
				expect(this.output).to.be.deep.equal({FOO: 'FOO!', QUZ: 'QUZ!', FLOOP: 'FLOOP!', FLEEM: 'FLEEM!'});
				done();
			});
	});

	it('should correctly map a late bound object (overwriting itself)', function(done) {
		asyncChainable()
			.set('myObject', {foo: 'foo', quz: 'quz', floop: 'floop', fleem: 'fleem'})
			.map('myObject', 'myObject', function(next, value, key) { next(null, value.toUpperCase() + '!', key.toUpperCase())} )
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this.myObject).to.be.deep.equal({FOO: 'FOO!', QUZ: 'QUZ!', FLOOP: 'FLOOP!', FLEEM: 'FLEEM!'});
				done();
			});
	});
});
