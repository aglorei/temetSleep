require('./config/mongoose.js');
var config = require('./config.js');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var path = require('path');
var app = express();

app.use(session({
	secret: config.production.session_secret,
	resave: false,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname,'client')));
app.use(bodyParser.json());

app.set('views', path.join(__dirname,'client/views'));
app.set('view engine','ejs');

var routes = require('./config/routes.js')(app);

var server = app.listen(8000, function(){
	console.log('listening to port 8000');
});