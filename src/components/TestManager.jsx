// src/components/TestManager.jsx
import { useState, useRef } from 'react';
import { Play, Square, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';
import { generateReportDigest } from '../utils/reportCrypto';
import { ARUCO_CONFIG } from '../config';

export default function TestManager({
  telemetry,
  visionState,
  onStartTracking,
  onStopTracking,
}) {
  const [selectedTask, setSelectedTask] = useState('Robot Guidance');
  const [isTesting, setIsTesting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [report, setReport] = useState(null);

  const timerRef = useRef(null);

  const handleStart = () => {
    setIsTesting(true);
    setElapsedSeconds(0);
    setReport(null);
    onStartTracking();

    timerRef.current = setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);
  };

  const handleEnd = async () => {
    clearInterval(timerRef.current);
    setIsTesting(false);
    onStopTracking();

    // Evaluation logic according to Table 8 & Section 5.2
    let isPass = false;
    let detail = '';

    if (selectedTask === 'Static Balance') {
      // 30 seconds static balance without falling
      isPass = elapsedSeconds >= 30;
      detail = isPass
        ? 'Maintained static balance for required 30s.'
        : `Test ended early (${elapsedSeconds}s / 30s).`;
    } else if (selectedTask === 'Robot Guidance') {
      // 0.8m - 1.2m range
      const distanceM = (visionState.cumulativeDistanceCm || 0) / 100;
      isPass =
        distanceM >= ARUCO_CONFIG.TOLERANCE_DISTANCE_MIN_M &&
        distanceM <= ARUCO_CONFIG.TOLERANCE_DISTANCE_MAX_M;
      detail = `Measured ${distanceM.toFixed(2)}m (Target: 0.8m - 1.2m).`;
    } else if (selectedTask === 'Charging') {
      // Docking and charging within 5s
      isPass = telemetry.isCharging && elapsedSeconds <= 5;
      detail = isPass
        ? 'Hardware charging verified within 5s threshold.'
        : 'Failed to initiate charging within 5s.';
    } else if (selectedTask === 'Integrated Task') {
      // Delivery + Autonomous docking
      const distM = (visionState.cumulativeDistanceCm || 0) / 100;
      isPass = distM >= 0.8 && telemetry.isCharging;
      detail = isPass
        ? 'Full sequence: travel and autonomous docking verified.'
        : 'Sequence incomplete: target distance or charging unconfirmed.';
    }

    const reportData = {
      task: selectedTask,
      timestamp: new Date().toISOString(),
      durationSec: elapsedSeconds,
      distanceTravelledM: ((visionState.cumulativeDistanceCm || 0) / 100).toFixed(2),
      recordedTilt: `${telemetry.tilt.toFixed(1)}°`,
      passed: isPass,
      diagnostic: detail,
    };

    // Calculate tamper-evident SHA-256 digest
    const digest = await generateReportDigest(reportData);

    setReport({
      ...reportData,
      hashDigest: digest,
    });
  };

  return (
    <div className="mobile-safe-bottom flex h-auto w-full shrink-0 flex-col justify-start gap-4 overflow-visible border-t border-slate-800 bg-slate-900 p-4 text-slate-100 md:h-full md:w-80 md:justify-between md:gap-0 md:overflow-y-auto md:border-l md:border-t-0 md:p-5 lg:w-96">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-cyan-400 w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            YTU Evaluation Console
          </h2>
        </div>

        {/* Task Selection */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 block mb-1">
            Official Evaluation Subtest
          </label>
          <select
            disabled={isTesting}
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="Static Balance">Module A: Static Balance (30s)</option>
            <option value="Robot Guidance">Module B: Guidance (0.8m - 1.2m)</option>
            <option value="Charging">Module C: Autonomous Charging (&lt;5s)</option>
            <option value="Integrated Task">Module E: Integrated Task Delivery</option>
          </select>
        </div>

        {/* Controls */}
        {!isTesting ? (
          <button
            onClick={handleStart}
            className="min-h-11 w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition duration-200 hover:bg-emerald-600 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> START SCORED TEST
          </button>
        ) : (
          <button
            onClick={handleEnd}
            className="min-h-11 w-full flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-500/20 transition duration-200 hover:bg-red-600 cursor-pointer animate-pulse"
          >
            <Square className="w-4 h-4 fill-current" /> END TEST & GRADE ({elapsedSeconds}s)
          </button>
        )}
      </div>

      {/* Tamper-Evident Report Card */}
      {report && (
        <div
          className={`mt-0 flex flex-col gap-2 rounded-xl border p-4 text-xs md:mt-4 ${
            report.passed
              ? 'bg-emerald-950/30 border-emerald-600/50 text-emerald-200'
              : 'bg-red-950/30 border-red-600/50 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {report.passed ? (
              <ShieldCheck className="text-emerald-400 w-5 h-5" />
            ) : (
              <ShieldAlert className="text-red-400 w-5 h-5" />
            )}
            <span className="font-bold text-sm">
              {report.passed ? 'TEST PASSED (+5 Pts)' : 'TEST FAILED (0 Pts)'}
            </span>
          </div>

          <div className="text-[11px] space-y-1 text-slate-300 border-t border-slate-700/40 pt-2">
            <div>Task: <span className="font-medium text-slate-100">{report.task}</span></div>
            <div>Time: <span className="font-medium text-slate-100">{report.durationSec}s</span></div>
            <div>Distance: <span className="font-medium text-slate-100">{report.distanceTravelledM}m</span></div>
            <div>Diagnostic: <span className="font-medium text-slate-100">{report.diagnostic}</span></div>
            <div>Timestamp: <span className="font-mono text-[9px] text-slate-400">{report.timestamp}</span></div>
            <div className="pt-1">
              <span className="text-[9px] text-slate-500 block">SHA-256 Digest:</span>
              <span className="font-mono text-[8px] text-slate-400 break-all select-all">
                {report.hashDigest}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}