(function(window, navigator, document, console) {

  'use strict';

  // =====================================
  //
  //        Define constants
  //
  // =====================================

  const CANVAS_WIDTH  = 640;
  const CANVAS_HEIGHT = 480;

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

  const createLinearFilterFast = parameterMatrix =>
    data => {
      for (let i = 0; i < data.length; i += 4) {
        let pixelVec = [data[i], data[i + 1], data[i + 2]];
        [data[i], data[i + 1], data[i + 2]] = matrixVectorProduct(parameterMatrix, pixelVec)
      }
    };

  const createLinearFilter = parameterMatrix =>

    data => {

      for (let i = 0; i < data.length; i += 4) {

        let computeR = (r, g, b) => parameterMatrix[0][0] * r + parameterMatrix[0][1] * g + parameterMatrix[0][2] * b,
            computeG = (r, g, b) => parameterMatrix[1][0] * r + parameterMatrix[1][1] * g + parameterMatrix[1][2] * b,
            computeB = (r, g, b) => parameterMatrix[2][0] * r + parameterMatrix[2][1] * g + parameterMatrix[2][2] * b;

        let r = data[i],
            g = data[i + 1],
            b = data[i + 2];

        data[i]   = computeR(r, g, b);
        data[i+1] = computeG(r, g, b);
        data[i+2] = computeB(r, g, b);
      }

    };

  let filter = createLinearFilter(deuteranopiaLinearParameters);

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