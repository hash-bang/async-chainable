var _ = require('lodash');
var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.set() - simple setters', function(){
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
		expect(context).to.not.have.property('mumble');
		expect(context.mumble).to.be.undefined;
	});

	it('set null', function() {
		expect(context).to.have.property('bongo');
		expect(context.bongo).to.be.null;
	});

	it('set regexp', function() {
		expect(context).to.have.property('bazola');
		expect(context.bazola).to.be.regexp;
	});
});


describe('async-chainable.set() - context access', function(){
	var contexts;

	beforeEach(function(done) {
		contexts = [];

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

	it('should set the context stack', function() {
		expect(contexts[0]).to.have.property('_struct');

		expect(contexts[1]).to.have.property('_struct');
		expect(contexts[1]).to.have.property('fooKey');
		expect(contexts[1].fooKey).to.equal('fooValue');

		expect(contexts[2]).to.have.property('_struct');
		expect(contexts[2]).to.have.property('fooKey');
		expect(contexts[2].fooKey).to.equal('fooValue');
		expect(contexts[2]).to.have.property('barKey');
		expect(contexts[2].barKey).to.equal('barValue');

		expect(contexts[3]).to.have.property('_struct');
		expect(contexts[3]).to.have.property('fooKey');
		expect(contexts[3].fooKey).to.equal('fooValue');
		expect(contexts[3]).to.have.property('barKey');
		expect(contexts[3].barKey).to.equal('barValue');
		expect(contexts[3]).to.have.property('bazKey');
		expect(contexts[3].bazKey).to.equal('bazValue');

		expect(contexts[4]).to.have.property('_struct');
		expect(contexts[4]).to.have.property('fooKey');
		expect(contexts[4].fooKey).to.equal('fooValue');
		expect(contexts[4]).to.have.property('barKey');
		expect(contexts[4].barKey).to.equal('barValue');
		expect(contexts[4]).to.have.property('bazKey');
		expect(contexts[4].bazKey).to.equal('bazValue');
		expect(contexts[4]).to.have.property('quzKey');
		expect(contexts[4].quzKey).to.equal('quzValue');

		expect(contexts[5]).to.have.property('_struct');
		expect(contexts[5]).to.have.property('fooKey');
		expect(contexts[5].fooKey).to.equal('fooValue');
		expect(contexts[5]).to.have.property('barKey');
		expect(contexts[5].barKey).to.equal('barValue');
		expect(contexts[5]).to.have.property('bazKey');
		expect(contexts[5].bazKey).to.equal('bazValue');
		expect(contexts[5]).to.have.property('quzKey');
		expect(contexts[5].quzKey).to.equal('quzValue');
		expect(contexts[5]).to.have.property('quuzKey');
		expect(contexts[5].quuzKey).to.equal('quuzValue');
	});

	it('should return the final context', function() {
		var context = contexts[5];

		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');

		expect(context).to.have.property('quzKey');
		expect(context.quzKey).to.equal('quzValue');

		expect(context).to.have.property('quuzKey');
		expect(context.quuzKey).to.equal('quuzValue');
	});
});
