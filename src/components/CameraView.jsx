// src/components/CameraView.jsx
import React from 'react';

export default function CameraView({ videoRef, canvasRef, children }) {
  return (
    <div className="relative flex-1 h-full w-full bg-black flex items-center justify-center overflow-hidden">
      {/* Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {/* Hidden processing canvas for ArUco detection */}
      <canvas ref={canvasRef} width={1280} height={720} className="hidden" />

      {/* Floating Children / Overlays */}
      {children}
    </div>
  );
}