const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');

const Board = require('./models/Board.js');


const app = express();
const server = http.createServer(app);
const sockets = socketio(server);

app.use('/TokenImages', express.static(__dirname + '/../TokenImages'));
app.use(express.static('./../front', {index: "./../front/views/board/index.html"}))

// app.use('/static', express.static(__dirname + '/TokenImages'));

const observers = [];
var files = {},
struct = {
  name: null,
  type: null,
  size: 0,
  data: [],
  slice: 0,
};

function notifyAll(name, data) {
  for (var i = 0; i < observers.length; i++) {
    observers[i].emit(name, data)
  }
}

const token_dict = {}
let board = null;

sockets.on("connection", (socket) => {
  let playerId = socket.id;
  console.log("Player id = ", playerId);
  observers.push(socket);

  socket.emit('setup', {token_dict});

  notifyAll('jogador-conectado', {playerId:playerId});

  socket.on('start-new-board', () => {

    if (!board) {
      board = new Board();
    }
    console.log('start-board', board);
    notifyAll('get-board-reply', {board});
  })

  socket.on('get-board', () => {
    console.log('get-board', board);
    socket.emit('get-board-reply', {
      board
    })
  })

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

  socket.on('undraw-token', (data) => {
    delete token_dict[data.token.name].position;
    console.log('Undraw data',data);
    data.playerId = playerId;
    notifyAll('undrawn-token', data)
  })

  socket.on('aplicar-efeito-em-token', (data) => {
    let alvo = token_dict[data.token_alvo.name];
    console.log('Alvo', alvo);
    console.log('efeito', data.efeito)
  });

  socket.on('token-image-slice-upload', (data) => {
    if (!files[data.name]) {
      files[data.name] = Object.assign({}, struct, data);
      files[data.name].data = [];
    }

    //convert the ArrayBuffer to Buffer
    data.data = new Buffer.from(new Uint8Array(data.data));
    //save the data
    files[data.name].data.push(data.data);
    files[data.name].slice++;

    if (files[data.name].slice * 100000 >= files[data.name].size) {
      var fileBuffer = Buffer.concat(files[data.name].data);

      fs.writeFile('./../TokenImages/'+data.name, fileBuffer, (err) => {
          delete files[data.name];
          if (err) return socket.emit('token-image-upload-error', err);


          socket.emit('token-image-end-upload', {
            path: './../TokenImages/'+data.name
          });
          console.log('imagem salva');
      });




    } else {
      socket.emit('request-token-image-slice-upload', {
        currentSlice: files[data.name].slice
      });
    }
  });

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
