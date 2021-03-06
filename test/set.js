var _ = require('lodash');
var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.set() - simple setters', function() {
	var context;

	beforeEach(function(done) {
		contexts = [];

		asyncChainable()
			.set('foo', 'fooValue')
			.set('bar', ['hello!'])
			.set({baz: 'bazValue'})
			.set('quz', {subkey: 'Hi!'})
			.set('quuz', function(next) {
				next(null, 'quuzValue');
			})
			.set('flarp', 672)
			.set('thud', 81.923)
			.set('snork', new Date())
			.set('mumble', undefined)
			.set('bongo', null)
			.set('bazola', /./)
			.set('blinga', true)
			.end(function(err) {
				expect(err).to.be.not.ok;
				context = this;
				done();
			});
	});

	it('set strings', function() {
		expect(context).to.have.property('foo');
		expect(context.foo).to.equal('fooValue');
	});

	it('set arrays', function() {
		expect(context).to.have.property('bar');
		expect(context.bar).to.have.length(1);
		expect(context.bar[0]).to.equal('hello!');
	});

	it('set objects', function() {
		expect(context).to.have.property('baz');
		expect(context.baz).to.equal('bazValue');
	});

	it('set objects to objects', function() {
		expect(context).to.have.property('quz');
		expect(context.quz.subkey).to.equal('Hi!');
	});

	it('set functions', function() {
		expect(context).to.have.property('quuz');
		expect(context.quuz).to.equal('quuzValue');
	});

	it('set numbers', function() {
		expect(context).to.have.property('flarp');
		expect(context.flarp).to.equal(672);
	});

	it('set floats', function() {
		expect(context).to.have.property('thud');
		expect(context.thud).to.equal(81.923);
	});

	it('set dates', function() {
		expect(context).to.have.property('snork');
	});

	it('set undefined', function() {
		expect(context).to.have.property('mumble');
		expect(context.mumble).to.be.undefined;
	});

	it('set null', function() {
		expect(context).to.have.property('bongo');
		expect(context.bongo).to.be.null;
	});

	it('set regexp', function() {
		expect(context).to.have.property('bazola');
		expect(context.bazola).to.be.a('regexp');
	});

	it('set boolean', function() {
		expect(context).to.have.property('blinga');
		expect(context.blinga).to.be.a('boolean');
	});
});


describe('async-chainable.set() - context access', function() {
	var contexts = [];

	before(done => {
		asyncChainable()
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.set('fooKey', 'fooValue')
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.set({barKey: 'barValue'})
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.set('bazKey', function(next) {
				next(null, 'bazValue');
			})
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.then(function(next) {
				this.quzKey = 'quzValue';
				next();
			})
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.then('quuzKey', function(next) {
				setTimeout(function() {
					next(null, 'quuzValue');
				}, 100);
			})
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should set the context stack', ()=> {
		expect(contexts[0]).to.have.property('_struct');

		expect(contexts[1]).to.have.property('_struct');
		expect(contexts[1]).to.have.property('fooKey', 'fooValue');

		expect(contexts[2]).to.have.property('_struct');
		expect(contexts[2]).to.have.property('fooKey', 'fooValue');
		expect(contexts[2]).to.have.property('barKey', 'barValue');

		expect(contexts[3]).to.have.property('_struct');
		expect(contexts[3]).to.have.property('fooKey', 'fooValue');
		expect(contexts[3]).to.have.property('barKey', 'barValue');
		expect(contexts[3]).to.have.property('bazKey', 'bazValue');

		expect(contexts[4]).to.have.property('_struct');
		expect(contexts[4]).to.have.property('fooKey', 'fooValue');
		expect(contexts[4]).to.have.property('barKey', 'barValue');
		expect(contexts[4]).to.have.property('bazKey', 'bazValue');
		expect(contexts[4]).to.have.property('quzKey', 'quzValue');

		expect(contexts[5]).to.have.property('_struct');
		expect(contexts[5]).to.have.property('fooKey', 'fooValue');
		expect(contexts[5]).to.have.property('barKey', 'barValue');
		expect(contexts[5]).to.have.property('bazKey', 'bazValue');
		expect(contexts[5]).to.have.property('quzKey', 'quzValue');
		expect(contexts[5]).to.have.property('quuzKey', 'quuzValue');
	});

});
