console.clear();

const canvas = document.querySelector('canvas');
const svg = document.querySelector('svg');
const ctx = canvas.getContext('2d');
let width = svg.clientWidth;
let height = svg.clientHeight;
const path = svg.querySelector('path');
const totalLength = path.getTotalLength();
let mouseX = 3;

let coordinates = [];

canvas.width = width;
canvas.height = height;

const gradients = [
  [
    [0, [190, 217, 2]],
    [33, [107, 140, 1]],
    [66, [80, 123, 5]],
    [100, [57, 84, 0]]
  ]
];

const dots = [];
class Dot {
  constructor (x, y, color, delay, index) {
    this._x = x;
    this._y = y;
    this.x = x * width;
    this.y = y * height;
    this.r = width * 0.005 + (Math.sin(delay) * width * 0.08);
    this.color = color;
    this.delay = delay;
    this.index = index;
  }
  resize () {
    this.x = this._x * width;
    this.y = this._y * height;
  }
  update (time) {
    const p = coordinates[Math.floor((time + (this.delay * totalLength))) % coordinates.length];
    this._x = p.x / 543.7;
    this._y = p.y / 232.6;
    this.x = this._x * width;
    this.y = this._y * height;
    this.r = width * 0.005 + (Math.sin(this.delay) * width * 0.08);
  }
  draw () {
    if (this.index % mouseX === 0) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

/* ============ */
/* === INIT ===  */
/* ============ */
function init () {
  let sum_length = 0;
  for (let i = 0; i < totalLength * 0.9; i+=2) {
    const point = path.getPointAtLength(i);
    const x = point.x / 543.7;
    const y = point.y / 232.6;
    const RGB_color = getColor(0, totalLength, i / totalLength);
    const color = `rgb(${RGB_color[0]}, ${RGB_color[1]}, ${RGB_color[2]})`;

    const dot = new Dot(x, y, color, (1 - i / totalLength), i / 2);
    dots.push(dot);
    sum_length += 2;
  }
  
  for (let i = 0; i < totalLength; i+=1) {
    coordinates.push(path.getPointAtLength(i));
  }
}

/* Code copied from https://stackoverflow.com/a/30144587 */
function pickHex(color1, color2, weight) {
  var p = weight;
  var w = p * 2 - 1;
  var w1 = (w/1+1) / 2;
  var w2 = 1 - w1;
  var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
      Math.round(color1[1] * w1 + color2[1] * w2),
      Math.round(color1[2] * w1 + color2[2] * w2)];
  return rgb;
}
function getColor(pathIndex, pathLength, colorIndex) {
  var colorRange = [];
  let stop = false;
  const gradient = gradients[pathIndex];
  gradient.forEach((step, index) => {
    if (!stop && (colorIndex * 100) <= step[0]) {
      if (index === 0) {
        index = 1;
      }
      colorRange = [index - 1, index];
      stop = true;
    }
  });

  //Get the two closest colors
  var firstcolor = gradient[colorRange[0]][1];
  var secondcolor = gradient[colorRange[1]][1];
  //Calculate ratio between the two closest colors
  var firstcolor_x = pathLength * (gradient[colorRange[0]][0]/100);
  var secondcolor_x = pathLength * (gradient[colorRange[1]][0]/100)-firstcolor_x;
  var slider_x = pathLength * colorIndex - firstcolor_x;
  var ratio = slider_x / secondcolor_x;

  //Get the color with pickHex(thx, less.js's mix function!)
  return pickHex(secondcolor, firstcolor, ratio);
}


function render (a) {
  const time = a * 0.2;
  requestAnimationFrame(render);
  ctx.clearRect(0, 0, width, height);
  for (let i = dots.length - 1; i >= 0; i--) {
    dots[i].update(time);
    dots[i].draw();
  }
  
  const head = dots[0];
  const p1 = coordinates[Math.floor((time + (head.delay * totalLength))) % coordinates.length];
  const p2 = coordinates[Math.floor((time + (head.delay * totalLength)) + 1) % coordinates.length];
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(angle + Math.PI * 1.5);
  // Draw the eyes
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(head.r * 0.25, 0, head.r * 0.2, 0, 2 * Math.PI);
  ctx.arc(-head.r * 0.25, 0, head.r * 0.2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(head.r * 0.25, head.r * 0.05, head.r * 0.05, 0, 2 * Math.PI);
  ctx.arc(-head.r * 0.25, head.r * 0.05, head.r * 0.05, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw the nose
  ctx.beginPath();
  ctx.arc(head.r * 0.1, head.r * 0.7, head.r * 0.05, 0, 2 * Math.PI);
  ctx.arc(-head.r * 0.1, head.r * 0.7, head.r * 0.05, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw the tongue
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, head.r);
  ctx.lineTo(0, head.r + head.r * 0.5);
  ctx.moveTo((head.r * .2), head.r + head.r * 0.5 + (head.r * .3));
  ctx.lineTo(0, head.r + head.r * 0.5);
  ctx.lineTo((head.r * -.2), head.r + head.r * 0.5 + (head.r * .3));
  ctx.stroke();
  
  ctx.restore();
}

function afterResize () {
  width = svg.clientWidth;
  height = svg.clientHeight;

  canvas.width = width;
  canvas.height = height;
  dots.forEach(dot => {
    dot.resize();
  });
}
let interval = null;
window.addEventListener('resize', () => {
  interval = clearTimeout(interval);
  interval = setInterval(afterResize, 500);
});
window.addEventListener('mousemove', (e) => {
  mouseX = 51 - Math.floor(e.clientX / innerWidth * 50);
});
window.addEventListener('touchmove', (e) => {
  mouseX = 51 - Math.floor(e.touches[0].clientX / innerWidth * 50);
});

init();
requestAnimationFrame(render);