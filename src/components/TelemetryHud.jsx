// src/components/TelemetryHud.jsx
import { Wifi, WifiOff, Battery, Compass, Zap, Navigation } from 'lucide-react';

export default function TelemetryHud({ telemetry, isConnected, visionState }) {
  return (
    <div className="mobile-safe-top absolute z-10 w-[calc(100%-1.5rem)] max-w-[280px] rounded-xl border border-slate-700/60 bg-slate-900/85 p-3 text-slate-100 shadow-xl backdrop-blur-md sm:w-auto sm:max-w-none sm:min-w-[270px] sm:p-4">
      {/* Connection & Watchdog Status */}
      <div className="mb-2 flex items-center gap-2 border-b border-slate-700/50 pb-2 sm:mb-3">
        {isConnected ? (
          <Wifi className="text-emerald-400 w-5 h-5 animate-pulse" />
        ) : (
          <WifiOff className="text-red-500 w-5 h-5" />
        )}
        <span
          className={`text-xs font-bold tracking-wider ${
            isConnected ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isConnected ? 'ROBOT LINKED (1 Hz)' : 'DISCONNECTED (>2s)'}
        </span>
      </div>

      {/* Hardware Telemetry */}
      <div className="flex flex-col gap-1.5 text-xs sm:gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Compass className="w-4 h-4 text-cyan-400" /> Tilt Angle:
          </span>
          <span className="font-mono font-semibold text-slate-100">
            {telemetry.tilt.toFixed(1)}°
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Battery className="w-4 h-4 text-amber-400" /> Battery:
          </span>
          <span className="font-mono font-semibold text-slate-100">
            {telemetry.battery.toFixed(2)} V
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-4 h-4 text-yellow-400" /> Dock Charging:
          </span>
          <span
            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
              telemetry.isCharging
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {telemetry.isCharging ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>

        <hr className="border-slate-800 my-1" />

        {/* Vision Tracking Telemetry */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Navigation className="w-4 h-4 text-purple-400" /> Motion State:
          </span>
          <span className="font-semibold text-slate-100">
            {visionState.motionState}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Direction:</span>
          <span className="font-semibold text-purple-300">
            {visionState.direction}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Dock Distance:</span>
          <span className="font-mono font-semibold text-slate-100">
            {visionState.distanceToDockCm !== null
              ? `~${visionState.distanceToDockCm} cm`
              : 'Searching markers...'}
          </span>
        </div>
      </div>
    </div>
  );
}