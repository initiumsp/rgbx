(function(window, navigator, document, console) {

  'use strict';

  // =====================================
  //
  // Create Colour Filters
  //
  // =====================================


  // =====================================
  //
  // Set up vendor-specific media input
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
  // Set up canvas and establish connection between canvas and video
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

    console.log(videoNode.offsetWidth, videoNode.offsetHeight);

    context.drawImage(videoNode, x0, y0, 320, 160);
    window.requestAnimationFrame(() => {
      updateCanvasFrame(videoNode, context, width, height);
    });
  };

  videoDOMNode.addEventListener('play', () => {
    updateCanvasFrame(videoDOMNode, canvasContext, 640, 480);
  });

}(window, window.navigator, window.document, window.console));