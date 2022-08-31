const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	createdDate: {
		type: Date,
		required: true,
		default: Date.now
	},
	isVerify: {
		type: Boolean,
		default: false
	},
	uniqueString: {
		type: String,
		required: true,
		default: ""
	}
})

UserSchema.methods.generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

UserSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password)
}

module.exports = mongoose.model('User', UserSchema)