var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');

mongoose.connect(process.env.MONGOLAB_URI, function (error, response){
	if (error) {
		console.log ('ERROR connecting to: ' + process.env.MONGOLAB_URI + '. ' + error);
	} else {
		console.log ('Succeeded connected to: ' + process.env.MONGOLAB_URI);
	}
});

mongoose.connection.on('open', function (){
	console.log('Mongoose connection open to MongoDB');
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