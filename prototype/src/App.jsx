//import { useState } from 'react'
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import './App.css'

function App() {

  return (
    <>
    <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WebRTC Demo</title>
        </head>
        <body>
        <h2>1. Start your Webcam</h2>
        <div className="videos">
            <span>
            <h3>Local Stream</h3>
            <video id="webcamVideo" autoPlay playsInline></video>
            </span>
            <span>
            <h3>Remote Stream</h3>
            <video id="remoteVideo" autoPlay playsInline></video>
            </span>
    
    
        </div>
    
        <button id="webcamButton">Start webcam</button>
        <h2>2. Create a new Call</h2>
        <button id="callButton" disabled>Create Call (offer)</button>
    
        <h2>3. Join a Call</h2>
        <p>Answer the call from a different browser window or device</p>
        
        <input id="callInput" />
        <button id="answerButton" disabled>Answer</button>
    
        <h2>4. Hangup</h2>
    
        <button id="hangupButton" disabled>Hangup</button>
    
        <script type="module" src="/main.js"></script>
    
        </body>
    </>
  )
}

export default App
