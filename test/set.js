var _ = require('lodash');
var expect = require('chai').expect;
var asyncChainable = require('../index')();

describe('async-chainable.set()', function(){
	var contexts;

	beforeEach(function(done) {
		contexts = [];

		asyncChainable
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
				expect(err).to.be.undefined();
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
