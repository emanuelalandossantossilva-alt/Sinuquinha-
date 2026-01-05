// 1. Configuração da Cena (Mesmo estilo de bar que você enviou)
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0502, 0.015);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Materiais e Luzes
const feltroMat = new THREE.MeshStandardMaterial({ color: 0x0a3d1e, roughness: 1.0 }); 
const madeiraMat = new THREE.MeshStandardMaterial({ color: 0x3d2610, roughness: 0.6 }); 
const luzBar = new THREE.PointLight(0xffaa00, 1.5);
luzBar.position.set(0, 10, 0);
scene.add(luzBar);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

// 3. Mesa e Linha de Mira
const mesa = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 12), feltroMat);
mesa.position.y = -0.5;
scene.add(mesa);

const materialMira = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const geoMira = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-10)]);
const linhaMira = new THREE.Line(geoMira, materialMira);
linhaMira.position.y = 0.05;
scene.add(linhaMira);

// 4. Lógica Offline (Troca de Turno)
let jogadorAtual = 1;
const turnMsg = document.getElementById('turn-msg');
const statusText = document.getElementById('status-text');

function realizarTacada() {
    // Aqui entraria a física. Por enquanto, apenas alterna o turno.
    jogadorAtual = jogadorAtual === 1 ? 2 : 1;
    turnMsg.innerText = `VEZ DO JOGADOR ${jogadorAtual}`;
    turnMsg.style.color = jogadorAtual === 1 ? "#ffeb3b" : "#00e676";
}

// 5. Sistema Semáforo
function atualizarSemaforo(forca) {
    const meter = document.getElementById('power-meter');
    meter.style.width = forca + "%";

    if (forca > 85) {
        linhaMira.material.color.setHex(0xff0000); // Vermelho = Erro
        statusText.innerText = "FORÇA EXCESSIVA! (FALTA)";
        statusText.style.color = "red";
    } else {
        linhaMira.material.color.setHex(0x00ff00); // Verde = OK
        statusText.innerText = "MIRA OK - SOLTE PARA ATIRAR";
        statusText.style.color = "#ffeb3b";
    }
}

// 6. Controles Mobile (Toque)
window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    // Inverte a posição do toque para simular "puxar o taco"
    const forca = Math.min((1 - touch.clientY / window.innerHeight) * 100, 100);
    linhaMira.rotation.y = (touch.clientX / window.innerWidth) * Math.PI * 2;
    atualizarSemaforo(forca);
});

window.addEventListener('touchend', () => {
    realizarTacada();
});

// Render Loop
camera.position.set(0, 12, 12);
camera.lookAt(0, 0, 0);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

