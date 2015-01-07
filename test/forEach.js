var expect = require('chai').expect;
var asyncChainable = require('../index')();

describe('async-chainable.forEach() - array style', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.end(function(err) {
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(3);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('foo');
		expect(output).to.contain('bar');
		expect(output).to.contain('baz');
	});
});


describe('async-chainable.forEach() - object style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		context = {};
		output = [];

		asyncChainable
			.forEach({fooKey: 'fooValue', barKey: 'barValue', bazKey: 'bazValue'}, function(next, item, key) { output.push(item, key); next(null, item); })
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(6);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('fooKey');
		expect(output).to.contain('fooValue');
		expect(output).to.contain('barKey');
		expect(output).to.contain('barValue');
		expect(output).to.contain('bazKey');
		expect(output).to.contain('bazValue');
	});

	it('should set the context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});
});


describe('async-chainable.forEach() - collection style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		context = {};
		output = [];

		asyncChainable
			.forEach([
				{foo: 'Foo!'},
				{bar: 'Bar!'},
				{baz: 'Baz!'},
			], function(next, item, key) { output.push(item, key); next(null, item); })
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(6);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('foo');
		expect(output).to.contain('Foo!');
		expect(output).to.contain('bar');
		expect(output).to.contain('Bar!');
		expect(output).to.contain('baz');
		expect(output).to.contain('Baz!');
	});

	it('should set the context', function() {
		expect(context).to.have.property('foo');
		expect(context.foo).to.equal('Foo!');

		expect(context).to.have.property('bar');
		expect(context.bar).to.equal('Bar!');

		expect(context).to.have.property('baz');
		expect(context.baz).to.equal('Baz!');
	});
});


describe('async-chainable.forEach() - this._key + this._item', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable
			.forEach({
				fooKey: 'fooValue',
				barKey: 'barValue',
				bazKey: 'bazValue',
			}, function(next, item, key) { output.push(this._item, this._key); next(); })
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(6);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('fooKey');
		expect(output).to.contain('fooValue');
		expect(output).to.contain('barKey');
		expect(output).to.contain('barValue');
		expect(output).to.contain('bazKey');
		expect(output).to.contain('bazValue');
	});
});
