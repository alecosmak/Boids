/* jshint -W069, esversion:6 */
/** @type {HTMLCanvasElement} */
let canvas =
	/** @type {HTMLCanvasElement} */ document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
let height = window.innerHeight - 105;
let width = window.innerWidth - 20;
canvas.width = width;
canvas.height = height;
ctx.translate(0, height);
ctx.scale(1, -1);
ctx.fillStyle = "purple";
ctx.strokeStyle = "purple";

// user inputs
let animRange = document.getElementById("animSpeed");
animRange.oninput = () => (animationSpeed = animRange.value);
let sizeRange = document.getElementById("boidSize");
sizeRange.oninput = () => {
	boidL = parseFloat(sizeRange.value);
	sight = parseFloat(sightRange.value) * boidL;
	linkWidth = boidL / 3;
	circLineW = boidL / 2;
};
sizeRange.onmousedown = () => (doDrawSight = true);
sizeRange.onmouseup = () => (doDrawSight = false);
let sightRange = document.getElementById("sightDist");
sightRange.oninput = () => (sight = parseFloat(sightRange.value) * boidL);
sightRange.onmousedown = () => (doDrawSight = true);
sightRange.onmouseup = () => (doDrawSight = false);
let linkARange = document.getElementById("linkAlpha");
linkARange.oninput = () => (maxLinkAlpha = parseFloat(linkARange.value));

let alignRange = document.getElementById("alignFac");
alignRange.oninput = () => (alignmentFac = parseFloat(alignRange.value));
let seperRange = document.getElementById("seperFac");
seperRange.oninput = () => (seperationFac = parseFloat(seperRange.value));
let cohesRange = document.getElementById("cohesFac");
cohesRange.oninput = () => (cohesionFac = parseFloat(cohesRange.value));

let bounceBox = document.getElementById("bounceBox");
bounceBox.onclick = () => {
	doBounce = bounceBox.checked;
};
let linkBox = document.getElementById("linkBox");
linkBox.onclick = () => {
	doDrawLinks = linkBox.checked;
};
let addButt = document.getElementById("addButt");
addButt.onclick = () => {
	for (let i = 0; i < 10; i++) {
		addBoid();
	}
};

// game variables
const boidSpeed = 1;
const colTime = 10;
const boidColor = "#a33";
const linkColor = "#ccccee";
const sightColor = "#bfbd";
const bounceColor = "#33b";
const steerRad = 0.005;
const startBoids = 2000;

let animationSpeed = 1;
let boidL = 7;
let linkWidth = boidL / 3;
let circLineW = boidL / 2;
let sight = 10 * boidL;
let maxLinkAlpha = 150;
let doBounce = false;
let doDrawLinks = false;
let doDrawSight = false;
let circNum = Math.ceil(startBoids / 25);
let circTemp = circNum;
let alignmentFac = 0.5;
let cohesionFac = 0.4;
let seperationFac = 0.5;
let mouseX = -1;
let mouseY = -1;
let boids = [];
for (let i = 0; i < startBoids; i++) {
	addBoid();
}

function addBoid(
	x = (width - 4 * boidL) * Math.random() + 2 * boidL,
	y = (height - 4 * boidL) * Math.random() + 2 * boidL
) {
	let theta = 2 * Math.PI * Math.random();
	boids.push({
		x: x,
		y: y,
		vx: Math.cos(theta),
		vy: Math.sin(theta),
		theta: theta,
		colTime: 0,
	});
}

function drawBoid(boid) {
	// draws sight circle around a few boids
	if (doDrawSight && circTemp > 0) {
		ctx.save();
		ctx.strokeStyle = sightColor;
		ctx.lineWidth = circLineW;
		ctx.beginPath();
		ctx.arc(boid.x, boid.y, sight, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.restore();
		circTemp--;
	}

	// draws boid
	ctx.save();
	ctx.fillStyle = boidColor;
	// if boids bounce off walls
	if (boid.colTime > 0) ctx.fillStyle = bounceColor;
	ctx.translate(boid.x, boid.y);
	ctx.rotate(boid.theta - Math.PI / 2);
	ctx.beginPath();
	ctx.moveTo(0, 1.5 * boidL);
	ctx.lineTo(boidL, -boidL);
	ctx.lineTo(0, -boidL / 1.7);
	ctx.lineTo(-boidL, -boidL);
	ctx.fill();
	ctx.restore();
}
function drawLink(boid1, boid2, dist) {
	ctx.save();
	// links fade if long
	let alpha = Math.floor((maxLinkAlpha * (0.91 * sight - dist)) / sight);
	alpha = alpha.toString(16);
	alpha = alpha.length == 1 ? "0" + alpha : alpha;
	ctx.strokeStyle = linkColor + alpha;
	ctx.lineWidth = linkWidth;
	ctx.beginPath();
	ctx.moveTo(boid1.x, boid1.y);
	ctx.lineTo(boid2.x, boid2.y);
	ctx.stroke();
	ctx.restore();
}

// makes boids bounce off edges of screen
function bounceBoid(boid) {
	// left and right
	if (boid.x <= 0) {
		boid.vx *= boid.vx < 0 ? -1 : 1;
		boid.colTime = colTime;
	} else if (boid.x >= width) {
		boid.vx *= boid.vx > 0 ? -1 : 1;
		boid.colTime = colTime;
	}
	// top and bottom
	if (boid.y <= 0) {
		boid.vy *= boid.vy < 0 ? -1 : 1;
		boid.colTime = colTime;
	} else if (boid.y >= height) {
		boid.vy *= boid.vy > 0 ? -1 : 1;
		boid.colTime = colTime;
	}
}
// makes boids warp to other side of screen if it crosses screen edge
function warpBoid(boid) {
	boid.x = mod(boid.x, width);
	boid.y = mod(boid.y, height);
}

function steer(boid, delta) {
	let totX = 0;
	let totY = 0;
	let totVX = 0;
	let totVY = 0;
	let inSight = 0;

	// calculate total postions and velocities
	for (let i = 0; i < boids.length; i++) {
		let checkBoid = boids[i];
		let dist = Math.sqrt(
			(checkBoid.x - boid.x) * (checkBoid.x - boid.x) +
				(checkBoid.y - boid.y) * (checkBoid.y - boid.y)
		);

		// if boid is in sight
		if (boid != checkBoid && dist <= sight) {
			// if boid is in link draw range
			if (doDrawLinks && dist < 0.9 * sight && dist >= 2.5 * boidL) {
				drawLink(boid, checkBoid, dist);
			}

			totX += checkBoid.x;
			totY += checkBoid.y;
			totVX += checkBoid.vx;
			totVY += checkBoid.vy;
			inSight++;
		}
	}

	drawBoid(boid);

	// calculate average postion and direction and steer boid
	if (inSight > 0) {
		totX += boid.x;
		totY += boid.y;
		inSight++;
		totVX += boid.vx;
		totVY += boid.vy;

		let avgV = normalize([totVX, totVY]);
		let toAvgPos = normalize([
			totX / inSight - boid.x,
			totY / inSight - boid.y,
		]);

		let steerX =
			alignmentFac * avgV[0] +
			cohesionFac * toAvgPos[0] +
			seperationFac * 0;
		let steerY =
			alignmentFac * avgV[1] +
			cohesionFac * toAvgPos[1] +
			seperationFac * 0;
		let steer = normalize([steerX, steerY]);
		let steerTheta = mod(Math.atan2(steer[1], steer[0]), 2 * Math.PI);

		// check if equal with float error first
		if (Math.abs(steerTheta - boid.theta) > 0.1) {
			if (mod(steerTheta - boid.theta, 2 * Math.PI) <= Math.PI) {
				boid.theta += delta * steerRad;
			} else {
				boid.theta -= delta * steerRad;
			}
		}

		boid.theta = mod(boid.theta, 2 * Math.PI);
		boid.vx = Math.cos(boid.theta);
		boid.vy = Math.sin(boid.theta);
	}
}

function moveBoids(delta) {
	for (let i = 0; i < boids.length; i++) {
		boids[i].x += delta * boidSpeed * boids[i].vx;
		boids[i].y += delta * boidSpeed * boids[i].vy;

		if (doBounce) bounceBoid(boids[i]);
		else warpBoid(boids[i]);

		boids[i].theta = mod(Math.atan2(boids[i].vy, boids[i].vx), 2 * Math.PI);

		if (boids[i].colTime > 0) {
			boids[i].colTime--;
		} else {
			boids[i].colTime = 0;
		}

		steer(boids[i], delta);
	}
}

let prevTime;
function animate(timestamp) {
	ctx.clearRect(0, 0, width, height);
	if (!timestamp) timestamp = 0;
	if (!prevTime) prevTime = timestamp;
	let delta = (animationSpeed * (timestamp - prevTime)) / 10.0;

	moveBoids(delta);
	circTemp = circNum;

	prevTime = timestamp;
	window.requestAnimationFrame(animate);
}
animate();

function mod(n, m) {
	return ((n % m) + m) % m;
}
function normalize([x, y]) {
	let length = Math.sqrt(x * x + y * y);
	return [x / length, y / length];
}

canvas.addEventListener("mousedown", (event) => {
	mouseX = event.clientX - event.target.getBoundingClientRect().left;
	mouseY =
		height - (event.clientY - event.target.getBoundingClientRect().top);
	addBoid(mouseX, mouseY);
});
canvas.addEventListener("mouseUp", (event) => {
	mouseX = -1;
	mouseY = -1;
});
