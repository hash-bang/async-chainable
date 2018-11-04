var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.promise()', function() {
	var output;

	it('should execute a simple promise return', done => {
		asyncChainable()
			.then(()=> new Promise(resolve => resolve()))
			.end(err => {
				expect(err).to.not.be.ok;
				done();
			});
	})

	it('should return an error if a promise rejects (reject error given)', done => {
		asyncChainable()
			.then(()=> new Promise((resolve, reject) => reject('Nope')))
			.end(err => {
				expect(err).to.be.ok;
				done();
			});
	});

	it('should return an error if a promise rejects (reject error omitted)', done => {
		asyncChainable()
			.then(()=> new Promise((resolve, reject) => reject()))
			.end(err => {
				expect(err).to.be.ok;
				done();
			});
	});

	it('should return an error if a promise throws', done => {
		asyncChainable()
			.then(()=> new Promise(()=> { throw new Error('Fake error') }))
			.end(function(err) {
				expect(err).to.be.ok;
				done();
			})
	});

	it('should run a complex promise chain', done => {
		output = [];

		asyncChainable()
			.parallel({
				fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)},
				barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)},
				bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)},
			})
			.promise()
			.then(function() { // <- NOTE: This is a Promise.then() not an asyncChainable.then()
				expect(output).to.have.length(3);

				expect(output).to.contain('foo');
				expect(output).to.contain('bar');
				expect(output).to.contain('baz');
				done();
			})
			.catch(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});
});

describe('async-chainable + promises', ()=> {

	it('series with returns', done => {
		asyncChainable()
			.then('foo', ()=> new Promise(resolve => setTimeout(()=> resolve('FooValue'), 10)))
			.then('bar', ()=> new Promise(resolve => setTimeout(()=> resolve(123), 20)))
			.then('baz', ()=> new Promise(resolve => setTimeout(()=> resolve([1, 2, 3]), 30)))
			.then('quz', ()=> new Promise(resolve => setTimeout(()=> resolve({one: 1, two: 2, three: 3}), 30)))
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('foo', 'FooValue');
				expect(this).to.have.property('bar', 123);
				expect(this).to.have.property('baz');
				expect(this.baz).to.deep.equal([1, 2, 3]);
				expect(this).to.have.property('quz');
				expect(this.quz).to.deep.equal({one: 1, two: 2, three: 3});
				done();
			})
	});

	it('series object', done => {
		asyncChainable()
			.series({
				foo: ()=> new Promise(resolve => setTimeout(()=> resolve('FooValue'), 10)),
				bar: ()=> new Promise(resolve => setTimeout(()=> resolve(123), 20)),
				baz: ()=> new Promise(resolve => setTimeout(()=> resolve([1, 2, 3]), 30)),
				quz: ()=> new Promise(resolve => setTimeout(()=> resolve({one: 1, two: 2, three: 3}), 30)),
			})
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('foo', 'FooValue');
				expect(this).to.have.property('bar', 123);
				expect(this).to.have.property('baz');
				expect(this.baz).to.deep.equal([1, 2, 3]);
				expect(this).to.have.property('quz');
				expect(this.quz).to.deep.equal({one: 1, two: 2, three: 3});
				done();
			})
	});

	it('parallel series', done => {
		asyncChainable()
			.parallel([
				new Promise(resolve => setTimeout(resolve, 10)),
				new Promise(resolve => setTimeout(resolve, 20)),
				new Promise(resolve => setTimeout(resolve, 30)),
			])
			.end(function(err) {
				expect(err).to.not.be.ok;
				done();
			})
	});

	it('parallel promise factories', done => {
		asyncChainable()
			.parallel([
				()=> new Promise(resolve => setTimeout(resolve, 10)),
				()=> new Promise(resolve => setTimeout(resolve, 20)),
				()=> new Promise(resolve => setTimeout(resolve, 30)),
			])
			.end(function(err) {
				expect(err).to.not.be.ok;
				done();
			})
	});

	it('parallel object', done => {
		asyncChainable()
			.parallel({
				foo: ()=> new Promise(resolve => setTimeout(()=> resolve('FooValue'), 10)),
				bar: ()=> new Promise(resolve => setTimeout(()=> resolve(123), 20)),
				baz: ()=> new Promise(resolve => setTimeout(()=> resolve([1, 2, 3]), 30)),
				quz: ()=> new Promise(resolve => setTimeout(()=> resolve({one: 1, two: 2, three: 3}), 30)),
			})
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('foo', 'FooValue');
				expect(this).to.have.property('bar', 123);
				expect(this).to.have.property('baz');
				expect(this.baz).to.deep.equal([1, 2, 3]);
				expect(this).to.have.property('quz');
				expect(this.quz).to.deep.equal({one: 1, two: 2, three: 3});
				done();
			})
	});

	it('parallel array', done => {
		asyncChainable()
			.map('output', [1, 2, 3], (next, val) => new Promise(resolve => setTimeout(()=> resolve(val * 10))))
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('output');
				expect(this.output).to.be.deep.equal([10, 20, 30]);
				done();
			})
	});

	it('parallel object', done => {
		asyncChainable()
			.map('output', {foo: 1, bar: 2, baz: 3}, (next, val) => new Promise(resolve => setTimeout(()=> resolve(val * 10))))
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('output');
				expect(this.output).to.be.deep.equal({foo: 10, bar: 20, baz: 30});
				done();
			})
	});

	it('range', done => {
		var cycled = 0;
		asyncChainable()
			.set('cycled', 0)
			.forEach(10, ()=> new Promise(resolve => setTimeout(()=> {
				cycled++;
				resolve();
			}, 10)))
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(cycled).to.equal(10);
				done();
			})
	});

	it('defer', done => {
		var output = [];

		asyncChainable()
			.defer([
				()=> new Promise(resolve => setTimeout(()=> resolve(output.push('a'), 30))),
				()=> new Promise(resolve => setTimeout(()=> resolve(output.push('b'), 20))),
				()=> new Promise(resolve => setTimeout(()=> resolve(output.push('c'), 10))),
			])
			.defer('foo', ['quz', 'bar'], ()=> new Promise(resolve => resolve(output.push('foo'))))
			.defer('bar', ['quuz', 'quz'], ()=> new Promise(resolve => resolve(output.push('bar'))))
			.defer('baz', ['quz', 'bar', 'foo'], ()=> new Promise(resolve => resolve(output.push('baz'))))
			.defer('quz', ['quuz'], ()=> new Promise(resolve => resolve(output.push('quz'))))
			.defer('quuz', ()=> new Promise(resolve => resolve(output.push('quuz'))))
			.await()
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(output.sort()).to.deep.equal(['a', 'b', 'bar', 'baz', 'c', 'foo', 'quuz', 'quz']);
				done();
			})
	});

});


describe('async-chainable + async functions', ()=> {

	var sleep;
	before('define sleep()', ()=> {
		sleep = delay => new Promise(resolve => setTimeout(resolve, delay));
	});

	it('series with returns', done => {
		asyncChainable()
			.then('foo', async ()=> { await sleep(10); return 'FooValue' })
			.then('bar', async ()=> { await sleep(20); return 123 })
			.then('baz', async ()=> { await sleep(30); return [1, 2, 3] })
			.then('quz', async ()=> { await sleep(30); return {one: 1, two: 2, three: 3} })
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('foo', 'FooValue');
				expect(this).to.have.property('bar', 123);
				expect(this).to.have.property('baz');
				expect(this.baz).to.deep.equal([1, 2, 3]);
				expect(this).to.have.property('quz');
				expect(this.quz).to.deep.equal({one: 1, two: 2, three: 3});
				done();
			})
	});

	it('series object', done => {
		asyncChainable()
			.series({
				foo: async ()=> { await sleep(10); return 'FooValue' },
				bar: async ()=> { await sleep(30); return 123 },
				baz: async ()=> { await sleep(40); return [1, 2, 3] },
				quz: async ()=> { await sleep(20); return {one: 1, two: 2, three: 3 } },
			})
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('foo', 'FooValue');
				expect(this).to.have.property('bar', 123);
				expect(this).to.have.property('baz');
				expect(this.baz).to.deep.equal([1, 2, 3]);
				expect(this).to.have.property('quz');
				expect(this.quz).to.deep.equal({one: 1, two: 2, three: 3});
				done();
			})
	});

	it('parallel series', done => {
		asyncChainable()
			.parallel([
				async ()=> { await sleep(10) },
				async ()=> { await sleep(20) },
				async ()=> { await sleep(30) },
			])
			.end(function(err) {
				expect(err).to.not.be.ok;
				done();
			})
	});

	it('parallel promise factories', done => {
		asyncChainable()
			.parallel([
				async ()=> { await sleep(30) },
				async ()=> { await sleep(20) },
				async ()=> { await sleep(10) },
			])
			.end(function(err) {
				expect(err).to.not.be.ok;
				done();
			})
	});

	it('parallel object', done => {
		asyncChainable()
			.parallel({
				foo: async ()=> { await sleep(10); return 'FooValue' },
				bar: async ()=> { await sleep(10); return 123 },
				baz: async ()=> { await sleep(10); return [1, 2, 3] },
				quz: async ()=> { await sleep(10); return {one: 1, two: 2, three: 3} },
			})
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('foo', 'FooValue');
				expect(this).to.have.property('bar', 123);
				expect(this).to.have.property('baz');
				expect(this.baz).to.deep.equal([1, 2, 3]);
				expect(this).to.have.property('quz');
				expect(this.quz).to.deep.equal({one: 1, two: 2, three: 3});
				done();
			})
	});

	it('parallel array', done => {
		asyncChainable()
			.map('output', [1, 2, 3], async val => { await sleep(10) ; return val * 10 })
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('output');
				expect(this.output).to.be.deep.equal([10, 20, 30]);
				done();
			})
	});

	it('parallel object', done => {
		asyncChainable()
			.map('output', {foo: 1, bar: 2, baz: 3}, async val => { await sleep(10); return val * 10 })
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(this).to.have.property('output');
				expect(this.output).to.be.deep.equal({foo: 10, bar: 20, baz: 30});
				done();
			})
	});

	it('range', done => {
		var cycled = 0;
		asyncChainable()
			.set('cycled', 0)
			.forEach(10, async ()=> {
				await sleep(10);
				cycled++;
			})
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(cycled).to.equal(10);
				done();
			})
	});

	it('defer', done => {
		var output = [];

		asyncChainable()
			.defer([
				async ()=> { await sleep(10); output.push('a') },
				async ()=> { await sleep(10); output.push('b') },
				async ()=> { await sleep(10); output.push('c') },
			])
			.defer('foo', ['quz', 'bar'], async ()=> { output.push('foo') })
			.defer('bar', ['quuz', 'quz'], async ()=> { await sleep(10); output.push('bar') })
			.defer('baz', ['quz', 'bar', 'foo'], async ()=> { await sleep(20); output.push('baz') })
			.defer('quz', ['quuz'], async ()=> { output.push('quz') })
			.defer('quuz', async ()=> { sleep(30); output.push('quuz') })
			.await()
			.end(function(err) {
				expect(err).to.not.be.ok;
				expect(output.sort()).to.deep.equal(['a', 'b', 'bar', 'baz', 'c', 'foo', 'quuz', 'quz']);
				done();
			})
	});

});

describe('async-chainable - callbacks, promises + async functions', ()=> {

	it('callbacks should only fire once', ()=> {
		var callCount = 0;
		return Promise.resolve(
			asyncChainable()
				.then(next => {
					callCount++;
					next();
				})
				.promise()
		).then(()=> {
			expect(callCount).to.equal(1);
		})
	});

	it('promises should only resolve once', ()=> {
		var callCount = 0;
		return Promise.resolve(
			asyncChainable()
				.then(()=> new Promise(resolve => {
					callCount++;
					resolve();
				}))
				.promise()
		).then(()=> {
			expect(callCount).to.equal(1);
		})
	});

	it('async functions should only resolve once', ()=> {
		var callCount = 0;
		return Promise.resolve(
			asyncChainable()
				.then(async ()=> {
					callCount++;
				})
				.promise()
		).then(()=> {
			expect(callCount).to.equal(1);
		})
	});

});

describe('async-chainable - callbacks + promises (hybrid returns)', ()=> {

	it('should be able to return in a plain callback', done => {
		asyncChainable()
			.then(next => next())
			.end(err => {
				expect(err).to.not.be.ok;
				done();
			});
	});

	it('should be able to return a plain promise', done => {
		asyncChainable()
			.then(next => next())
			.promise()
			.catch(e => done(e))
			.then(()=> done())
	});

	it('should be able to use a callback + a promise', done => {
		var calledEnd = false;

		asyncChainable()
			.then(next => next())
			.promise(err => {
				expect(err).to.not.be.ok;
				calledEnd = true;
			})
			.catch(e => done(e))
			.then(()=> {
				expect(calledEnd).to.be.true;
				done();
			})
	});

	it('should be able to use a callback + a promise with a value', done => {
		var calledEnd = false;

		asyncChainable()
			.then('foo', next => next(null, 'Foo!'))
			.promise('foo', (err, val) => {
				expect(err).to.not.be.ok;
				expect(val).to.be.equal('Foo!');
				calledEnd = true;
			})
			.catch(e => done(e))
			.then(val => {
				expect(calledEnd).to.be.true;
				expect(val).to.be.equal('Foo!');
				done();
			})
	});

	it('should reject correctly when using a callback + a promise', done => {
		var calledEnd = false;

		asyncChainable()
			.then(next => next('This is an error'))
			.promise(err => {
				expect(err).to.be.ok;
				calledEnd = true;
			})
			.then(()=> e('Incorrect resolve'))
			.catch(e => {
				expect(calledEnd).to.be.true;
				done();
			})
	});

	it('should reject correctly when using a callback + a promise with a value', done => {
		var calledEnd = false;

		asyncChainable()
			.then('foo', next => next('This is an error', 'Foo!'))
			.promise('foo', err => {
				expect(err).to.be.ok;
				calledEnd = true;
			})
			.then(()=> e('Incorrect resolve'))
			.catch(e => {
				expect(calledEnd).to.be.true;
				done();
			})
	});

});
