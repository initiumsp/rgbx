(function(window, navigator, document, console) {

  'use strict';

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

  // =====================================
  //
  // Set up vendor-specific media input
  //
  // =====================================

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
    if (videoNode.paused || videoNode.ended) {
      return;
    }
    context.drawImage(videoNode, 0, 0, width, height);

    window.setTimeout(() => {
      updateCanvasFrame(videoNode, context, width, height);
    }, 16);
    console.log('running');
  };

  videoDOMNode.addEventListener('play', () => {
    updateCanvasFrame(videoDOMNode, canvasContext, 640, 480);
  });

}(window, window.navigator, window.document, window.console));