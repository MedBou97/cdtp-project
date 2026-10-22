// mock-esp32.js
import { WebSocketServer } from 'ws';
import readline from 'readline';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

let state = {
  tilt: 0.2, // degrees
  battery: 12.4, // Volts
  charging: false, // Hardware dock indicator
};

// 1 Hz broadcast loop (Module 5.2 requirement)
setInterval(() => {
  // Add subtle sensor jitter (-0.2° to +0.2°)
  const jitterTilt = Number((state.tilt + (Math.random() * 0.4 - 0.2)).toFixed(1));
  
  const payload = JSON.stringify({
    tilt: jitterTilt,
    battery: state.battery,
    charging: state.charging,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}, 1000);

console.log(`🤖 Mock ESP32 active on ws://0.0.0.0:${PORT}`);
console.log('-------------------------------------------');
console.log('Terminal Keyboard Commands:');
console.log('  [c] -> Toggle charging dock status');
console.log('  [t] -> Simulate tilt tip (+12.0°)');
console.log('  [r] -> Reset tilt to balanced (0.2°)');
console.log('  [b] -> Lower battery voltage by 0.5V');
console.log('-------------------------------------------');

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') process.exit();

  if (key.name === 'c') {
    state.charging = !state.charging;
    console.log(`[STATE] Charging dock indicator: ${state.charging ? 'ACTIVE' : 'INACTIVE'}`);
  }
  if (key.name === 't') {
    state.tilt = 12.0;
    console.log('[STATE] High tilt triggered (+12.0°)');
  }
  if (key.name === 'r') {
    state.tilt = 0.2;
    console.log('[STATE] Balance restored (0.2°)');
  }
  if (key.name === 'b') {
    state.battery = Number((state.battery - 0.5).toFixed(2));
    console.log(`[STATE] Battery level: ${state.battery}V`);
  }
});