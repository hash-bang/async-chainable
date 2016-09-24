var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.race() - test #1', function() {
	var output = [];
	var context;

	before(function(done) {

		asyncChainable()
			.race('result', [
				function(next) { setTimeout(function(){ output.push('foo'); next(null, 'foo') }, 10)},
				function(next) { setTimeout(function(){ output.push('bar'); next(null, 'bar') }, 0)},
				function(next) { setTimeout(function(){ output.push('baz'); next(null, 'baz') }, 5)},
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
		expect(output).to.deep.equal(['bar', 'baz', 'foo']);
	});

	it('should have the correct context', function() {
		expect(context).to.have.property('result');
		expect(context.result).to.deep.equal('bar');
	});
});


describe('async-chainable.race() - test #2', function() {
	var output = [];
	var context;

	before(function(done) {

		asyncChainable()
			.race('result', [
				function(next) { setTimeout(function(){ output.push('foo'); next(null, 'foo') }, 10)},
				function(next) { setTimeout(function(){ output.push('bar'); next(null, 'bar') }, 50)},
				function(next) { setTimeout(function(){ output.push('baz'); next(null, 'baz') }, 5)},
				function(next) { setTimeout(function(){ output.push('quz'); next(null, 'quz') }, 0)},
			])
			.end(function(err) {
				expect(err).to.be.not.ok;
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(4);
	});
	
	it('contain the expected output', function() {
		expect(output).to.deep.equal(['quz', 'baz', 'foo', 'bar']);
	});

	it('should have the correct context', function() {
		expect(context).to.have.property('result');
		expect(context.result).to.deep.equal('quz');
	});
});


describe('async-chainable.race() - errors', function() {

	it('should return an error if any race condition throws (start of run)', function(done) {
		asyncChainable()
			.race('result', [
				function(next) { setTimeout(function(){ next(null, 'foo') }, 10)},
				function(next) { setTimeout(function(){ next(null, 'bar') }, 20)},
				function(next) { setTimeout(function(){ next('Error!') }, 0)},
				function(next) { setTimeout(function(){ next(null, 'quz') }, 5)},
			])
			.end(function(err) {
				expect(err).to.be.equal('Error!');
				done();
			});
	});

	it('should return an error if any race condition throws (middle of run)', function(done) {
		asyncChainable()
			.race('result', [
				function(next) { setTimeout(function(){ next(null, 'foo') }, 10)},
				function(next) { setTimeout(function(){ next(null, 'bar') }, 20)},
				function(next) { setTimeout(function(){ next('Error!') }, 15)},
				function(next) { setTimeout(function(){ next(null, 'quz') }, 5)},
			])
			.end(function(err) {
				expect(err).to.be.equal('Error!');
				done();
			});
	});

	it('should return an error if any race condition throws (end of run)', function(done) {
		asyncChainable()
			.race('result', [
				function(next) { setTimeout(function(){ next(null, 'foo') }, 10)},
				function(next) { setTimeout(function(){ next(null, 'bar') }, 20)},
				function(next) { setTimeout(function(){ next('Error!') }, 100)},
				function(next) { setTimeout(function(){ next(null, 'quz') }, 5)},
			])
			.end(function(err) {
				expect(err).to.be.equal('Error!');
				done();
			});
	});

});
