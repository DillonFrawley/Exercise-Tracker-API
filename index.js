const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require("mongoose");
let bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let usernameSchema = new mongoose.Schema({
  username: {
    type: String,
    req: true
  },
  _id: mongoose.Schema.Types.ObjectId,
  logs: [{
    description: {
    type: String,
    req:true
    },
    duration: {
      type: Number,
      req:true
    },
    date: {
      type:String,
      req:true
    }
  }]
});

let usernameModel = mongoose.model('username', usernameSchema);


app.post('/api/users', (req,res) => {
  let newUser = new usernameModel({
    username: req.body.username,
    _id: mongoose.Types.ObjectId()
  });
  newUser.save(function(err, result) {
    if (err) return console.log(err);
    res.send({username:result.username, _id: result._id});
  })
});

app.get('/api/users', (req, res) => {
  usernameModel.find().select("username _id").exec(function(err, result) {
    if (err) return console.log(err);
    res.send(result);
  })
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let exerciseDate;
  if (req.body.date === undefined || req.body.date === null || (req.body.date + "").length == 0) {
    exerciseDate = new Date().toDateString();
  }
  else {
    exerciseDate = new Date(req.body.date).toDateString();
  }
  usernameModel.findById(req.params._id, (err, foundUser) => {
    if (err) return console.log(err);
    let numExercises = foundUser.logs.length;
    
    let newExercise = {
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: new Date(exerciseDate).toDateString()
    };
    foundUser.logs.push(newExercise);
    foundUser.save(function(err, updatedUser) {
      if (err) return console.log(err);
      res.send({username:updatedUser.username, description: updatedUser.logs[numExercises].description, duration: updatedUser.logs[numExercises].duration, date: updatedUser.logs[numExercises].date, _id:updatedUser._id});
    });
  })
  
});

app.get("/api/users/:_id/logs", (req, res) => {
  let from;
  let to;
  let limit; 

  if (
    req.query.from == null ||
    req.query.from == undefined ||
    (req.query.from + "").length == 0
  ) {
    from = new Date(0).getTime();
  }
  else{
    from = new Date(req.query.from).getTime();
  }
  if (
    req.query.to == null ||
    req.query.to == undefined ||
    (req.query.to + "").length == 0
  ) {
    to = new Date().getTime();
  }
  else {
    to = new Date(req.query.to).getTime();
  }
  if (
    req.query.limit == null ||
    req.query.limit == undefined ||
    (req.query.limit + "").length == 0
  ) {
    limit = Infinity;
  }
  else {
    limit = req.query.limit;
  }
  usernameModel.findById(req.params._id ).exec(function (err, foundUser) {
    if (err) return console.log(err);
    let outputExercises = [];
    for (let i = 0; i < foundUser.logs.length; i++) {
      let tempDate = new Date(foundUser.logs[i].date).getTime();
      if (tempDate >= from && tempDate <= to && outputExercises.length < limit ) {
        outputExercises.push(foundUser.logs[i]);
      };
    };
    res.send({
          username: foundUser.username,
          count: outputExercises.length,
          _id: foundUser._id,
          log: outputExercises,
        });
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
