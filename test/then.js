var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.series() - single item style', function(){
	var context;
	var output;

	before(function(done) {
		output = [];
		context = {};

		asyncChainable()
			.then(function(next) { setTimeout(function(){ output.push('foo'); next() }, 10)})
			.then(function(next) { setTimeout(function(){ output.push('bar'); next() }, 0)})
			.then(function(next) { setTimeout(function(){ output.push('baz'); next() }, 5)})
			.end(function(err) {
				expect(err).to.be.not.ok;
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
