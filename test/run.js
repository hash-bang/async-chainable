var _ = require('lodash');
var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.run() - parallel execution with arrays', function() {

	it('should run simple callbacks', function(done) {
		var output = [];

		asyncChainable()
			.run([
				function(next) { output.push('cb1'); next() },
				function(next) { output.push('cb2'); next() },
				function(next) { output.push('cb3'); next() },
			], 0, function(err) {
				expect(err).to.be.not.ok;
				expect(output).to.be.deep.equal(['cb1', 'cb2', 'cb3']);
				done();
			});
	});

	it('should exit on errors', function(done) {
		asyncChainable()
			.run([
				function(next) { next() },
				function(next) { next('NOPE') },
				function(next) { next() },
			], 0, function(err) {
				expect(err).to.be.equal('NOPE');
				done();
			});
	});

});
