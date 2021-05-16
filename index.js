const express = require('express');
const app = express();
const http = require('http');
const socket = require('socket.io');
const router = require('./routes/routes');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = socket(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true,
    },
});

/**
 *
 * room object
 * @typedef {{ broadcaster: string, room: string, user: string}} room
 */

/**
 * @type {room[]} rooms
 */
let rooms = [];

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, '/public')));
app.use(
    session({
        secret: crypto.randomBytes(12).toString('hex'),
        cookie: {
            maxAge: 10000000,
        },
        resave: false,
        saveUninitialized: true,
    })
);

app.use(router);

io.on('connection', (socket) => {
    socket.on('broadcaster', (room, user) => {
        rooms.push({
            broadcaster: socket.id,
            room,
            user,
        });

        socket.join(room);
        socket.broadcast.emit('broadcaster');
        socket.on('disconnect', () => {
            rooms = rooms.filter((r) => r.broadcaster !== socket.id);
        });
    });

    socket.on('viewer', (room, user) => {
        const broadcast = rooms.filter((r) => r.room === room)[0];

        if (!broadcast) {
            socket.emit('Invalid Room');
            return;
        }
        socket.join(room);
        socket.to(room).emit('viewer', user);
    });

    socket.on('sendOffer', (data, roomId, userWhoIsSending) => {
        socket.to(roomId).emit('offer', data, userWhoIsSending);
    });

    socket.on('sendAnswer', (data, roomId, userWhoReceived) => {
        socket.to(roomId).emit('answer', data, userWhoReceived);
    });

    socket.on('newCandidate', (candidate, roomId) => {
        socket.to(roomId).emit('candidate', candidate);
    });

    socket.on('endCall', (room) => {
        rooms = rooms.filter((r) => r.room != room);
        socket.in(room).emit('endCall');
    });
});

server.listen(port, () => {
    console.log('Server Started');
});
