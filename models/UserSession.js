const mongoose = require('mongoose')

const UserSessionSchema = new mongoose.Schema({
	userId: {
		type: String,
		required: true,
		default: ''
	},
	timestamp: {
		type: Date,
		required: true,
		default: Date.now
	},
	isDeleted: {
		type: Boolean,
		default: false
	}
})

module.exports = mongoose.model('UserSession', UserSessionSchema); 