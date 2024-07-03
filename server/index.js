const express = require('express');
const app = express();
const port = 3000;
const server = require('http').createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const { readFile, readFileSync } = require('fs');
const { setTimeout } = require('timers/promises');

const path = '../frontend/';

app.use(express.static(path + 'public'));

let nouns = [];
nouns = readFileSync(path + 'public/prompts/nouns.txt', 'utf-8').split(' ');

function returnPage(request, response, page) {
    readFile(path + 'public/pages/' + page, 'utf-8', (err, html) => {
        if (err) {
            console.log(`500 Internal Server Error - failed to retrieve ${path + 'public/pages/' + page} `);
            response.status(500).send('500 Internal Server Error - page could not be retrieved');
        } else {
            response.send(html);
        }
    })
}

app.get('/', (request, response) => {
    returnPage(request, response, 'home.html');
});

let room;

const roundLength = 2*60;

function resetGame() {
    let prompt = nouns[Math.floor(Math.random()*nouns.length)];
    room = {'allLinesDrawn': [], 'endTime': (Date.now()/1000) + roundLength, 'prompt': prompt};
    setTimeout(room.endTime*1000 - Date.now()).then(() => {
        io.emit('gameOver');

        const waitSeconds = 5; // number of seconds to wait after the round ends

        setTimeout(waitSeconds * 1000).then(() => {
            resetGame();
            io.emit('firstConnection', room.allLinesDrawn, room.endTime, room.prompt);
        });
    });
}
resetGame();


const perSecond = 35; // how many times per second data is sent between the clients

io.on('connection', (socket) => {
    console.log('New user connected.');
    socket.emit('firstConnection', room.allLinesDrawn, room.endTime, room.prompt);

    socket.on('disconnect', () => {
        console.log('User disconnected.')
    })
    socket.on('clientToServer', (data, timestamp) => {
        // validating the input
        data.forEach((dataPoint) => {if (dataPoint.width > 12) {dataPoint.width = 12;}});


        let timeSpent = Date.now() - timestamp;
        let timeLeft = 1000/perSecond - timeSpent;
        if (timeLeft < 0) {timeLeft = 0;}

        let frozen = room.endTime < Date.now()/1000; // checks if the player is allowed to keep drawing

        if (!frozen) {room.allLinesDrawn.push(...data);}
        setTimeout(timeLeft).then(() => {
            if (!frozen) {socket.broadcast.emit('addLines', data);} // sends the new data to everyone else on the site
            socket.emit('getMoreData'); // sends a message to the person currently drawing in order to continue recieving information
        });
    })
});

server.listen(port, () => {
    console.log(`Running on http://localhost:${port}`);
});