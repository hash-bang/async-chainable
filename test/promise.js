var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.promise()', function() {
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable()
			.parallel([
				{fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)}},
				{barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)}},
				{bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)}},
			])
			.promise()
			.then(function() {
				done();
			})
			.catch(function(err) {
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
});
