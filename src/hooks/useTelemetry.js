// src/hooks/useTelemetry.js
import { useState, useEffect, useRef } from 'react';
import { WS_URL, TELEMETRY_WATCHDOG_TIMEOUT_MS } from '../config';

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState({
    tilt: 0,
    battery: 0,
    isCharging: false,
  });
  const [isConnected, setIsConnected] = useState(false);
  const lastPacketTimestamp = useRef(Date.now());
  const socketRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;

    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          lastPacketTimestamp.current = Date.now();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setTelemetry({
              tilt: typeof data.tilt === 'number' ? data.tilt : 0,
              battery: typeof data.battery === 'number' ? data.battery : 0,
              isCharging: Boolean(data.charging),
            });
            lastPacketTimestamp.current = Date.now();
            setIsConnected(true);
          } catch (err) {
            console.error('Failed to parse incoming telemetry JSON:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Auto-reconnect loop
          reconnectTimeout = setTimeout(connect, 1000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 1000);
      }
    }

    connect();

    // 2-second timeout watchdog (Module 5.2 requirement)
    const watchdogTimer = setInterval(() => {
      const timeSinceLastPacket = Date.now() - lastPacketTimestamp.current;
      if (timeSinceLastPacket > TELEMETRY_WATCHDOG_TIMEOUT_MS) {
        setIsConnected(false);
      }
    }, 500);

    return () => {
      if (socketRef.current) socketRef.current.close();
      clearTimeout(reconnectTimeout);
      clearInterval(watchdogTimer);
    };
  }, []);

  return { telemetry, isConnected };
}