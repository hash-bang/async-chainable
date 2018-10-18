var expect = require('chai').expect;
var fs = require('fs');
var asyncChainable = require('../index');

describe('async-chainable.hybrid()', function() {

	it('should wrap a callback-style function into a promise', function(done) {
		asyncChainable
			.hybrid((done, path) => fs.stat(path, done))('/')
			.then(stats => {
				expect(stats).to.be.an('object');
				done();
			})
	});

	it('should wrap a callback-style function into another callback-style function', function(done) {
		asyncChainable
			.hybrid(
				(done, path) => fs.stat(path, done),
				(err, stats) => {
					expect(err).to.be.not.ok;
					expect(stats).to.be.an('object');
					done();
				}
			)('/')
	});

});
