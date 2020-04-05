angular.module('RPJogo').controller('MainController', ($scope, $rootScope) => {



  $scope.startServerConnection = function () {
    $rootScope.socket = io();

    $rootScope.socket.on("connect", () => {
      console.log("Player id = ", $rootScope.socket.id);
    })

    $rootScope.socket.on("setup", (data) => {
      console.log('setup received');
      $scope.token_dict = data.token_dict;
      for (var key in $scope.token_dict) {
        let value = $scope.token_dict[key]
        if (value.position) {
          $scope.placeToken(value.position.x, value.position.y, value)
        }
      }
      $scope.$apply()
    })

    $rootScope.socket.on('jogador-conectado', (data) => {
      if ($rootScope.socket.id !== data.playerId) {

        console.log("Novo jogador conectado: " , data);
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
        $scope.placeToken(data.position.x, data.position.y, data.token)
      }
    });

    $rootScope.socket.on('moved-token', (data) => {
      if ($rootScope.socket.id !== data.playerId) {
        console.log('moved-token');
        let token = $scope.token_dict[data.token.name]
        $scope.moveToken(data.newPosition.x, data.newPosition.y, token)
      }
    });
  }


  $scope.formEnabled = false;

  $scope.formControll = {

    enabled : false,
    isNew : true,
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
      return true
    },
    clear(){
      $scope.token_in_form = {
        color : '#00ff00',
        token_image : './../../TokenImages/dragon.png',
      };
    },

  }

  $scope.newTokenCreateOnClick = function () {
    $scope.formControll.enabled = true;
    $scope.formControll.isNew = true;

  }

  $scope.token_in_form = {
    name : 'teste',
    color : '#00ff00',
    token_image : './../../TokenImages/dragon.png',
  };

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
      $scope.formControll.enabled = false;
      $scope.placeToken(x, y, $scope.token_to_draw);

      $rootScope.socket.emit('place-token', {
        token : $scope.token_to_draw
        , position : {x, y}
      });

      $scope.formControll.clear();
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

  $scope.activeActionOnHexClick = null;



  $scope.token_dict = {}

  $scope.isEmpty = function (obj) {
    return Object.keys($scope.token_dict).length === 0;
  }



  $scope.img_src = './../../TokenImages/dragon.png';
  $scope.changed_src = function (input) {
    let file_input = document.querySelector('#imageFile');
    $scope.img_src = './../../TokenImages/' + file_input.files[0].name
    console.log($scope.img_src);
    $scope.token_to_draw.token_image = $scope.img_src;
    $scope.$apply()
  }

  $scope.startZoomInStage = function () {
    $scope.grid_board.startZoomInStage()

  }




  $scope.initGrid = function () {

    $scope.startServerConnection();
    $scope.grid_board = new Board("container", n_colunas = 60 , n_linhas = 30 , hex_radius = 20);

    $scope.drawGrid();

    $scope.startZoomInStage();

  }

  $scope.drawGrid = function () {



    $scope.hexagons = $scope.grid_board.drawGrid()

    $scope.hexagons.map((linha) => {
      linha.map((el) => {
        el['img_ref'].on('click', function(){
          $scope.hexOnClick(this.name())
        })
      })
    });




    // add the $scope.grid_board.grid_layer to the $scope.grid_board.stage

    // $scope.setListeners()
  }



  $scope.drawNewToken = function (x_index, y_index, token_to_draw) {

    let token = $scope.grid_board.drawNewToken(x_index, y_index, token_to_draw)

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
        // $scope.grid_board.stage.container().style.cursor = 'pointer';
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
        let tooltip = $scope.grid_board.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
        var mousePos = $scope.grid_board.getRelativePointerPosition($scope.grid_board.stage);
        tooltip.x(mousePos.x);
        tooltip.y(mousePos.y-10);
        tooltip.visible(true);
        $scope.grid_board.tooltips_layer.draw();
      }
    });
    token['img_ref'].on('mouseleave', function(ev) {

      let tooltip = $scope.grid_board.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
      tooltip.visible(false)
      $scope.grid_board.tooltips_layer.draw()
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
        $scope.grid_board.tokens_layer.draw()
        $scope.$apply()
      }


    })
  }

  $scope.hexOnClick = function (name) {
    let [x, y] = name.split('_');
    console.log("X: ", x, "Y: ", y);
    $scope.actionDictOnHexClick[$scope.activeActionOnHexClick](x, y);

  }

  $scope.scaleOnChange = function(scale){
    $scope.gridSetScale(scale);
  }

  $scope.placeNewTokenOnClick = function () {
    $scope.token_to_draw = $scope.token_in_form
    console.log('drawTokensOnClick');
    // alert('Clique em um hexágono para inserir o token criado')
    $scope.place_cursor_enabled = true;
    $scope.activeActionOnHexClick = 'placeClick'
    // $scope.$apply()

  }

  $scope.ataqueRegistrado = function (name) {
    let dano = prompt("Insira o dano", "1")
    $scope.token_dict[name].hp_max -= dano;
    $scope.$apply()
  }

  $scope.healRegistrado = function (name) {
    let heal = prompt("Insira o heal", "1")
    $scope.token_dict[name].hp_max = parseInt(heal) + parseInt($scope.token_dict[name].hp_max);
    $scope.$apply()
  }

  $scope.redrawTokenOnClick = function (token) {
    $scope.token_to_draw = token;
    $scope.place_cursor_enabled = true;
    $scope.activeActionOnHexClick = 'placeClick'
  }
  $scope.editTokenOnClick = function (token) {
    if (token.token_refs) {
      $scope.destroyReferencesFromToken(token);
      $scope.grid_board.stage.draw();
    }
    $scope.token_in_form = token;
    $scope.token_in_form.old_name = token.name;
    $scope.formControll.isNew = false;
    $scope.formControll.enabled = true;
  }

  $scope.removeTokenOnClick = function (token) {
    $scope.destroyReferencesFromToken(token)
    // console.log('$scope.token_dict[token.name]',$scope.token_dict[token.name]);

    // delete $scope.token_dict[token.name];
    $scope.grid_board.stage.draw()
    // $scope.$apply()
  }

  $scope.saveTokenOnClick = function () {

    $scope.saveToken($scope.token_in_form)

    $rootScope.socket.emit('save-token', {token : $scope.token_in_form});
    $scope.formControll.enabled = false;
    $scope.formControll.clear();



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
    let [posX, posY] = $scope.grid_board.indexToPosition(x, y)
    token.token_refs['img_ref'].x(posX);
    token.token_refs['img_ref'].y(posY);
    let label = token.token_refs['text_ref']
    // console.log('getwidth', label.getWidth());
    label.x(posX - label.getWidth()/2);
    label.y(posY - label.getHeight()/2);
    console.log(label);

    token.token_refs['img_ref'].stroke('blue');



    $scope.grid_board.tokens_layer.draw();
    $scope.grid_board.labels_layer.draw();

    $scope.$apply();
  }

  $scope.saveNewTokenOnClick = function () {
    $rootScope.socket.emit('new-token', $scope.token_in_form);
    console.log('save new token on click');
    $scope.token_dict[$scope.token_in_form.name] = $scope.token_in_form;



    $scope.formControll.enabled = false;
    $scope.formControll.clear();


  }

  $scope.gridSetScale = function (scale) {
    $scope.grid_board.stage.scaleX(scale);
    $scope.grid_board.stage.scaleY(scale);
    $scope.grid_board.stage.draw()
  }

  $scope.destroyReferencesFromToken = function (token) {
    token.token_refs.img_ref.destroy()
    token.token_refs.tooltip_ref.destroy()
    token.token_refs.text_ref.destroy()
    delete $scope.token_dict[token.name].token_refs;
  }

})
