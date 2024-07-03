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

canvas.addEventListener('touchstart', (event) => {
    let touches = event.changedTouches;
    let touch = touches[0];
    mouseX = getMouseX(touch.pageX);
    mouseY = getMouseY(touch.pageY);

    mouseDown = true;
})
canvas.addEventListener('touchend', () => {
    mouseDown = false;
})
canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    let touches = event.changedTouches;
    if (touches.length > 1) {return;}
    let touch = touches[0];
    draw(touch.pageX, touch.pageY);
    mouseX = getMouseX(touch.pageX);
    mouseY = getMouseY(touch.pageY);
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
    draw(event.clientX, event.clientY);
    mouseX = getMouseX(event.clientX);
    mouseY = getMouseY(event.clientY);

});

let frozen = false;

let drawn = [];
let sendingData = false; // if it's currently sending data, then it will send more data every time the server asks for data. if data is currently
// not being sent, then it will start sending data once you start drawing

function draw(x, y) {
    if (frozen) {return;}
    if (mouseDown) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(getMouseX(x), getMouseY(y));
        ctx.stroke();
        drawn.push({x1: mouseX, y1: mouseY, x2: getMouseX(x), y2: getMouseY(y), color: color, width: width});

        if (!sendingData) {
            socket.emit('clientToServer', drawn, Date.now());
            drawn = [];
            sendingData = true;
        }
    }
}

function addLines(data) {
    data.forEach((line) => {
        ctx.strokeStyle = line.color
        ctx.lineWidth = line.width;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
    });

}

socket.on('firstConnection', (data, endTime, prompt) => {
    frozen = false; // prevents the player from drawing any more. gets set to true when the game ends and before a new one starts

    // sets the prompt
    const promptElement = document.querySelector('#prompt');
    promptElement.textContent = prompt;

    // it sets up the timer
    const timer = document.querySelector('#timer');
    let interval;

    function setCurrentTime() {
        let current = Date.now()/1000;
        let secondsLeft = endTime - current;
        if (Math.floor(secondsLeft) <= 0) {
            timer.textContent = '0:00';
            clearInterval(interval);
            return;
        }
        let minutes = Math.floor(secondsLeft/60);
        let seconds = secondsLeft - (minutes*60);
        let displaySeconds = String(Math.floor(seconds));
        if (displaySeconds.length === 1) {
            displaySeconds = '0' + displaySeconds;
        }
        timer.textContent = `${minutes}:${displaySeconds}`;
    }

    setCurrentTime();
    // runs every second
    setTimeout(() => {
        interval = setInterval(setCurrentTime, 1000);
    }, Date.now()/1000 - Math.floor(Date.now()/1000));

    ctx.clearRect(0, 0, canvas.getAttribute('width'), canvas.getAttribute('height'));

    // next, it adds all previously added lines
    addLines(data);
});


socket.on('serverToClient', (data) => {
    if (data === null) {
        if (drawn.length === 0 || !sendingData) {
            sendingData = false;
            return;
        }

        // the client sends its data to the server
        socket.emit('clientToServer', drawn, Date.now());
        drawn = [];
    } else {
        // the client draws the lines added by other clients
        addLines(data);
    }
})

socket.on('gameOver', () => {
    frozen = true;
})
