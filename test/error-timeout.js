var asyncChainable = require('../index');
var expect = require('chai').expect;

describe('async-chainable - error (timeouts)', function() {

	it('should trigger a timeout if the tasks take too long', function(finish) {
		var runOrder = [];
		var self = asyncChainable()
			.timeout(10)
			.timeout(function() {
				runOrder.push('timeout');
				self._timeoutHandler(); // Run original timeout handler also
			})
			.then(function(next) {
				setTimeout(function() {
					runOrder.push('then-1');
					next();
				}, 200);
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this._options).to.have.property('timeout', 10);
				expect(runOrder).to.have.length(2);
				expect(runOrder).to.be.deep.equal(['timeout', 'then-1']);
				finish();
			});
	});

	it('should trigger a timeout for forEach items if they take too long', function(finish) {
		var runOrder = [];
		asyncChainable()
			.timeout(150, function() {
				runOrder.push('timeout');
			})
			.limit(1) // Force series execution so we can predict what will fire and when
			.forEach([400, 100, 250, 100, 300, 400, 200], function(next, item) {
				setTimeout(function() {
					runOrder.push(item);
					next();
				}, item);
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(this._options).to.have.property('timeout', 150);
				expect(runOrder).to.deep.equal([
					'timeout', 400, 100, 'timeout', 250, 100, 'timeout', 300, 'timeout', 400, 'timeout', 200,
				]);
				finish();
			});
	});

	// Skipped as it takes the default time (5s) to kick-in to test
	it.skip('should automatically queue a timeout process.env.DEBUG=async-chainable', function(finish) {
		this.timeout(10 * 1000);

		var runOrder = [];
		process.env.DEBUG = 'async-chainable';
		var self = asyncChainable()
			.timeout(function() { // Have to override this to see if we're actually firing it - normally it should just complain to the console
				runOrder.push('timeout');
				self._timeoutHandler();
			})
			// Note absense of .timeout(TIME) call - should be automatic
			.then(function(next) {
				setTimeout(function() {
					runOrder.push('then-1');
					next();
				}, 7000);
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
				expect(runOrder).to.have.length(2);
				expect(runOrder[0]).to.be.equal('timeout');
				expect(runOrder[1]).to.be.equal('then-1');
				finish();
			});
	});

});
