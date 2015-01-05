var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.set()', function(){
	var contexts;

	beforeEach(function(done) {
		contexts = [];

		asyncChainable
			.then(function(next) { contexts.push(this); next() })
			.set('fooKey', 'fooValue')
			.then(function(next) { contexts.push(this); next() })
			.set({barKey: 'barValue'})
			.then(function(next) { contexts.push(this); next() })
			.set('bazKey', function(next) {
				next(null, 'bazValue');
			})
			.then(function(next) { contexts.push(this); next() })
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
	});

	it('should return the final context', function() {
		var context = contexts[3];

		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});
});
