var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.series() - collections style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable
			.series([
				{fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)}},
				{barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)}},
				{bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)}},
			])
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


describe('async-chainable.series() - array style', function(){
	var output;

	beforeEach(function(done){
		output = [];

		asyncChainable
			.series([
				function(next) { setTimeout(function(){ output.push('foo'); next() }, 10)},
				function(next) { setTimeout(function(){ output.push('bar'); next() }, 0)},
				function(next) { setTimeout(function(){ output.push('baz'); next() }, 5)},
			])
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

	it('should be in the correct order', function() {
		expect(output[0]).to.equal('foo');
		expect(output[1]).to.equal('bar');
		expect(output[2]).to.equal('baz');
	});
});


describe('async-chainable.series() - object style', function(){
	var context;
	var output;

	beforeEach(function(done){
		output = [];
		context = {};

		asyncChainable
			.series({
				fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)},
				barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)},
				bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)},
			})
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

	it('should be in the correct order', function() {
		expect(output[0]).to.equal('foo');
		expect(output[1]).to.equal('bar');
		expect(output[2]).to.equal('baz');
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


describe('async-chainable.series() - single call style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable
			.series(function(next) { setTimeout(function(){ output.push('foo'); next() }, 10)})
			.series(function(next) { setTimeout(function(){ output.push('bar'); next() }, 0)})
			.series(function(next) { setTimeout(function(){ output.push('baz'); next() }, 5)})
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

	it('should be in the correct order', function() {
		expect(output[0]).to.equal('foo');
		expect(output[1]).to.equal('bar');
		expect(output[2]).to.equal('baz');
	});
});


describe('async-chainable.series() - named single call style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable
			.series('fooKey', function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)})
			.series('barKey', function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)})
			.series('bazKey', function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)})
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

	it('should be in the correct order', function() {
		expect(output[0]).to.equal('foo');
		expect(output[1]).to.equal('bar');
		expect(output[2]).to.equal('baz');
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
