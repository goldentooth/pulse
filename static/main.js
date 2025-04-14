const canvas = document.getElementById('pulseCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

let nodes = [];

async function fetchNodes() {
  const res = await fetch('/api/nodes');
  nodes = await res.json();
  layoutNodes();
  drawNodes();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', () => {
  resizeCanvas();
  layoutNodes();
  drawNodes();
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

function drawNodes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI);
    ctx.fillStyle = node.theme.primary || '#ffffff';
    ctx.fill();
    ctx.strokeStyle = node.theme.secondary || '#888888';
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

fetchNodes();
