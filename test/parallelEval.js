var expect = require('chai').expect;
var asyncChainable = require('../index');

/*
describe('async-chainable.parallelEval()', function(){
	var context;
	var output;

	beforeEach(function(done) {
		output = [];
		context = {};

		var variableTasksCount = 25;

		asyncChainable
			.parallel([
				function(next) { output.push('parallel-1'; next()) },
				function(next) {
					// Make a variable list of tasks to execute next
					this.randomTasks = [];
					for (var i = 0; i < variableTasksCount; i++) { // Up to 50 tasks
						this.randomTasks.push(function(next) {
							setTimeout({
								console.log('Hello', i);
								next();
							}, 10);
						});
					}
					output.push('parallel-2');
				}
			])
			.parallelEval(randomTasks)
			.end();
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(3);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('foo');
		expect(output).to.contain('bar');
		expect(output).to.contain('baz');
	});

	it('should set the context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});
});
*/
