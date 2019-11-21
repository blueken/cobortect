const RATIO = 10;
const COLOR_WIDTH = 5 * RATIO;
const COLOR_HEIGHT = 8 * RATIO;
const OTHER_COLOR_WIDTH = 3 * RATIO;
const OTHER_COLOR_HEIGHT = 4 * RATIO;
const IMAGE_WIDTH = 7 * RATIO;
const IMAGE_HEIGHT = 9 * RATIO;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

ctx.beginPath();
ctx.fillStyle = "#000000";
ctx.fillRect(10, 10, COLOR_WIDTH, COLOR_HEIGHT);
ctx.fillStyle = "#FF0000";
ctx.fillRect(10, 10, OTHER_COLOR_WIDTH, OTHER_COLOR_HEIGHT);
const imgD = ctx.getImageData(10, 10, IMAGE_WIDTH, IMAGE_HEIGHT);

function getRGBAI(imageData, i) {
  const { data } = imageData;
  const r = data[4 * i + 0];
  const g = data[4 * i + 1];
  const b = data[4 * i + 2];
  const a = data[4 * i + 3];
  return { r, g, b, a, i };
}
function pixelArray(imageData) {
  //pixelArray = [{r,g, b, a, i}]
  let result = [];
  const { data } = imageData;
  result = data.reduce((p, c, i, a) => {
    const pixelNum = Math.floor(i / 4);
    const pixelIdx = i % 4;
    let rst = pixelIdx === 0 ? [...p, getRGBAI(imageData, pixelNum)] : p;
    return rst;
  }, []);
  return result;
}

function pixelNum(imageData) {
  const result = pixelArray(imageData).length;
  return result;
}

function rgb2Hex(color) {
  //color: '255, 244, 233'
  var rgb = color.split(",");
  var r = parseInt(rgb[0]);
  var g = parseInt(rgb[1]);
  var b = parseInt(rgb[2]);

  var hex =
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase();
  return hex;
}

function hex2Rgb(hexStr) {
  const rgbHex = [...hexStr.match(/^#?(\w{2})(\w{2})(\w{2})/)].slice(-3);
  return rgbHex.map(v => parseInt(v, 16));
}

function isPixelNull(pixelObj) {
  //pixelObj = { r, g, b, a, i }
  const { r, g, b, a, i } = pixelObj;
  return r === 0 && g === 0 && b === 0 && a === 0;
}
function isPixelAtBorder(imageData, i) {
  const rows = imageData.height;
  const cols = imageData.width;
  const rowIdx = Math.floor(i / cols);
  const colIdx = i % cols;
  return (
    rowIdx === 0 || rowIdx === rows - 1 || colIdx === 0 || colIdx === cols - 1
  );
}
function nearOtherColor(imageData, i) {
  let result = false;
  const rows = imageData.height;
  const cols = imageData.width;
  const rowIdx = Math.floor(i / cols);
  const colIdx = i % cols;
  const LT = {};
  return result;
}
function isSrcColor(pixelObj, srcHexColor) {
  let result = false;
  const { r, g, b, a, i } = pixelObj;
  result = rgb2Hex([r, g, b].join(",")) === srcHexColor;

  return result;
}
function borderPureColor(imageData, srcHexColor, destHexColor) {
  const rows = imageData.height;
  const cols = imageData.width;
  const pixelArr = pixelArray(imageData);
  const newImageData = pixelArr.reduce((p, c) => {
    const { i } = c;
    if (
      !isPixelNull(c) &&
      isSrcColor(c, srcHexColor) &&
      isPixelAtBorder(imageData, i)
    ) {
      // not null && at image data  border
      const [destR, destG, destB] = hex2Rgb(destHexColor);
      // let newPixelArr = [destR, destG, destB, 255];
      // console.log(`newPixelArr:`, newPixelArr);
      p.data[4 * i + 0] = destR;
      p.data[4 * i + 1] = destG;
      p.data[4 * i + 2] = destB;
      p.data[4 * i + 3] = 255;
    } else if (
      !isPixelNull(c) &&
      isSrcColor(c, srcHexColor) &&
      nearOtherColor(imageData, i)
    ) {
      // not null && not at image data border , but near othercolor
    } else {
      const r = imageData.data[4 * i + 0];
      const g = imageData.data[4 * i + 1];
      const b = imageData.data[4 * i + 2];
      const a = imageData.data[4 * i + 3];
      p.data[4 * i + 0] = r;
      p.data[4 * i + 1] = g;
      p.data[4 * i + 2] = b;
      p.data[4 * i + 3] = a;
    }
    return p;
  }, ctx.createImageData(IMAGE_WIDTH, IMAGE_HEIGHT));

  return newImageData;
}
var xxxyyy = borderPureColor(imgD, "#FF0000", "#00FF00");
ctx.putImageData(xxxyyy, 100, 10);
