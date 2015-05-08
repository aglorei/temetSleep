require('./config/mongoose.js');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var path = require('path');
var app = express();

app.use(session({
	secret: process.env.session_secret,
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

var port = process.env.PORT || 8080;

var server = app.listen(port, function(){
	console.log('listening to port:', port);
});