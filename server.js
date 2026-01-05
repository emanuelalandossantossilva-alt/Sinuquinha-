const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir arquivos da pasta atual
app.use(express.static(__dirname));

let jogadores = [];

io.on('connection', (socket) => {
    console.log('Novo jogador conectado:', socket.id);

    if (jogadores.length < 2) {
        jogadores.push(socket.id);
        socket.emit('atribuirJogador', jogadores.length); 
    }

    socket.on('tacada', (dados) => {
        // Envia para o outro jogador
        socket.broadcast.emit('receberTacada', dados);
    });

    socket.on('disconnect', () => {
        jogadores = jogadores.filter(id => id !== socket.id);
        console.log('Jogador saiu:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

