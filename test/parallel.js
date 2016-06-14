var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.parallel() - collections style', function() {
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.parallel([
				{fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)}},
				{barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)}},
				{bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)}},
			])
			.end(function(err) {
				expect(err).to.be.not.ok;
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


describe('async-chainable.parallel() - array style', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable()
			.parallel([
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
});


describe('async-chainable.parallel() - object style', function() {
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.parallel({
				fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)},
				barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)},
				bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)},
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
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

/**
* This test checks that async-chainable can cope with an array of tasks changing in a preceeding tasks
* Here the intial .then() condition rewrites the tasks that the next .parallel() call will actually execute
*/
describe('async-chainable.parallel() - array pointer during change', function() {
	var output;
	var otherTasksCount = 20;

	beforeEach(function(done) {
		output = [];

		var otherTasks = [];

		asyncChainable()
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
			.parallel(otherTasks)
			.end(function(err) {
				output.push('end');
				expect(err).to.be.not.ok;
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
});


describe('async-chainable.parallel() - empty calls', function() {
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable()
			.then(function(next) { output.push('parallel-1'); next() })
			.parallel()
			.then(function(next) { output.push('parallel-2'); next() })
			.parallel([])
			.then(function(next) { output.push('parallel-3'); next() })
			.parallel({})
			.end(function(err) {
				expect(err).to.be.not.ok;
				output.push('parallel-end');
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(4);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('parallel-1');
		expect(output).to.contain('parallel-2');
		expect(output).to.contain('parallel-3');
		expect(output).to.contain('parallel-end');
	});
});
