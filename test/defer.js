var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.defer() - collections style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.defer([
				{fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)}},
				{barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)}},
				{bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)}},
			])
			.await()
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
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

	it('should set the context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});
});


describe('async-chainable.defer() - array style', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable()
			.defer([
				function(next) { setTimeout(function(){ output.push('foo'); next() }, 10)},
				function(next) { setTimeout(function(){ output.push('bar'); next() }, 0)},
				function(next) { setTimeout(function(){ output.push('baz'); next() }, 5)},
			])
			.await()
			.end(done);
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

describe('async-chainable.defer() - object style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.defer({
				fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)},
				barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)},
				bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)},
			})
			.await()
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
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

	it('should set the context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});
});

describe('async-chainable.defer() - named function style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.defer('fooKey', function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)})
			.defer('barKey', function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)})
			.defer('bazKey', function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)})
			.await()
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
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

	it('should set the context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});
});


describe('async-chainable.defer() - empty calls', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable()
			.then(function(next) { output.push('defer-1'); next() })
			.defer()
			.then(function(next) { output.push('defer-2'); next() })
			.defer([])
			.then(function(next) { output.push('defer-3'); next() })
			.defer({})
			.await()
			.end(function(err) {
				output.push('defer-end');
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(4);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('defer-1');
		expect(output).to.contain('defer-2');
		expect(output).to.contain('defer-3');
		expect(output).to.contain('defer-end');
	});
});
