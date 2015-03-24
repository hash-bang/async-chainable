var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable - parallel() chain with errors', function(){
	var context;
	var output, outputSections;
	var error;

	before(function(done) {
		output = [];
		outputSections = [];
		context = {};
		error = null;

		asyncChainable()
			.then(function(next) { outputSections.push('sec-1'); next() })
			.parallel({
				step1: function(next) { setTimeout(function(){ output.push('step1'); next(null, 'step1Value'); }, 0)},
				step2: function(next) { setTimeout(function(){ output.push('step2'); next(null, 'step2Value'); }, 10)},
				step3: function(next) { setTimeout(function(){ output.push('step3'); next(null, 'step3Value'); }, 5)},
			})
			.then(function(next) { outputSections.push('sec-2'); next() })
			.parallel({
				step4: function(next) { setTimeout(function(){ output.push('step4'); next(null, 'step4Value'); }, 0)},
				step5: function(next) { setTimeout(function(){ output.push('step5'); next(null, 'step5Value'); }, 10)},
				step6: function(next) { setTimeout(function(){ next('Error in step 6'); }, 5)},
			})
			// As an error was raised nothing until end() should now run
			.then(function(next) { outputSections.push('sec-3'); next() })
			.parallel({
				step7: function(next) { setTimeout(function(){ output.push('step7'); next(null, 'step7Value'); }, 0)},
				step8: function(next) { setTimeout(function(){ output.push('step8'); next(null, 'step8Value'); }, 10)},
				step9: function(next) { setTimeout(function(){ output.push('step9'); next(null, 'step9Value'); }, 5)},
			})
			.end(function(err) {
				outputSections.push('sec-end');
				error = err;
				context = this;
				done();
			});
	});

	it('should raise an error', function() {
		expect(error).to.not.be.undefined();
		expect(error).to.be.equal('Error in step 6');
	});

	it('should have run until an error occurred', function() {
		expect(output).to.contain('step1');
		expect(output).to.contain('step2');
		expect(output).to.contain('step3');
		// 4 and 5 MIGHT be present - no point in testing though
		expect(output).to.not.contain('step7');
		expect(output).to.not.contain('step8');
		expect(output).to.not.contain('step9');
	});

	it('should run all sections in the right order until an error occured', function() {
		expect(outputSections[0]).to.equal('sec-1');
		expect(outputSections[1]).to.equal('sec-2');
		expect(outputSections[2]).to.equal('sec-end');
	});
});

describe('async-chainable - series() chain with errors', function(){
	var context;
	var output, outputSections;
	var error;

	before(function(done) {
		output = [];
		outputSections = [];
		context = {};
		error = null;

		asyncChainable()
			.then(function(next) { outputSections.push('sec-01-series'); next() })
			.series([
				function(next) { setTimeout(function(){ output.push('01-series'); next() }, 10)},
				function(next) { setTimeout(function(){ next('Error in 02-series') }, 0)},
				function(next) { setTimeout(function(){ output.push('03-series'); next() }, 5)}, // Should not run
			])
			// As an error was raised nothing until end() should now run
			.then(function(next) { outputSections.push('sec-02-series'); next() })
			.series([
				function(next) { setTimeout(function(){ output.push('04-series'); next() }, 10)},
				function(next) { setTimeout(function(){ output.push('05-series'); next() }, 0)},
				function(next) { setTimeout(function(){ output.push('06-series'); next() }, 5)},
			])
			.end(function(err) {
				outputSections.push('sec-03-end')
				error = err;
				context = this;
				done();
			});
	});

	it('should raise an error', function() {
		expect(error).to.not.be.undefined();
		expect(error).to.be.equal('Error in 02-series');
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(1);
	});
	
	it('should have run until an error occurred', function() {
		expect(output).to.contain('01-series');
		expect(output).to.not.contain('02-series');
		expect(output).to.not.contain('03-series');
		expect(output).to.not.contain('04-series');
		expect(output).to.not.contain('05-series');
		expect(output).to.not.contain('06-series');

		expect(output[0]).to.equal('01-series');
	});

	it('should run all sections in the right order until an error occured', function() {
		expect(outputSections[0]).to.equal('sec-01-series');
		expect(outputSections[1]).to.equal('sec-03-end');
	});
});


describe('async-chainable - then() chain with errors', function(){
	var context;
	var outputSections;
	var error;

	before(function(done) {
		outputSections = [];
		context = {};
		error = null;

		asyncChainable()
			.then(function(next) { outputSections.push('sec-01'); next() })
			.then(function(next) { outputSections.push('sec-02'); next() })
			.then(function(next) { next('Error in sec-03') })
			// As an error was raised nothing until end() should now run
			.then(function(next) { outputSections.push('sec-04'); next() })
			.then(function(next) { outputSections.push('sec-05'); next() })
			.end(function(err) {
				outputSections.push('sec-06')
				context = this;
				error = err;
				done();
			});
	});

	it('should raise an error', function() {
		expect(error).to.not.be.undefined();
		expect(error).to.be.equal('Error in sec-03');
	});

	it('should run all sections in the right order until an error occured', function() {
		expect(outputSections[0]).to.equal('sec-01');
		expect(outputSections[1]).to.equal('sec-02');
		expect(outputSections).to.not.contain('sec-04');
		expect(outputSections).to.not.contain('sec-05');
		expect(outputSections[2]).to.equal('sec-06');
	});
});
