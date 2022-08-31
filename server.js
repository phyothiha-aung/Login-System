require('dotenv').config()

const express = require('express')
const app = express()
const mongoose = require('mongoose')

app.use(express.json())

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true})
const db = mongoose.connection
db.on('error', (error)=>console.log(error))
db.once('open', ()=>console.log('Connected to Database'))

const signInRouter = require('./routes/signIn')
app.use('/', signInRouter)

app.listen(process.env.PORT, ()=> {console.log('Server Started')})
