var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable - nesting (2 level)', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable
			.then(function(next) { output.push('outer-1'); next() })
			.series([
				function(next) { setTimeout(function(){ output.push('outer-2'); next() }, 10)},
				function(outerNext) { 
					output.push('outer-3')
					asyncChainable.new()
						.series([
							function(next) { setTimeout(function(){ output.push('inner-1'); next() }, 10)},
							function(next) { setTimeout(function(){ output.push('inner-2'); next() }, 10)},
							function(next) { setTimeout(function(){ output.push('inner-3'); next() }, 10)},
						])
						.end(function(err) {
							output.push('inner-end')
							expect(err).to.be.undefined();
							outerNext(err);
						});
				},
				function(next) { setTimeout(function(){ output.push('outer-4'); next() }, 5)},
			])
			.end(function(err) {
				output.push('outer-end')
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(9);
	});
	
	it('should have run everything', function() {
		expect(output).to.contain('outer-1');
		expect(output).to.contain('outer-2');
		expect(output).to.contain('outer-3');
		expect(output).to.contain('inner-1');
		expect(output).to.contain('inner-2');
		expect(output).to.contain('inner-3');
		expect(output).to.contain('outer-4');
		expect(output).to.contain('inner-end');
		expect(output).to.contain('outer-end');
	});

	it('should have run all sections in the right order', function() {
		expect(output[0]).to.equal('outer-1');
		expect(output[1]).to.equal('outer-2');
		expect(output[2]).to.equal('outer-3');
		expect(output[3]).to.equal('inner-1');
		expect(output[4]).to.equal('inner-2');
		expect(output[5]).to.equal('inner-3');
		expect(output[6]).to.equal('inner-end');
		expect(output[7]).to.equal('outer-4');
		expect(output[8]).to.equal('outer-end');
	});
});


describe('async-chainable - nesting (3 level)', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable
			.then(function(next) { output.push('alpha-1'); next() })
			.series([
				function(next) { setTimeout(function(){ output.push('alpha-2'); next() }, 10)},
				function(alphaNext) { 
					output.push('alpha-3')
					asyncChainable.new()
						.series([
							function(next) { setTimeout(function(){ output.push('beta-1'); next() }, 10)},
							function(betaNext) { setTimeout(function(){
								output.push('beta-2');

								asyncChainable.new()
									.series([
										function(next) { setTimeout(function(){ output.push('gamma-1'); next() }, 10)},
										function(next) { setTimeout(function(){ output.push('gamma-2'); next() }, 10)},
										function(next) { setTimeout(function(){ output.push('gamma-3'); next() }, 10)},
									])
									.end(function(err) {
										output.push('gamma-end')
										expect(err).to.be.undefined();
										betaNext(err);
									});
							}, 10)},
							function(next) { setTimeout(function(){ output.push('beta-3'); next() }, 10)},
						])
						.end(function(err) {
							output.push('beta-end')
							expect(err).to.be.undefined();
							alphaNext(err);
						});
				},
				function(next) { setTimeout(function(){ output.push('alpha-4'); next() }, 5)},
			])
			.end(function(err) {
				output.push('alpha-end')
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(13);
	});
	
	it('should have run everything', function() {
		expect(output).to.contain('alpha-1');
		expect(output).to.contain('alpha-2');
		expect(output).to.contain('alpha-3');
		expect(output).to.contain('beta-1');
		expect(output).to.contain('beta-2');
		expect(output).to.contain('gamma-1');
		expect(output).to.contain('gamma-2');
		expect(output).to.contain('gamma-3');
		expect(output).to.contain('gamma-end');
		expect(output).to.contain('beta-3');
		expect(output).to.contain('alpha-4');
		expect(output).to.contain('beta-end');
		expect(output).to.contain('alpha-end');
	});

	it('should have run all sections in the right order', function() {
		expect(output[00]).to.equal('alpha-1');
		expect(output[01]).to.equal('alpha-2');
		expect(output[02]).to.equal('alpha-3');
		expect(output[03]).to.equal('beta-1');
		expect(output[04]).to.equal('beta-2');
		expect(output[05]).to.equal('gamma-1');
		expect(output[06]).to.equal('gamma-2');
		expect(output[07]).to.equal('gamma-3');
		expect(output[08]).to.equal('gamma-end');
		expect(output[09]).to.equal('beta-3');
		expect(output[10]).to.equal('beta-end');
		expect(output[11]).to.equal('alpha-4');
		expect(output[12]).to.equal('alpha-end');
	});
});


describe('async-chainable - nesting (3 level with error)', function(){
	var output;
	var finalError;

	beforeEach(function(done) {
		output = [];
		finalError = null;

		asyncChainable
			.then(function(next) { output.push('alpha-1'); next() })
			.series([
				function(next) { setTimeout(function(){ output.push('alpha-2'); next() }, 10)},
				function(alphaNext) { 
					output.push('alpha-3')
					asyncChainable.new()
						.series([
							function(next) { setTimeout(function(){ output.push('beta-1'); next() }, 10)},
							function(betaNext) { setTimeout(function(){
								output.push('beta-2');

								asyncChainable.new()
									.series([
										function(next) { setTimeout(function(){ output.push('gamma-1'); next() }, 10)},
										function(next) { setTimeout(function(){ output.push('gamma-2'); next('Error in gamma-2') }, 10)},
										function(next) { setTimeout(function(){ output.push('gamma-3'); next() }, 10)},
									])
									.end(function(err) {
										output.push('gamma-end')
										betaNext(err);
									});
							}, 10)},
							function(next) { setTimeout(function(){ output.push('beta-3'); next() }, 10)},
						])
						.end(function(err) {
							output.push('beta-end')
							alphaNext(err);
						});
				},
				function(next) { setTimeout(function(){ output.push('alpha-4'); next() }, 5)},
			])
			.end(function(err) {
				output.push('alpha-end')
				finalError = err;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(10);
	});
	
	it('should have run everything', function() {
		expect(output).to.contain('alpha-1');
		expect(output).to.contain('alpha-2');
		expect(output).to.contain('alpha-3');
		expect(output).to.contain('beta-1');
		expect(output).to.contain('beta-2');
		expect(output).to.contain('gamma-1');
		expect(output).to.contain('gamma-2');
		expect(output).to.not.contain('gamma-3');
		expect(output).to.contain('gamma-end');
		expect(output).to.not.contain('beta-3');
		expect(output).to.not.contain('alpha-4');
		expect(output).to.contain('beta-end');
		expect(output).to.contain('alpha-end');
	});

	it('should have run all sections in the right order', function() {
		expect(output[0]).to.equal('alpha-1');
		expect(output[1]).to.equal('alpha-2');
		expect(output[2]).to.equal('alpha-3');
		expect(output[3]).to.equal('beta-1');
		expect(output[4]).to.equal('beta-2');
		expect(output[5]).to.equal('gamma-1');
		expect(output[6]).to.equal('gamma-2');
		expect(output[7]).to.equal('gamma-end');
		expect(output[8]).to.equal('beta-end');
		expect(output[9]).to.equal('alpha-end');
	});
});


describe('async-chainable - nesting via require()', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable
			.then(function(next) { output.push('outer-1'); next() })
			.series([
				function(next) { setTimeout(function(){ output.push('outer-2'); next() }, 10)},
				function(outerNext) { 
					output.push('outer-3');
					require('./nesting-require').subtasks(output, outerNext);
				},
				function(next) { setTimeout(function(){ output.push('outer-4'); next() }, 5)},
			])
			.end(function(err) {
				output.push('outer-end')
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(9);
	});
	
	it('should have run everything', function() {
		expect(output).to.contain('outer-1');
		expect(output).to.contain('outer-2');
		expect(output).to.contain('outer-3');
		expect(output).to.contain('inner-1');
		expect(output).to.contain('inner-2');
		expect(output).to.contain('inner-3');
		expect(output).to.contain('outer-4');
		expect(output).to.contain('inner-end');
		expect(output).to.contain('outer-end');
	});

	it('should have run all sections in the right order', function() {
		expect(output[0]).to.equal('outer-1');
		expect(output[1]).to.equal('outer-2');
		expect(output[2]).to.equal('outer-3');
		expect(output[3]).to.equal('inner-1');
		expect(output[4]).to.equal('inner-2');
		expect(output[5]).to.equal('inner-3');
		expect(output[6]).to.equal('inner-end');
		expect(output[7]).to.equal('outer-4');
		expect(output[8]).to.equal('outer-end');
	});
});
