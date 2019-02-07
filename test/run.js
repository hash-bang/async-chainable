var _ = require('lodash');
var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.run() - wrapper for promises / callbacks', function() {

	it('should run a simple callback', function(done) {
		asyncChainable.run(this, done => done(null, 'CB-OK'), (err, result) => {
			expect(err).to.not.be.ok;
			expect(result).to.be.equal('CB-OK');
			done();
		});
	});

	it('should fail when a function calls a callback with an error', function(done) {
		asyncChainable.run(this, done => done('CB-ERR'), (err, result) => {
			expect(err).to.be.equal('CB-ERR');
			expect(result).to.not.be.ok;
			done();
		});
	});

	it('should run a simple promise', function(done) {
		asyncChainable.run(this, ()=> new Promise(resolve => setTimeout(()=> resolve('PROMISE-OK'), 100)), (err, result) => {
			expect(err).to.not.be.ok;
			expect(result).to.be.equal('PROMISE-OK');
			done();
		});
	});

	it('should fail when a function throws', function(done) {
		asyncChainable.run(this, ()=> { throw 'PROMISE-THROW' }, (err, result) => {
			expect(result).to.not.be.ok;
			expect(err).to.be.equal('PROMISE-THROW');
			done();
		});
	});

	it('should fail when a promise throws', function(done) {
		asyncChainable.run(this, ()=> new Promise((resolve, reject) => setTimeout(()=> reject('PROMISE-THROW-DEEP'), 100)), (err, result) => {
			expect(result).to.not.be.ok;
			expect(err).to.be.equal('PROMISE-THROW-DEEP');
			done();
		});
	});

	it('should fail when a promise throws (deep)', function(done) {
		asyncChainable.run(this, ()=>
			Promise.resolve()
				.then(()=> Promise.resolve())
				.then(()=> { throw 'PROMISE-THROW-VERY-DEEP' })
				.then(()=> expect.fail())
		, (err, result) => {
			expect(result).to.not.be.ok;
			expect(err).to.be.equal('PROMISE-THROW-VERY-DEEP');
			done();
		});
	});

});

describe('async-chainable.runArray() - parallel execution with arrays', function() {

	it('should run simple callbacks', function(done) {
		var output = [];

		asyncChainable()
			.runArray([
				function(next) { output.push('cb1'); next() },
				function(next) { output.push('cb2'); next() },
				function(next) { output.push('cb3'); next() },
			], 0, function(err) {
				expect(err).to.be.not.ok;
				expect(output).to.be.deep.equal(['cb1', 'cb2', 'cb3']);
				done();
			});
	});

	it('should exit on errors', function(done) {
		asyncChainable()
			.runArray([
				function(next) { next() },
				function(next) { next('NOPE') },
				function(next) { next() },
			], 0, function(err) {
				expect(err).to.be.equal('NOPE');
				done();
			});
	});

	it.skip('should exit on errors', function(done) {
		asyncChainable()
			.runArray([
				function(next) { next() },
				function(next) { throw 'NOPE' },
				function(next) { next() },
			], 0, function(err) {
				expect(err).to.be.equal('NOPE');
				done();
			});
	});

});
