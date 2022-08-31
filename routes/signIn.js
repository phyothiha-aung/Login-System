const express = require('express')
const router = express.Router()
const User = require('../models/User')
const UserSession = require('../models/UserSession')
const cors = require('cors')
const nodemailer = require('nodemailer')
const {v4: uuid4} = require('uuid')

router.use(cors())
router.use(express.json())

let transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.AUTH_EMAIL,
		pass: process.env.AUTH_PASS
	}
})

transporter.verify((error, success)=>{
	if(error) {
		console.log(error)
	}else{
		console.log("ready for message")
		console.log(success)
	}
})


//deleting one
router.delete('/:id', getUser,async (req, res)=>{
	try{
		await res.user.remove()
		res.json({success:true, message:"Deleted successfully"})
	}catch(err){
		res.status(500).json({success: false, message: err.message})
	}
})

async function getUser(req, res, next){
	let user
	try{
		user = await User.findById(req.params.id)
		if(user == null){
			return res.status(404).json({success:false, message:"Cannot find user"})
		}
	}catch(err){
		return res.status(500).json({success:false, message: err.message})
	}
	res.user = user
	next()
}


const sendVerificationEmail = (email, _id, uniqueString) => {
	const currentUrl = "http://localhost:8080/"

	const link = currentUrl+"user/verify/"+_id+"/"+uniqueString

	const mailOptions = {
		from: 'no-reply@ether.com',
		to: email,
		subject: "Verify Your Email",
		html: `<p>Verify your email address to complete sigm up and login into your account.</p><p>This link will be expired in <b>6 hour</b>.</p><p>Press <a href=${link}>here</a></p>`
	}

	transporter.sendMail(mailOptions)
	.then(()=>{
		console.log(email)
		console.log(_id)
	})
	.catch(error=>{
		console.log(error.message)
	})
}

router.get('/user/verify/:id/:uniqueString', async(req, res) => {
	const { id, uniqueString } = req.params;
	try{
		const user = await User.find({
			_id: id
		})
		console.log(user)
		if(user.length && user[0].uniqueString == uniqueString){

			user[0].isVerify = true

			try{
				user[0].save()
				return res.send({
					success: true,
					message: "Email is verified."
				})

			}catch(err){
				return res.send({
					success: false,
					message: err.message
				})
			}
			
		}else{
			return res.send({
				success: false,
				message: "Something is wrong with link."
			})
		}
	}catch(err){
		return res.send({
			success: false,
			message: err.message
		})
	}
})

router.post('/api/account/signup', async (req, res, next)=>{
	const {
		name,
		password
	} = req.body;
	let {email} = req.body;
	if(!name){
		return res.send({
			success: false,
			message: "Error: Name can not be blank"
		})
	}
	if(!email){
		return res.send({
			success: false,
			message: "Error: Email can not be blank"
		})
	}
	if(!password){
		return res.send({
			success: false,
			message: "Error: Password can not be blank"
		})
	}

	email = email.toLowerCase()

	try{
		const user = await User.find({
			email: email
		})
		if(user.length > 0){
			return res.send({
				success: false,
				message: "User ALready Exist."
			})
		}
	}catch(err){
		return res.send({
			success: false,
			message: err.message
		})
	}

	const newUser = new User()
	newUser.name = name;
	newUser.email = email;
	newUser.password = newUser.generateHash(password);
	newUser.uniqueString = uuid4() + newUser._id;

	try{
		await newUser.save()
		sendVerificationEmail(email, newUser._id, newUser.uniqueString)
		res.json({
			success: true,
			message: "Signed Up"
		})
	}catch(err){
		res.json({
			success: false,
			message: err.message
		})
	}
})

router.post('/api/account/signin', async (req, res, next)=>{
	const { password } = req.body
	let { email } = req.body

	if(!email){
		return res.send({
			success: false,
			message: "Error: Email can not be blank"
		})
	}
	if(!password){
		return res.send({
			success: false,
			message: "Error: Password can not be blank"
		})
	}

	email = email.toLowerCase()

	let users = new User();
	let user;
	try{
		users = await User.find({email: email})
		if(users.length != 1){
			return res.send({
				success: false,
				message: "User does not exist."
			})
		}
		user = users[0];
		if(!user.validPassword(password)){
			return res.send({
				success: false,
				message: "Error: Invalid Login"
			})
		}
		if(!user.isVerify){
			return res.send({
				success: false,
				message: "Verify your email first."
			})
		}
	}catch(err){
		return res.send({
			success: false,
			message: err.message
		})
	}

	try{
		const session = await UserSession.findOneAndUpdate({
			userId:user._id
		},{
			isDeleted: false
		})

		if(session){
			return res.send({
				success: true,
				message: "Logined successfully",
				token: session._id
			})
		}

	}catch(err){
		console.log(err.message)
		return res.send({
			success: false,
			message: err.message
		})
	}


	let userSession =new UserSession();

	userSession.userId = user._id

	try{
		userSession = await userSession.save()
		res.json({
			success: true,
			message: "Logined successfully",
			token: userSession._id
		})
	}catch(err){
		return res.send({
			success: false,
			message: err.message
		})
	}

})

router.get('/api/account/session', async (req, res, next)=>{
	const { query } = req
	const { token } = query

	try{
		const session = await UserSession.find({
			_id:token,
			isDeleted: false
		})
		if(session.length != 1){
			return res.send({
				success: false,
				message: "Error: Invalid"
			})
		}
		return res.send({
			success: true,
			message: "Good"
		})
	}catch(err){
		return res.send({
			success: false,
			message: err.message
		})
	}

})

router.get('/api/account/logout', async (req, res, next)=>{
	const { query } = req
	const { token } = query

	try{
		const log = await UserSession.findOneAndUpdate({
			_id:token,
			isDeleted: false
		},{
			isDeleted: true
		})
		if(log == null){
			return res.send({
				success: false,
				message: "ALready Logout"
			})
		}
		return res.send({
			success: true,
			message: "Logouted successfully"
		})
	}catch(err){
		return res.send({
			success: false,
			message: err.message
		})
	}

})

module.exports = router