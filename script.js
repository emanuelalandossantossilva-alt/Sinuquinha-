// Conexão com o servidor que você configurou
const socket = io();

// Configuração Básica da Cena Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- MATERIAIS QUE VOCÊ DEFINIU ---

// Mesa com feltro verde musgo
const feltroMat = new THREE.MeshStandardMaterial({ 
    color: 0x0a3d1e, 
    roughness: 1.0 
}); 

// Madeira escura para as bordas
const madeiraMat = new THREE.MeshStandardMaterial({ 
    color: 0x3d2610, 
    roughness: 0.6 
}); 

// Neblina para o fundo de bar
scene.fog = new THREE.FogExp2(0x0a0502, 0.015);

// Luz amarelada de bar pendurada
const luzBar = new THREE.PointLight(0xffaa00, 1.2);
luzBar.position.set(0, 20, 0);
scene.add(luzBar);
scene.add(new THREE.AmbientLight(0x404040, 0.5)); // Luz ambiente suave

// --- CRIAÇÃO DA MESA (SIMPLIFICADA) ---

const mesaGeo = new THREE.BoxGeometry(20, 1, 10);
const mesa = new THREE.Mesh(mesaGeo, feltroMat);
scene.add(mesa);

camera.position.set(0, 15, 15);
camera.lookAt(0, 0, 0);

// --- LÓGICA MULTIPLAYER ---

socket.on('atribuirJogador', (numero) => {
    console.log("Você é o Jogador:", numero);
    document.getElementById('turn-msg').innerText = "VOCÊ É O JOGADOR " + numero;
});

socket.on('receberTacada', (dados) => {
    console.log("O oponente realizou uma tacada:", dados);
    // Aqui você aplicaria a força na bola branca do oponente
});

// Animação
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Ajuste de tela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

