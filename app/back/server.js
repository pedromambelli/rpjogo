const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const sockets = socketio(server);

app.use('/TokenImages', express.static(__dirname + '/../TokenImages'));
app.use(express.static('./../front', {index: "./../front/views/index.html"}))

// app.use('/static', express.static(__dirname + '/TokenImages'));

const observers = [];

function notifyAll(name, data) {
  for (var i = 0; i < observers.length; i++) {
    observers[i].emit(name, data)
  }
}

const token_dict = {}


sockets.on("connection", (socket) => {
  let playerId = socket.id;
  console.log("Player id = ", playerId);
  observers.push(socket);

  socket.emit('setup', {token_dict});

  notifyAll('jogador-conectado', {playerId:playerId})

  socket.on('new-token', (newToken) => {
    console.log(newToken);

    token_dict[newToken.name] = newToken;

    notifyAll('new-token', {
      playerId : playerId,
      newToken : newToken,
    })
  })

  socket.on('save-token', (data) => {
    if (!(data.token.name in token_dict)) {
      delete token_dict[data.token.old_name];
      token_dict[data.token.name] = data.token;
    }
    data.playerId = playerId;
    notifyAll('saved-token', data)
  })

  socket.on('place-token', (data) => {
    delete data.token.token_refs;
    token_dict[data.token.name].position = data.position;
    console.log('place-token', data);
    data.playerId = playerId;
    notifyAll('placed-token', data)
  })

  socket.on('move-token', (data) => {
    delete data.token.token_refs;
    token_dict[data.token.name].position = data.newPosition;
    console.log('move-token', data);
    data.playerId = playerId;
    notifyAll('moved-token', data)
  })

})



server.listen(3000, () => {
  var ifaces = require('os').networkInterfaces();

  // Iterate over interfaces ...
  var adresses = Object.keys(ifaces).reduce(function (result, dev) {
    return result.concat(ifaces[dev].reduce(function (result, details) {
      return result.concat(details.family === 'IPv4' && !details.internal ? [details.address] : []);
    }, []));
  });

  // Print the result
  console.log(adresses)
})
