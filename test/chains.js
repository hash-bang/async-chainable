var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable - mixed chain', function(){
	var context;
	var output, outputSeries, outputSections;

	beforeEach(function(done) {
		output = [];
		outputSeries = [];
		outputSections = [];
		context = {};

		asyncChainable
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
