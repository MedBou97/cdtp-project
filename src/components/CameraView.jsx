// src/components/CameraView.jsx
export default function CameraView({ videoRef, canvasRef, children }) {
  return (
    <div className="relative flex h-[52svh] min-h-[280px] max-h-[580px] w-full shrink-0 items-center justify-center overflow-hidden bg-black md:h-full md:min-h-0 md:max-h-none md:flex-1">
      {/* Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      {/* Hidden processing canvas for ArUco detection */}
      <canvas ref={canvasRef} width={1280} height={720} className="hidden" />

      {/* Floating Children / Overlays */}
      {children}
    </div>
  );
}