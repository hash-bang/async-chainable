var expect = require('chai').expect;
var asyncChainable = require('../index');
var mlog = require('mocha-logger');

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


describe('async-chainable.forEach() - large objects (run time bound)', function(){
	var output;
	var limit = 99999;

	before(function(done) {
		this.timeout(60 * 1000);
		output = [];

		var data = {};
		for (var i = 0; i < limit; i++) {
			data['item-' + i] = 'Item ' + i;
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


describe('async-chainable.forEach() - large objects (late bound)', function(){
	var output;
	var limit = 99999;

	before(function(done) {
		this.timeout(60 * 1000);
		output = [];

		asyncChainable()
			.then('data', function(next) {
				var data = {};
				for (var i = 0; i < limit; i++) {
					data['item-' + i] = 'Item ' + i;
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


describe.only('async-chainable.forEach() - very large arrays (late bound)', function(){
	var output;
	var limit = 1000000;

	before(function(done) {
		this.timeout(60 * 60 * 1000);
		output = [];

		asyncChainable()
			.set('ran', 0)
			.then('data', function(next) {
				mlog.log('populating', limit, 'items');
				var data = [];
				for (var i = 0; i < limit; i++) {
					data.push('Item ' + i);
				}
				next(null, data);
			})
			.then(function(next) {
				mlog.log('running forEach');
				next();
			})
			.forEach('data', function(next, item) {
				if ((++this.ran % 1000) == 0)
					mlog.log('ran', this.ran, 'iterations (', Math.floor((this.ran / limit) * 100), '%)');
				output.push(item); next();
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(limit);
	});
});


