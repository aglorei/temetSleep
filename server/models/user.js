var mongoose = require('mongoose');

// DECLARE SCHEMA
var userSchema = new mongoose.Schema({
	provider: String,
	providerUserId: {
		type: String,
		required: true,
		unique: true
	},
	token: {
		type: String,
		required: true,
		unique: true
	},
	tokenSecret: {
		type: String,
		required: true,
		unique: true
	},
	profile: {},
	created_at: {
		type: Date,
		default: Date
	}
});

// CREATES MEMBERSHIP COLLECTION
mongoose.model('User', userSchema);