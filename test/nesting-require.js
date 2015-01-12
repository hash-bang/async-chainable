var asyncChainable = require('../index');

/**
* Used by tests/nesting.js to test require() based nesting
*/
module.exports.subtasks = function(output, finish) {
	asyncChainable()
		.series([
			function(next) { setTimeout(function(){ output.push('inner-1'); next() }, 10)},
			function(next) { setTimeout(function(){ output.push('inner-2'); next() }, 10)},
			function(next) { setTimeout(function(){ output.push('inner-3'); next() }, 10)},
		])
		.end(function(err) {
			output.push('inner-end')
			finish(err);
		});
};
