var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable - mixed chain', function(){
	var context;
	var output, outputSeries, outputSections;

	before(function(done) {
		output = [];
		outputSeries = [];
		outputSections = [];
		context = {};

		asyncChainable()
			.then(function(next) { outputSections.push('sec-01-parallel'); next() })
			.parallel([
				function(next) { setTimeout(function(){ output.push('01-parallel'); next() }, 10)},
				function(next) { setTimeout(function(){ output.push('02-parallel'); next() }, 0)},
				function(next) { setTimeout(function(){ output.push('03-parallel'); next() }, 5)},
			])
			.then(function(next) { outputSections.push('sec-02-series'); next() })
			.series([
				function(next) { setTimeout(function(){ output.push('04-series'); outputSeries.push('04-series'); next() }, 10)},
				function(next) { setTimeout(function(){ output.push('05-series'); outputSeries.push('05-series'); next() }, 0)},
				function(next) { setTimeout(function(){ output.push('06-series'); outputSeries.push('06-series'); next() }, 5)},
			])
			.then(function(next) { outputSections.push('sec-03-parallel'); next() })
			.parallel([
				function(next) { setTimeout(function(){ output.push('07-parallel'); next() }, 10)},
				function(next) { setTimeout(function(){ output.push('08-parallel'); next() }, 0)},
				function(next) { setTimeout(function(){ output.push('09-parallel'); next() }, 5)},
			])
			.then(function(next) { outputSections.push('sec-04-defer'); next() })
			.defer(function(next) { setTimeout(function(){ output.push('10-defer'); next() }, 10)})
			.defer(function(next) { setTimeout(function(){ output.push('11-defer'); next() }, 10)})
			.defer(function(next) { setTimeout(function(){ output.push('12-defer'); next() }, 10)})
			.then(function(next) { outputSections.push('sec-05-series'); next() })
			.series([
				function(next) { setTimeout(function(){ output.push('13-series'); outputSeries.push('10-series'); next() }, 10)},
				function(next) { setTimeout(function(){ output.push('14-series'); outputSeries.push('11-series'); next() }, 0)},
				function(next) { setTimeout(function(){ output.push('15-series'); outputSeries.push('12-series'); next() }, 5)},
			])
			.then(function(next) { outputSections.push('sec-06-end'); next() })
			.then(function(next) { setTimeout(function(){ output.push('16-then'); outputSeries.push('13-then'); next()}, 5) })
			.await() // Let defer items catch up
			.end(function(err) {
				output.push('17-end')
				expect(err).to.be.undefined();
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(17);
	});
	
	it('should have run everything', function() {
		expect(output).to.contain('01-parallel');
		expect(output).to.contain('02-parallel');
		expect(output).to.contain('03-parallel');
		expect(output).to.contain('04-series');
		expect(output).to.contain('05-series');
		expect(output).to.contain('06-series');
		expect(output).to.contain('07-parallel');
		expect(output).to.contain('08-parallel');
		expect(output).to.contain('09-parallel');
		expect(output).to.contain('10-defer');
		expect(output).to.contain('11-defer');
		expect(output).to.contain('12-defer');
		expect(output).to.contain('13-series');
		expect(output).to.contain('14-series');
		expect(output).to.contain('15-series');
		expect(output).to.contain('16-then');
		expect(output).to.contain('17-end');
	});

	it('should have run all sections in the right order', function() {
		expect(outputSections[0]).to.equal('sec-01-parallel');
		expect(outputSections[1]).to.equal('sec-02-series');
		expect(outputSections[2]).to.equal('sec-03-parallel');
		expect(outputSections[3]).to.equal('sec-04-defer');
		expect(outputSections[4]).to.equal('sec-05-series');
		expect(outputSections[5]).to.equal('sec-06-end');
	});

	it('should have run all series() calls in the right order', function() {
		expect(outputSeries[0]).to.contain('04-series');
		expect(outputSeries[1]).to.contain('05-series');
		expect(outputSeries[2]).to.contain('06-series');
		expect(outputSeries[3]).to.contain('10-series');
		expect(outputSeries[4]).to.contain('11-series');
		expect(outputSeries[5]).to.contain('12-series');
		expect(outputSeries[6]).to.contain('13-then');
	});
});


describe('async-chainable - blocked parallel() chain', function(){
	var context;
	var output, outputSections;

	beforeEach(function(done) {
		output = [];
		outputSections = [];
		context = {};

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
				step6: function(next) { setTimeout(function(){ output.push('step6'); next(null, 'step6Value'); }, 10)},
			})
			// As an error was raised nothing until end() should now run
			.then(function(next) { outputSections.push('sec-3'); next() })
			.parallel({
				step7: function(next) { setTimeout(function(){ output.push('step7'); next(null, 'step7Value'); }, 0)},
				step8: function(next) { setTimeout(function(){ output.push('step8'); next(null, 'step8Value'); }, 10)},
				step9: function(next) { setTimeout(function(){ output.push('step9'); next(null, 'step9Value'); }, 5)},
			})
			.end(function(err) {
				expect(err).to.be.undefined();
				outputSections.push('sec-end');
				context = this;
				done();
			});
	});

	it('run all functions', function() {
		expect(output).to.contain('step1');
		expect(output).to.contain('step2');
		expect(output).to.contain('step3');
		expect(output).to.contain('step4');
		expect(output).to.contain('step5');
		expect(output).to.contain('step6');
		expect(output).to.contain('step7');
		expect(output).to.contain('step8');
		expect(output).to.contain('step9');
	});

	it('should run all sections in the right order', function() {
		expect(outputSections[0]).to.equal('sec-1');
		expect(outputSections[1]).to.equal('sec-2');
		expect(outputSections[2]).to.equal('sec-3');
		expect(outputSections[3]).to.equal('sec-end');
	});

	it('should set the context', function() {
		expect(context).to.have.property('step1');
		expect(context.step1).to.equal('step1Value');

		expect(context).to.have.property('step2');
		expect(context.step2).to.equal('step2Value');

		expect(context).to.have.property('step3');
		expect(context.step3).to.equal('step3Value');

		expect(context).to.have.property('step4');
		expect(context.step4).to.equal('step4Value');

		expect(context).to.have.property('step5');
		expect(context.step5).to.equal('step5Value');

		expect(context).to.have.property('step6');
		expect(context.step6).to.equal('step6Value');

		expect(context).to.have.property('step7');
		expect(context.step7).to.equal('step7Value');

		expect(context).to.have.property('step8');
		expect(context.step8).to.equal('step8Value');

		expect(context).to.have.property('step9');
		expect(context.step9).to.equal('step9Value');
	});
});
