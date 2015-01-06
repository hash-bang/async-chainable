var expect = require('chai').expect;
var asyncChainable = require('../index')();

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


/**
* This test checks that async-chainable can cope with an array of tasks changing in a preceeding tasks
* Here the intial .then() condition rewrites the tasks that the next .series() call will actually execute
*/
describe('async-chainable.series() - array pointer during change', function(){
	var output;
	var otherTasksCount = 20;

	beforeEach(function(done) {
		output = [];

		var otherTasks = [];

		asyncChainable
			.then(function(next) {
				output.push('parallel-1');
				for (var i = 0; i < otherTasksCount; i++) {
					(function(i) { // Make a closure so 'i' doesnt end up being 20 all the time (since its passed by reference)
						otherTasks.push(function(next) {
							setTimeout(function() {
								output.push('parallel-other-' + i);
								next();
							}, Math.ceil(Math.random() * 10));
						});
					})(i);
				}
				next();
			})
			.series(otherTasks)
			.end(function(err) {
				output.push('end');
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(22);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('parallel-1');
		for (var i = 0; i < otherTasksCount; i++) {
			expect(output).to.contain('parallel-other-' + i);
		}
		expect(output).to.contain('end');
	});

	it('should be in the correct order', function() {
		expect(output[0]).to.equal('parallel-1');
		for (var i = 0; i < otherTasksCount; i++) {
			expect(output[i+1]).to.equal('parallel-other-' + i);
		}
		expect(output[21]).to.equal('end');
	});
});


describe('async-chainable.series() - empty calls', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable
			.then(function(next) { output.push('series-1'); next() })
			.series()
			.then(function(next) { output.push('series-2'); next() })
			.series([])
			.then(function(next) { output.push('series-3'); next() })
			.series({})
			.end(function(err) {
				output.push('series-end');
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(4);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('series-1');
		expect(output).to.contain('series-2');
		expect(output).to.contain('series-3');
		expect(output).to.contain('series-end');
	});

	it('should be in the correct order', function() {
		expect(output[0]).to.equal('series-1');
		expect(output[1]).to.equal('series-2');
		expect(output[2]).to.equal('series-3');
		expect(output[3]).to.equal('series-end');
	});
});
