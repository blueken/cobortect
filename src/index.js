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
ctx.fillRect(20, 20, OTHER_COLOR_WIDTH, OTHER_COLOR_HEIGHT);
ctx.fillStyle = "#FFFF00";
ctx.fillRect(30, 30, OTHER_COLOR_WIDTH, OTHER_COLOR_HEIGHT);
ctx.fillRect(40, 40, OTHER_COLOR_WIDTH, OTHER_COLOR_HEIGHT);
ctx.fillStyle = "#0000FF";
ctx.fillRect(10, 50, 40, 40);
const imgD = ctx.getImageData(10, 10, IMAGE_WIDTH, IMAGE_HEIGHT);

function rc2i(imageData, r, c) {
  //input pixel row col ,get pixel index
  const { width } = imageData;
  return r * width + c;
}
function getRGBAIByIndex(imageData, i) {
  const { data } = imageData;
  const r = data[4 * i + 0];
  const g = data[4 * i + 1];
  const b = data[4 * i + 2];
  const a = data[4 * i + 3];
  return { r, g, b, a, i };
}
function getRGBAIByRowCol(imageData, r, c) {
  const i = rc2i(imageData, r, c);
  return getRGBAIByIndex(imageData, i);
}
function pixelArray(imageData) {
  //pixelArray = [{r,g, b, a, i}]
  let result = [];
  const { data } = imageData;
  result = data.reduce((p, c, i, a) => {
    const pixelNum = Math.floor(i / 4);
    const pixelIdx = i % 4;
    let rst = pixelIdx === 0 ? [...p, getRGBAIByIndex(imageData, pixelNum)] : p;
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
function isPixelAtBorder(imageData, pixelObj) {
  const { i } = pixelObj;
  const rows = imageData.height;
  const cols = imageData.width;
  const rowIdx = Math.floor(i / cols);
  const colIdx = i % cols;
  return (
    rowIdx === 0 || rowIdx === rows - 1 || colIdx === 0 || colIdx === cols - 1
  );
}
function nearOtherColor(imageData, pixelObj, neighborHexColor) {
  const { r, g, b, a, i } = pixelObj;
  let result = false;
  const rows = imageData.height;
  const cols = imageData.width;
  const rowIdx = Math.floor(i / cols);
  const colIdx = i % cols;
  const LT = {};
  let neighbors = [];
  for (let i = rowIdx - 1; i < rowIdx + 2; i++) {
    for (let j = colIdx - 1; j < colIdx + 2; j++) {
      if (
        i >= 0 &&
        i <= rows - 1 &&
        j >= 0 &&
        j <= cols - 1 &&
        (i !== rowIdx || j !== colIdx)
      ) {
        neighbors.push([i, j]);
      }
    }
  }

  const someNeighborIsDifferentColor = neighbors.some(v => {
    const [ri, ci] = v;
    const { r: rNeighbor, g: gNeighbor, b: bNeighbor } = getRGBAIByRowCol(
      imageData,
      ri,
      ci
    );
    return (
      rgb2Hex([rNeighbor, gNeighbor, bNeighbor].join(",")) !==
      rgb2Hex([r, g, b].join(","))
    );
  });
  const allDifferentColorNeighbors = neighbors.filter(v => {
    const [ri, ci] = v;
    const { r: rNeighbor, g: gNeighbor, b: bNeighbor } = getRGBAIByRowCol(
      imageData,
      ri,
      ci
    );
    return (
      rgb2Hex([rNeighbor, gNeighbor, bNeighbor].join(",")) !==
      rgb2Hex([r, g, b].join(","))
    );
  });
  const allDifferentColorNeighborsHasSameColor =
    !!!neighborHexColor ||
    !allDifferentColorNeighbors.some(v => {
      const [ri, ci] = v;
      const { r: rNeighbor, g: gNeighbor, b: bNeighbor } = getRGBAIByRowCol(
        imageData,
        ri,
        ci
      );
      return (
        rgb2Hex([rNeighbor, gNeighbor, bNeighbor].join(",")) !==
        neighborHexColor
      );
    });
  result =
    someNeighborIsDifferentColor && allDifferentColorNeighborsHasSameColor;
  return result;
}
function isSrcColor(pixelObj, srcHexColor) {
  let result = false;
  const { r, g, b, a, i } = pixelObj;
  result = rgb2Hex([r, g, b].join(",")) === srcHexColor;

  return result;
}
function borderPureColor(
  imageData,
  srcHexColor,
  borderHexColor,
  neighborHexColor
) {
  const rows = imageData.height;
  const cols = imageData.width;
  const pixelArr = pixelArray(imageData);
  const newImageData = pixelArr.reduce((p, c) => {
    const { i } = c;
    // 如果需要勾 imagedata 的边界，解注释此处，把下面的接成 else if 即可
    // if (
    //   !isPixelNull(c) &&
    //   isSrcColor(c, srcHexColor) &&
    //   isPixelAtBorder(imageData, c)
    // ) {
    //   // not null && at image data  border
    //   const [destR, destG, destB] = hex2Rgb(borderHexColor);
    //   // let newPixelArr = [destR, destG, destB, 255];
    //   // console.log(`newPixelArr:`, newPixelArr);
    //   p.data[4 * i + 0] = destR;
    //   p.data[4 * i + 1] = destG;
    //   p.data[4 * i + 2] = destB;
    //   p.data[4 * i + 3] = 255;
    // }
    if (
      !isPixelNull(c) &&
      isSrcColor(c, srcHexColor) &&
      nearOtherColor(imageData, c, neighborHexColor)
    ) {
      // not null && not at image data border , but near othercolor
      const [destR, destG, destB] = hex2Rgb(borderHexColor);
      // let newPixelArr = [destR, destG, destB, 255];
      // console.log(`newPixelArr:`, newPixelArr);
      p.data[4 * i + 0] = destR;
      p.data[4 * i + 1] = destG;
      p.data[4 * i + 2] = destB;
      p.data[4 * i + 3] = 255;
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

const btn = document.querySelector("#btn");
btn.addEventListener("click", () => {
  const colorSource = document.querySelector("#colorSource").value;
  const colorBorder = document.querySelector("#colorBorder").value;
  const colorNeighbor = document.querySelector("#colorNeighbor").value;
  var xxxyyy = borderPureColor(imgD, colorSource, colorBorder, colorNeighbor);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(xxxyyy, 10, 10);
});
