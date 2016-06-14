var expect = require('chai').expect;
var asyncChainable = require('../index');

// Most of the global await functionality (i.e. `.await()` without args) is contained in test/defer

describe('async-chainable.await() - stepped blocking', function(){
	var contextStep, contextFinal;

	before(function(done) {
		output = [];
		contextStep = {};
		contextFinal = {};

		asyncChainable()
			.defer('fooKey', function(next) { setTimeout(function(){ next(null, 'fooValue') }, 10)})
			.defer('barKey', function(next) { setTimeout(function(){ next(null, 'barValue') }, 0)})
			.defer('bazKey', function(next) { setTimeout(function(){ next(null, 'bazValue') }, 50)})
			.await('fooKey', 'bazKey')
			.then(function(next) {
				contextStep = this;
				next();
			})
			.end(function(err) {
				expect(err).to.be.not.ok
				contextFinal = this;
				done();
			});
	});

	it('should set the blocking context', function() {
		expect(contextStep).to.have.property('fooKey');
		expect(contextStep.fooKey).to.equal('fooValue');

		expect(contextStep).to.have.property('bazKey');
		expect(contextStep.bazKey).to.equal('bazValue');
	});

	it('should set the final context', function() {
		expect(contextFinal).to.have.property('fooKey');
		expect(contextFinal.fooKey).to.equal('fooValue');

		expect(contextFinal).to.have.property('barKey');
		expect(contextFinal.barKey).to.equal('barValue');

		expect(contextFinal).to.have.property('bazKey');
		expect(contextFinal.bazKey).to.equal('bazValue');
	});
});
