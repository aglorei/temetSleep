var temet_account = angular.module('temet_account', ['ngRoute','nvd3ChartDirectives']);

temet_account.config(function ($routeProvider){
	$routeProvider
		.when('/', {
			templateUrl: '/partials/dashboard.html',
			controller: 'usersController'
		})
		.when('/stats', {
			templateUrl: '/partials/stats.html',
			controller: 'usersController'
		})
		.when('/about', {
			templateUrl: '/partials/about.html'
		});
});

// ------ DEVICE FACTORY ------ //
temet_account.factory('deviceFactory', function ($http){
	var factory = {};
	var device = {};

	factory.getDevice = function (callback){
		$http.get('/device').success(function (data){
			device = data[0];
			callback(device);
		});
	};

	return factory;
});

// ------ DEVICES CONTROLLER ------ //
temet_account.controller('devicesController', function ($scope, deviceFactory){

	deviceFactory.getDevice(function (device){
		$scope.device = device;
	});
});

// ------ USER FACTORY ------ //
temet_account.factory('userFactory', function ($http){
	var factory = {};
	var profile = {};
	var summary = {};
	var minuteData = [];
	var timeData = [];

	factory.getProfile = function (callback){
		// only send request if profile is empty
		if (Object.keys(profile).length === 0){
			$http.get('/profile').success(function (data){
				profile = data.user;
				callback(profile);
			});
		} else {
			callback(profile);
		}
	};

	factory.getDaily = function (time, callback){
		// currently accessing on each controller load
		$http.get('/daily/'+time).success(function (data){
			minuteData = minuteCollection(data.sleep);
			summary = data.summary;
			callback(minuteData,summary);
		});
	};

	factory.getTime = function (base, end, callback){
		// currently accessing on each controller load
		timeData = [];

		$http.get('/time/minutesAwake/'+base+'/'+end).success(function (data){
			timeData.push(timeCollection('minutesAwake', data));
		});
		$http.get('/time/minutesAsleep/'+base+'/'+end).success(function (data){
			timeData.push(timeCollection('minutesAsleep', data));
		});

		callback(timeData);
	};

	// daily-series collection of minute data
	function minuteCollection(sleep)
	{
		var result = [];
		var mainLength = sleep[0].timeInBed;

		// set maximum length for sleepSets based on mainSleep
		for (var i=0; i<sleep.length; i++)
		{
			if (sleep[i].isMainSleep)
			{
				mainLength = sleep[i].timeInBed;
			}
		}

		// loop through each sleepSet
		for (var j=0; j<sleep.length; j++)
		{
			var sleepSet = {
				'key': (sleep[j].isMainSleep ? 'Main ' : 'Nap ') + sleep[j].minuteData[0].dateTime + ' (' + sleep[j].timeInBed + ' min)' ,
				'values': []
			};

			// declare constants for gaussian function for aesthetics (http://en.wikipedia.org/wiki/Gaussian_function)
			var a = 100;
			var b = Math.floor(sleep[j].minuteData.length / 2);
			var c = sleep[j].minuteData.length / 6;

			// loop through each minuteData the maximum length number of times
			for (var k=0; k<mainLength; k++)
			{
				if (sleep[j].minuteData[k])
				{
					var gaussian = a * Math.pow(Math.E, (-Math.pow((k- b), 2) / (2 * c * c)));

					switch (sleep[j].minuteData[k].value)
					{
						case '1':
							sleepSet.values.push([k, gaussian]);
							break;
						case '2':
							sleepSet.values.push([k, -gaussian]);
							break;
						case '3':
							sleepSet.values.push([k, -2 * gaussian]);
							break;
					}
				}
				else
				{
					sleepSet.values.push([k, 0]);
				}
			}

			result.push(sleepSet);
		}

		return result;
	}

	// time-series collection of resource data
	function timeCollection (resource, data)
	{
		var series = {
			'key': resource,
			'values' : []
		};

		for (var i=0; i<data['sleep-'+resource].length; i++)
		{
			series.values.push([new Date(data['sleep-'+resource][i].dateTime).getTime(), +data['sleep-'+resource][i].value]);
		}

		return series;
	}

	return factory;
});

// ------ USERS CONTROLLER ------ //
temet_account.controller('usersController', function ($scope, userFactory){

	var colorArray = ['#d62728', '#ff7f0e', '#aec7e8', '#ffbb78', '#2ca02c', '#98df8a', '#1f77b4', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'];

	var yesterday = (function(){
		this.setDate(this.getDate()-1);
		return this;
	}).call(new Date());
	var weekAgo = (function(){
		this.setDate(this.getDate()-7);
		return this;
	}).call(new Date());

	// initialize scope values
	$scope.Math = Math;
	$scope.daySeries = yesterday;
	$scope.timeSeries = {
		resource: 'efficiency',
		base: weekAgo,
		end: yesterday
	};

	// initializing factory calls
	userFactory.getProfile(function (profile){
		$scope.profile = profile;
	});

	userFactory.getDaily('today', function (minuteData, summary){
		$scope.minuteData = minuteData;
		$scope.summary = summary;
	});

	userFactory.getTime('today', '7d', function (timeData){
		$scope.timeData = timeData;
		console.log($scope.timeData);
	});

	// scope functions
	$scope.getDaily = function (){
		userFactory.getDaily($scope.daySeries.toISOString().slice(0,10), function (minuteData, summary){
			$scope.minuteData = minuteData;
			$scope.summary = summary;
		});
	};

	$scope.getTime = function (){
		userFactory.getTime($scope.timeSeries.base.toISOString().slice(0,10), $scope.timeSeries.end.toISOString().slice(0,10), function (timeData){
			$scope.timeData = timeData;
		});
	};

	$scope.colorFunction = function (){
		return function(d, i) {
			return colorArray[i];
		};
	};

	$scope.xAxisTickFormatFunction = function (){
		return function(d) {
			return d[0];
		};
	};

	$scope.xAxisTickFormat_Time_Format = function(){
		return function(d){
			return d3.time.format('%x')(new Date(d));
		};
	};

	$scope.yAxisTickFormatFunction = function (){
		return function(d) {
			return d[1];
		};
	};
});