var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');

mongoose.connect(process.env.db);

mongoose.connection.on('open', function (){
	console.log('Mongoose connection open');
});

// declare path for folder containing models
var models_path = path.join(__dirname, './../server/models');

// loop through and require all models in models folder
fs.readdirSync(models_path).forEach(function (file){
	if (file.indexOf('.js') > 0)
	{
		require(path.join(models_path,'/',file));
	}
});