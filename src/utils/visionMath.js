// src/utils/visionMath.js
import { ARUCO_CONFIG } from '../config';

/**
 * Calculates the center (x, y) of an ArUco quad from its 4 corners
 */
export function getMarkerCenter(corners) {
  const x = (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4;
  const y = (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4;
  return { x, y };
}

/**
 * Calculates the width in pixels of a square marker
 */
export function getMarkerPixelSize(corners) {
  return Math.hypot(corners[0].x - corners[1].x, corners[0].y - corners[1].y);
}

/**
 * Converts a pixel displacement into real centimeters using marker scaling
 */
export function pixelsToCentimeters(pixelDistance, markerPixelWidth) {
  if (!markerPixelWidth || markerPixelWidth === 0) return 0;
  const pixelsPerCm = markerPixelWidth / ARUCO_CONFIG.MARKER_REAL_SIZE_CM;
  return Math.round(pixelDistance / pixelsPerCm);
}

/**
 * Determines directional vector from previous to current position
 */
export function calculateMotionHeading(prevPos, currPos) {
  const dx = currPos.x - prevPos.x;
  const dy = currPos.y - prevPos.y;
  const distance = Math.hypot(dx, dy);

  if (distance < ARUCO_CONFIG.MIN_MOTION_THRESHOLD_PX) {
    return { state: 'Static Balance', direction: 'None', displacementPx: 0 };
  }

  let direction = 'None';
  if (Math.abs(dx) > Math.abs(dy)) {
    direction = dx > 0 ? 'Right' : 'Left';
  } else {
    // Canvas Y-axis is inverted: negative dy is upward/forward
    direction = dy < 0 ? 'Forward' : 'Backward';
  }

  return { state: 'Moving', direction, displacementPx: distance };
}