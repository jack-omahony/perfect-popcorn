import { useState } from 'react';
import './App.css';

var ContextConstructor = window.AudioContext || window.webkitAudioContext;

const context = new ContextConstructor({
  latencyHint: 'interactive',
  sampleRate: 8000,
});

context.audioWorklet.addModule('worklet/volume-meter.js');

const volumeMeter = new AudioWorkletNode(context, 'volume-meter');

volumeMeter.port.onmessage = ({data}) => {
  console.log('volume', data);
}

var mic;

function App() {

  const [listening, setListening] = useState(false);

  const [stream, setStream] = useState(null);

  const startListening = () => {
    const constraints = { audio: true, video: false };
    navigator.mediaDevices.getUserMedia(constraints)
      .then(function(stream) {
        setStream(stream);
        setListening(true);

        mic = context.createMediaStreamSource(stream);
        mic.connect(volumeMeter);
      })
      .catch(function(err) {
        console.error(err);
        stopListening();
      });
  }

  const stopListening = () => {
    stream.getAudioTracks().forEach(track => {
      track.stop();
    });
    setListening(false);
  }

  return (
    <div className="App">
      {!listening && <button onClick={startListening}>Start Listening</button>}
      {listening && <button onClick={stopListening}>Stop Listening</button>}
    </div>
  );
}

export default App;
