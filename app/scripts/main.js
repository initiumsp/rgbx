(function(window, navigator, document, console) {

  'use strict';

  // =====================================
  //
  //        Define constants
  //
  // =====================================

  const CANVAS_WIDTH  = 640;
  const CANVAS_HEIGHT = 480;
  const TETRACHROMACY_ADJUSTMENT_INDEX = 0.7; // Effective to enhance sensitivity on the red-yellow range

  // =====================================
  //
  //        Create Colour Filters
  //
  // =====================================

  // Generate a filter that just copies the input
  const identicalLinearParameters = [
  // R  G  B  - values from the camera
    [1, 0, 0],  // R - linear coefficients
    [0, 1, 0],  // G
    [0, 0, 1]   // B
  ];

  const deuteranopiaLinearParameters = [
    [ 0.43, 0.72, -0.15],
    [ 0.34, 0.57, -0.09],
    [-0.02, 0.03,  0.80]
  ];

  const add = (sum, operand) => sum + operand;

  const matrixVectorProduct = (mat, vec) =>
    mat.map(row =>
            row.map((value, index) => value * vec[index])
               .reduce(add));

  const createSlowButConciseLinearFilter = parameterMatrix =>
      data => {
      for (let i = 0; i < data.length; i += 4) {
        let pixelVec = [data[i], data[i + 1], data[i + 2]];
        [data[i], data[i + 1], data[i + 2]] = matrixVectorProduct(parameterMatrix, pixelVec)
      }
    };

  function createLinearFilter(parameterMatrix) {

    return data => {

      // This is just matrix multiplication: parameterMatrix * data

      for (let i = 0; i < data.length; i += 4) {

        const coefficient_RxR = parameterMatrix[0][0];
        const coefficient_RxG = parameterMatrix[0][1];
        const coefficient_RxB = parameterMatrix[0][2];
        const coefficient_GxR = parameterMatrix[1][0];
        const coefficient_GxG = parameterMatrix[1][1];
        const coefficient_GxB = parameterMatrix[1][2];
        const coefficient_BxR = parameterMatrix[2][0];
        const coefficient_BxG = parameterMatrix[2][1];
        const coefficient_BxB = parameterMatrix[2][2];

        let r = data[i],
            g = data[i + 1],
            b = data[i + 2];

        data[i    ] = coefficient_RxR * r + coefficient_RxG * g + coefficient_RxB * b;
        data[i + 1] = coefficient_GxR * r + coefficient_GxG * g + coefficient_GxB * b;
        data[i + 2] = coefficient_BxR * r + coefficient_BxG * g + coefficient_BxB * b;

      }

    };
  }

  // HSV functions from http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c

  function rgbToHsv(r, g, b){
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
      h = 0; // achromatic
    }else{
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h, s, v];
  }

  function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
  }

  function createSpectrumShifter(compress_index) {

    return data => {

      let r, g, b, h, s, v;

      for (let i = 0; i < data.length; i += 4) {

        r = data[i];
        g = data[i + 1];
        b = data[i + 2];
        [h, s, v] = rgbToHsv(r, g, b);

        h = Math.pow(h, compress_index);

        [r, g, b] = hsvToRgb(h, s, v);
        data[i]     = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

    }
  }

  let filter = createSpectrumShifter(TETRACHROMACY_ADJUSTMENT_INDEX);

  // =====================================
  //
  //  Set up vendor-specific media input
  //
  // =====================================

  const mediaErrorHandler = error => console.log("Video capture error: ", error);

  const createStreamHandler = (videoNode, urlCreator) =>
      stream => {
        if (urlCreator === null) {
          videoNode.src = stream;
        } else {
          videoNode.src = urlCreator(stream);
        }
        videoNode.play();
      };

  const videoDOMNode = document.getElementById("video");
  const videoConstraints = {
    video: true,
    audio: false
  };
  let funcGetUserMedia, vendorUrlCreator;

  // Standard
  if (navigator.getUserMedia) {
    funcGetUserMedia = navigator.getUserMedia.bind(navigator);
    vendorUrlCreator = null;
    console.log('Using standard getUserMedia');

  // Webkit-specific
  } else if (navigator.webkitGetUserMedia) {
    funcGetUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    vendorUrlCreator = window.URL.createObjectURL;
    console.log('Using Webkit getUserMedia');

  // Gecko-specific
  } else if (navigator.mozGetUserMedia) {
    funcGetUserMedia = navigator.mozGetUserMedia.bind(navigator);
    vendorUrlCreator = window.URL.createObjectURL;
    console.log('Using Mozilla getUserMedia');
  }

  const streamHandler = createStreamHandler(videoDOMNode, vendorUrlCreator);
  funcGetUserMedia(videoConstraints, streamHandler, mediaErrorHandler);

  // =====================================
  //
  //     Set up canvas and establish
  //  connection between canvas and video
  //
  // =====================================

  const canvasDOMNode = document.getElementById('display');
  const canvasContext = canvasDOMNode.getContext('2d');

  const updateCanvasFrame = (videoNode, context, width, height) => {

    const x0 = 0;
    const y0 = 0;

    if (videoNode.paused || videoNode.ended) {
      return;
    }

    // Paint the frame onto the canvas
    context.drawImage(videoNode, x0, y0, width, height);

    // Apply filter to the image frame
    let imageData = context.getImageData(x0, y0, width, height);
    filter(imageData.data);
    context.putImageData(imageData, x0, y0);

    // Request for next frame
    window.requestAnimationFrame(() => {
      updateCanvasFrame(videoNode, context, width, height);
    });
  };

  videoDOMNode.addEventListener('play', () => {
    updateCanvasFrame(videoDOMNode, canvasContext, CANVAS_WIDTH, CANVAS_HEIGHT);
  });

}(window, window.navigator, window.document, window.console));