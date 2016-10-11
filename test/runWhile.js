var _ = require('lodash');
var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.runWhile() - execution until function returns false', function() {

	it('should run simple callbacks', function(done) {
		var output = [];

		asyncChainable()
			.runWhile(function(next, index) {
				if (output.length >= 10) return next(null, false);
				output.push('cb' + index);
				next(null, true);
			}, function(err) {
				expect(err).to.be.not.ok;
				expect(output).to.be.deep.equal(['cb0', 'cb1', 'cb2', 'cb3', 'cb4', 'cb5', 'cb6', 'cb7', 'cb8', 'cb9']);
				done();
			});
	});

	it('should exit on errors', function(done) {
		var output = [];

		asyncChainable()
			.runWhile(function(next, index) {
				if (output.length >= 3) return next('STOP');
				output.push('cb' + index);
				next(null, true);
			}, function(err) {
				expect(err).to.be.equal('STOP');
				expect(output).to.be.deep.equal(['cb0', 'cb1', 'cb2']);
				done();
			});
	});

});
