var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.forEach() - range style (0 => max)', function() {
	var output;

	before(function(done) {
		output = [];

		asyncChainable()
			.forEach(2, function(next, item) { output.push(item); next(); })
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(3);
	});
	
	it('contain the expected output', function() {
		expect(output).to.be.deep.equal([0,1,2]);
	});
});

describe('async-chainable.forEach() - range style (min => max)', function() {
	var output;

	before(function(done) {
		output = [];

		asyncChainable()
			.forEach(1, 5, function(next, item) { output.push(item); next(); })
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(5);
	});
	
	it('contain the expected output', function() {
		expect(output).to.be.deep.equal([1,2,3,4,5]);
	});
});


describe('async-chainable.forEach() - array style', function() {
	var output;

	before(function(done) {
		output = [];

		asyncChainable()
			.forEach(['foo', 'bar', 'baz'], function(next, item) { output.push(item); next(); })
			.end(function(err) {
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


describe('async-chainable.forEach() - bogosort array', function() {
	var output;

	before(function(done) {
		output = [];

		asyncChainable()
			.forEach([500, 300, 200, 100, 400], function(next, value) {
				setTimeout(function() {
					output.push(value);
					next();
				}, value);
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(5);
	});
	
	it('contain the expected output', function() {
		expect(output[0]).to.equal(100);
		expect(output[1]).to.equal(200);
		expect(output[2]).to.equal(300);
		expect(output[3]).to.equal(400);
		expect(output[4]).to.equal(500);
	});
});


describe('async-chainable.forEach() - array style, unlimited', function() {
	var output, running = 0, maxRunning = 0;
	this.timeout(5000);

	before(function(done) {
		output = [];

		asyncChainable()
			.limit(null)
			.forEach(['foo', 'bar', 'baz', 'quz', 'quuz', 'quuuz'], function(next, item) {
				running++;
				if (running > maxRunning) maxRunning = running;
				setTimeout(function() {
					running--;
					output.push(item);
					next();
				}, Math.random() * 500)
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
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

	it('should have no threads left over', function() {
		expect(running).to.equal(0);
	});

	it('upper limit of 6 running threads', function() {
		expect(maxRunning).to.equal(6);
	});
});


describe('async-chainable.forEach() - array style, limited', function() {
	var output, running = 0, maxRunning = 0;
	this.timeout(5000);

	before(function(done) {
		output = [];

		asyncChainable()
			.limit(2)
			.forEach(['foo', 'bar', 'baz', 'quz', 'quuz', 'quuuz'], function(next, item) {
				running++;
				if (running > maxRunning) maxRunning = running;
				setTimeout(function() {
					running--;
					output.push(item);
					next();
				}, Math.random() * 500)
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
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

	it('should have no threads left over', function() {
		expect(running).to.equal(0);
	});

	it('limit to 2 running threads', function() {
		expect(maxRunning).to.equal(2);
	});
});


describe('async-chainable.forEach() - object style', function() {
	var context;
	var output;

	before(function(done) {
		context = {};
		output = [];

		asyncChainable()
			.forEach({fooKey: 'fooValue', barKey: 'barValue', bazKey: 'bazValue'}, function(next, item, key) { output.push(item, key); next(null, item); })
			.end(function(err) {
				expect(err).to.be.not.ok;
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


describe('async-chainable.forEach() - collection style', function() {
	var output;

	before(function(done) {
		context = {};
		output = [];

		asyncChainable()
			.forEach([
				{foo: 'Foo!', crash: 'Crash!'},
				{bar: 'Bar!', bang: 'Bang!'},
				{baz: 'Baz!', wallop: 'Wallop!'},
			], function(next, item) { output.push(item); next(null, item); })
			.end(function(err) {
				expect(err).to.be.not.ok;
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


describe('async-chainable.forEach() - bogosort collection', function() {
	var output;

	before(function(done) {
		output = [];

		asyncChainable()
			.set({
				metaWords: [
					{title: 'quuz', delay: 500},
					{title: 'baz', delay: 300},
					{title: 'foo', delay: 100},
					{title: 'bar', delay: 200},
					{title: 'quz', delay: 400},
				]
			})
			.forEach('metaWords', function(next, item) {
				setTimeout(function() {
					output.push(item.title);
					next();
				}, item.delay);
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should have the correct number of output elements', function() {
		expect(output).to.have.length(5);
	});
	
	it('contain the expected output', function() {
		expect(output[0]).to.equal('foo');
		expect(output[1]).to.equal('bar');
		expect(output[2]).to.equal('baz');
		expect(output[3]).to.equal('quz');
		expect(output[4]).to.equal('quuz');
	});
});


describe('async-chainable.forEach() - this._key + this._item', function() {
	var output;

	before(function(done) {
		output = [];

		asyncChainable()
			.forEach({
				fooKey: 'fooValue',
				barKey: 'barValue',
				bazKey: 'bazValue',
			}, function(next, item, key) { output.push(this._item, this._key); next(); })
			.end(function(err) {
				expect(err).to.be.not.ok;
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


describe('async-chainable.forEach() - named set', function() {
	var outputArray, outputObject, outputCollection;

	before(function(done) {
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
				expect(err).to.be.not.ok;
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

describe('async-chainable.forEach() - named set via path', function() {
	var seen = {};

	before(function(done) {
		asyncChainable()
			.then('result', function(next) {
				next(null, {
					foo: 'fooStr',
					bar: 'barStr',
					baz: [700, 800, 900],
				});
			})
			.forEach('result.baz', function(next, no) {
				seen[no] = true;
				next();
			})
			.end(function(err) {
				expect(err).to.be.not.ok;
				done();
			});
	});

	it('should support forEach() over a nested path', function() {
		expect(seen).to.have.property('700');
		expect(seen).to.have.property('800');
		expect(seen).to.have.property('900');
	});
});
