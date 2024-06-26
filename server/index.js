const express = require('express');
const app = express();
const port = 3000;
const server = require('http').createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const { readFile } = require('fs');
const { setTimeout } = require('timers/promises');

const path = '../frontend/';

app.use(express.static(path + 'public'));


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
function resetGame() {
    room = {'allLinesDrawn': [], 'endTime': (Date.now()/1000) + (1*60), 'prompt': 'hi'};
    setTimeout(room.endTime*1000 - Date.now()).then(() => {
        resetGame();
        io.emit('firstConnection', room.allLinesDrawn, room.endTime, room.prompt);
    })
}
resetGame();


const perSecond = 35; // how many times per second data is sent between the clients

io.on('connection', (socket) => {
    console.log('New user connected.');
    socket.emit('firstConnection', room.allLinesDrawn, room.endTime, room.prompt);


    socket.on('clientToServer', (data, timestamp) => {
        let timeSpent = Date.now() - timestamp;
        let timeLeft = 1000/perSecond - timeSpent;
        if (timeLeft < 0) {timeLeft = 0;}
        room.allLinesDrawn.push(...data);
        setTimeout(timeLeft).then(() => {
            socket.broadcast.emit('serverToClient', data);
            socket.emit('serverToClient', null);
        });
    })
})

server.listen(port, () => {
    console.log(`Running on http://localhost:${port}`);
})