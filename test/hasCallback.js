var asyncChainable = require('../index');
var expect = require('chai').expect;
var fs = require('fs');

describe('async-chainable - no callback functions', ()=> {

	it('should correctly identify when a function has a callback', ()=> {
		expect(asyncChainable.hasCallback(()=> 1)).to.be.false;
		expect(asyncChainable.hasCallback(()=> {})).to.be.false;
		expect(asyncChainable.hasCallback(function (){})).to.be.false;
		expect(asyncChainable.hasCallback(function namedFunc(){})).to.be.false;
		expect(asyncChainable.hasCallback(async ()=> {})).to.be.false;
		expect(asyncChainable.hasCallback(async ()=> 'one')).to.be.false;
		expect(asyncChainable.hasCallback(async function (){})).to.be.false;
		expect(asyncChainable.hasCallback(async function namedFunc(){})).to.be.false;
		expect(asyncChainable.hasCallback(x => {})).to.be.true;
		expect(asyncChainable.hasCallback(x => true)).to.be.true;
		expect(asyncChainable.hasCallback(function(x) {})).to.be.true;
		expect(asyncChainable.hasCallback(function namedFunc(x) {})).to.be.true;
		expect(asyncChainable.hasCallback(async x => {})).to.be.false;
		expect(asyncChainable.hasCallback(async x => new Date())).to.be.false;
		expect(asyncChainable.hasCallback(async function (x){})).to.be.false;
		expect(asyncChainable.hasCallback(async function namedFunc (x){})).to.be.false;
		expect(asyncChainable.hasCallback((a, b, c) => {})).to.be.true;
		expect(asyncChainable.hasCallback((a, b, c) => new Set())).to.be.true;
		expect(asyncChainable.hasCallback(function (a, b, c){})).to.be.true;
		expect(asyncChainable.hasCallback(function namedFunc	(a, b, c){})).to.be.true;
		expect(asyncChainable.hasCallback(async (a, b, c) => {})).to.be.false;
		expect(asyncChainable.hasCallback(async (a, b, c) => Date.now())).to.be.false;
		expect(asyncChainable.hasCallback(async function (a, b, c){})).to.be.false;
		expect(asyncChainable.hasCallback(async function   namedFunc(a, b, c){})).to.be.false;
	});

	it('should correctly identify when a function has a callback with native functions', ()=> {
		expect(asyncChainable.hasCallback(console.log)).to.be.false;
		expect(asyncChainable.hasCallback(fs.stat)).to.be.true;
		expect(asyncChainable.hasCallback(fs.promises.stat)).to.be.false;
	});

	it('should run a chain of functions with no callbacks', done => {
		asyncChainable.run(()=> { return 'one' }, (err, result) => {
			expect(err).to.not.be.ok;
			expect(result).to.be.equal('one');

			asyncChainable.run(async ()=> { return 'two' }, (err, result) => {
				expect(err).to.not.be.ok;
				expect(result).to.be.equal('two');

				asyncChainable.run(done => { done(null, 'three') }, (err, result) => {
					expect(err).to.not.be.ok;
					expect(result).to.be.equal('three');

					asyncChainable.run(function myCustomCallback(next){ next(null, 'four') }, (err, result) => {
						expect(err).to.not.be.ok;
						expect(result).to.be.equal('four');
						done();
					});
				});
			});
		})

	});

	it('should support simple passthrough functions via .then()', done => {
		var output = [];

		asyncChainable()
			.then(()=> output.push(1))
			.then(()=> output.push(2))
			.then(()=> output.push(3))
			.end(err => {
				expect(err).to.not.be.ok;
				expect(output).to.be.deep.equal([1, 2, 3]);
				done();
			})
	});

	it('should support simple passthrough functions in complex asyncChainable patterns', done => {
		var output = [];

		asyncChainable()
			.then(()=> output.push('a'))
			.parallel([
				function() { output.push('b') },
				()=> output.push('c'),
				()=> { output.push('d') },
			])
			.parallel({
				foo: function() { output.push('e') },
				bar: ()=> output.push('f'),
				baz: ()=> { output.push('g') },
			})
			.forEach(['h', 'i', 'j'], async val => output.push(val))
			.end(err => {
				expect(err).to.not.be.ok;
				expect(output.sort()).to.be.deep.equal(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
				done();
			})
	});

});
