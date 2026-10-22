// src/config.js

// By default, connect via the same-origin Vite proxy (/ws).
// When running standalone on hardware without Vite, fallback to ws://192.168.4.1/ws.
export const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (window.location.protocol === 'https:' ? `wss://${window.location.host}/ws` : 'ws://192.168.4.1/ws');

export const TELEMETRY_WATCHDOG_TIMEOUT_MS = 2000; // Strict 2-second cutoff rule

export const ARUCO_CONFIG = {
  STATION_MARKER_ID: 0,
  ROBOT_MARKER_ID: 1,
  MARKER_REAL_SIZE_CM: 10.0, // 10 cm printed square tag
  MIN_MOTION_THRESHOLD_PX: 3.5, // Deadband to ignore camera jitter
  TOLERANCE_DISTANCE_MIN_M: 0.8, // 0.8m - 1.2m range for Module B
  TOLERANCE_DISTANCE_MAX_M: 1.2,
};