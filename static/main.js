const canvas = document.getElementById('pulseCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

let nodes = [];
let pulseData = {};
let pulseState = {};
let time = 0;

async function fetchNodes() {
  const res = await fetch('/api/nodes');
  nodes = await res.json();
  layoutNodes();
  nodes.forEach(node => {
    pulseState[node.name] = {
      current: 30,
      target: 30,
      velocity: 0,
      // Cumulative drift phase based on latency-induced offset
      driftPhase: 0
    };
  });
}

async function fetchPulse() {
  const res = await fetch('/api/data');
  pulseData = await res.json();

  nodes.forEach(node => {
    const data = pulseData[node.name];
    const latency = data?.latency ?? 0;
    const latencyScale = scaleLatency(latency);
    pulseState[node.name].target = 30 + latencyScale;

    // If lastUpdate is available, use it to estimate drift phase (relative to local time)
    const now = Date.now();
    const lastUpdate = new Date(data?.lastUpdate).getTime();
    const driftMs = now - lastUpdate;
    const driftSec = driftMs / 1000;
    const pulseSpeed = 0.08;
    // Accumulate drift based on latency over time
    const driftIncrement = (latency / 1e6) * pulseSpeed; // Convert ns to ms, then scale
    pulseState[node.name].driftPhase += driftIncrement;
  });
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', () => {
  resizeCanvas();
  layoutNodes();
});

function layoutNodes() {
  const radius = Math.min(canvas.width, canvas.height) / 3;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const angleStep = (2 * Math.PI) / nodes.length;

  nodes.forEach((node, i) => {
    node.x = centerX + radius * Math.cos(i * angleStep);
    node.y = centerY + radius * Math.sin(i * angleStep);
  });
}

function scaleLatency(latency) {
  if (latency <= 0) return 0;
  const logLatency = Math.log10(latency);
  return Math.min((logLatency - 6) * 10, 30);
}

function drawNodes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  nodes.forEach(node => {
    const data = pulseData[node.name];
    const state = pulseState[node.name];
    const alive = data?.available ?? false;

    const pulseAmplitude = 3;
    const pulseSpeed = 0.08;
    const phase = state.driftPhase ?? 0;
    const pulseOffset = Math.sin(time * pulseSpeed + phase) * pulseAmplitude;

    // Spring-like overshoot behavior
    const stiffness = 0.1;
    const damping = 0.4;
    const delta = state.target - state.current;
    state.velocity += stiffness * delta;
    state.velocity *= damping;
    state.current += state.velocity;

    const baseRadius = state.current;
    const pulseRadius = baseRadius + pulseOffset;

    ctx.beginPath();
    ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
    ctx.fillStyle = alive ? node.theme.primary : '#333';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = alive ? node.theme.secondary : '#111';
    ctx.stroke();
  });
}

async function tick() {
  await fetchPulse();
}

function animate() {
  drawNodes();
  time++;
  requestAnimationFrame(animate);
}

async function start() {
  await fetchNodes();
  await tick();
  setInterval(tick, 250);
  animate();
}

start();
