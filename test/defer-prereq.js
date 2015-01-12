var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.defer() - isosceles', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.defer('fooKey', function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)})
			.defer('fooKey', 'barKey', function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)})
			.defer('fooKey', 'bazKey', function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)})
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

	it('should execute in the right order', function() {
		expect(output[0]).to.equal('foo');
	});
});


describe('async-chainable.defer() - isosceles (contextless)', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.defer('fooKey', function(next) { setTimeout(function(){ output.push('foo'); next() }, 10)})
			.defer('fooKey', 'barKey', function(next) { setTimeout(function(){ output.push('bar'); next() }, 0)})
			.defer('fooKey', 'bazKey', function(next) { setTimeout(function(){ output.push('baz'); next() }, 5)})
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

	it('should execute in the right order', function() {
		expect(output[0]).to.equal('foo');
	});
});


describe('async-chainable.defer() - prereq labyrinth', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.defer('quzKey', 'fooKey', function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)})
			.defer(['bazKey', 'fooKey'], 'barKey', function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)})
			.defer('bazKey', function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)})
			.defer('bazKey', 'quzKey', function(next) { setTimeout(function(){ output.push('quz'); next(null, 'quzValue') }, 20)})
			.await()
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(4);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('foo');
		expect(output).to.contain('bar');
		expect(output).to.contain('baz');
		expect(output).to.contain('quz');
	});

	it('should set the context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');

		expect(context).to.have.property('quzKey');
		expect(context.quzKey).to.equal('quzValue');
	});

	it('should execute in the right order', function() {
		expect(output[0]).to.equal('baz');
		expect(output[1]).to.equal('quz');
		expect(output[2]).to.equal('foo');
		expect(output[3]).to.equal('bar');
	});
});
