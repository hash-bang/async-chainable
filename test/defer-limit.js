var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.defer() - limit', function() {
	var output;
	var executing, executingPeak;

	before(function(done) {
		output = [];
		executing = 0;
		executingPeak = 0;

		var tasks = asyncChainable();

		tasks.limit(5);

		for (var i = 0; i < 50; i++) {
			(function () {
				var name = 'iter-' + i;
				tasks.defer(function(next) {
					executing++;
					output.push(name);
					setTimeout(function() {
						if (executing > executingPeak)
							executingPeak = executing;
						executing--;
						next();
					}, Math.random() * 50);
				});
			}());
		}

		tasks
			.await()
			.end(function(err) {
				expect(err).to.be.not.ok;
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(50);
	});
	
	it('contain the expected output', function() {
		for (var i = 0; i < 50; i++) {
			expect(output).to.contain('iter-' + i);
		}
	});

	it('should execute no more tasks than the limit', function() {
		expect(executingPeak).to.be.at.most(5);
	});
});
