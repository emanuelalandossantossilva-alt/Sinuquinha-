import * as THREE from 'three';

// --- CONFIGURAÇÃO E ESTADO (Mantenha o topo igual) ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0502, 0.012);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.userData.currentLook = new THREE.Vector3(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

let gameState = { 
    modoDefinido: false, turno: 1, p1Tipo: null, p2Tipo: null, 
    fezPontoRodada: false, aguardandoReset: false,
    primeiraBolaAtingida: null, bateuNaTabelaAntes: false, brancaCaiu: false,
    matouAdversariaSemQuerer: false
};

const ALTURA_MESA = 7.0, RAIO = 0.62, FRICCAO = 0.993, REBOTE_TABELA = 0.65; 
const Y_BOLAS = ALTURA_MESA + 1.0 + RAIO;
const LIMITE_X = 9.4, LIMITE_Z = 17.6; // Ajustados para ficarem rente às tabelas

// Materiais (Mantenha os mesmos)
const feltroMat = new THREE.MeshStandardMaterial({ color: 0x021a0e, roughness: 0.9 });
const madeiraMat = new THREE.MeshStandardMaterial({ color: 0x2d1804, roughness: 0.5 }); 

// Mesas e Tabelas (Código de construção permanece igual...)
const mesaCorpo = new THREE.Mesh(new THREE.BoxGeometry(20, 1.5, 36), feltroMat);
mesaCorpo.position.y = ALTURA_MESA + 0.25; scene.add(mesaCorpo);
const mesaBase = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 38), madeiraMat);
mesaBase.position.y = ALTURA_MESA - 0.5; scene.add(mesaBase);

const cacapas = [
    {x:-10.0, z: 18.2}, {x:10.0,  z: 18.2}, 
    {x:-10.5, z:0}, {x:10.5,  z:0},
    {x:-10.0, z:-18.2}, {x:10.0,  z:-18.2} 
];

// --- LOGICA DE BOLAS E MIRA (Mantenha funções auxiliares) ---
const bolas = [];
// ... (Criar bolas, texturas, etc.)

// --- A MUDANÇA CRUCIAL: LÓGICA DE MOVIMENTO E COLISÃO ---

function loop() {
    requestAnimationFrame(loop);
    
    // Sub-steps para física mais precisa (6 passos por frame)
    for(let s=0; s<6; s++) {
        bolas.forEach(b => {
            if(!b.userData.ativa) return;

            if(b.userData.caindo) {
                // ... lógica de queda permanece igual ...
                return;
            }

            const spd = Math.hypot(b.userData.vx, b.userData.vz);
            if(spd > 0.001) {
                b.position.x += b.userData.vx/6; 
                b.position.z += b.userData.vz/6;
                
                // Rotação visual
                b.userData.mesh.rotateOnWorldAxis(new THREE.Vector3(b.userData.vz, 0, -b.userData.vx).normalize(), (spd/6)/RAIO);
                
                // Atrito suave
                b.userData.vx *= FRICCAO; b.userData.vz *= FRICCAO;

                // 1. CHECAGEM DE CAÇAPA (Prioridade antes da tabela)
                let entrouNaCacapa = false;
                cacapas.forEach(c => { 
                    const distC = Math.hypot(b.position.x - c.x, b.position.z - c.z);
                    if(distC < 1.4) { // Área de "sucção" da caçapa
                        entrouNaCacapa = true;
                        if(distC < 1.1) b.userData.caindo = true; 
                    }
                });

                // 2. COLISÃO COM TABELAS (Só acontece se NÃO estiver na caçapa)
                if(!entrouNaCacapa) {
                    // Se estiver passando do limite X (Laterais compridas)
                    if(Math.abs(b.position.x) > LIMITE_X) {
                        // Verifica se não está no vão da caçapa do meio (Z entre -1.5 e 1.5)
                        if(Math.abs(b.position.z) > 1.5) {
                            b.userData.vx *= -REBOTE_TABELA;
                            b.position.x = Math.sign(b.position.x) * LIMITE_X;
                            if(b===branca && !gameState.primeiraBolaAtingida) gameState.bateuNaTabelaAntes = true;
                        }
                    }
                    // Se estiver passando do limite Z (Cabeceiras)
                    if(Math.abs(b.position.z) > LIMITE_Z) {
                        // Verifica se não está no vão das caçapas de canto (X entre -8.5 e 8.5)
                        if(Math.abs(b.position.x) < 8.5) {
                            b.userData.vz *= -REBOTE_TABELA;
                            b.position.z = Math.sign(b.position.z) * LIMITE_Z;
                            if(b===branca && !gameState.primeiraBolaAtingida) gameState.bateuNaTabelaAntes = true;
                        }
                    }
                }
            }
        });

        // 3. COLISÃO ENTRE BOLAS (Física de Impacto Melhorada)
        for(let i=0; i<bolas.length; i++) {
            for(let j=i+1; j<bolas.length; j++) {
                const b1=bolas[i], b2=bolas[j]; 
                if(!b1.userData.ativa || !b2.userData.ativa || b1.userData.caindo || b2.userData.caindo) continue;
                
                const dx = b2.position.x - b1.position.x;
                const dz = b2.position.z - b1.position.z;
                const d = Math.hypot(dx, dz);
                
                if(d < RAIO * 2) {
                    // Normal da colisão
                    const nx = dx / d;
                    const nz = dz / d;
                    
                    // Velocidade relativa na direção da normal
                    const v1n = b1.userData.vx * nx + b1.userData.vz * nz;
                    const v2n = b2.userData.vx * nx + b2.userData.vz * nz;
                    const vRel = v1n - v2n;

                    if(vRel > 0) {
                        // Identifica primeira batida para regras do jogo
                        if(b1 === branca && !gameState.primeiraBolaAtingida) gameState.primeiraBolaAtingida = b2.userData;
                        if(b2 === branca && !gameState.primeiraBolaAtingida) gameState.primeiraBolaAtingida = b1.userData;

                        // Transferência de momento (Elasticidade de 98%)
                        const impulso = 0.98 * vRel;
                        b1.userData.vx -= impulso * nx;
                        b1.userData.vz -= impulso * nz;
                        b2.userData.vx += impulso * nx;
                        b2.userData.vz += impulso * nz;

                        // Correção de sobreposição (Evita que as bolas grudem)
                        const sobreposto = (RAIO * 2 - d) / 2;
                        b1.position.x -= sobreposto * nx;
                        b1.position.z -= sobreposto * nz;
                        b2.position.x += sobreposto * nx;
                        b2.position.z += sobreposto * nz;
                    }
                }
            }
        }
    }
    // ... restante do render e mira igual ...
}

