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
		.when('/alarms', {
			templateUrl: '/partials/alarms.html',
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
	var efficiencyData = [];
	var awakeData = [];
	var scatterData = [];

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

	factory.getDaily = function (date, callback){
		// only send initializing request if minuteData is empty
		if (date == 'today' && minuteData.length){
			callback(minuteData, efficiencyData, summary);
		} else {
			$http.get('/daily/'+date).success(function (data){
				minuteData = dailyCollection(data.sleep)[0];
				efficiencyData = dailyCollection(data.sleep)[1];
				summary = data.summary;
				callback(minuteData, efficiencyData, summary);
			});
		}
	};

	factory.getAwake = function (base, end, callback){
		// only send initializing request if awakeData is empty
		if (base == 'today' && awakeData.length){
			callback(awakeData);
		} else {
			// reset in order to push new data
			awakeData = [];
			// nest callbacks!
			// minutesAwake call
			$http.get('/time/minutesAwake/'+base+'/'+end).success(function (data){
				awakeData.push(awakeCollection('minutesAwake', data));

				// minutesAsleep call
				$http.get('/time/minutesAsleep/'+base+'/'+end).success(function (data){
					awakeData.push(awakeCollection('minutesAsleep', data));
				});

				callback(awakeData);
			});
		}
	};

	factory.getScatter = function (base, end, x, y, size, callback){
		// only send initializing request if scatterData is empty
		if (base == 'today' && scatterData.length){
			callback(scatterData);
		} else {
			var dataSet = [];
			var resourceSet = [x, y, size];

			// nest callbacks!
			// resource x call
			$http.get('/time/'+x+'/'+base+'/'+end).success(function (dataX){
				dataSet.push(dataX);

				// resource y call
				$http.get('/time/'+y+'/'+base+'/'+end).success(function (dataY){
					dataSet.push(dataY);

					// resource size call
					$http.get('/time/'+size+'/'+base+'/'+end).success(function (dataSize){
						dataSet.push(dataSize);

						scatterData = scatterCollection(resourceSet, dataSet);
						callback(scatterData);
					});
				});
			});
		}
	};

	// daily-series collection of minute data
	function dailyCollection(sleep)
	{
		var minutes = [];
		var efficiency = [];
		var mainLength = sleep[0].timeInBed;

		// set maximum length for sleepSets based on mainSleep
		for (var i=0; i<sleep.length; i++)
		{
			if (sleep[i].isMainSleep)
			{
				mainLength = sleep[i].timeInBed;
			}
		}

		// loop through each minuteSet
		for (var j=0; j<sleep.length; j++)
		{
			var minuteSet = {
				key: (sleep[j].isMainSleep ? 'Main ' : 'Nap ') + sleep[j].minuteData[0].dateTime + ' (' + sleep[j].timeInBed + ' min)' ,
				values: []
			};
			var efficiencySet = [
				{
					key: 'Time Asleep',
					y: sleep[j].minutesAsleep
				},
				{
					key: 'Time Restless',
					y: sleep[j].restlessDuration
				},
				{
					key: 'Time Awake',
					y: sleep[j].awakeDuration
				}
			];

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
							minuteSet.values.push([k, gaussian]);
							break;
						case '2':
							minuteSet.values.push([k, -gaussian]);
							break;
						case '3':
							minuteSet.values.push([k, -2 * gaussian]);
							break;
					}
				}
				else
				{
					minuteSet.values.push([k, 0]);
				}
			}

			minutes.push(minuteSet);
			efficiency.push(efficiencySet);
		}

		return [minutes, efficiency];
	}

	// awake-series collection of resource data
	function awakeCollection (resource, data)
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

	// scatter-series collection of resource data
	function scatterCollection (resourceSet, dataSet)
	{
		var dataLength = dataSet[0]['sleep-'+resourceSet[0]].length;
		var scatterData = [];

		for (var i=0; i<dataLength; i++)
		{
			var daySet = {
				key: dataSet[0]['sleep-'+resourceSet[0]][i].dateTime,
				values: [{
					x: +dataSet[0]['sleep-'+resourceSet[0]][i].value,
					y: +dataSet[1]['sleep-'+resourceSet[1]][i].value,
					size: +dataSet[2]['sleep-'+resourceSet[2]][i].value
				}]
			};

			scatterData.push(daySet);
		}

		return scatterData;
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
	var monthAgo = (function(){
		this.setDate(this.getDate()-30);
		return this;
	}).call(new Date());

	// initialize scope values
	$scope.Math = Math;
	$scope.daySeries = yesterday;
	$scope.awakeSeries = {
		resource: 'efficiency',
		base: monthAgo,
		end: yesterday
	};
	$scope.scatterSeries = {
		x: 'minutesAsleep',
		y: 'minutesAwake',
		size: 'efficiency',
		base: monthAgo,
		end: yesterday
	};

	// initializing factory calls
	userFactory.getProfile(function (profile){
		$scope.profile = profile;
	});

	userFactory.getDaily('today', function (minuteData, efficiencyData, summary){
		$scope.minuteData = minuteData;
		$scope.efficiencyData = efficiencyData;
		$scope.summary = summary;
	});

	userFactory.getAwake('today', '30d', function (awakeData){
		$scope.awakeData = awakeData;
	});

	userFactory.getScatter('today', '30d', 'minutesAsleep', 'minutesAwake', 'efficiency', function (scatterData){
		$scope.scatterData = scatterData;
		console.log($scope.scatterData);
	});

	// scope functions
	$scope.getDaily = function (){
		userFactory.getDaily($scope.daySeries.toISOString().slice(0,10), function (minuteData, efficiencyData, summary){
			$scope.minuteData = minuteData;
			$scope.efficiencyData = efficiencyData;
			$scope.summary = summary;
		});
	};

	$scope.getAwake = function (){
		userFactory.getAwake($scope.awakeSeries.base.toISOString().slice(0,10), $scope.awakeSeries.end.toISOString().slice(0,10), function (awakeData){
			$scope.awakeData = awakeData;
		});
	};

	$scope.getScatter = function (){
		userFactory.getScatter($scope.scatterSeries.base.toISOString().slice(0,10), $scope.scatterSeries.end.toISOString().slice(0,10), $scope.scatterSeries.x, $scope.scatterSeries.y, $scope.scatterSeries.size, function (scatterData){
			$scope.scatterData = scatterData;
			console.log($scope.scatterData);
		});
	};

	$scope.colorFunction = function (){
		return function(d, i) {
			return colorArray[i];
		};
	};

	$scope.xFunction = function(){
		return function(d) {
			return d.key;
		};
	};

	$scope.yFunction = function(){
		return function(d){
			return d.y;
		};
	};

	$scope.xAxisTickFormatFunction = function (){
		return function(d) {
			return d[0];
		};
	};

	$scope.xAxisTickFormat_Date_Format = function(){
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