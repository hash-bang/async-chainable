var expect = require('chai').expect;
var asyncChainable = require('../asyncChainable');

//This is the BDD style of testing
describe('Async-Chainable: ', function(){

	var arr = [];

	beforeEach(function(){

		asyncChainable.parallel([
			setTimeout(function(){ arr.push(1) }, 10),
			setTimeout(function(){ arr.push(2) }, 0),
			setTimeout(function(){ arr.push(3) }, 5),
		]).end();
	});
	
	describe('.parallel ', function(){

		it('should execute each of the arguments given to it', function(){
			var sum = arr.reduce(function(prev, curr) { return prev + curr });
			expect(sum).to.equal(6);
		});

	});

	describe('.series', function(){
		
		it('should execute each of the arguments given to it', function(){
			var sum = arr.reduce(function(prev, curr) { return prev + curr });
			expect(sum).to.equal(6);
		});
	
		it('should maintain ordinality when given a sequence of operations', function(){
			expect(arr[0]).to.equal(1);
			expect(arr[0]).to.equal(2);
			expect(arr[0]).to.equal(3);
		});
	});
});
