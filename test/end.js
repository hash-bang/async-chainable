var _ = require('lodash');
var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.end()', function() {

	it('should exit with an error when explicitly returned', function(done) {
		asyncChainable()
			.then(function(next) {
				next('An error');
			})
			.end(function(err) {
				expect(err).to.be.ok;
				expect(err).to.be.a('string');
				expect(err).to.be.equal('An error');
				done();
			});
	});

	it.skip('should exit with an error when a function throws', function(done) {
		asyncChainable()
			.then(function(next) {
				throw new Error('An error2');
			})
			.end(function(err) {
				expect(err).to.be.ok;
				expect(err).to.be.a('string');
				expect(err).to.be.equal('An error2');
				done();
			});
	});

	it.skip('should return an error when a callback is called twice', function(done) {
		asyncChainable()
			.then(function(next) {
				next()
				next();
			})
			.end(function(err) {
				expect(err).to.be.ok;
				done();
			});
	});

	it('should exit with a context value when required', function(done) {
		asyncChainable()
			.then('value', function(next) {
				next(null, 'Return value');
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this.value).to.be.a('string');
				expect(this.value).to.be.equal('Return value');
				done();
			});
	});

	it('should exit with a context value in shorthand form', function(done) {
		asyncChainable()
			.then('value2', function(next) {
				next(null, 'Return value2');
			})
			.end('value2', function(err, value) {
				expect(err).to.be.not.ok;
				expect(value).to.be.a('string');
				expect(value).to.be.equal('Return value2');
				done();
			});
	});
});
