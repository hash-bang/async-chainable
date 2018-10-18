var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.promise()', function() {
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable()
			.parallel({
				fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)},
				barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 0)},
				bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 5)},
			})
			.promise()
			.then(function() { // <- NOTE: This is a Promise.then() not an asyncChainable.then()
				done();
			})
			.catch(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(3);
	});

	it('contain the expected output', function() {
		expect(output).to.contain('foo');
		expect(output).to.contain('bar');
		expect(output).to.contain('baz');
	});
});

describe('async-chainable + promises', ()=> {

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

	it('callbacks + promises should only resolve once', ()=> {
		var callCount = 0;
		return Promise.resolve(
			asyncChainable()
				.then(next => new Promise(resolve => {
					callCount++;
					resolve();
					next();
				}))
				.promise()
		).then(()=> {
			expect(callCount).to.equal(1);
		})
	});

	it('series of promises', done => {
		asyncChainable()
			.then(()=> new Promise(resolve => setTimeout(resolve, 10)))
			.then(()=> new Promise(resolve => setTimeout(resolve, 20)))
			.then(()=> new Promise(resolve => setTimeout(resolve, 30)))
			.end(function(err) {
				expect(err).to.not.be.ok;
				done();
			})
	});

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
