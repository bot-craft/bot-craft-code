// test-speech-recognition.js
function testSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    // console.log('Speech recognition started');
  };
  
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');
    
    // console.log('Transcript:', transcript);
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
  };
  
  recognition.onend = () => {
    // console.log('Speech recognition ended');
  };
  
  recognition.start();
  // console.log('Started recognition, speak now...');
  
  // Stop after 10 seconds
  setTimeout(() => {
    recognition.stop();
    // console.log('Recognition stopped after timeout');
  }, 10000);
}

// Call the test function
testSpeechRecognition();