
const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
var socket = require('socket.io')
var fs = require('fs');

//fetch users from 'database'

var data = fs.readFileSync('users.json');
var users = JSON.parse(data);//key:user name, value:password

var socketIdToName = {};//aux to find name by socket id
var connectedUsers = {};//aux to find connected users:key-name,value-socket id
var UserMessages = {};//aux to find user's messages along the chat


//func checks if the login detailes are valid
var detailesAreValid = function (name, password) {
  if (name in users) {
    if (users[name] == password) {
      return true;
    }
  } else {
    return false;
  }
}




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


//socket & game variables setup
var io = socket(server);

//connect to socket.io
io.on('connection', function (socket) {
  console.log("connected new socket");

//Handle new login request
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


  //Handle input events
  socket.on('input', function (data) {
    let theMessage = data.message;


    //Check for name and message
    if (!theMessage == '') {

      //Insert message


      let newMessageBlock = [data.from, theMessage];
      UserMessages[data.from].push(newMessageBlock);
      UserMessages[data.to].push(newMessageBlock);

      socket.emit('new message', { message: [newMessageBlock], from: data.from });
      io.sockets.connected[connectedUsers[data.to]].emit('new message', { message: [newMessageBlock], from: data.from });



    }
  });

  //Handle clear
  socket.on('clear', function (data) {
    //Remove all chats from collection
    UserMessages[socket.id] = [];
    socket.emit('cleared');

  });

  //Handle socket disconnect

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






