const canvas = document.getElementById('pulseCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

let nodes = [];
let pulseData = {};

async function fetchNodes() {
  const res = await fetch('/api/nodes');
  nodes = await res.json();
  layoutNodes();
}

async function fetchPulse() {
  const res = await fetch('/api/data');
  pulseData = await res.json();
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
  // Normalize with a logarithmic scale to make differences more visible
  if (latency <= 0) return 0;
  const logLatency = Math.log10(latency);
  return Math.min((logLatency - 6) * 10, 30); // Range approx: [0-30]
}

function drawNodes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  nodes.forEach(node => {
    const data = pulseData[node.name];
    const alive = data?.available ?? false;
    const latency = data?.latency ?? 0;
    const baseRadius = 30;
    const pulseRadius = baseRadius + scaleLatency(latency);

    ctx.beginPath();
    ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
    ctx.fillStyle = alive ? node.theme.primary : '#333';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = alive ? node.theme.secondary : '#111';
    ctx.stroke();
  });
}

async function tick() {
  await fetchPulse();
  drawNodes();
}

async function start() {
  await fetchNodes();
  await tick();
  setInterval(tick, 1000);
}

start();
