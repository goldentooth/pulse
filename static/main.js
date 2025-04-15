const canvas = document.getElementById("pulseCanvas");
const ctx = canvas.getContext("2d");

let nodes = [];
let pulseData = {};
let nodePositions = {};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

async function loadNodes() {
  const res = await fetch("/api/nodes");
  nodes = await res.json();
  layoutNodes();
}

async function fetchPulseData() {
  try {
    const res = await fetch("/api/data");
    pulseData = await res.json();
  } catch (err) {
    console.error("Failed to fetch pulse data:", err);
  }
}

function layoutNodes() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) * 0.7;

  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    nodePositions[node.name] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  nodes.forEach((node) => {
    const pos = nodePositions[node.name];
    const pulse = pulseData[node.name];

    const color = node.theme.primary || "#ffffff";
    const available = pulse?.available ?? false;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, available ? 10 : 6, 0, 2 * Math.PI);
    ctx.fillStyle = available ? color : "#444";
    ctx.fill();

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#ccc";
    ctx.fillText(node.name, pos.x - 15, pos.y - 12);
  });

  requestAnimationFrame(draw);
}

// Initial Setup
loadNodes().then(() => {
  draw();
  setInterval(fetchPulseData, 2000);
});
