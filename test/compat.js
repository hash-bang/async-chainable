var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.parallel() - compability mode', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable.parallel([
			function(next) { setTimeout(function(){ output.push('foo'); next() }, 10)},
			function(next) { setTimeout(function(){ output.push('bar'); next() }, 0)},
			function(next) { setTimeout(function(){ output.push('baz'); next() }, 5)},
		], function(err) {
			expect(err).to.be.undefined();
			done();
		})
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(3);
	});
	
	it('should have run everything', function() {
		expect(output).to.contain('foo');
		expect(output).to.contain('bar');
		expect(output).to.contain('baz');
	});
});


describe('async-chainable.series() - compability mode', function(){
	var output;

	beforeEach(function(done) {
		output = [];
		outputSeries = [];
		outputSections = [];
		context = {};

		asyncChainable.series([
			function(next) { setTimeout(function(){ output.push('foo'); next() }, 10)},
			function(next) { setTimeout(function(){ output.push('bar'); next() }, 0)},
			function(next) { setTimeout(function(){ output.push('baz'); next() }, 5)},
		], function(err) {
			expect(err).to.be.undefined();
			done();
		})
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(3);
	});
	
	it('should have run everything', function() {
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
