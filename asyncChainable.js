
//Mock out only

module.exports = {
	parallel: function() {  return this; },
	series: function()   {  return this; },
	end: function(cb)      {  cb(); return this; },
};
