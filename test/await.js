var expect = require('chai').expect;
var asyncChainable = require('../index');

// Most of the global await functionality (i.e. `.await()` without args) is contained in test/defer

describe('async-chainable.await() - stepped blocking', function(){
	var contextStep, contextFinal;

	beforeEach(function(done){
		output = [];
		contextStep = {};
		contextFinal = {};

		asyncChainable
			.defer('fooKey', function(next) { setTimeout(function(){ next(null, 'fooValue') }, 10)})
			.defer('barKey', function(next) { setTimeout(function(){ next(null, 'barValue') }, 0)})
			.defer('bazKey', function(next) { setTimeout(function(){ next(null, 'bazValue') }, 50)})
			.await('fooKey', 'bazKey')
			.then(function(next) {
				contextStep = this;
				next();
			})
			.end(function(err) {
				expect(err).to.be.undefined();
				contextFinal = this;
			});
	});

	it('should set the blocking context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});

	it('should set the final context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});
});
