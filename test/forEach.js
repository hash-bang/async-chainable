var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.forEach() - array style', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable()
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.end(function(err) {
				expect(err).to.be.undefined();
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


describe('async-chainable.forEach() - object style', function(){
	var context;
	var output;

	beforeEach(function(done) {
		context = {};
		output = [];

		asyncChainable()
			.forEach({fooKey: 'fooValue', barKey: 'barValue', bazKey: 'bazValue'}, function(next, item, key) { output.push(item, key); next(null, item); })
			.end(function(err) {
				expect(err).to.be.undefined();
				context = this;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(6);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('fooKey');
		expect(output).to.contain('fooValue');
		expect(output).to.contain('barKey');
		expect(output).to.contain('barValue');
		expect(output).to.contain('bazKey');
		expect(output).to.contain('bazValue');
	});

	it('should set the context', function() {
		expect(context).to.have.property('fooKey');
		expect(context.fooKey).to.equal('fooValue');

		expect(context).to.have.property('barKey');
		expect(context.barKey).to.equal('barValue');

		expect(context).to.have.property('bazKey');
		expect(context.bazKey).to.equal('bazValue');
	});
});


describe('async-chainable.forEach() - collection style', function(){
	var output;

	beforeEach(function(done) {
		context = {};
		output = [];

		asyncChainable()
			.forEach([
				{foo: 'Foo!', crash: 'Crash!'},
				{bar: 'Bar!', bang: 'Bang!'},
				{baz: 'Baz!', wallop: 'Wallop!'},
			], function(next, item) { output.push(item); next(null, item); })
			.end(function(err) {
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(3);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain({foo: 'Foo!', crash: 'Crash!'});
		expect(output).to.contain({bar: 'Bar!', bang: 'Bang!'});
		expect(output).to.contain({baz: 'Baz!', wallop: 'Wallop!'});
	});
});


describe('async-chainable.forEach() - this._key + this._item', function(){
	var output;

	beforeEach(function(done) {
		output = [];

		asyncChainable()
			.forEach({
				fooKey: 'fooValue',
				barKey: 'barValue',
				bazKey: 'bazValue',
			}, function(next, item, key) { output.push(this._item, this._key); next(); })
			.end(function(err) {
				expect(err).to.be.undefined();
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(6);
	});
	
	it('contain the expected output', function() {
		expect(output).to.contain('fooKey');
		expect(output).to.contain('fooValue');
		expect(output).to.contain('barKey');
		expect(output).to.contain('barValue');
		expect(output).to.contain('bazKey');
		expect(output).to.contain('bazValue');
	});
});


describe('async-chainable.forEach() - named set', function(){
	var outputArray, outputObject, outputCollection;

	beforeEach(function(done) {
		outputArray = [];
		outputObject = [];
		outputCollection = [];

		asyncChainable()
			.set({
				items: ['foo', 'bar', 'baz'],
				hitchhikers: {
					arthur: 'british',
					ford: 'froody',
					zaphod: 'president'
				},
				numbers: [
					{one: 'Number 1'},
					{two: 'Number 2'},
					{three: 'Number 3'},
				],
			})
			.forEach('items', function(next, item) { // Array form
				outputArray.push(item);
				next();
			})
			.forEach('hitchhikers', function(next, item, key) { // Object form
				outputObject.push(item, key);
				next();
			})
			.forEach('numbers', function(next, item) { // Collection form
				outputCollection.push(item);
				next();
			})


			// Finish
			.end(function(err) {
				expect(err).to.be.undefined();
				done();
			});
	});

	it('array method should have the correct number of output elements', function() {
		expect(outputArray).to.have.length(3);
	});
	
	it('array method should contain the expected output', function() {
		expect(outputArray).to.contain('foo');
		expect(outputArray).to.contain('bar');
		expect(outputArray).to.contain('baz');
	});

	it('object method should have the correct number of output elements', function() {
		expect(outputObject).to.have.length(6);
	});
	
	it('object method should contain the expected output', function() {
		expect(outputObject).to.contain('arthur');
		expect(outputObject).to.contain('british');
		expect(outputObject).to.contain('ford');
		expect(outputObject).to.contain('froody');
		expect(outputObject).to.contain('zaphod');
		expect(outputObject).to.contain('president');
	});

	it('collection method should have the correct number of output elements', function() {
		expect(outputCollection).to.have.length(3);
	});
	
	it('collection method should contain the expected output', function() {
		expect(outputCollection).to.contain({one: 'Number 1'});
		expect(outputCollection).to.contain({two: 'Number 2'});
		expect(outputCollection).to.contain({three: 'Number 3'});
	});
});
