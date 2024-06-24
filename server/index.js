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

const perSecond = 40; // how many times per second data is sent between the clients
let allLinesDrawn = [];

io.on('connection', (socket) => {
    console.log('New user connected.');
    socket.emit('serverToClient', null);
    socket.emit('serverToClient', allLinesDrawn);


    socket.on('clientToServer', (data) => {
        allLinesDrawn.push(...data);
        setTimeout(1000/perSecond).then(() => {
            socket.broadcast.emit('serverToClient', data);
            socket.emit('serverToClient', null);
        });
    })
})

server.listen(port, () => {
    console.log(`Running on http://localhost:${port}`);
})