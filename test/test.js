var expect = require('chai').expect;
var asyncChainable = require('../index');

//This is the BDD style of testing
describe('Async-Chainable: ', function(){

	var arr;

	beforeEach(function(done){
	
		arr = [];

		asyncChainable
			.parallel([
				function(next) { setTimeout(function(){ arr.push(0); next() }, 10)},
				function(next) { setTimeout(function(){ arr.push(1); next() }, 0)},
				function(next) { setTimeout(function(){ arr.push(2); next() }, 5)},
			])
			.end(done);
	});
	
	describe('.parallel ', function(){

		it('should execute each of the arguments given to it', function(){
			var sum = arr.reduce(function(prev, curr) { return prev + curr });
			expect(sum).to.equal(3);
		});

	});

	describe('.series', function(){
		
		it('should execute each of the arguments given to it', function(){
			var sum = arr.reduce(function(prev, curr) { return prev + curr });
			expect(sum).to.equal(3);
		});
	
		it('should maintain ordinality when given a sequence of operations', function(){
			console.log(arr)
			expect(arr[0]).to.equal(0);
			expect(arr[1]).to.equal(1);
			expect(arr[2]).to.equal(2);
		});
	});
});
