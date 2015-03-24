var _ = require('lodash');
var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.context()', function(){
	var output;
	var contexts;

	before(function(done) {
		output = [];
		contexts = [];

		asyncChainable()
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.parallel({
				fooKey: function(next) { setTimeout(function(){ output.push('foo'); next(null, 'fooValue') }, 10)},
				barKey: function(next) { setTimeout(function(){ output.push('bar'); next(null, 'barValue') }, 10)},
			})
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.context({'hello': 'world'})
			.parallel({
				bazKey: function(next) { setTimeout(function(){ output.push('baz'); next(null, 'bazValue') }, 10)},
				quzKey: function(next) { setTimeout(function(){ output.push('quz'); next(null, 'quzValue') }, 10)},
			})
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.context()
			.parallel({
				quuzKey: function(next) { setTimeout(function(){ output.push('quuz'); next(null, 'quuzValue') }, 10)},
				quuuzKey: function(next) { setTimeout(function(){ output.push('quuuz'); next(null, 'quuuzValue') }, 10)},
			})
			.then(function(next) { contexts.push(_.cloneDeep(this)); next() })
			.end(function(err) {
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(6);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('foo');
		expect(output).to.contain('bar');
		expect(output).to.contain('baz');
		expect(output).to.contain('quz');
		expect(output).to.contain('quuz');
		expect(output).to.contain('quuuz');
	});

	it('should set the context stack', function() {
		expect(contexts[0]).to.have.property('_struct');

		expect(contexts[1]).to.have.property('_struct');
		expect(contexts[1]).to.have.property('fooKey');
		expect(contexts[1].fooKey).to.equal('fooValue');
		expect(contexts[1]).to.have.property('barKey');
		expect(contexts[1].barKey).to.equal('barValue');

		expect(contexts[2]).to.not.have.property('_struct');
		expect(contexts[2]).to.have.property('hello');
		expect(contexts[2].hello).to.equal('world');

		expect(contexts[3]).to.have.property('_struct');
		expect(contexts[3]).to.have.property('fooKey');
		expect(contexts[3].fooKey).to.equal('fooValue');
		expect(contexts[3]).to.have.property('barKey');
		expect(contexts[3].barKey).to.equal('barValue');
		expect(contexts[3]).to.have.property('bazKey');
		expect(contexts[3].bazKey).to.equal('bazValue');
		expect(contexts[3]).to.have.property('quzKey');
		expect(contexts[3].quzKey).to.equal('quzValue');
		expect(contexts[3]).to.have.property('quuzKey');
		expect(contexts[3].quuzKey).to.equal('quuzValue');
		expect(contexts[3]).to.have.property('quuuzKey');
		expect(contexts[3].quuuzKey).to.equal('quuuzValue');
	});

	it('should return the final context', function() {
		var context = contexts[3];

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

		expect(context).to.have.property('quuuzKey');
		expect(context.quuuzKey).to.equal('quuuzValue');
	});
});
