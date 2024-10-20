import { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import './style.css';

const firebaseConfig = {
  apiKey: "AIzaSyBNjNJbbEYZxFwSzwcARlxVMCin4R63RZ8",
  authDomain: "cal-hacks-2024-b76af.firebaseapp.com",
  projectId: "cal-hacks-2024-b76af",
  storageBucket: "cal-hacks-2024-b76af.appspot.com",
  messagingSenderId: "196170393747",
  appId: "1:196170393747:web:0e6505a30f173119ef0566",
  measurementId: "G-PPZJZ7JL94"
};

const VideoChat = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [pc, setPc] = useState(null);
  const [callId, setCallId] = useState('');

  const webcamVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callInputRef = useRef(null);
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

  useEffect(() => {
    

    const servers = {
      iceServers: [
        {
          urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
      ],
      iceCandidatePoolSize: 10,
    };

    setPc(new RTCPeerConnection(servers));
  }, []);

  const setupMediaSources = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    setRemoteStream(new MediaStream());

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    webcamVideoRef.current.srcObject = stream;
    remoteVideoRef.current.srcObject = remoteStream;
  };

  const createOffer = async () => {
    
    const callDocRef = doc(collection(firestore, 'calls'));
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');

    setCallId(callDocRef.id);

    pc.onicecandidate = (event) => {
      event.candidate && setDoc(doc(offerCandidatesCollection), event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDocRef, { offer });

    onSnapshot(callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    onSnapshot(answerCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  const answerCall = async () => {
    
    const callIdValue = callInputRef.current.value;
    const callDocRef = doc(firestore, 'calls', callIdValue);
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');

    pc.onicecandidate = (event) => {
      event.candidate && setDoc(doc(answerCandidatesCollection), event.candidate.toJSON());
    };

    const callDataSnap = await getDoc(callDocRef);
    const callData = callDataSnap.data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDocRef, { answer });

    onSnapshot(offerCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  return (
    <div>
      <h2>1. Start your Webcam</h2>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <video ref={webcamVideoRef} autoPlay playsInline />
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteVideoRef} autoPlay playsInline />
        </span>
      </div>

      <button onClick={setupMediaSources}>Start webcam</button>
      <h2>2. Create a new Call</h2>
      <button onClick={createOffer} disabled={!localStream}>Create Call (offer)</button>

      <h2>3. Join a Call</h2>
      <p>Answer the call from a different browser window or device</p>
      
      <input ref={callInputRef} value={callId} onChange={(e) => setCallId(e.target.value)} />
      <button onClick={answerCall} disabled={!localStream}>Answer</button>

      <h2>4. Hangup</h2>
      <button disabled={!localStream}>Hangup</button>
    </div>
  );
};

export default VideoChat;