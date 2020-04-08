angular.module('RPJogo').controller('MainController', ($scope, $rootScope) => {


  //  ------------------ Config --------------


  angular.element(document).ready(function () {
      $scope.startController()
  });


  $scope.startControllVar = function () {
    $scope.token_dict = {}
    $scope.token_in_form = {
      name : 'teste',
      color : '#00ff00',
      token_image : './../../TokenImages/dragon.png',
    };
    $scope.tokenFormControll = {

      enabled : false,
      isNew : true,
      imageControll : {
        loaded_fraction : 0,
        fileReader : new FileReader(),
        MAX_BITES_ON_UPLOAD : 100000,
        imageLoaded : false,
      },
      validName(name) {
        if (name in $scope.token_dict) {
          return false
        }
        return true
      },
      isValid(){
        if (this.isNew && !this.validName($scope.token_in_form.name) ) {
          return false
        }
        if (this.imageControll.loaded_fraction != 100) {
          return false
        }
        return true
      },
      clear(){
        $scope.token_in_form = {
          color : '#00ff00',
        };
        this.imageControll.imageLoaded = false
        this.imageControll.loaded_fraction = 0
        angular.element( document.querySelector( '#new-token-modal' ) ).modal('hide');
      },

    }
    $scope.boardControll = {
      placeholder : {
        enabled : true
      },
      container : {
        enabled : false
      },
      menubar : {
        enabled : false
      },
      boardShow(){
        this.menubar.enabled = true;
        this.container.enabled = true;
        this.placeholder.enabled = false;
        $scope.$apply();
      }

    }
    $scope.activeActionOnHexClick = null;
    $scope.form_img_src = null;

  }
  $scope.startServerConnection = function () {
    $rootScope.socket = io();

    $rootScope.socket.on("connect", () => {
      console.log("Player id = ", $rootScope.socket.id);
    })

    $rootScope.socket.on("setup", (data) => {
      console.log('setup received');
      $scope.token_dict = data.token_dict;

    })

    $rootScope.socket.on('jogador-conectado', (data) => {
      if ($rootScope.socket.id !== data.playerId) {

        console.log("Novo jogador conectado: " , data);
      }
    });

    $rootScope.socket.on('get-board-reply', (data) => {
      console.log('get-board-reply', data.board);
      if (data.board) {

        $scope.boardControll.boardShow()
        // $scope.$apply();
        $scope.boardOnceReady(data);
        for (var key in $scope.token_dict) {
          let value = $scope.token_dict[key]
          if (value.position) {
            $scope.placeToken(value.position.x, value.position.y, value)
          }
        }
        $scope.$apply();
      }
      else {
        console.log('Não há um board carregado');
      }
    });

    $rootScope.socket.on('new-token', (data) => {
      if ($rootScope.socket.id !== data.playerId) {

        console.log("Novo Token inserido: ", data.newToken);
        $scope.token_dict[data.newToken.name] = data.newToken;
        $scope.$apply()
      }
    });

    $rootScope.socket.on('saved-token', (data) => {
      if ($rootScope.socket.id !== data.playerId) {

        console.log("Token Editado: ", data.token);
        $scope.saveToken(data.token)
        $scope.$apply()
      }
    });

    $rootScope.socket.on('placed-token', (data) => {
      if ($rootScope.socket.id !== data.playerId) {
        $scope.placeToken(data.position.x, data.position.y, data.token);
        $scope.$apply();
      }
    });

    $rootScope.socket.on('moved-token', (data) => {
      if ($rootScope.socket.id !== data.playerId) {
        console.log('moved-token');
        let token = $scope.token_dict[data.token.name]
        $scope.moveToken(data.newPosition.x, data.newPosition.y, token)
      }
    });

    $rootScope.socket.on('undrawn-token', (data) => {
      if ($rootScope.socket.id !== data.playerId) {
        console.log('undraw-token: ', data.token.name);
        let token = $scope.token_dict[data.token.name]
        $scope.destroyReferencesFromToken(token);
        $scope.boardRender.stage.draw();
        $scope.$apply()
      }
    });

    $rootScope.socket.on('request-token-image-slice-upload', (data) => {
      var place = data.currentSlice * 100000,
      slice = $scope.file_to_upload.slice(place, place + Math.min(100000, $scope.file_to_upload.size - place));
      $scope.tokenFormControll.imageControll.loaded_fraction = place / $scope.file_to_upload.size * 100;
      console.log('loaded fraction',$scope.tokenFormControll.imageControll.loaded_fraction);
      $scope.$apply();
      $scope.tokenFormControll.imageControll.fileReader.readAsArrayBuffer(slice);
    });

    $rootScope.socket.on('token-image-end-upload', (data) => {
      console.log('token-image-end-upload', data);
      $scope.tokenFormControll.imageControll.loaded_fraction = 100;
      $scope.form_img_src = data.path;
      $scope.token_in_form.token_image = $scope.form_img_src;
      $scope.tokenFormControll.imageLoaded = true;
      $scope.$apply();
    })

    $rootScope.socket.on('token-image-upload-error', (err) => {
      console.log(err);
    })
  }
  $scope.startController = function () {
    // $scope.startControllVar();
    $scope.startServerConnection();

    $scope.initGrid();
  }

  $scope.initGrid = function () {

    $scope.requestBoard();



  }

  //  ------------------ User Interactions --------------

  $scope.newBoardOnClick = function () {
    console.log('creating new board');
    $rootScope.socket.emit('start-new-board');
  }
  $scope.hexOnClick = function (name) {
    let [x, y] = name.split('_');
    console.log("X: ", x, "Y: ", y);
    $scope.actionDictOnHexClick[$scope.activeActionOnHexClick](x, y);

  }
  $scope.redrawTokenOnClick = function (token) {
    $scope.token_to_draw = token;
    $scope.place_cursor_enabled = true;
    $scope.activeActionOnHexClick = 'placeClick'
  }
  $scope.editTokenOnClick = function (token) {
    if (token.token_refs) {
      $scope.destroyReferencesFromToken(token);
      $scope.boardRender.stage.draw();
    }
    $scope.token_in_form = token;
    $scope.token_in_form.old_name = token.name;
    $scope.tokenFormControll.isNew = false;
    $scope.tokenFormControll.enabled = true;
  }
  $scope.removeTokenOnClick = function (token) {
    $scope.destroyReferencesFromToken(token)

    $rootScope.socket.emit('undraw-token', {token})

    $scope.boardRender.stage.draw()
    // $scope.$apply()
  }
  $scope.saveTokenOnClick = function () {

    $scope.saveToken($scope.token_in_form)

    $rootScope.socket.emit('save-token', {token : $scope.token_in_form});
    $scope.tokenFormControll.enabled = false;
    $scope.tokenFormControll.clear();



  }
  $scope.saveNewTokenOnClick = function () {
    $rootScope.socket.emit('new-token', $scope.token_in_form);
    console.log('save new token on click');
    $scope.token_dict[$scope.token_in_form.name] = $scope.token_in_form;



    $scope.tokenFormControll.enabled = false;
    $scope.tokenFormControll.clear();


  }
  // $scope.scaleOnChange = function(scale){
  //   $scope.gridSetScale(scale);
  // }
  $scope.placeNewTokenOnClick = function () {
    $scope.token_to_draw = $scope.token_in_form
    console.log('drawTokensOnClick');
    // alert('Clique em um hexágono para inserir o token criado')
    $scope.place_cursor_enabled = true;
    $scope.activeActionOnHexClick = 'placeClick'
    // $scope.$apply()

  }
  $scope.newTokenCreateOnClick = function () {
    $scope.tokenFormControll.enabled = true;
    $scope.tokenFormControll.isNew = true;

  }
  $scope.imgSrcOnChange = function (input) {
    let file_input = document.querySelector('#imageFile');
    // $scope.form_img_src = './../../TokenImages/' + file_input.files[0].name
    $scope.file_to_upload  = file_input.files[0];
    console.log('file_input', input.files);
    $scope.uploadImage()
    $scope.$apply()
  }


  //  ------------------ Funções Internas --------------


  $scope.isEmpty = function (obj) {
    return Object.keys($scope.token_dict).length === 0;
  }
  $scope.destroyReferencesFromToken = function (token) {
    token.token_refs.img_ref.destroy()
    token.token_refs.tooltip_ref.destroy()
    token.token_refs.text_ref.destroy()
    delete $scope.token_dict[token.name].token_refs;
  }
  $scope.uploadImage = function () {

    slice = $scope.file_to_upload.slice(0, $scope.tokenFormControll.imageControll.MAX_BITES_ON_UPLOAD);

    var re_extension = /(?:\.([^.]+))?$/;

    $scope.tokenFormControll.imageControll.fileReader.readAsArrayBuffer(slice);
    $scope.tokenFormControll.imageControll.fileReader.onload = (evt) => {
      var arrayBuffer = $scope.tokenFormControll.imageControll.fileReader.result;
      $rootScope.socket.emit('token-image-slice-upload', {
        name: $scope.token_in_form.name + re_extension.exec($scope.file_to_upload.name)[0],
        type: $scope.file_to_upload.type,
        size: $scope.file_to_upload.size,
        data: arrayBuffer
      });
    }
  }
  $scope.saveToken = function (token) {
    if (!(token.name in $scope.token_dict)) {
      console.log('aopa');
      delete $scope.token_dict[token.old_name];

      // $scope.$apply()
    }
    $scope.token_dict[token.name] = token;
  }
  $scope.placeToken = function (x, y, token) {
    token.token_refs = $scope.drawNewToken(x, y, token);
    console.log('new token', token);
    $scope.token_dict[(token.name)] = token;

  }
  $scope.moveToken = function (x, y, token) {
    let [posX, posY] = $scope.boardRender.indexToPosition(x, y)
    token.token_refs['img_ref'].x(posX);
    token.token_refs['img_ref'].y(posY);
    let label = token.token_refs['text_ref']
    // console.log('getwidth', label.getWidth());
    label.x(posX - label.getWidth()/2);
    label.y(posY - label.getHeight()/2);
    console.log(label);

    token.token_refs['img_ref'].stroke('blue');



    $scope.boardRender.tokens_layer.draw();
    $scope.boardRender.labels_layer.draw();

    $scope.$apply();
  }
  $scope.ataqueRegistrado = function (name) {
    let dano = prompt("Insira o dano", "1");
    let alvo = $scope.token_dict[name]
    alvo.hp_max -= dano;
    $scope.$apply();

    $rootScope.socket.emit('aplicar-efeito-em-token', {
      efeito : {
        tipo : 'dano',
        valor : dano
      },
      token_alvo : {
        name : alvo.name
      }
    });
  }
  $scope.healRegistrado = function (name) {
    let heal = prompt("Insira o heal", "1")
    $scope.token_dict[name].hp_max = parseInt(heal) + parseInt($scope.token_dict[name].hp_max);
    $scope.$apply()
  }
  $scope.requestBoard = function () {
    $rootScope.socket.emit('get-board');
  }


  //  ------------------ BoardRender --------------

  $scope.actionDictOnHexClick = new Proxy({

    moveClick(x, y){
      $scope.last_clicked = x +'-'+y;

      $scope.moveToken(x, y, $scope.selectedToken)

      $rootScope.socket.emit('move-token', {
        newPosition : {x, y}
        , token : $scope.selectedToken
      })

      $scope.selectedToken = null;



      $scope.activeActionOnHexClick = null;
    },
    placeClick(x, y){
      $scope.place_cursor_enabled = false;
      $scope.tokenFormControll.enabled = false;
      $scope.placeToken(x, y, $scope.token_to_draw);

      $rootScope.socket.emit('place-token', {
        token : $scope.token_to_draw
        , position : {x, y}
      });

      $scope.tokenFormControll.clear();
      $scope.$apply()
      $scope.activeActionOnHexClick = null;
    }

  }, {
    get : function (target, name) {
      return name in target ?
      target[name] :
      function (x, y) {
        console.log("No active action", x, y);
      }
    }
  });
  $scope.drawNewToken = function (x_index, y_index, token_to_draw) {

    let token = $scope.boardRender.drawNewToken(x_index, y_index, token_to_draw)

    $scope.setTokenMouseEvents(token);

    return token

  }
  $scope.setTokenMouseEvents = function (token) {
    token['img_ref'].on('mouseenter', function(ev) {

      if (ev.evt.ctrlKey) {
        $scope.sword_cursor_enabled = true;
        $scope.$apply()
        // console.log($scope.sword_cursor_enabled);
      }
      else {
        // $scope.boardRender.stage.container().style.cursor = 'pointer';
      }
    });
    token['img_ref'].on('mousemove', function(ev) {


      if (ev.evt.ctrlKey) {
        $scope.sword_cursor_enabled = true;
        $scope.$apply()
        // console.log($scope.sword_cursor_enabled);
      }
      else if (ev.evt.shiftKey) {
        $scope.heal_cursor_enabled = true;
        $scope.$apply()
        // console.log($scope.sword_cursor_enabled);
      }
      else {
        let tooltip = $scope.boardRender.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
        var mousePos = $scope.boardRender.getRelativePointerPosition($scope.boardRender.stage);
        tooltip.x(mousePos.x);
        tooltip.y(mousePos.y-10);
        tooltip.visible(true);
        $scope.boardRender.tooltips_layer.draw();
      }
    });
    token['img_ref'].on('mouseleave', function(ev) {

      let tooltip = $scope.boardRender.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
      tooltip.visible(false)
      $scope.boardRender.tooltips_layer.draw()
      $scope.sword_cursor_enabled = false;
      $scope.heal_cursor_enabled = false;
      $scope.$apply()
      // console.log($scope.sword_cursor_enabled);

    });
    token['img_ref'].on('click', function(ev){
      // let [x,y] = this.name().split('_').map((element) => parseInt(element))
      // console.log("Clicked", this.name());
      // console.log("Event", ev);

      if (ev.evt.ctrlKey) {
        $scope.ataqueRegistrado(this.name())
      }
      else if (ev.evt.shiftKey) {
        $scope.healRegistrado(this.name())
      }
      else{
        if ($scope.selectedToken) {
          $scope.selectedToken.token_refs['img_ref'].stroke('blue')
        }
        $scope.selectedToken = $scope.token_dict[this.name()];
        $scope.activeActionOnHexClick = 'moveClick';
        this.stroke('red');
        $scope.boardRender.tokens_layer.draw()
        $scope.$apply()
      }


    })
  }
  $scope.gridSetScale = function (scale) {
    $scope.boardRender.stage.scaleX(scale);
    $scope.boardRender.stage.scaleY(scale);
    $scope.boardRender.stage.draw()
  }
  $scope.startZoomInStage = function () {
    $scope.boardRender.startZoomInStage()

  }
  $scope.drawGrid = function () {



    $scope.hexagons = $scope.boardRender.drawGrid()

    $scope.hexagons.map((linha) => {
      linha.map((el) => {
        el['img_ref'].on('click', function(){
          $scope.hexOnClick(this.name())
        })
      })
    });




    // add the $scope.boardRender.grid_layer to the $scope.boardRender.stage

    // $scope.setListeners()
  }
  $scope.boardOnceReady = function (data) {
    $scope.boardRender = new BoardRender("container", data.board);

    $scope.drawGrid();

    $scope.startZoomInStage();
  }


})
