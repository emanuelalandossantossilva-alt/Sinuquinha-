// No topo do arquivo
const socket = io('https://sinuquinha-online.onrender.com'); 
let meuNumeroJogador = 0;
let vezDoJogador = 1;

socket.on('atribuirJogador', (num) => {
    meuNumeroJogador = num;
    document.getElementById('turn-msg').innerText = `VOCÊ É O JOGADOR ${num}`;
});

// Na função de tacada, após soltar o clique/touch
if (vezDoJogador === meuNumeroJogador) {
    socket.emit('tacada', {
        forca: forcaFinal,
        angulo: angH,
        // Envia as posições atuais para sincronizar
        bolas: bolas.map(b => ({ id: b.userData.id, x: b.position.x, z: b.position.z }))
    });
}

// Para receber a jogada do outro
socket.on('receberTacada', (dados) => {
    aplicarForca(dados.forca, dados.angulo);
    // Sincroniza posição das bolas para evitar erros de física
    dados.bolas.forEach(info => {
        const b = bolas.find(bola => bola.userData.id === info.id);
        if(b) { b.position.set(info.x, b.position.y, info.z); }
    });
});

