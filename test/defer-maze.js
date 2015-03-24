var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.defer() - generated maze', function(){
	var created = [];
	var context;
	var output;

	before(function(done) {
		this.timeout(10000);
		output = [];
		context = {};

		var maze = asyncChainable();

		for (var i = 0; i < 100; i++) {
			var id = 'xxxxx'.replace(/./g, function() { return '0123456789abcdef'.substr(Math.random() * 16, 1) });
			var defered = [];
			for (var d = 0; d < Math.min(created.length, 10); d++) {
				defered.push(created[Math.floor(Math.random() * created.length)]);
			}

			maze.defer(defered, id, function(next) {
				output.push(this._id);
				setTimeout(next, Math.random() * 10);
			});

			created.push(id);
		}

		maze
			.await()
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(100);
	});

	it('should have called each task once', function() {
		expect(output.sort()).to.eql(created.sort());
	});
});
