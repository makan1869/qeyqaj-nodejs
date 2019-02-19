const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/qeyqaj', {useNewUrlParser: true});
var express = require('express')
var morgan = require('morgan')
var app = express()
var redis = require('redis');
var cache = redis.createClient();
var randomstring = require("randomstring");
var bodyParser = require('body-parser')
let jwt = require('jsonwebtoken');
const config = require('./config.js');


var aedes = require('aedes')()
var server = require('net').createServer(aedes.handle)
var mqttPort = 1883

server.listen(mqttPort, function () {
  console.log('MQTT Server Listening on Port', mqttPort)
})


const User = mongoose.model('User', { msisdn: String });
const Question = mongoose.model('Question', { level : Number,  answers : [[String]], correct : Number})
const Game = mongoose.model('Game', { status : String, startDate : Date})


app.use(morgan('combined'))

// parse application/json
app.use(bodyParser.json())

const port = 8080

app.get('/api/auth/otp/generate/:msisdn', function (req, res) {
  var password = randomstring.generate({
  	length: 6,
  	charset: 'numeric'
  });
  cache.set(`otp_${req.params.msisdn}`,password, 'EX', 120)
  res.send({code : 0, message : "SUCCESS", data : null})
})

app.post('/api/auth/otp/confirm', function (req, res) {
	cache.get(`otp_${req.body.username}`, function (error, result) {
	    if (error) {
	        console.log(error);
	        throw error;
	    } else {
	    	if(result == req.body.password) {
	    		const user = new User({ msisdn: req.body.username });
	    		user.save();
				let token = jwt.sign({username: req.body.username},
		          config.secret,
		          { expiresIn: '24h' // expires in 24 hours
		          }
		        );
		        res.set("Authorization", `Bearer ${token}`)
				res.send({code : 0, message : "SUCCESS", data : null})
			} else {
				res.status(401)
				res.send({code : 500, message : "Failure", data : null})
			}
	    }
	    
	})
})

app.get('/api/game/start', function(req, res) {
	Game.findOne({status : 'WAITING'}, function (err, game) {
		if(game != null) {

		} else {
			game = new Game({status : 'WAITING'})
			game.save()
		}
		console.log(game);
		res.send({code : 0, message : "SUCCESS", data : null})
	})
	

})

app.get('/api/game/answer/{id}', function(req, res) {

})

app.listen(port, () => console.log(`Qeyqaj Application listening on Port ${port}!`))
