var expect = require('chai').expect;
var asyncChainable = require('../index');
var asyncInst = asyncChainable();

describe('async-chainable._get() - path traversal', function() {
	it('should find simple keys', function() {
		var obj = {foo: 'fooStr', bar: 'barStr', baz: 'bazStr'}
		expect(asyncInst.getPath(obj, 'bar')).to.equal('barStr');
		expect(asyncInst.getPath(obj, 'quz')).to.be.undefined;
	});

	it('should find nested keys', function() {
		var obj = {
			foo: {fooFoo: 'fooFooStr', fooBar: 'fooBarStr', fooBaz: {fooBazFoo: 'fooBazFooStr', fooBazBar: 'fooBazBarStr'}},
			bar: 'barStr',
			baz: [{foo: 'baz1FooStr'}, {foo: 'baz2FooStr', baz: 'baz2BarStr'}],
		};
		expect(asyncInst.getPath(obj, 'foo.fooBar')).to.equal('fooBarStr');
		expect(asyncInst.getPath(obj, 'foo.fooBaz')).to.be.an.object;
		expect(asyncInst.getPath(obj, 'foo.fooBaz.fooBazFoo')).to.be.equal('fooBazFooStr');
		expect(asyncInst.getPath(obj, 'foo.fooQuz.fooBazFoo')).to.be.be.undefined;
		expect(asyncInst.getPath(obj, 'bar')).to.equal('barStr');
		expect(asyncInst.getPath(obj, 'baz')).to.be.an.array;
		expect(asyncInst.getPath(obj, 'baz.0')).to.be.an.object;
		expect(asyncInst.getPath(obj, 'baz.0.foo')).to.equal('baz1FooStr');
		expect(asyncInst.getPath(obj, 'baz.1.baz')).to.equal('baz2BarStr');
		expect(asyncInst.getPath(obj, 'baz.1.quz')).to.be.undefined;
	});
});
