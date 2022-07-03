import { useEffect, useState } from 'react';
import logo from './Perfect Popcorn.svg';
import './App.scss';

var ContextConstructor = window.AudioContext || window.webkitAudioContext;

const context = new ContextConstructor({
  latencyHint: 'interactive',
  sampleRate: 8000,
});

var interval;
var volumeMeter;
var mic;
var bandpassFilter;

const createBandPasFilter = (low, high, context) => {
  var geometricMean = Math.sqrt(low * high);
  var filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = geometricMean;
  filter.Q.value = geometricMean / (high - low);
  // debugger;
  return filter;
}

context.audioWorklet.addModule('worklet/volume-meter.js').then(() => {
  volumeMeter = new AudioWorkletNode(context, 'volume-meter');
});

const formatTime = (timeDiff) => {
  var sigFigs = 2
  if(timeDiff / 1000 < 1){
    sigFigs = 1;
  }
  return (timeDiff / 1000).toPrecision(sigFigs);
}

function App() {

  const [listening, setListening] = useState(false);
  const [stream, setStream] = useState(null);
  const [lastPeak, setLastPeak] = useState(null);
  const [sensitivity, setSensitivity] = useState(100);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    if(listening){
      volumeMeter.port.onmessage = ({ data }) => {
        if (data * 1000 > sensitivity) { 
          setLastPeak(Date.now());
          console.log('volume', data * 1000);
        }
      }
    }

  }, [sensitivity, listening]);


  useEffect(() => {
    if(lastPeak){
      interval = setInterval(() => {
        setDuration(Date.now() - lastPeak);
      }, 16);
    }

    return () => clearInterval(interval);
  }, [lastPeak]);

  const startListening = () => {
    const constraints = { audio: true, video: false };
    navigator.mediaDevices.getUserMedia(constraints)
      .then(function (stream) {
        setStream(stream);
        setListening(true);

        mic = context.createMediaStreamSource(stream);
        bandpassFilter = createBandPasFilter(350, 2000, context);
        mic.connect(bandpassFilter);
        bandpassFilter.connect(volumeMeter);
      })
      .catch(function (err) {
        console.error(err); 
        stopListening(); 
      });
  }

  const stopListening = () => {
    stream?.getAudioTracks().forEach(track => {
      track.stop();
    });
    mic?.disconnect(bandpassFilter);
    setListening(false);
    clearInterval(interval);
  }

  return (
    <div className="App">
       <img src={logo} className="App-logo" alt="logo" />
        
      {!listening && <button onClick={startListening}>Start</button>}
      {listening && <button onClick={stopListening}>Stop</button>}
      {lastPeak && <div id='ticket'><p>Time since last pop</p><div><span>{formatTime(duration)}</span>S</div></div>}
      <fieldset>
      <input id='sensitivity' type="range" defaultValue={sensitivity} min="0" max="200" onChange={e => setSensitivity(e.target.value)} />
      <label htmlFor="sensitivity">Adjust Sensitivity</label>
      </fieldset>
    </div>
  );
}


export default App;
