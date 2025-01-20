// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 10.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariableToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegment = 10;

function addActionsForHtmlUI() {
  document.getElementById('clearButton').onclick = function () { g_shapesList = []; renderAllShapes(); };
  document.getElementById('pointButton').onclick = function () { g_selectedType = POINT; };
  document.getElementById('triButton').onclick = function () { g_selectedType = TRIANGLE };
  document.getElementById('circleButton').onclick = function () { g_selectedType = CIRCLE };
  document.getElementById('redSlide').addEventListener('mouseup', function () { g_selectedColor[0] = this.value / 100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function () { g_selectedColor[1] = this.value / 100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function () { g_selectedColor[2] = this.value / 100; });
  document.getElementById('sizeSlide').addEventListener('mouseup', function () { g_selectedSize = this.value; });
  document.getElementById('segSlide').addEventListener('mouseup', function () { g_selectedSegment = this.value; });
  document.getElementById('dogButton').onclick = function () { paintDog(); };
}

function main() {
  setupWebGL();
  connectVariableToGLSL();
  addActionsForHtmlUI();
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) { if (ev.buttons == 1) { click(ev) } };
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];
var redoStack = [];

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_selectedSegment;
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);
  renderAllShapes();
}

function renderAllShapes() {
  var startTime = performance.now();
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
  var duration = performance.now() - startTime;
  sendTextToHTML("Number of Dots: " + len + " | MS: " + Math.floor(duration) + "  | FPS: " + Math.floor(10000 / duration) / 10, "Num_of_Dots");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return ([x, y]);
}

function uniqueTriangle(vertices, color) {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

const red = [1.0, 0.0, 0.0, 1.0];
const black = [0.0, 0.0, 0.0, 1.0];
const white = [1.0, 1.0, 1.0, 1.0];
const orange = [1.0, 0.3, 0.0, 1.0];

function paintDog() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Body
  uniqueTriangle([-0.3, -0.3, 0.3, -0.3, 0, 0.1], orange);
  uniqueTriangle([-0.2, -0.2, 0.2, -0.2, 0, 0.3], orange);

  // Head
  uniqueTriangle([-0.2, 0.3, 0.2, 0.3, 0, 0.5], orange);

  // Ears
  uniqueTriangle([-0.25, 0.4, -0.2, 0.3, -0.3, 0.2], orange);
  uniqueTriangle([0.25, 0.4, 0.2, 0.3, 0.3, 0.2], orange);

  // Eyes
  uniqueTriangle([-0.1, 0.4, -0.05, 0.4, -0.075, 0.45], black);
  uniqueTriangle([0.1, 0.4, 0.05, 0.4, 0.075, 0.45], black);

  // Nose
  uniqueTriangle([-0.05, 0.35, 0.05, 0.35, 0, 0.3], black);

  // Legs
  uniqueTriangle([-0.25, -0.3, -0.2, -0.3, -0.2, -0.5], orange);
  uniqueTriangle([0.25, -0.3, 0.2, -0.3, 0.2, -0.5], orange);

  // Tail
  uniqueTriangle([0.3, -0.2, 0.4, -0.1, 0.35, -0.3], orange);
}
