
const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
var socket = require('socket.io')
var fs = require('fs');


var data = fs.readFileSync('users.json');
var users = JSON.parse(data);

var detailesAreValid = function (name, password) {

  if (name in users) {
    if (users[name] == password) {
      return true;
    }
  } else {
    return false;
  }
}

var socketIdToName = {};
var connectedUsers = {};
var UserMessages = {};


var hbs = exphbs.create({
  helpers: {
    ifEqual: function (val1, val2, options) {
      return (val1 === val2) ? options.fn(this) : options.inverse(this);
    },
    ifNotEqueal: function (val1, val2, options) {
      return (val1 !== val2) ? options.fn(this) : options.inverse(this);
    }
  },
  defaultLayout: 'main'
});

//Handlebars Middleware

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.static('public'));


const port = 3000;
var server = app.listen(process.env.PORT || 3000);

console.log("connected to port:" + port);


//Index Route
app.get('/', (req, res) => {
  console.log("preparing index...");
  res.render('index');
});

app.get('/settings', (req, res) => {
  res.send(gameSettings);
});

//socket & game variables setup
var io = socket(server);

//connect to socket.io
io.on('connection', function (socket) {
  console.log("connected new socket");


  //create function to send status
  sendStatus = function (s) {
    socket.emit('status', s);
  }


  socket.on('new connection', function (data, callback) {

    if (!detailesAreValid(data.userName, data.userPassword)) {
      callback(false, 'ID');
      console.log("error in login");
    } else {
      console.log("success in login");
      callback(true);
      // additional info on the socket
      socketIdToName[socket.id] = data.userName;
      connectedUsers[data.userName] = socket.id;
      UserMessages[data.userName] = [["System", "Welcome to secret chat,please speak politely."]];

      //Emit the messages

      io.sockets.emit('update connected users', { connectedUsers: Object.keys(connectedUsers) });

      // socket.emit('output', { Messages: UserMessages[data.userName] });
      console.log("connected users output:");
      console.log(Object.keys(connectedUsers));
    }
  });



  // socket.on('request for chat messages', function (data) {
  //   console.log("data.with:");
  //   console.log(data.with);

  //   socket.emit('output', { Messages: UserMessages[socketIdToName[socket.id]] });
  //   io.sockets.connected[connectedUsers[data.with]].emit('output', { Messages: UserMessages[data.with] });
  // });



  //Handle input events
  socket.on('input', function (data) {
    let theMessage = data.message;


    //Check for name and message
    if (theMessage == '') {
      //Send error status
      sendStatus('Please enter a message');
    } else {
      //Insert message

      console.log("data.from:");
      console.log(data.from);
      console.log("data.to:");
      console.log(data.to);

      let newMessageBlock = [data.from, theMessage];
      UserMessages[data.from].push(newMessageBlock);
    
      UserMessages[data.to].push(newMessageBlock);

      socket.emit('new message', {message:[newMessageBlock],from:data.from});
      io.sockets.connected[connectedUsers[data.to]].emit('new message', {message:[newMessageBlock],from:data.from});

      //send status object
      sendStatus({
        message: 'Message sent',
        clear: true
      })

    }
  });

  //Handle clear
  socket.on('clear', function (data) {
    //Remove all chats from collection
    UserMessages[socket.id] = [];
    socket.emit('cleared');

  });

  socket.on('disconnect', (data) => {

    if (socketIdToName[socket.id] in connectedUsers) {
      delete connectedUsers[socketIdToName[socket.id]];
    }

    if (socket.id in socketIdToName) {
      delete socketIdToName[socket.id];
    }

    io.sockets.emit('update connected users', { connectedUsers: Object.keys(connectedUsers) });

  });

});






