var config = require('./../config.js');
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');

mongoose.connect(config.production.db);

mongoose.connection.on('open', function (){
	console.log('Mongoose default connection open to mongodb://localhost/temet_db');
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