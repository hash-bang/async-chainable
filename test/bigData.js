var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.forEach() - large arrays (run time bound)', function(){
	var output;
	var limit = 99999;

	before(function(done) {
		this.timeout(60 * 1000);
		output = [];

		var data = [];
		for (var i = 0; i < limit; i++) {
			data.push('Item ' + i);
		}

		asyncChainable()
			.forEach(data, function(next, item) { output.push(item); next(); })
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(limit);
	});
});


describe('async-chainable.forEach() - large arrays (late bound)', function(){
	var output;
	var limit = 99999;

	before(function(done) {
		this.timeout(60 * 1000);
		output = [];

		asyncChainable()
			.then('data', function(next) {
				var data = [];
				for (var i = 0; i < limit; i++) {
					data.push('Item ' + i);
				}
				next(null, data);
			})
			.forEach('data', function(next, item) { output.push(item); next(); })
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(limit);
	});
});
