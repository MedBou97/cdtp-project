// src/App.jsx
import React from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { useCameraVision } from './hooks/useCameraVision';
import CameraView from './components/CameraView';
import TelemetryHud from './components/TelemetryHud';
import TestManager from './components/TestManager';

export default function App() {
  const { telemetry, isConnected } = useTelemetry();
  const {
    videoRef,
    canvasRef,
    visionState,
    resetTrajectoryTracking,
    stopTrajectoryTracking,
  } = useCameraVision();

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      {/* Primary Video Feed with Floating HUD */}
      <CameraView videoRef={videoRef} canvasRef={canvasRef}>
        <TelemetryHud
          telemetry={telemetry}
          isConnected={isConnected}
          visionState={visionState}
        />
      </CameraView>

      {/* Right/Bottom Control Panel & Audit Manager */}
      <TestManager
        telemetry={telemetry}
        visionState={visionState}
        onStartTracking={resetTrajectoryTracking}
        onStopTracking={stopTrajectoryTracking}
      />
    </div>
  );
}