angular.module('RPJogo').controller('MainController', ($scope, $rootScope) => {

  $scope.gridInfo = {
    n_linhas : 30
    , n_colunas: 60
    , hex_radius : 20
    , text : {
      fontSize : 10
      , fontFamily : 'Calibri'
      , fill : 'red'
    }

  }

  $scope.newToken = {
    color : '#00ff00',
  };

  $scope.token_dict = {}


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
      let tooltip = $scope.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
      var mousePos = $scope.getRelativePointerPosition($scope.stage);
      tooltip.x(mousePos.x);
      tooltip.y(mousePos.y);
      tooltip.visible(true);
      $scope.tooltips_layer.draw();

      if (ev.evt.ctrlKey) {
        $scope.sword_cursor_enabled = true;
        $scope.$apply()
        // console.log($scope.sword_cursor_enabled);
      }
      else {
        // $scope.stage.container().style.cursor = 'pointer';
      }
    });

    token['img_ref'].on('mouseleave', function(ev) {

      let tooltip = $scope.tooltips_layer.find('.'+this.name()+"_tooltip")[0];
      tooltip.visible(false)
      $scope.tooltips_layer.draw()
      $scope.sword_cursor_enabled = false;
      $scope.$apply()
      // console.log($scope.sword_cursor_enabled);

    });
    token['img_ref'].on('click', function(ev){
      // let [x,y] = this.name().split('_').map((element) => parseInt(element))
      // console.log("Clicked", this.name());
      // console.log("Event", ev);

      if (ev.evt.ctrlKey) {
        alert('ataque registrado')
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
        opacity: 0.75,
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
        shadowOpacity: 0.5
      })
    );

    tooltip.add(
      new Konva.Text({
        text: 'CA: '+$scope.newToken.ca+'\nHP: '+$scope.newToken.hp_max+'\nMov: '+ +$scope.newToken.mov,
        fontFamily: 'Calibri',
        fontSize: 12,
        padding: 5,
        fill: 'white'
      })
    );

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
    if($scope.newToken.name){
      $scope.newToken.token_refs = $scope.drawNewToken(x, y);
      console.log($scope.newToken);
      $scope.token_dict[($scope.newToken.name)] = $scope.newToken;
      $scope.newToken = {
        color : '#00ff00',
      };
      $scope.$apply()



    }

  }

  $scope.scaleOnChange = function(scale){
    $scope.gridSetScale(scale);
  }

  $scope.drawTokensOnClick = function () {
    console.log('drawTokensOnClick');
    $scope.drawTokens();
    $scope.tokens_layer.moveToTop();

    $scope.tokens_layer.draw();

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
