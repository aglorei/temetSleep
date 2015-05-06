# temetSleep

This application was developed to provide additional interfaces to interact with wearable technology for sleep tracking. The project was built on the MEAN stack.

On the back-end, Node and Express allow us to OAuth into Fitbit's API via Passport. From there, the server makes https requests to the API using customized headers and signatures.

On the front-end, Angular handles the incoming data, while D3JS, nvd3, and angularjs-nvd3-directives presents the visualizations.