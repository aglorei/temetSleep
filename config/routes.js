var passport = require('passport');
var passportFitbit = require('./fitbitAuth.js');
var https = require('https');
var oauthSignature = require('oauth-signature');
var randomString = require('randomstring');

module.exports = function (app){
	// login view
	app.get('/login', function (request, response){
		response.render('login');
	});

	// login view
	app.get('/about', function (request, response){
		response.render('about');
	});

	// use passport.authenticate() as route middleware to authenticate the request by first redirecting to fitbit.com
	app.get('/auth/fitbit', passport.authenticate('fitbit'));

	// if authentication fails, redirect home. otherwise, direct to app.get '/account'
	app.get('/auth/fitbit/callback',
		passport.authenticate('fitbit', {
			successRedirect: '/',
			failureRedirect: '/login'
		})
	);

	// account (authenticated) view
	app.get('/', ensureAuthenticated, function (request, response){
		response.render('index');
	});

	// get Fitbit profile
	app.get('/profile', ensureAuthenticated, function (request, response){
		httpsRequest('GET', 'api.fitbit.com', '/1/user/-/profile.json', request.user.token, request.user.tokenSecret, function (error, res){
			if (error) { console.log(error); }
			response.json(JSON.parse(res));
		});
	});

	// get Fitbit device
	app.get('/device', ensureAuthenticated, function (request, response){
		httpsRequest('GET', 'api.fitbit.com', '/1/user/-/devices.json', request.user.token, request.user.tokenSecret, function (error, res){
			if (error) { console.log(error); }
			response.json(JSON.parse(res));
		});
	});

	// get daily-series sleep data
	app.get('/daily/:time', ensureAuthenticated, function (request, response){
		httpsRequest('GET', 'api.fitbit.com', '/1/user/-/sleep/date/'+request.params.time+'.json', request.user.token, request.user.tokenSecret, function (error, res){
			if (error) { console.log(error); }
			response.json(JSON.parse(res));
		});
	});

	// get times-series sleep data
	app.get('/time/:resource/:base/:end', ensureAuthenticated, function (request, response){
		httpsRequest('GET', 'api.fitbit.com', '/1/user/-/sleep/'+request.params.resource+'/date/'+request.params.base+'/'+request.params.end+'.json', request.user.token, request.user.tokenSecret, function (error, res){
			if (error) { console.log(error); }
			response.json(JSON.parse(res));
		});
	});

	// logout
	app.get('/logout', function (request, response){
		request.logout();
		response.redirect('/login');
	});

	//	Use this route middleware on any resource that needs to be protected. authenticated via a persistent login session
	function ensureAuthenticated(request, response, next) {
		if (request.isAuthenticated())
		{
			return next();
		}
		response.redirect('/login');
	}

	function httpsRequest(httpsMethod, host, path, token, tokenSecret, actionCallback){

		var time = Math.floor(new Date().getTime()/1000);
		var nonce = randomString.generate(16);

		// set request parameters
		var parameters = {
			'oauth_consumer_key': process.env.FITBIT_CONSUMER_KEY,
			'oauth_nonce': nonce,
			'oauth_signature_method': 'HMAC-SHA1',
			'oauth_timestamp': time,
			'oauth_token': token,
			'oauth_version': '1.0'
		};

		// generate oauth signature
		encodedSignature = oauthSignature.generate(httpsMethod, 'https://' + host + path, parameters, process.env.FITBIT_CONSUMER_SECRET, tokenSecret);

		// create header
		var oauthString = 'OAuth ';
		for(var key in parameters)
		{
			oauthString += key + '="' + parameters[key] + '", ';
		}
		oauthString += 'oauth_signature="' + encodedSignature + '"';

		// send signed https request
		var sendRequest = https.request({
				method: httpsMethod,
				hostname: host,
				path: path,
				headers: { Authorization: oauthString }
			}, function (sendResponse){
				var data = '';
				sendResponse.setEncoding('utf8');
				sendResponse.on('data', function (chunk){
					data += chunk;
				});
				sendResponse.on('end', function (){
					actionCallback(null, data);
				});
			}
		);
		sendRequest.on('error', function (error){
			actionCallback(httpsMethod + ' ' + 'https://' + host + path + ' ERROR => ' + error);
		});
		sendRequest.end();
	}
};