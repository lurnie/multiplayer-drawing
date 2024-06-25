'use strict';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const colorElement = document.querySelector('#color');
const widthElement = document.querySelector('#width');

const body = document.querySelector('body');

const socket = io();

ctx.lineCap = 'round';
ctx.imageSmoothingEnabled = false;

let mouseDown = false;
body.addEventListener('mousedown', () => {
    mouseDown = true;
});
body.addEventListener('mouseup', () => {
    mouseDown = false;
});

let color = colorElement.value;
colorElement.addEventListener('input', () => {
    color = colorElement.value;
});
let width = widthElement.value;
widthElement.addEventListener('input', () => {
    width = widthElement.value;
});

let mouseX;
let mouseY;

function getMouseX(x) {
    let style = window.getComputedStyle(canvas);
    return (x - canvas.offsetLeft) / (Number(style.getPropertyValue('width').slice(0, -2))/1000);
}
function getMouseY(y) {
    let style = window.getComputedStyle(canvas);
    return (y - canvas.offsetTop) / (Number(style.getPropertyValue('height').slice(0, -2))/500);
}

body.addEventListener('mousemove', (event) => {
    draw(event.x, event.y);
    mouseX = getMouseX(event.clientX);
    mouseY = getMouseY(event.clientY);

});

let drawn = [];
let sendingData = false; // if it's currently sending data, then it will send more data every time the server asks for data. if data is currently
// not being sent, then it will start sending data once you start drawing

function draw(x, y) {
    if (mouseDown) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(getMouseX(x), getMouseY(y));
        ctx.stroke();
        drawn.push({x1: mouseX, y1: mouseY, x2: getMouseX(x), y2: getMouseY(y), color: color, width: width});

        if (!sendingData) {
            socket.emit('clientToServer', drawn);
            drawn = [];
            sendingData = true;
        }
    }
}

socket.on('serverToClient', (data) => {
    if (data === null) {
        if (drawn.length === 0 || !sendingData) {
            sendingData = false;
            return;
        }

        // the client sends its data to the server
        socket.emit('clientToServer', drawn);
        drawn = [];
    } else {
        // the client draws the lines added by other clients
        data.forEach((line) => {
            ctx.strokeStyle = line.color
            ctx.lineWidth = line.width;
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
        })
    }
})

