import * as THREE from 'three';

// --- CONFIGURAÇÃO INICIAL ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Constantes Físicas
const RAIO = 0.62;
const FRICCAO = 0.993;
const REBOTE = 0.65;
const LIMITE_X = 9.4;
const LIMITE_Z = 17.6;

// Caçapas (Posições)
const cacapas = [
    {x:-10, z:18.2}, {x:10, z:18.2}, {x:-10.5, z:0},
    {x:10.5, z:0}, {x:-10, z:-18.2}, {x:10, z:-18.2}
];

// --- CRIAÇÃO DA MESA (SIMPLIFICADA) ---
const mesaGeo = new THREE.BoxGeometry(20, 1.5, 36);
const feltroMat = new THREE.MeshStandardMaterial({ color: 0x076324 });
const mesa = new THREE.Mesh(mesaGeo, feltroMat);
mesa.position.y = 7;
mesa.receiveShadow = true;
scene.add(mesa);

const luz = new THREE.SpotLight(0xffffff, 5);
luz.position.set(0, 50, 0);
luz.castShadow = true;
scene.add(luz, new THREE.AmbientLight(0xffffff, 0.5));

// --- BOLAS ---
const bolas = [];
function criarBola(cor, pos, isBranca = false) {
    const geo = new THREE.SphereGeometry(RAIO, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    const obj = { 
        mesh, 
        vx: 0, vz: 0, 
        ativa: true, 
        caindo: false, 
        isBranca 
    };
    scene.add(mesh);
    bolas.push(obj);
    return obj;
}

const branca = criarBola(0xffffff, new THREE.Vector3(0, 7.62, 8), true);
// Exemplo de uma bola alvo
criarBola(0xff0000, new THREE.Vector3(0, 7.62, -8));

// --- CONTROLES ---
let angulo = 0, forca = 0, carregando = false;
window.addEventListener('mousedown', () => carregando = true);
window.addEventListener('mouseup', () => {
    if(carregando) {
        branca.vx = Math.sin(angulo) * -forca * 5;
        branca.vz = Math.cos(angulo) * -forca * 5;
        forca = 0;
        carregando = false;
    }
});
window.addEventListener('mousemove', (e) => {
    if(!carregando) angulo += e.movementX * 0.005;
    else forca = Math.min(forca + 0.01, 1);
});

// --- LOOP PRINCIPAL (FÍSICA MELHORADA) ---
function update() {
    requestAnimationFrame(update);

    bolas.forEach(b => {
        if (!b.ativa) return;

        // Movimentação
        b.mesh.position.x += b.vx;
        b.mesh.position.z += b.vz;
        b.vx *= FRICCAO;
        b.vz *= FRICCAO;

        // Verificação de Caçapa (Onde a barreira some)
        let naBoca = false;
        cacapas.forEach(c => {
            const dist = Math.hypot(b.mesh.position.x - c.x, b.mesh.position.z - c.z);
            if (dist < 1.6) {
                naBoca = true; // Desativa a parede invisível
                if (dist < 1.1) {
                    b.caindo = true;
                    b.ativa = false;
                    scene.remove(b.mesh);
                }
            }
        });

        // Colisão com Tabelas (Só se não estiver na boca da caçapa)
        if (!naBoca) {
            if (Math.abs(b.mesh.position.x) > LIMITE_X) {
                b.vx *= -REBOTE;
                b.mesh.position.x = Math.sign(b.mesh.position.x) * LIMITE_X;
            }
            if (Math.abs(b.mesh.position.z) > LIMITE_Z) {
                b.vz *= -REBOTE;
                b.mesh.position.z = Math.sign(b.mesh.position.z) * LIMITE_Z;
            }
        }
    });

    // Câmera segue a branca
    camera.position.set(branca.mesh.position.x, 25, branca.mesh.position.z + 20);
    camera.lookAt(branca.mesh.position);

    document.getElementById('power-meter').style.width = (forca * 100) + '%';
    renderer.render(scene, camera);
}

update();
