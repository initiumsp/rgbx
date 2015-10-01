(function(window, navigator, document, console) {

  'use strict';

  const videoDOMNode = document.getElementById("video");
  const videoConstraints = {
          video: true,
          audio: false
        };

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

  // =====================================
  //
  // Set up vendor-specific media input
  //
  // =====================================

  let funcGetUserMedia, vendorURLCreator;

  // Standard
  if (navigator.getUserMedia) {
    funcGetUserMedia = navigator.getUserMedia.bind(navigator);
    vendorURLCreator = null;
    console.log('Using standard getUserMedia');

  // Webkit-specific
  } else if (navigator.webkitGetUserMedia) {
    funcGetUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    vendorURLCreator = window.URL.createObjectURL;
    console.log('Using Webkit getUserMedia');

  // Gecko-specific
  } else if (navigator.mozGetUserMedia) {
    funcGetUserMedia = navigator.mozGetUserMedia.bind(navigator);
    vendorURLCreator = window.URL.createObjectURL;
    console.log('Using Mozilla getUserMedia');
  }

  const streamHandler = createStreamHandler(videoDOMNode, vendorURLCreator);
  funcGetUserMedia(videoConstraints, streamHandler, mediaErrorHandler);

}(window, window.navigator, window.document, window.console));