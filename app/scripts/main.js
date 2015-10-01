(function(window, navigator, document, console) {

  'use strict';

  // =====================================
  //
  //        Create Colour Filters
  //
  // =====================================

  const original = data => data;

  const deuteranopia = data => {

    // Reference parameters from:
    // http://blog.noblemaster.com/wp-content/uploads/2013/10/2013-10-26-ColorCorrection.txt

    for (var i = 0; i < data.length; i += 4) {

      let getR = (r, g, b) => 0.43 * r + 0.72 * g + -0.15 * b;
      let getG = (r, g, b) => 0.34 * r + 0.57 * g + -0.09 * b;
      let getB = (r, g, b) => -0.02 * r + 0.03 * g + 1.00 * b;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      data[i] = getR(r, g, b);
      data[i+1] = getG(r, g, b);
      data[i+2] = getB(r, g, b);
    }
  };

  let filter = deuteranopia;

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
          console.log(videoNode.src);
        } else {
          videoNode.src = urlCreator(stream);
          console.log(videoNode.src);
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
    context.drawImage(videoNode, x0, y0, 320, 160);

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
    updateCanvasFrame(videoDOMNode, canvasContext, 640, 480);
  });

}(window, window.navigator, window.document, window.console));