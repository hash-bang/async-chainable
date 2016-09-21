var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.hooks() - start and end', function() {

	it('should execute simple start, end and start+end hooks ', function(done) {
		var output = [];

		asyncChainable()
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.hook('start', function(next) {
				output.push('on(start)');
				next();
			})
			.hook('end', function(next) {
				output.push('on(end)');
				next();
			})
			.hook('end', function(next) {
				output.push('on(end2)');
				next();
			})
			.hook(['start', 'end'], function(next) {
				output.push('on(start,end)');
				next();
			})
			.end(function(err) {
				expect(err).to.be.not.ok;

				expect(output).to.contain('on(start)');
				expect(output).to.contain('on(start,end)');
				expect(output).to.contain('foo');
				expect(output).to.contain('bar');
				expect(output).to.contain('baz');
				expect(output).to.contain('on(end)');
				expect(output).to.contain('on(end2)');

				done();
			});
	});


	it('should throw an error before a chain starts', function(done) {
		var output = [];
		asyncChainable()
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.hook('start', function(next) {
				output.push('on(start)');
				next('FAIL!');
			})
			.hook('end', function(next, err) {
				output.push('on(end)');
				next();
			})
			.end(function(err) {
				expect(err).to.be.equal('FAIL!');

				expect(output).to.have.length(2);
				expect(output).to.contain('on(start)');
				expect(output).to.contain('on(end)');

				done();
			});
	});


	it('should throw an error before a chain ends', function(done) {
		var output = [];
		asyncChainable()
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.hook('start', function(next) {
				output.push('on(start)');
				next();
			})
			.hook('end', function(next, err) {
				output.push('on(end)');
				next('FAIL2!');
			})
			.end(function(err) {
				expect(err).to.be.equal('FAIL2!');

				expect(output).to.have.length(5);
				expect(output).to.contain('on(start)');
				expect(output).to.contain('foo');
				expect(output).to.contain('bar');
				expect(output).to.contain('baz');
				expect(output).to.contain('on(end)');

				done();
			});
	});

});
