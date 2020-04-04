angular.module('RPJogo').controller('MainController', ($scope, $rootScope) => {

  $scope.gridInfo = {
    n_linhas : 30
    , n_colunas: 60
    , hex_radius : 20
    , text : {
      fontSize : 10
      , fontFamily : 'Calibri'
      , fill : 'black'
    },
    teams : [
      {
        name : "aliados",
        color : "#54C6BE"
      },
      {
        name : "inimigos",
        color : "#E5243F"
      },
      {
        name : "neutros",
        color : "#F7B15C"
      },
    ]

  }

  $scope.formEnabled = false

  $scope.newTokenCreateOnClick = function () {
    $scope.formEnabled = true
  }

  $scope.newToken = {
    name : 'teste',
    color : '#00ff00',
    token_image : './../../TokenImages/dragon.png',
  };



  $scope.token_dict = {}

  $scope.isEmpty = function (obj) {
    return Object.keys($scope.token_dict).length === 0;
  }



  $scope.img_src = './../../TokenImages/dragon.png';
  $scope.changed_src = function (input) {
    let file_input = document.querySelector('#imageFile');
    $scope.img_src = './../../TokenImages/' + file_input.files[0].name
    console.log($scope.img_src);
    $scope.newToken.token_image = $scope.img_src;
    $scope.$apply()
  }

  $scope.startZoomInStage = function () {
    var scaleBy = 1.1;
      $scope.stage.on('wheel', e => {
        e.evt.preventDefault();
        var oldScale = $scope.stage.scaleX();

        var mousePointTo = {
          x: $scope.stage.getPointerPosition().x / oldScale - $scope.stage.x() / oldScale,
          y: $scope.stage.getPointerPosition().y / oldScale - $scope.stage.y() / oldScale
        };

        var newScale =
          e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        newScale = newScale > 5 ? 5 : newScale
        newScale = newScale < 1 ? 1 : newScale
        $scope.stage.scale({ x: newScale, y: newScale });

        var newPos = {
          x:
            -(mousePointTo.x - $scope.stage.getPointerPosition().x / newScale) *
            newScale,
          y:
            -(mousePointTo.y - $scope.stage.getPointerPosition().y / newScale) *
            newScale
        };

        $scope.stage.position(newPos);
        $scope.stage.batchDraw();
      });

  }

  $scope.indexToPosition = function (x, y) {
    let distance_x = Math.sqrt($scope.gridInfo.hex_radius**2 * 3 / 4) * 2;
    let distance_y = (3/4 * $scope.gridInfo.hex_radius) * 2;
    let base_step_x = y%2 !=0 ? 0 :  distance_x/2;

    let pos_x = x * distance_x + base_step_x;
    let pos_y = y * distance_y;

    return [pos_x, pos_y]
  }

  $scope.getRelativePointerPosition = function(node) {
    // the function will return pointer position relative to the passed node
    var transform = node.getAbsoluteTransform().copy();
    // to detect relative position we need to invert transform
    transform.invert();

    // get pointer (say mouse or touch) position
    var pos = node.getStage().getPointerPosition();

    // now we find relative point
    return transform.point(pos);
  }

  $scope.initGrid = function () {
    $scope.stage = new Konva.Stage({
      container: 'container',
      // width: window.innerWidth *2,
      // height: window.innerHeight *2,
      width: $scope.gridInfo.n_colunas * $scope.gridInfo.hex_radius,
      height: $scope.gridInfo.n_linhas * $scope.gridInfo.hex_radius,
      scaleX : 1,
      scaleY : 1,
      // draggable :true,
    });

    $scope.grid_layer = new Konva.Layer();
    $scope.tokens_layer = new Konva.Layer();
    $scope.labels_layer = new Konva.Layer({
      listening : false
    });
    $scope.tooltips_layer = new Konva.Layer({
      listening : false
    });
    $scope.drawGrid();
    $scope.stage.add($scope.grid_layer);
    $scope.stage.add($scope.tokens_layer);
    $scope.stage.add($scope.labels_layer);
    $scope.stage.add($scope.tooltips_layer);
    $scope.startZoomInStage();

  }

  $scope.drawGrid = function () {



    $scope.hexagons = []
    for (var i = 0; i < $scope.gridInfo.n_linhas; i++) {
      let linha = []


      for (var j = 0; j < $scope.gridInfo.n_colunas; j++) {
        let hexagon = {}
        let position = $scope.indexToPosition(j, i);
        hexagon['img_ref'] = new Konva.RegularPolygon({
          x: position[0],
          y: position[1],
          sides: 6,
          radius: $scope.gridInfo.hex_radius,
          stroke: 'black',
          strokeWidth: 1,
          name : j+"_"+i
        });

        hexagon['img_ref'].on('click', function(){
          // this.fill('green')
          // $scope.grid_layer.draw()
          // console.log(this.name());

          $scope.hexOnClick(this.name())
        })

        linha.push(hexagon);
        $scope.grid_layer.add(hexagon['img_ref']);
      }
      $scope.hexagons.push(linha)
    }



    // add the $scope.grid_layer to the $scope.stage

    // $scope.setListeners()
  }

  // $scope.drawTokens = function () {
  //
  //   let hexagon = {}
  //   let x_index = $scope.newToken.x, y_index = $scope.newToken.y;
  //   let position = $scope.indexToPosition( x_index, y_index);
  //   hexagon['img_ref'] = new Konva.RegularPolygon({
  //     x: position[0],
  //     y: position[1],
  //     sides: 6,
  //     radius: $scope.gridInfo.hex_radius,
  //     fill : 'blue',
  //     stroke: 'red',
  //     strokeWidth: 1,
  //     name : y_index+"_"+x_index
  //   });
  //
  //   hexagon['img_ref'].on('mouseenter', function() {
  //     $scope.stage.container().style.cursor = 'pointer';
  //   });
  //
  //   hexagon['img_ref'].on('mouseleave', function() {
  //     $scope.stage.container().style.cursor = 'default';
  //   });
  //   hexagon['img_ref'].on('click', function(){
  //     let [x,y] = this.name().split('_').map((element) => parseInt(element))
  //     console.log("Clicked", x, y);
  //     if ($scope.selectedToken) {
  //       $scope.selectedToken.fill('blue')
  //     }
  //     $scope.selectedToken = this;
  //     this.fill('green');
  //     $scope.tokens_layer.draw()
  //     $scope.$apply()
  //   })
  //   $scope.tokens_layer.add(hexagon['img_ref'])
  //
  //
  // }

  $scope.drawNewToken = function (x_index, y_index) {

    let token = {}
    let position = $scope.indexToPosition( x_index, y_index);

    token['img_ref'] = new Konva.RegularPolygon({
      x: position[0],
      y: position[1],
      sides: 6,
      radius: $scope.gridInfo.hex_radius,
      fill : $scope.newToken.color,
      stroke: 'blue',
      strokeWidth: 1,
      name : $scope.newToken.name
    });

    token['img_ref'].on('mouseenter', function(ev) {

      // let tooltip = $scope.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
      // tooltip.visible(true)
      // $scope.tooltips_layer.draw()

      if (ev.evt.ctrlKey) {
        $scope.sword_cursor_enabled = true;
        $scope.$apply()
        // console.log($scope.sword_cursor_enabled);
      }
      else {
        // $scope.stage.container().style.cursor = 'pointer';
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
        let tooltip = $scope.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
        var mousePos = $scope.getRelativePointerPosition($scope.stage);
        tooltip.x(mousePos.x);
        tooltip.y(mousePos.y-10);
        tooltip.visible(true);
        $scope.tooltips_layer.draw();
      }
    });

    token['img_ref'].on('mouseleave', function(ev) {

      let tooltip = $scope.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
      tooltip.visible(false)
      $scope.tooltips_layer.draw()
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
          $scope.selectedToken.stroke('blue')
        }
        $scope.selectedToken = this;
        this.stroke('red');
        $scope.tokens_layer.draw()
        $scope.$apply()
      }


    })
    $scope.tokens_layer.add(token['img_ref']);
    $scope.tokens_layer.draw()


    token['text_ref'] = new Konva.Text({
      x: position[0],
      y: position[1],
      text: $scope.newToken.name,
      align: 'center',
      verticalAlign: 'middle',
      fontSize: $scope.gridInfo.text.fontSize,
      fontFamily: $scope.gridInfo.text.fontFamily,
      fill: $scope.gridInfo.text.fill,
      name : $scope.newToken.name + "_label"
    });
    token['text_ref'].x(token['text_ref'].x() - token['text_ref'].getWidth()/2)
    token['text_ref'].y(token['text_ref'].y() - token['text_ref'].getHeight()/2)
    $scope.labels_layer.add(token['text_ref'])
    $scope.labels_layer.draw()

    var tooltip = new Konva.Label({
        x: position[0],
        y: position[1],
        opacity: 1,
        name : $scope.newToken.name + "_tooltip"
      });

    tooltip.add(
      new Konva.Tag({
        fill: 'black',
        pointerDirection: 'down',
        pointerWidth: 10,
        pointerHeight: 10,
        lineJoin: 'round',
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffsetX: 10,
        shadowOffsetY: 10,
        shadowOpacity: 1
      })
    );


    var cardImageObj = new Image();
    cardImageObj.onload = function() {
      var card_border = new Konva.Image({
        x: -32,
        y: -90,
        image: cardImageObj,
        width: 64,
        height: 90
      });

      // add the shape to the layer
      tooltip.add(card_border);
      $scope.tooltips_layer.batchDraw();
    };
    cardImageObj.src = './../static/card.png';


    var tokenImageObj = new Image();
    tokenImageObj.onload = function() {
      var token_img = new Konva.Image({
        x: -32,
        y: -88,
        image: tokenImageObj,
        width: 64,
        height: 88
      });

      // add the shape to the layer
      tooltip.add(token_img);
      token_img.moveDown()
      $scope.tooltips_layer.batchDraw();
    };
    tokenImageObj.src = $scope.newToken.token_image;




    token['tooltip_ref'] = tooltip;

    $scope.tooltips_layer.add(token['tooltip_ref']);
    $scope.tooltips_layer.draw()

    console.log('tooltip', tooltip);

    return token

  }

  $scope.drawTooltip = function () {
    var tooltip = new Konva.Label({
        x: 170,
        y: 75,
        opacity: 0.75
      });

      tooltip.add(
        new Konva.Tag({
          fill: 'black',
          pointerDirection: 'down',
          pointerWidth: 10,
          pointerHeight: 10,
          lineJoin: 'round',
          shadowColor: 'black',
          shadowBlur: 10,
          shadowOffsetX: 10,
          shadowOffsetY: 10,
          shadowOpacity: 0.5
        })
      );

      tooltip.add(
        new Konva.Text({
          text: 'Tooltip pointing down',
          fontFamily: 'Calibri',
          fontSize: 18,
          padding: 5,
          fill: 'white'
        })
      );
  }

  $scope.hexOnClick = function (name) {
    let [x, y] = name.split('_');
    console.log("X: ", x, "Y: ", y);

    if ($scope.selectedToken) {

      $scope.last_clicked = x +'-'+y;

      let [posX, posY] = $scope.indexToPosition(x, y)
      $scope.selectedToken.x(posX);
      $scope.selectedToken.y(posY);
      let label = $scope.labels_layer.find('.'+$scope.selectedToken.name()+"_label")[0];
      // console.log('getwidth', label.getWidth());
      label.x(posX - label.getWidth()/2);
      label.y(posY - label.getHeight()/2);
      console.log(label);

      $scope.selectedToken.stroke('blue');
      $scope.selectedToken = null;


      $scope.tokens_layer.draw();
      $scope.labels_layer.draw();



      $scope.$apply();
    }
    if($scope.place_cursor_enabled){
      $scope.place_cursor_enabled = false;
      $scope.formEnabled = false;
      $scope.newToken.token_refs = $scope.drawNewToken(x, y);
      console.log('new token', $scope.newToken);
      $scope.token_dict[($scope.newToken.name)] = $scope.newToken;
      $scope.newToken = {
        color : '#00ff00',
        token_image : './../../TokenImages/dragon.png',
      };
      $scope.$apply()



    }

  }

  $scope.scaleOnChange = function(scale){
    $scope.gridSetScale(scale);
  }

  $scope.placeNewTokenOnClick = function () {
    console.log('drawTokensOnClick');
    // alert('Clique em um hexágono para inserir o token criado')
    $scope.place_cursor_enabled = true;
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


  $scope.removeTokenOnClick = function (token) {
    token.token_refs.img_ref.destroy()
    token.token_refs.tooltip_ref.destroy()
    token.token_refs.text_ref.destroy()

    delete $scope.token_dict[token.name];
    $scope.stage.draw()
    // $scope.$apply()
  }
  $scope.gridSetScale = function (scale) {
    $scope.stage.scaleX(scale);
    $scope.stage.scaleY(scale);
    $scope.stage.draw()
  }

  $scope.setHexColor = function(cor){
    console.log(cor);
    $scope.hexagon.fill(cor);
    $scope.grid_layer.draw()
  }

})
