import { io } from "socket.io-client";

const socket = io();  

const localVideo = document.getElementById("localVideo") as HTMLVideoElement;
const remoteVideo = document.getElementById("remoteVideo") as HTMLVideoElement;
const joinBtn = document.getElementById("joinBtn") as HTMLButtonElement;

let localStream: MediaStream;
let peerConnection: RTCPeerConnection;
const roomId = "default-room"; // Room ID for simplicity

// STUN Server configuration for WebRTC
const config: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

joinBtn.onclick = async () => {
  // Get media stream
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localVideo.srcObject = localStream;

  // Join room
  socket.emit("join-room", roomId);

  // Set up WebRTC peer connection
  peerConnection = new RTCPeerConnection(config);
  
  // Add local tracks to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // ICE candidate exchange
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };

  // Handle offer from remote peer
  socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
  });

  // Handle answer from remote peer
  socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  });

  // Handle ICE candidates from remote peer
  socket.on("ice-candidate", async (candidate: RTCIceCandidate) => {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Error adding received ice candidate", err);
    }
  });

  // Create offer if first in room
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
};
