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

  const rgbTolmsParameters = [
    [17.8824, 43.5161, 4.11935],
    [3.45565, 27.1554, 3.86714],
    [0.0299566, 0.184309, 1.46709]
  ];

  const lmsTorgbParameters = [
    [0.0809444479, -0.130504409, 0.116721066],
    [-0.0102485335, 0.0540193266, -0.113614708],
    [-0.000365296938, -0.00412161469, 0.693511405]
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