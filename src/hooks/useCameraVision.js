// src/hooks/useCameraVision.js
import { useState, useEffect, useRef } from 'react';
import { AR } from 'js-aruco';
import { ARUCO_CONFIG } from '../config';
import {
  getMarkerCenter,
  getMarkerPixelSize,
  pixelsToCentimeters,
  calculateMotionHeading,
} from '../utils/visionMath';

export function useCameraVision() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [visionState, setVisionState] = useState({
    distanceToDockCm: null,
    motionState: 'Static Balance',
    direction: 'None',
    robotDetected: false,
    stationDetected: false,
    cumulativeDistanceCm: 0,
  });

  const prevRobotPos = useRef(null);
  const initialRobotPos = useRef(null);
  const prevDockDistance = useRef(null);
  const isTrackingCumulative = useRef(false);

  // Method to reset distance counter when starting a scored test
  const resetTrajectoryTracking = () => {
    initialRobotPos.current = prevRobotPos.current;
    isTrackingCumulative.current = true;
    setVisionState((prev) => ({ ...prev, cumulativeDistanceCm: 0 }));
  };

  const stopTrajectoryTracking = () => {
    isTrackingCumulative.current = false;
  };

  useEffect(() => {
    let streamInstance = null;

    // 1. Request environment (rear) camera
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        streamInstance = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Camera access denied or unavailable:', err);
      });

    const detector = new AR.Detector();

    // 2. Detection loop running at ~15-20 FPS
    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Detect ArUco tags
      const markers = detector.detect(imageData);
      const station = markers.find((m) => m.id === ARUCO_CONFIG.STATION_MARKER_ID);
      const robot = markers.find((m) => m.id === ARUCO_CONFIG.ROBOT_MARKER_ID);

      let distanceCm = null;
      let motion = 'Static Balance';
      let direction = 'None';
      let cumulativeCm = 0;

      if (robot) {
        const robotCenter = getMarkerCenter(robot.corners);
        const robotPxWidth = getMarkerPixelSize(robot.corners);

        // Motion & direction vector
        if (prevRobotPos.current) {
          const heading = calculateMotionHeading(prevRobotPos.current, robotCenter);
          motion = heading.state;
          direction = heading.direction;
        }
        prevRobotPos.current = robotCenter;

        // Cumulative distance traveled from test starting point
        if (isTrackingCumulative.current && initialRobotPos.current) {
          const totalPx = Math.hypot(
            robotCenter.x - initialRobotPos.current.x,
            robotCenter.y - initialRobotPos.current.y
          );
          cumulativeCm = pixelsToCentimeters(totalPx, robotPxWidth);
        }

        // Distance to charging dock if both markers visible
        if (station) {
          const stationCenter = getMarkerCenter(station.corners);
          const stationPxWidth = getMarkerPixelSize(station.corners);
          const pixelGap = Math.hypot(
            robotCenter.x - stationCenter.x,
            robotCenter.y - stationCenter.y
          );

          distanceCm = pixelsToCentimeters(pixelGap, stationPxWidth);

          // Refine direction relative to docking station
          if (prevDockDistance.current !== null && motion === 'Moving') {
            const delta = distanceCm - prevDockDistance.current;
            if (delta < -1) direction = 'Forward (Toward Dock)';
            else if (delta > 1) direction = 'Backward (Away from Dock)';
          }
          prevDockDistance.current = distanceCm;
        }
      }

      setVisionState((prev) => ({
        ...prev,
        distanceToDockCm: distanceCm,
        motionState: motion,
        direction: direction,
        robotDetected: Boolean(robot),
        stationDetected: Boolean(station),
        cumulativeDistanceCm: isTrackingCumulative.current
          ? cumulativeCm
          : prev.cumulativeDistanceCm,
      }));
    }, 66);

    return () => {
      clearInterval(interval);
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    visionState,
    resetTrajectoryTracking,
    stopTrajectoryTracking,
  };
}