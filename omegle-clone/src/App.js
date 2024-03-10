import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const roomID = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    socketRef.current = io.connect(SERVER_URL);

    socketRef.current.on("room", (room) => {
      console.log(`Joined room ${room}`);
      setIsConnected(true);
      roomID.current = room;
      startVideoCall();
    });

    socketRef.current.on("signal", (data) => {
      peerRef.current.signal(data);
    });

    socketRef.current.on("peerDisconnected", () => {
      console.log("Peer disconnected");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setIsConnected(false);
    });

    return () => {
      socketRef.current.disconnect();
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const startVideoCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerRef.current = new Peer({ initiator: true, stream });

        peerRef.current.on("signal", (data) => {
          socketRef.current.emit("signal", {
            signalData: data,
            room: roomID.current,
          });
        });

        peerRef.current.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
      });
  };

  const handleStartClick = () => {
    socketRef.current.emit("join");
  };

  return (
    <div>
      {!isConnected && (
        <button onClick={handleStartClick}>Start Video Call</button>
      )}
      <video playsInline muted ref={localVideoRef} autoPlay />
      {isConnected && (
        <video
          playsInline
          ref={remoteVideoRef}
          autoPlay
          style={{ display: isConnected ? "block" : "none" }}
        />
      )}
    </div>
  );
}

export default App;
