class BoardRender {
  constructor(container, board) {

    this.board = board
    this.n_colunas = board.n_colunas;
    this.n_linhas = board.n_linhas;
    this.hex_radius = board.hex_radius;
    this.text = {
      fontSize : 10
      , fontFamily : 'Calibri'
      , fill : 'black'
    };
    this.teams = board.teams;
    let limits = this.indexToPosition(board.n_colunas,board.n_linhas)

    this.stage = new Konva.Stage({
      container: container,
      width:  limits[0],
      height: limits[1],
      // width: this.board.n_colunas * this.board.hex_radius *4,
      // height: this.board.n_linhas * this.board.hex_radius *4,
      scaleX : 1,
      scaleY : 1,
      // draggable :true,
      // dragBoundFunc: function(pos) {
      //   let maxY = this.board.n_linhas * this.board.hex_radius * this
      //   var newY = pos.y < 0 - this.board.n_linhas * this.board.hex_radius ? 0 - this.board.n_colunas * this.board.hex_radius  : pos.y;
      //   var newX = pos.x < 0 ? 0 : pos.x;
      //   console.log('newY', newY);
      //   return {
      //     x: newX,
      //     y: newY
      //   };
      // }
    });

    this.grid_layer = new Konva.Layer();
    this.tokens_layer = new Konva.Layer();
    this.labels_layer = new Konva.Layer({
      listening : false
    });
    this.tooltips_layer = new Konva.Layer({
      listening : false
    });


    this.stage.add(this.grid_layer);
    this.stage.add(this.tokens_layer);
    this.stage.add(this.labels_layer);
    this.stage.add(this.tooltips_layer);
  }

  startZoomInStage(){

    let resize_timeout = setTimeout(() =>{
      this.stage.scaleX(1);
      this.stage.scaleY(1);
      this.stage.draw();
    }, 10);

    var scaleBy = 1.5;
      this.stage.on('wheel', e => {
        clearTimeout(resize_timeout)

        e.evt.preventDefault();
        var oldScale = this.stage.scaleX();
        console.log('old scale', this.stage.scaleX());
        var mousePointTo = {
          x: this.stage.getPointerPosition().x / oldScale - this.stage.x() / oldScale,
          y: this.stage.getPointerPosition().y / oldScale - this.stage.y() / oldScale
        };

        var newScale =
          e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        newScale = newScale > 5 ? 5 : newScale
        newScale = newScale < 1 ? 1 : newScale
        this.stage.scale({ x: newScale, y: newScale });

        let [maxX, maxY] = this.indexToPosition(this.board.n_colunas, this.board.n_linhas)


        var newPos = {
          x:
            -(mousePointTo.x - this.stage.getPointerPosition().x / newScale) *
            newScale,
          y:
            -(mousePointTo.y - this.stage.getPointerPosition().y / newScale) *
            newScale
        };

        // let newPos = this.getRelativePointerPosition(this.stage)

        newPos.x = newPos.x > 0 ? 0 : newPos.x;
        newPos.y = newPos.y > 0 ? 0 : newPos.y;



        newPos.x = newPos.x < -maxX ? -maxX : newPos.x;
        newPos.y = newPos.y < -maxY ? -maxY : newPos.y;

        console.log("newPos", newPos);
        console.log("maxX", this.board.n_colunas * newScale * this.board.hex_radius * 3 /4 );
        this.stage.position(newPos);

        // resize_timeout = setTimeout(() =>{
        //   this.stage.width(maxX*newScale);
        //   this.stage.height(maxY*newScale);
        //
        // }, 1000);

        this.stage.batchDraw();
      });
  }

  drawGrid(){
    let grid = []
    for (var i = 0; i < this.board.n_linhas; i++) {
      let linha = []


      for (var j = 0; j < this.board.n_colunas; j++) {
        let hexagon = {}
        let position = this.indexToPosition(j, i);
        hexagon['img_ref'] = new Konva.RegularPolygon({
          x: position[0],
          y: position[1],
          sides: 6,
          radius: this.board.hex_radius,
          stroke: 'black',
          strokeWidth: 1,
          name : j+"_"+i
        });



        linha.push(hexagon);
        this.grid_layer.add(hexagon['img_ref']);
      }
      grid.push(linha)
    }
    return grid
  }

  drawNewToken(x_index, y_index, newToken){
    let token = {}
    let position = this.indexToPosition( x_index, y_index);

    token['img_ref'] = new Konva.RegularPolygon({
      x: position[0],
      y: position[1],
      sides: 6,
      radius: this.board.hex_radius,
      fill : newToken.color,
      stroke: 'blue',
      strokeWidth: 1,
      name : newToken.name
    });


    this.tokens_layer.add(token['img_ref']);
    this.tokens_layer.draw()


    token['text_ref'] = new Konva.Text({
      x: position[0],
      y: position[1],
      text: newToken.name,
      align: 'center',
      verticalAlign: 'middle',
      fontSize: this.text.fontSize,
      fontFamily: this.text.fontFamily,
      fill: this.text.fill,
      name : newToken.name + "_label"
    });
    token['text_ref'].x(token['text_ref'].x() - token['text_ref'].getWidth()/2)
    token['text_ref'].y(token['text_ref'].y() - token['text_ref'].getHeight()/2)
    this.labels_layer.add(token['text_ref'])
    this.labels_layer.draw()

    var tooltip = new Konva.Label({
        x: position[0],
        y: position[1],
        opacity: 1,
        name : newToken.name + "_tooltip",
        visible : false
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
    cardImageObj.onload = () => {
      var card_border = new Konva.Image({
        x: -32,
        y: -90,
        image: cardImageObj,
        width: 64,
        height: 90
      });

      // add the shape to the layer
      tooltip.add(card_border);
      this.tooltips_layer.batchDraw();
    };
    cardImageObj.src = './../static/card.png';


    var tokenImageObj = new Image();
    tokenImageObj.onload = () => {
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
      this.tooltips_layer.batchDraw();
    };
    tokenImageObj.src = newToken.token_image;




    token['tooltip_ref'] = tooltip;

    this.tooltips_layer.add(token['tooltip_ref']);
    this.tooltips_layer.draw()

    console.log('tooltip', tooltip);

    return token
  }

  indexToPosition(x, y) {
    let distance_x = Math.sqrt(this.board.hex_radius**2 * 3 / 4) * 2;
    let distance_y = (3/4 * this.board.hex_radius) * 2;
    let base_step_x = y%2 !=0 ? 0 :  distance_x/2;

    let pos_x = x * distance_x + base_step_x;
    let pos_y = y * distance_y;

    return [pos_x, pos_y]
  }

  getRelativePointerPosition(node) {
    // the function will return pointer position relative to the passed node
    var transform = node.getAbsoluteTransform().copy();
    // to detect relative position we need to invert transform
    transform.invert();

    // get pointer (say mouse or touch) position
    var pos = node.getStage().getPointerPosition();

    // now we find relative point
    return transform.point(pos);
  }
}
