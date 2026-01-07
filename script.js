import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Constantes de Jogo
const RAIO = 0.62;
const FRICCAO = 0.992;
const REBOTE = 0.7;
const LIMITE_X = 9.4;
const LIMITE_Z = 17.6;

const cacapas = [
    {x:-10, z:18.2}, {x:10, z:18.2}, // Canto superior
    {x:-10.5, z:0}, {x:10.5, z:0},   // Meio
    {x:-10, z:-18.2}, {x:10, z:-18.2} // Canto inferior
];

// Mesa e Iluminação
const mesa = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 36.4), new THREE.MeshStandardMaterial({ color: 0x076324 }));
mesa.position.y = 7;
scene.add(mesa, new THREE.AmbientLight(0xffffff, 0.9));

const bolas = [];
function criarBola(cor, x, z, ehBranca = false) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(RAIO, 32, 32), new THREE.MeshStandardMaterial({ color: cor }));
    b.position.set(x, 7.62, z);
    const obj = { mesh: b, vx: 0, vz: 0, ativa: true, branca: ehBranca };
    scene.add(b); bolas.push(obj); return obj;
}

const branca = criarBola(0xffffff, 0, 8, true);
criarBola(0xffcc00, 0, -8); // Bola alvo de teste

// Controles de Toque/Mouse
let carregando = false, forca = 0, angulo = 0;
window.onmousedown = () => carregando = true;
window.onmouseup = () => {
    if(carregando) {
        branca.vx = Math.sin(angulo) * -forca * 0.8;
        branca.vz = Math.cos(angulo) * -forca * 0.8;
        carregando = false; forca = 0;
    }
};
window.onmousemove = (e) => {
    if(!carregando) angulo += e.movementX * 0.005;
    else forca = Math.min(forca + 0.02, 1.5);
};

function loop() {
    requestAnimationFrame(loop);
    bolas.forEach(b => {
        if(!b.ativa) return;
        b.mesh.position.x += b.vx;
        b.mesh.position.z += b.vz;
        b.vx *= FRICCAO; b.vz *= FRICCAO;

        // --- LÓGICA DE CAÇAPA (REMOÇÃO DE BARREIRAS) ---
        let naBoca = false;
        cacapas.forEach(c => {
            const d = Math.hypot(b.mesh.position.x - c.x, b.mesh.position.z - c.z);
            if(d < 1.8) { // Detecta que está na área do buraco
                naBoca = true; 
                if(d < 1.1) { b.ativa = false; scene.remove(b.mesh); } // Caiu
            }
        });

        // Só rebate na tabela se não estiver na boca da caçapa
        if(!naBoca) {
            if(Math.abs(b.mesh.position.x) > LIMITE_X) {
                b.vx *= -REBOTE;
                b.mesh.position.x = Math.sign(b.mesh.position.x) * LIMITE_X;
            }
            if(Math.abs(b.mesh.position.z) > LIMITE_Z) {
                b.vz *= -REBOTE;
                b.mesh.position.z = Math.sign(b.mesh.position.z) * LIMITE_Z;
            }
        }
    });

    // Câmera dinâmica
    camera.position.set(branca.mesh.position.x, 22, branca.mesh.position.z + 18);
    camera.lookAt(branca.mesh.position);
    
    document.getElementById('power-meter').style.width = (forca * 50) + '%';
    renderer.render(scene, camera);
}
loop();

