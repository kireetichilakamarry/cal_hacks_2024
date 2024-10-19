import './index.css'
import './style.css';
import firebase from 'firebase/app';
import 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const VideoChat = () => {

    const firebaseConfig = {
        apiKey: "AIzaSyBNjNJbbEYZxFwSzwcARlxVMCin4R63RZ8",
        authDomain: "cal-hacks-2024-b76af.firebaseapp.com",
        projectId: "cal-hacks-2024-b76af",
        storageBucket: "cal-hacks-2024-b76af.appspot.com",
        messagingSenderId: "196170393747",
        appId: "1:196170393747:web:0e6505a30f173119ef0566",
        measurementId: "G-PPZJZ7JL94"
      };
      
      // Initialize Firebase
      
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      const firestore = firebase.firestore();

      const servers = {
        iceServers: [
          {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
          },
        ],
        iceCandidatePoolSize: 10,
      };
      
      //const analytics = getAnalytics(app);
      
      //servers
      


      // Global State
      const pc = new RTCPeerConnection(servers);
      let localStream = null;
      let remoteStream = null;
      
      // HTML elements
      const webcamButton = document.getElementById('webcamButton');
      const webcamVideo = document.getElementById('webcamVideo');
      const callButton = document.getElementById('callButton');
      const callInput = document.getElementById('callInput');
      const answerButton = document.getElementById('answerButton');
      const remoteVideo = document.getElementById('remoteVideo');
      const hangupButton = document.getElementById('hangupButton');
      
      webcamButton.onclick = async () => {
        //get webcam perms
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
        //set to empty media stream until received
        remoteStream = new MediaStream();
      
        //local stream already running, so get its tracks and push all to pc
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        })
      
        // get to audio/video from peer connection (other person's video/audio) and add to remoteStream
        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          });
        };

        //assigning tracks to stream
        webcamVideo.srcObject = localStream;
        remoteVideo.srcObject = remoteStream;

        callButton.disabled = false;
        answerButton.disabled = false;
        webcamButton.disabled = true;
      };

    //Make an offer
    callButton.onclick = async () => {
        //reference firestore collection
        const callDoc = firestore.collection('calls').doc();
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        callInput.value = callDoc.id;

        // Get candidates for caller, save to db
        pc.onicecandidate = (event) => {
            event.candidate && offerCandidates.add(event.candidate.toJSON());
        };

        // Create offer
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription); 

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await callDoc.set({ offer });

        //Listen for remote answer
        callDoc.onSnapshot((snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });

            // When answered, add candidate to peer connection
        answerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });

    hangupButton.disabled = false;
    }

    answerButton.onclick = async () => {
        const callId = callInput.value;
        const callDoc = firestore.collection('calls').doc(callId);
        const answerCandidates = callDoc.collection('answerCandidates');
        const offerCandidates = callDoc.collection('offerCandidates');

        pc.onicecandidate = (event) => {
            event.candidate && answerCandidates.add(event.candidate.toJSON());
        };
        
        const callData = (await callDoc.get()).data();
    
        const offerDescription = callData.offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
    
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await callDoc.update({ answer });

        offerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
            console.log(change);
            if (change.type === 'added') {
                let data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
            }
        });
    });
};

    



return (
    <html lang="en">
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
    </html>
    )
}

export default VideoChat