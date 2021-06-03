/* jshint -W069, esversion:6 */

/** @type {HTMLCanvasElement} */
let canvas =
	/** @type {HTMLCanvasElement} */ document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

let height = window.innerHeight - 105;
let width = window.innerWidth - 20;
canvas.width = width;
canvas.height = height;

// make bottom left canvas origin
ctx.translate(0, height);
ctx.scale(1, -1);
ctx.fillStyle = "purple";
ctx.strokeStyle = "purple";
let animRange = document.getElementById("animSpeed");
animRange.oninput = () => (animationSpeed = animRange.value);
let sizeRange = document.getElementById("boidSize");
sizeRange.oninput = () => {
	boidL = parseFloat(sizeRange.value);
	sight = parseFloat(sightRange.value) * boidL;
};
sizeRange.onmousedown = () => (doDrawSight = true);
sizeRange.onmouseup = () => (doDrawSight = false);
let sightRange = document.getElementById("sightDist");
sightRange.oninput = () => (sight = parseFloat(sightRange.value) * boidL);
sightRange.onmousedown = () => (doDrawSight = true);
sightRange.onmouseup = () => (doDrawSight = false);
let alignRange = document.getElementById("alignFac");
alignRange.oninput = () => (alignmentFac = parseFloat(alignRange.value));
let seperRange = document.getElementById("seperFac");
seperRange.oninput = () => (seperationFac = parseFloat(seperRange.value));
let cohesRange = document.getElementById("cohesFac");
cohesRange.oninput = () => (cohesionFac = parseFloat(cohesRange.value));
let linkARange = document.getElementById("linkAlpha");
linkARange.oninput = () => (maxLinkAlpha = parseFloat(linkARange.value));
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
const colTime = 20;
const steerColor = "#cccccc";
const sightColor = "#bfbd";
const steerRad = 0.005;
const startBoids = 200;

let animationSpeed = 1;
let maxLinkAlpha = 175;
let boidL = 7;
let sight = 10 * boidL;
let doBounce = false;
let doDrawLinks = true;
let doDrawSight = false;
let alignmentFac = 0.5;
let cohesionFac = 0.4;
let seperationFac = 0.5;
let mouseX = -1;
let mouseY = -1;
let links = [];
let linkMap = new Map();
let boids = [];
for (let i = 0; i < startBoids; i++) {
	addBoid();
}

function stringIt(num) {
	let stringNum = Math.round(num).toString();
	let length = stringNum.length;
	if (length < 4) {
		stringNum = "0" + stringNum;
		if (length < 3) {
			stringNum = "0" + stringNum;
			if (length < 2) {
				stringNum = "0" + stringNum;
				if (length < 1) {
					stringNum = "0" + stringNum;
				}
			}
		}
	}
	return stringNum;
}

function normalize([x, y]) {
	let length = Math.sqrt(x * x + y * y);
	return [x / length, y / length];
}

function steer(boid, delta) {
	let totX = 0;
	let totY = 0;
	let totVX = 0;
	let totVY = 0;
	let inSight = 0;

	boids.forEach((checkBoid) => {
		let dist = Math.sqrt(
			(checkBoid.x - boid.x) * (checkBoid.x - boid.x) +
				(checkBoid.y - boid.y) * (checkBoid.y - boid.y)
		);

		if (boid != checkBoid && dist <= sight) {
			if (doDrawLinks && dist < 0.9 * sight && dist >= 2.5 * boidL) {
				let linkCode =
					stringIt(boid.x) +
					stringIt(boid.y) +
					stringIt(checkBoid.x) +
					stringIt(checkBoid.y) +
					stringIt(dist);

				// let bk1 = Math.min(boid.key, checkBoid.key);
				// let bk2 = Math.max(boid.key, checkBoid.key);
				// linkMap.set(stringIt(bk1) + stringIt(bk2), linkCode);
				// outside of steer(), in drawLinks(), loop through all links in linkMap and draw them all.

				links.push(linkCode);
			}

			totX += checkBoid.x;
			totY += checkBoid.y;
			totVX += checkBoid.vx;
			totVY += checkBoid.vy;
			inSight++;
		}
	});

	links.forEach((link) => {
		ctx.save();
		let alpha = Math.floor(
			(maxLinkAlpha * (0.91 * sight - parseInt(link.substr(16, 4)))) /
				sight
		);
		alpha = alpha.toString(16);
		alpha = alpha.length == 1 ? "0" + alpha : alpha;
		ctx.strokeStyle = steerColor + alpha;
		ctx.beginPath();
		ctx.moveTo(parseInt(link.substr(0, 4)), parseInt(link.substr(4, 4)));
		ctx.lineTo(parseInt(link.substr(8, 4)), parseInt(link.substr(12, 4)));
		ctx.stroke();
		ctx.restore();
	});
	links = [];

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

function addBoid(
	x = (width - 2 * boidL) * Math.random() + boidL,
	y = (height - 2 * boidL) * Math.random() + boidL
) {
	let theta = 2 * Math.PI * Math.random();

	boids.push({
		x: x,
		y: y,
		vx: Math.cos(theta),
		vy: Math.sin(theta),
		theta: theta,
		colTime: 0,
		key: boids.length + 1,
	});
}

function drawBoids() {
	let circ = 20;

	ctx.save();
	ctx.fillStyle = "#b33";
	boids.forEach((boid) => {
		if (doDrawSight && circ == 20) {
			ctx.save();
			ctx.strokeStyle = sightColor;
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.arc(boid.x, boid.y, sight, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
		circ = mod(circ - 1, 21);

		ctx.save();
		if (boid.colTime > 0) ctx.fillStyle = "#33b"; // when bouncing
		ctx.translate(boid.x, boid.y);
		ctx.rotate(boid.theta - Math.PI / 2);
		ctx.beginPath();
		ctx.moveTo(0, 1.5 * boidL);
		ctx.lineTo(boidL, -boidL);
		ctx.lineTo(0, -boidL / 1.7);
		ctx.lineTo(-boidL, -boidL);
		ctx.fill();
		ctx.restore();
	});
	ctx.restore();

	circ = 20;
}

function drawLinks(){
/*
for (let value of linkMap.values()) {
  console.log(value)
}

links.forEach((link) => {
		ctx.save();
		let alpha = Math.floor(
			(maxLinkAlpha * (0.91 * sight - parseInt(link.substr(16, 4)))) /
				sight
		);
		alpha = alpha.toString(16);
		alpha = alpha.length == 1 ? "0" + alpha : alpha;
		ctx.strokeStyle = steerColor + alpha;
		ctx.beginPath();
		ctx.moveTo(parseInt(link.substr(0, 4)), parseInt(link.substr(4, 4)));
		ctx.lineTo(parseInt(link.substr(8, 4)), parseInt(link.substr(12, 4)));
		ctx.stroke();
		ctx.restore();
	});
*/
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

function moveBoids(delta) {
	boids.forEach((boid) => {
		boid.x += delta * boidSpeed * boid.vx;
		boid.y += delta * boidSpeed * boid.vy;

		if (doBounce) bounceBoid(boid);
		else warpBoid(boid);

		boid.theta = mod(Math.atan2(boid.vy, boid.vx), 2 * Math.PI);

		if (boid.colTime > 0) {
			boid.colTime--;
		} else {
			boid.colTime = 0;
		}

		steer(boid, delta);
	});
}

let prevTime;
function animate(timestamp) {
	ctx.clearRect(0, 0, width, height);
	if (!timestamp) timestamp = 0;
	if (!prevTime) prevTime = timestamp;
	let delta = (animationSpeed * (timestamp - prevTime)) / 10.0;

	moveBoids(delta);
	drawLinks();
	drawBoids();

	prevTime = timestamp;
	window.requestAnimationFrame(animate);
}
animate();

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

function mod(n, m) {
	return ((n % m) + m) % m;
}
