// **** BOARD ELEMENTS ****

function Shape(x, y, w, h, fill) {
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 1;
  this.h = h || 1;
  this.fill = fill || '#000';
}
Shape.prototype.draw = function(ctx) {
  ctx.fillStyle = this.fill;
  ctx.fillRect(this.x, this.y, this.w, this.h);
}
Shape.prototype.contains = function(mx, my) {
  return  (this.x <= mx) && (this.x + this.w >= mx) &&
          (this.y <= my) && (this.y + this.h >= my);
}
Shape.prototype.inCorner = function(mx, my, corner) {
  switch (corner) {
    case 'ne':
      return this.x + this.w - 3 <= mx && mx <= this.x + this.w + 3 && this.y - 3 <= my && my <= this.y + 3;
    case 'nw':
      return this.x - 3 <= mx && mx <= this.x + 3 && this.y - 3 <= my && my <= this.y + 3;
    case 'sw':
      return this.x - 3 <= mx && mx <= this.x + 3 && this.y + this.h - 3 <= my && my <= this.y + this.h + 3;
    case 'se':
      return this.x + this.w - 3 <= mx && mx <= this.x + this.w + 3 && this.y + this.h - 3 <= my && my <= this.y + this.h + 3;
    default:
      return false;
  }
}
Shape.prototype.getCorner = function(mx, my) {
  if (this.inCorner(mx, my, "ne"))
    return "ne";
  else if (this.inCorner(mx, my, "nw"))
    return "nw";
  else if (this.inCorner(mx, my, "se"))
    return "se";
  else if (this.inCorner(mx, my, "sw"))
    return "sw";
}
Shape.prototype.showContextMenu = function(mouse) {
  var l = layerManager.getLayer();
  l.selection = this;
  l.valid = false;
  var token = this;
  $menu.show();
  $menu.empty();
  $menu.css({left: mouse.x, top: mouse.y});
  var data = "" +
    "<ul>" + 
      "<li>Layer<ul>";
  for (var i=0; i<layerManager.layers.length - 1; i++){
    var sel = layerManager.layers[i] === l ? " style='background-color:aqua' " : " ";
    data += "<li data-action='setLayer' data-layer='" + i + "'" + sel + "class='context-clickable'>" + i + "</li>";
  }
  data += "</ul></li>" + 
      "<li data-action='moveToBack' class='context-clickable'>Move to back</li>" +
      "<li data-action='moveToFront' class='context-clickable'>Move to front</li>" +
    "</ul>"
  $menu.html(data);
  $(".context-clickable").on('click', function() {
    handleContextMenu($(this), token);
  });
}

function Token(img, x, y, w, h) {
  this.img = img;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
}
Token.prototype = Object.create(Shape.prototype);
Token.prototype.draw = function(ctx) {
  ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
}

// **** specific Layer State Management

function LayerState(canvas) {
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');

  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  var state = this;
  
  this.valid = false;
  this.shapes = [];
  this.dragging = false;
  this.resizing = false;
  this.resizedir = '';
  
  this.selection = null;
  this.dragoffx = 0;
  this.dragoffy = 0;

  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;  
  this.interval = 30;
  setInterval(function() { state.draw(); }, state.interval);
}
LayerState.prototype.addShape = function(shape) {
  this.shapes.push(shape);
  this.valid = false;
}
LayerState.prototype.removeShape = function(shape) {
  this.shapes.splice(this.shapes.indexOf(shape), 1);
  this.valid = false;
}
LayerState.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}
LayerState.prototype.draw = function() {
  if (!this.valid) {
    var ctx = this.ctx;
    var shapes = this.shapes;
    this.clear();

    var l = shapes.length;
    for (var i = 0; i < l; i++) {
      var shape = shapes[i];
      if (shape.x > this.width || shape.y > this.height ||
          shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
      shapes[i].draw(ctx);
    }

    if (this.selection != null) {
      ctx.strokeStyle = this.selectionColor;
      ctx.lineWidth = this.selectionWidth;
      var mySel = this.selection;
      ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);

      // topright
      ctx.fillRect(mySel.x + mySel.w - 3, mySel.y - 3, 6, 6)
      // topleft
      ctx.fillRect(mySel.x - 3, mySel.y - 3, 6, 6)
      // botright
      ctx.fillRect(mySel.x + mySel.w - 3, mySel.y + mySel.h - 3, 6, 6)
      // botleft
      ctx.fillRect(mySel.x - 3, mySel.y + mySel.h - 3, 6, 6)
    }
    
    this.valid = true;
  }
}
LayerState.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  
  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;
  
  return {x: mx, y: my};
}
LayerState.prototype.moveShapeOrder = function(shape, destinationIndex) {
  var ls = this.shapes;
  var idx = ls.indexOf(shape);
  if (destinationIndex !== idx){
    ls.splice(idx, 1);
    ls.splice(destinationIndex, 0, shape);
    this.valid = false;
  }
}

// **** Manager for working with multiple layers

function LayerManager(layers) {
  this.layers = layers
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.selectedLayer = 0;
  
  var layerManager = this;

  this.gridSize = 100;
  
  // prevent double clicking text selection
  window.addEventListener('selectstart', function(e) { e.preventDefault(); return false; });
  window.addEventListener('mousedown', function(e) {
    if(e.button !== 0 || e.target.tagName !== 'CANVAS') { return; }

    $menu.hide();

    var layer = this.layerManager.getLayer();
    var mouse = layer.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;

    if (mx < 200 && $('#menu').is(":visible")) {
      return;
    }

    var shapes = layer.shapes;
    var l = shapes.length;
    for (var i = l-1; i >= 0; i--) {
      var corn = shapes[i].getCorner(mx, my);
      if (corn !== undefined) {
        layer.selection = shapes[i];
        layer.resizing = true;
        layer.resizedir = corn;
        layer.valid = false;
        return;
      } else if (shapes[i].contains(mx, my)) {
        var sel = shapes[i];
        layer.selection = sel;
        layer.dragging = true;
        layer.dragoffx = mx - sel.x;
        layer.dragoffy = my - sel.y;
        layer.valid = false;
        return;
      }
    }
    if (layer.selection) {
      layer.selection = null;
      layer.valid = false;
    }
  });
  window.addEventListener('mousemove', function(e) {
    var layer = this.layerManager.getLayer();
    var sel = layer.selection;
    var mouse = layer.getMouse(e);
    if (layer.dragging){
      sel.x = mouse.x - layer.dragoffx;
      sel.y = mouse.y - layer.dragoffy;   
      layer.valid = false;
    } else if (layer.resizing) {
      if (layer.resizedir === 'nw') {
        sel.w = sel.x + sel.w - mouse.x;
        sel.h = sel.y + sel.h - mouse.y;
        sel.x = mouse.x;
        sel.y = mouse.y;
      } else if (layer.resizedir === 'ne') {
        sel.w = mouse.x - sel.x;
        sel.h = sel.y + sel.h - mouse.y;
        sel.y = mouse.y;
      } else if (layer.resizedir === 'se') {
        sel.w = mouse.x - sel.x;
        sel.h = mouse.y - sel.y;
      } else if (layer.resizedir === 'sw') {
        sel.w = sel.x + sel.w - mouse.x;
        sel.h = mouse.y - sel.y;
        sel.x = mouse.x;
      } 
      layer.valid = false;
    } else if (sel) {
      if (sel.inCorner(mouse.x, mouse.y, "nw")) {
        document.body.style.cursor = "nw-resize";
      } else if (sel.inCorner(mouse.x, mouse.y, "ne")) {
        document.body.style.cursor = "ne-resize";
      } else if (sel.inCorner(mouse.x, mouse.y, "se")) {
        document.body.style.cursor = "se-resize";
      } else if (sel.inCorner(mouse.x, mouse.y, "sw")) {
        document.body.style.cursor = "sw-resize";
      } else {
        document.body.style.cursor = "default";
      }
    } else {
      document.body.style.cursor = "default";
    }
  });
  window.addEventListener('mouseup', function(e) {
    var layer = this.layerManager.getLayer();
    if (!e.altKey && layer.dragging) {
      var gs = this.layerManager.gridSize;
      var mouse = layer.getMouse(e);
      var mx = mouse.x;
      var my = mouse.y;
      var diff = (gs - layer.selection.w) / 2;
      layer.selection.x = diff + Math.floor(mx / gs) * gs;
      layer.selection.y = diff + Math.floor(my / gs) * gs;
      layer.valid = false;
    }
    layer.dragging = false;
    layer.resizing = false;
  });
  window.addEventListener('dblclick', function(e) {
    var layer = this.layerManager.getLayer();
    var mouse = layer.getMouse(e);
    if (mouse.x < 200 && $('#menu').is(":visible")) {
      return;
    }
    layer.addShape(new Shape(mouse.x - 10, mouse.y - 10, 20, 20, 'rgba(0,255,0,.6)'));
  });
  window.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var layer = this.layerManager.getLayer();
    var mouse = layer.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var shapes = layer.shapes;
    var l = shapes.length;
    for (var i = l-1; i >= 0; i--) {
      if (shapes[i].contains(mx, my)) {
        shapes[i].showContextMenu(mouse);
        break;
      }
    }
  });
}
LayerManager.prototype.getLayer = function(index) {
  var index = (typeof index === 'undefined') ? this.selectedLayer : index;
  return this.layers[index];
}
LayerManager.prototype.setLayer = function(index) {
  if (0 <= index && index < this.layers.length) {
    this.selectedLayer = index;
    // -1 to exclude the grid layer
    for (var i=0; i < this.layers.length - 1; i++) {
      var l = this.getLayer(i);
      if (i > index) {
        l.ctx.globalAlpha = 0.3;
      } else {
        l.ctx.globalAlpha = 1.0;
      }
      l.valid = false;
    }
  } else {
    alert("Invalid layer index");
  }
}
LayerManager.prototype.getGridLayer = function() {
  return this.layers[this.layers.length - 1];
}
LayerManager.prototype.drawGrid = function(layer) {
  var layer = (typeof layer === 'undefined') ? this.getGridLayer() : layer;
  var ctx = layer.ctx;
  ctx.clearRect(0, 0, layer.width, layer.height);
  ctx.beginPath();

  for (var i=0; i < layer.width; i += this.gridSize) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, layer.height);
    ctx.moveTo(0, i);
    ctx.lineTo(layer.width, i);
  }
  ctx.strokeStyle = 'rgba(255,0,0, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  layer.valid = true;
}
LayerManager.prototype.setGridSize = function(gridSize, layer) {
  this.gridSize = gridSize;
  this.drawGrid(layer);
}
LayerManager.prototype.invalidate = function() {
  for(var i=0; i < this.layers.length - 1; i++) {
    this.layers[i].valid = false;
  }
}
LayerManager.prototype.getShapeAtLocation = function(mouse) {
  var layer = this.getLayer();
  var mx = mouse.x;
  var my = mouse.y;

  if (mx < 200 && $('#menu').is(":visible")) {
    return;
  }

  var shapes = layer.shapes;
  var l = shapes.length;
  for (var i = l-1; i >= 0; i--) {
    if (shapes[i].contains(mx, my)) {
      return shapes[i];
    }
  }
  return;
}



// **** SETUP LAYERMANAGER ****

var layers = Array.from(document.getElementsByTagName('canvas'));
for (var i = 0; i < layers.length; i++) {
  layers[i].width = window.innerWidth;
  layers[i].height = window.innerHeight;
  layers[i] = new LayerState(layers[i]);
}

var layerManager = new LayerManager(layers);
layerManager.getLayer(0).addShape(new Shape(40,40,50,50));
layerManager.getLayer(1).addShape(new Shape(80,40,50,50, "red"));
layerManager.getLayer(1).addShape(new Shape(40,80,50,50, "red"));
layerManager.getLayer(2).addShape(new Shape(80,80,50,50, "blue"));
layerManager.drawGrid();
layerManager.setLayer(1);

var img = $('#throt')[0];
img.onload = function() {
  layerManager.getLayer(1).addShape(new Token(img, 200, 100, 50, 50));
}


// **** SETUP UI ****

$("#layerselect li").on("click", function(){
  var layers = $("#layerselect li");
  var index = layers.index($(this));
  if (index !== layerManager.selectedLayer){
    $(this).addClass("layer-selected");
    $(layers[layerManager.selectedLayer]).removeClass("layer-selected");
    layerManager.setLayer(index);
  }
})

var $menu = $('#contextMenu');
$menu.hide();

function handleContextMenu(menu, token) {
  var action = menu.data("action");
  var layer = layerManager.getLayer();
  var ls = layer.shapes;
  var i;
  switch(action) {
    case 'moveToFront':
      layer.moveShapeOrder(token, ls.length - 1);
      break;
    case 'moveToBack':
      layer.moveShapeOrder(token, 0);
      break;
    case 'setLayer':
      layer.removeShape(token);
      layerManager.getLayer(menu.data("layer")).addShape(token);
      break;
  }
  $menu.hide();
}

$('#menutoggle').on("click", function(){
  var menu = $('#menu');
  // order of animation is important, it otherwise will sometimes show a small gap between the two objects
  if (menu.is(":visible")) {
    $('#menutoggle').animate({left: "-=200px"});
    menu.animate({width: 'toggle'});
  } else {
    menu.animate({width: 'toggle'});
    $('#menutoggle').animate({left: "+=200px"});
  }
})

window.onresize = function() {
  layerManager.width = window.innerWidth;
  layerManager.height = window.innerHeight;
  for (var i=0; i < layerManager.layers.length; i++) {
    layerManager.layers[i].canvas.width = layerManager.width;
    layerManager.layers[i].canvas.height = layerManager.height;
  }
  layerManager.invalidate();
  layerManager.drawGrid();
}


$(".draggable").draggable({
  helper: "clone"
});
$("#grid-layer").droppable({
  drop: function(event, ui) {
    var l = layerManager.getLayer();
    var offset = $(l.canvas).offset();
    x = parseInt(ui.offset.left - offset.left);
    y = parseInt(ui.offset.top - offset.top);
    width = ui.helper[0].width;
    height = ui.helper[0].height;

    l.addShape(new Token(ui.draggable[0], x, y, width, height));
  }
});


// **** WebSocket ****

var protocol = document.domain === 'localhost' ? "http://" : "https://";
var socket = io.connect(protocol + document.domain + ":8000/planarally");
socket.on("connect", function(){
  console.log("Connected");
  socket.emit("my event", {data: "I'm connected!"});
});
socket.on("disconnect", function() {
  console.log("Disconnected");
});
socket.on("my response", function(msg) {
  console.log("Msg: " + msg.data);
});