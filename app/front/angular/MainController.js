angular.module('RPJogo').controller('MainController', ($scope, $rootScope) => {

  $scope.gridInfo = {
    n_linhas : 30
    , n_colunas: 30
    , hex_radius : 20

  }




  $scope.indexToPosition = function (x, y) {
    let distance_x = Math.sqrt($scope.gridInfo.hex_radius**2 * 3 / 4) * 2;
    let distance_y = (3/4 * $scope.gridInfo.hex_radius) * 2;
    let base_step_x = y%2 !=0 ? 0 :  distance_x/2;

    let pos_x = x * distance_x + base_step_x;
    let pos_y = y * distance_y;

    return [pos_x, pos_y]
  }

  $scope.initGrid = function () {
    $scope.stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth / 2,
      height: window.innerHeight / 2,
      scaleX : 1,
      scaleY : 1
    });

    $scope.grid_layer = new Konva.Layer();
    $scope.tokens_layer = new Konva.Layer();
    $scope.drawGrid();
    $scope.stage.add($scope.grid_layer);
    $scope.stage.add($scope.tokens_layer);

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
          stroke: 'red',
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

  $scope.drawTokens = function () {

    let hexagon = {}
    let x_index = $scope.newToken.x, y_index = $scope.newToken.y;
    let position = $scope.indexToPosition( x_index, y_index);
    hexagon['img_ref'] = new Konva.RegularPolygon({
      x: position[0],
      y: position[1],
      sides: 6,
      radius: $scope.gridInfo.hex_radius,
      fill : 'blue',
      stroke: 'red',
      strokeWidth: 1,
      name : y_index+"_"+x_index
    });
    hexagon['img_ref'].on('click', function(){
      // this.fill('green')
      // $scope.grid_layer.draw()
      // console.log(this.name());
      $scope.hexOnClick(this.name())
    })
    $scope.tokens_layer.add(hexagon['img_ref'])


  }

  $scope.hexOnClick = function (name) {
    let [x, y] = name.split('_');
    console.log("X: ", x, "Y: ", y);
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
