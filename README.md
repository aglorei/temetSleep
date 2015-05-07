# temetSleep

This application was developed to provide additional interfaces to interact with wearable technology for sleep tracking. The project was built on the MEAN stack using Fitbit's API.

On the back-end, Node and Express allow us to OAuth into Fitbit's API via Passport. From there, the server makes resource requests to the API using customized headers and signatures.

On the front-end, Angular handles the incoming data, while D3JS, nvd3, and angularjs-nvd3-directives presents the visualizations.

## To Do List:
* Deploy
* Fix scatterChart
  * Make sure size variable correctly manages size of data points
  * Have tooltips show up at correct horizontal and vertical coordinates relative to its respective data point
* Add alarms partial
  * Users should be able CRUD alarms
  * Consider an algorithm that suggests "healthy" alarms for waking times, possibly based off of an input that allows the user to state the time that they plan on sleeping that day
* Manage API calls (there are currently 8 calls at login). This might involve:
  * Adding resource subscriptions through Fitbit's API so that the server listens for updates. This can involve storing data in MongoDB until the server recieves an update, at which point it will pull the entry and update it
    * MAYBE(!) link those subscriptions to socket.io
  * Cacheing data
  * Further modularizing Angular's handle on the data by adding more controllers, and separating data loads into more view partials