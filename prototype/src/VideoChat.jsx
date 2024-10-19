import { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import 'firebase/firestore';

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

  const webcamVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callInputRef = useRef(null);

  useEffect(() => {
    
    
    const servers = {}; // Add your STUN/TURN servers here
    const newPc = new RTCPeerConnection(servers);
    setPc(newPc);

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (pc) {
        pc.close();
      }
    };
  }, []);

  const handleWebcamButton = async () => {
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

    if (webcamVideoRef.current) webcamVideoRef.current.srcObject = stream;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  };

  const handleCallButton = async () => {
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const callDoc = firestore.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    if (callInputRef.current) callInputRef.current.value = callDoc.id;

    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  return (
    <div>
      <button onClick={handleWebcamButton}>Start Webcam</button>
      <div>
        <video ref={webcamVideoRef} autoPlay playsInline muted></video>
        <video ref={remoteVideoRef} autoPlay playsInline></video>
      </div>
      <button onClick={handleCallButton}>Call</button>
      <input ref={callInputRef} />
    </div>
  );
};

export default VideoChat;