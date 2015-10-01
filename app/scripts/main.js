(function(window, navigator, document, console) {

  'use strict';

  const videoDOMNode = document.getElementById("video");
  const canvasDOMNode = document.getElementById('display');
  const videoConstraints = {
          video: true,
          audio: false
        };

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

}(window, window.navigator, window.document, window.console));