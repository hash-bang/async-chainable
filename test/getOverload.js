var expect = require('chai').expect;
var asyncChainable = require('../index');

describe('async-chainable.getOverload()', function() {

	it('should recognise types', function() {
		expect(asyncChainable().getOverload([function() { }])).to.equal('function');
		expect(asyncChainable().getOverload([123])).to.equal('number');
		expect(asyncChainable().getOverload(['abc'])).to.equal('string');
		expect(asyncChainable().getOverload([new Date])).to.equal('date');
		expect(asyncChainable().getOverload([{foo: 'foo'}])).to.equal('object');
		expect(asyncChainable().getOverload([[1,2,3]])).to.equal('array');
		expect(asyncChainable().getOverload([null])).to.equal('null');
		expect(asyncChainable().getOverload([undefined])).to.equal('');
	});

	it('should recognise compound types', function() {
		expect(asyncChainable().getOverload([undefined,undefined])).to.equal('');
		expect(asyncChainable().getOverload([123,'123', function() { return 123 },null])).to.equal('number,string,function,null');
	});

});
