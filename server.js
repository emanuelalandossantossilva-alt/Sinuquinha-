const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let jogadores = [];

io.on('connection', (socket) => {
    if (jogadores.length < 2) {
        jogadores.push(socket.id);
        socket.emit('atribuirJogador', jogadores.length); 
    }

    socket.on('tacada', (dados) => {
        socket.broadcast.emit('receberTacada', dados);
    });

    socket.on('disconnect', () => {
        jogadores = jogadores.filter(id => id !== socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));
