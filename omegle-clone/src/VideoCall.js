import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

export function VideoCall({ partnerId, socket }) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [peer, setPeer] = useState(null);

  useEffect(() => {
    console.log("Setting up media devices and peer connection");
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        const newPeer = new Peer({
          initiator: true,
          stream,
        });

        newPeer.on("error", (err) => {
          console.error("Peer connection error:", err);
        });

        newPeer.on("signal", (data) => {
          console.log("Sending signal", data);
          socket.emit("signal", { partnerId, signal: data });
        });

        newPeer.on("stream", (partnerStream) => {
          console.log("Received partner stream");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = partnerStream;
          }
        });

        socket.on("signal", (data) => {
          console.log("Received signal", data);
          if (data && data.signal) {
            newPeer.signal(data.signal);
          }
        });

        setPeer(newPeer);

        return () => {
          console.log("Cleaning up VideoCall component");
          newPeer.destroy();
        };
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });
  }, [partnerId, socket]);

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted playsInline />
      <video ref={remoteVideoRef} autoPlay playsInline />
    </div>
  );
}

export function StartButton({ onStart }) {
  return <button onClick={onStart}>Start</button>;
}
