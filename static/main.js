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

    const pulseSpeed = 0.8;
    const driftIncrement = (latency / 1e6) * pulseSpeed;
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
  ctx.globalAlpha = 0.2; // ghost wash layer

  nodes.forEach(node => {
    const data = pulseData[node.name];
    const state = pulseState[node.name];
    const alive = data?.available ?? false;

    const pulseAmplitude = 0.3;
    const pulseSpeed = 0.002;
    const phase = state.driftPhase ?? 0;
    const pulseOffset = Math.sin(time * pulseSpeed + phase) * pulseAmplitude;

    const stiffness = 0.4;
    const damping = 0.8;
    const delta = state.target - state.current;
    state.velocity += stiffness * delta;
    state.velocity *= damping;
    state.current += state.velocity;

    const baseRadius = state.current;
    const pulseRadius = baseRadius + pulseOffset;

    // Outer wash effect
    const waveRadius = pulseRadius * 10 + (Math.sin(time * pulseSpeed + phase) * pulseAmplitude);
    const gradient = ctx.createRadialGradient(node.x, node.y, pulseRadius, node.x, node.y, waveRadius);
    gradient.addColorStop(0, alive ? node.theme.primary : '#333');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, waveRadius, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.globalAlpha = 0.5; // reset

  nodes.forEach(node => {
    const data = pulseData[node.name];
    const state = pulseState[node.name];
    const alive = data?.available ?? false;

    const baseRadius = state.current;
    const pulseAmplitude = 15;
    const pulseSpeed = 0.08;
    const phase = state.driftPhase ?? 0;
    const pulseOffset = Math.sin(time * pulseSpeed + phase) * pulseAmplitude;
    const pulseRadius = baseRadius + pulseOffset;

    ctx.beginPath();
    ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
    const intensity = 0.0 + 0.1 * Math.abs(pulseOffset / pulseAmplitude); // pulse-modulated opacity
    ctx.fillStyle = alive ? node.theme.primary : '#333';
    ctx.globalAlpha = intensity;
    ctx.fill();
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 0;
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
  setInterval(tick, 1000);
  animate();
}

start();
