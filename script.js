import * as THREE from 'three';

// --- CONFIGURAÇÃO INICIAL E RESIZE ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0502, 0.012);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.userData.currentLook = new THREE.Vector3(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

// Botão Fullscreen
const btnFs = document.getElementById('fullscreen-btn');
btnFs.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        btnFs.innerText = "SAIR";
    } else {
        document.exitFullscreen();
        btnFs.innerText = "TELA CHEIA";
    }
});

// --- VARIÁVEIS DE ESTADO DO JOGO ---
let gameState = { 
    modoDefinido: false, turno: 1, p1Tipo: null, p2Tipo: null, 
    fezPontoRodada: false, aguardandoReset: false,
    primeiraBolaAtingida: null, bateuNaTabelaAntes: false, brancaCaiu: false,
    matouAdversariaSemQuerer: false, bolasCaidasNoEstouro: []
};

// --- CONSTANTES DE FÍSICA E MESA ---
const ALTURA_MESA = 7.0, RAIO = 0.62, FRICCAO = 0.9965, REBOTE_TABELA = 0.7; 
const Y_BOLAS = ALTURA_MESA + 1.0 + RAIO, LIMITE_X = 9.25, LIMITE_Z = 17.45;

const feltroMat = new THREE.MeshStandardMaterial({ color: 0x021a0e, roughness: 0.9 });
const madeiraMat = new THREE.MeshStandardMaterial({ color: 0x2d1804, roughness: 0.5 }); 
const aroInternoMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

// --- CONSTRUÇÃO DA MESA ---
const mesaCorpo = new THREE.Mesh(new THREE.BoxGeometry(20, 1.5, 36), feltroMat);
mesaCorpo.position.y = ALTURA_MESA + 0.25; 
scene.add(mesaCorpo);

const mesaBase = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 38), madeiraMat);
mesaBase.position.y = ALTURA_MESA - 0.5; 
scene.add(mesaBase);

const luzFoco = new THREE.SpotLight(0xfff5e0, 4.5); 
luzFoco.position.set(0, 50, 0); 
luzFoco.castShadow = true;
scene.add(luzFoco, new THREE.AmbientLight(0x402010, 0.5));

function criarTabela(largura, x, z, rot) {
    const g = new THREE.Group();
    const s = new THREE.Shape();
    s.moveTo(-largura/2+0.5, 0); 
    s.lineTo(largura/2-0.5, 0); 
    s.absarc(largura/2-0.5, 0.6, 0.6, -Math.PI/2, 0, false);
    s.lineTo(largura/2, 1.2); 
    s.lineTo(-largura/2, 1.2); 
    s.absarc(-largura/2+0.5, 0.6, 0.6, Math.PI, Math.PI*1.5, false);
    
    const mf = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.8 }), feltroMat);
    const mm = new THREE.Mesh(new THREE.BoxGeometry(largura, 0.9, 0.9), madeiraMat);
    mm.position.set(0, 1.6, 0.4); 
    g.add(mf, mm); 
    g.rotation.x = -Math.PI/2; 
    g.rotation.z = rot; 
    g.position.set(x, ALTURA_MESA + 0.75, z); 
    scene.add(g);
}

criarTabela(16.3, -10, -9.2, Math.PI/2); 
criarTabela(16.3, 10, -9.2, -Math.PI/2);
criarTabela(18.2, 0, -18.2, 0); 
criarTabela(18.2, 0, 18.2, Math.PI);
criarTabela(16.3, -10, 9.2, Math.PI/2); 
criarTabela(16.3, 10, 9.2, -Math.PI/2);

const cacapas = [
    {x:-10.0, z: 18.2, rot: Math.PI/4, isMiddle: false}, 
    {x:10.0,  z: 18.2, rot: -Math.PI/4, isMiddle: false}, 
    {x:-10.5, z:0, rot: Math.PI/2, isMiddle: true}, 
    {x:10.5,  z:0, rot: -Math.PI/2, isMiddle: true},
    {x:-10.0, z:-18.2, rot: 3*Math.PI/4, isMiddle: false}, 
    {x:10.0,  z:-18.2, rot: -3*Math.PI/4, isMiddle: false} 
];

cacapas.forEach(p => {
    const rA = p.isMiddle ? 1.05 : 1.45;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(rA, 0.1, 12, 24), aroInternoMat);
    aro.rotation.x = Math.PI/2; aro.position.set(p.x, ALTURA_MESA + 0.95, p.z); scene.add(aro);
    
    const arcoM = p.isMiddle ? Math.PI : Math.PI * 1.20;
    const aroM = new THREE.Mesh(new THREE.TorusGeometry(rA + 0.3, 0.45, 12, 32, arcoM), madeiraMat);
    aroM.position.set(p.isMiddle ? (p.x < 0 ? p.x - 0.1 : p.x + 0.1) : p.x, ALTURA_MESA + 1.15, p.z); 
    aroM.rotation.x = Math.PI/2; 
    aroM.rotation.z = p.rot - (p.isMiddle ? 0 : (arcoM - Math.PI) / 2); 
    scene.add(aroM);
    
    const tampa = new THREE.Mesh(new THREE.CircleGeometry(rA - 0.05, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    tampa.rotation.x = -Math.PI/2; 
    tampa.position.set(p.x, ALTURA_MESA + 1.01, p.z); 
    scene.add(tampa);
});

// --- LÓGICA DAS BOLAS ---
const bolas = [];
const coresC = { '2': '#0000ff', '3': '#ff0000', '4': '#4b0082', '5': '#ff69b4', '6': '#008000', '7': '#5d3a1a', '8': '#111111', '9': '#ffd700', '10': '#0000ff', '11': '#ff0000', '12': '#4b0082', '13': '#ff69b4', '14': '#008000', '15': '#5d3a1a' };

function gerarTexturaBrilho() { 
    const c = document.createElement('canvas'); 
    c.width = 64; c.height = 64; 
    const ctx = c.getContext('2d'); 
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); 
    grad.addColorStop(0, 'rgba(255,255,255,1)'); 
    grad.addColorStop(1, 'rgba(255,255,255,0)'); 
    ctx.fillStyle = grad; 
    ctx.fillRect(0,0,64,64); 
    return c; 
}

function criarBola(cor, num, pos) {
    const canvas = document.createElement('canvas'); 
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d'); 
    ctx.fillStyle = cor; ctx.fillRect(0,0,128,128);
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(64,64,35,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'black'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(num,64,64);
    
    const group = new THREE.Group();
    const b = new THREE.Mesh(new THREE.SphereGeometry(RAIO, 32, 32), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.1 }));
    const sMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gerarTexturaBrilho()), transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const glow = new THREE.Sprite(sMat); glow.scale.set(RAIO*3, RAIO*3, 1);
    
    group.add(b, glow); 
    group.position.copy(pos);
    group.userData = { 
        vx:0, vz:0, ativa:true, caindo: false, 
        isBranca: num===".", numero: num === "." ? 0 : parseInt(num), 
        tipo: (parseInt(num)||0)%2===0?'par':'impar', cor: cor, mesh: b, glow: glow 
    };
    scene.add(group); 
    bolas.push(group); 
    return group;
}

function adicionarBolaNaListaUI(userData) { 
    if(userData.isBranca) return; 
    const container = document.getElementById(userData.tipo === 'par' ? 'balls-pares' : 'balls-impares'); 
    const ballDiv = document.createElement('div'); 
    ballDiv.className = 'ball-icon'; 
    ballDiv.style.backgroundColor = userData.cor; 
    ballDiv.innerText = userData.numero; 
    container.appendChild(ballDiv); 
}

function removerBolas(tipo, qtd) {
    let targets = bolas.filter(b => b.userData.ativa && !b.userData.isBranca && b.userData.tipo === tipo);
    targets.sort((a,b)=>a.userData.numero - b.userData.numero);
    for(let i=0; i<qtd && i<targets.length; i++) {
        targets[i].userData.ativa = false; 
        adicionarBolaNaListaUI(targets[i].userData); 
        scene.remove(targets[i]);
    }
}

function punirComBranca() {
    if (!gameState.modoDefinido) return;
    const meuTipo = (gameState.turno === 1) ? gameState.p1Tipo : gameState.p2Tipo;
    const oponenteTipo = (meuTipo === 'par') ? 'impar' : 'par';
    removerBolas(oponenteTipo, 1);
}

// Criar Bolas
const branca = criarBola('#ffffff', '.', new THREE.Vector3(0, Y_BOLAS, 8));
let bIdx = 2;
for (let r = 1; r < 5; r++) { 
    for (let i = 0; i <= r; i++) { 
        if (bIdx <= 15) { 
            const x = (i - r * 0.5) * (RAIO * 2.05); 
            const z = -8 - (r * RAIO * 1.85); 
            criarBola(coresC[bIdx.toString()], bIdx.toString(), new THREE.Vector3(x, Y_BOLAS, z)); 
            bIdx++; 
        } 
    } 
}

// --- TACO E MIRA ---
const taco = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.05, 25, 16), madeiraMat); 
scene.add(taco);

const ghostBall = new THREE.Mesh(new THREE.SphereGeometry(RAIO, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, wireframe: true })); 
scene.add(ghostBall);

const ghostStopBall = new THREE.Mesh(new THREE.SphereGeometry(RAIO, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 })); 
scene.add(ghostStopBall);

// --- CONTROLES ---
let angH = 0, rawForca = 0, altCam = 18, touchPos = { x: 0, y: 0 }, isCharging = false, mesaMovendo = false;
let alvoCamera = branca;

window.ontouchstart = (e) => { 
    if(mesaMovendo || gameState.aguardandoReset) return; 
    touchPos={x:e.touches[0].clientX, y:e.touches[0].clientY}; 
    isCharging=(touchPos.x > window.innerWidth*0.7); 
};

window.ontouchmove = (e) => {
    const t = e.touches[0];
    if(isCharging) { 
        rawForca = Math.max(0, Math.min(1.0, (t.clientY - touchPos.y)/250)); 
        document.getElementById('power-meter').style.width = (rawForca*100)+'%'; 
    }
    else if(!mesaMovendo) { 
        angH -= (t.clientX - touchPos.x)*0.005; 
        altCam = Math.max(9, Math.min(48, altCam + (t.clientY - touchPos.y)*0.2)); 
        touchPos={x:t.clientX, y:t.clientY}; 
    }
};

window.ontouchend = () => { 
    if(!mesaMovendo && isCharging && rawForca > 0.01) { 
        const f = Math.pow(rawForca, 1.6)*4.2; 
        branca.userData.vx = Math.sin(angH)*-f; 
        branca.userData.vz = Math.cos(angH)*-f; 
        gameState.fezPontoRodada = false; 
        gameState.primeiraBolaAtingida = null; 
        gameState.bateuNaTabelaAntes = false; 
        gameState.brancaCaiu = false; 
        gameState.matouAdversariaSemQuerer = false; 
    } 
    isCharging=false; 
    rawForca=0; 
    document.getElementById('power-meter').style.width='0%'; 
};

// --- LOOP PRINCIPAL (FÍSICA E RENDER) ---
function loop() {
    requestAnimationFrame(loop);
    for(let s=0; s<6; s++) {
        bolas.forEach(b => {
            if(!b.userData.ativa) return;
            
            const meuTipo = (gameState.turno === 1) ? gameState.p1Tipo : gameState.p2Tipo;
            if (!b.userData.isBranca && gameState.modoDefinido && b.userData.tipo === meuTipo) { 
                b.userData.glow.material.opacity = 0.4 + Math.sin(Date.now()*0.005)*0.2; 
                b.userData.glow.material.color.setHex(gameState.turno === 1 ? 0x00ff88 : 0x00d9ff); 
            } else { 
                b.userData.glow.material.opacity = 0; 
            }

            if(b.userData.caindo) {
                alvoCamera = b; b.position.y -= 0.15; 
                if(b.position.y < ALTURA_MESA-2) { 
                    let eraBranca = b.userData.isBranca; 
                    if(eraBranca) { gameState.brancaCaiu = true; punirComBranca(); }
                    if(!eraBranca) { 
                        adicionarBolaNaListaUI(b.userData); 
                        if(!gameState.modoDefinido) {
                            gameState.modoDefinido = true; 
                            gameState.p1Tipo = gameState.turno === 1 ? b.userData.tipo : (b.userData.tipo==='par'?'impar':'par'); 
                            gameState.p2Tipo = gameState.p1Tipo==='par'?'impar':'par';
                            gameState.fezPontoRodada = true;
                        } else if(b.userData.tipo !== meuTipo) { 
                            gameState.matouAdversariaSemQuerer = true; 
                        } else { 
                            gameState.fezPontoRodada = true; 
                        }
                    }
                    b.userData.ativa=false; scene.remove(b); gameState.aguardandoReset = true;
                    setTimeout(()=>{
                        if(eraBranca) { 
                            b.position.set(0,Y_BOLAS,10); 
                            b.userData.vx=b.userData.vz=0; 
                            b.userData.ativa=true; b.userData.caindo=false; 
                            scene.add(b); 
                        }
                        alvoCamera = branca; gameState.aguardandoReset = false;
                    }, 1200);
                }
                return;
            }

            const spd = Math.hypot(b.userData.vx, b.userData.vz);
            if(spd > 0.001) {
                b.position.x += b.userData.vx/6; b.position.z += b.userData.vz/6;
                b.userData.mesh.rotateOnWorldAxis(new THREE.Vector3(b.userData.vz, 0, -b.userData.vx).normalize(), (spd/6)/RAIO);
                b.userData.vx *= FRICCAO; b.userData.vz *= FRICCAO;
                cacapas.forEach(c => { if(Math.hypot(b.position.x-c.x, b.position.z-c.z) < 1.35) b.userData.caindo=true; });
                if(Math.abs(b.position.x) > LIMITE_X) { 
                    b.userData.vx *= -REBOTE_TABELA; b.position.x = Math.sign(b.position.x)*LIMITE_X; 
                    if(b===branca && !gameState.primeiraBolaAtingida) gameState.bateuNaTabelaAntes = true; 
                }
                if(Math.abs(b.position.z) > LIMITE_Z) { 
                    b.userData.vz *= -REBOTE_TABELA; b.position.z = Math.sign(b.position.z)*LIMITE_Z; 
                    if(b===branca && !gameState.primeiraBolaAtingida) gameState.bateuNaTabelaAntes = true; 
                }
            }
        });

        // Colisões entre bolas
        for(let i=0; i<bolas.length; i++) {
            for(let j=i+1; j<bolas.length; j++) {
                const b1=bolas[i], b2=bolas[j]; if(!b1.userData.ativa || !b2.userData.ativa || b1.userData.caindo || b2.userData.caindo) continue;
                const dx=b2.position.x-b1.position.x, dz=b2.position.z-b1.position.z, d=Math.hypot(dx,dz);
                if(d < RAIO*2) {
                    const nx=dx/d, nz=dz/d, vRel = (b1.userData.vx-b2.userData.vx)*nx + (b1.userData.vz-b2.userData.vz)*nz;
                    if(vRel > 0) { 
                        if(b1 === branca && !gameState.primeiraBolaAtingida) gameState.primeiraBolaAtingida = b2.userData; 
                        if(b2 === branca && !gameState.primeiraBolaAtingida) gameState.primeiraBolaAtingida = b1.userData; 
                        const imp = 1.02*vRel; 
                        b1.userData.vx -= imp*nx; b1.userData.vz -= imp*nz; 
                        b2.userData.vx += imp*nx; b2.userData.vz += imp*nz; 
                    }
                }
            }
        }
    }

    const movendoAntigo = mesaMovendo;
    mesaMovendo = bolas.some(b => b.userData.ativa && (Math.hypot(b.userData.vx, b.userData.vz) > 0.005 || b.userData.caindo));
    
    // Final do movimento da tacada
    if (movendoAntigo && !mesaMovendo && !gameState.aguardandoReset) {
        const meuTipo = (gameState.turno === 1) ? gameState.p1Tipo : gameState.p2Tipo;
        const adversarioTipo = meuTipo === 'par' ? 'impar' : 'par';
        let txt = "Sua vez!"; 
        let troca = !gameState.fezPontoRodada || gameState.matouAdversariaSemQuerer || gameState.brancaCaiu;
        
        if(gameState.modoDefinido) {
            if(gameState.brancaCaiu) { txt = "BRANCA CAIU! (+1 oponente)"; }
            else if(gameState.matouAdversariaSemQuerer) { removerBolas(meuTipo, 1); txt = "DERRUBOU A DELE! (-1 sua)"; }
            else if(!gameState.primeiraBolaAtingida) { removerBolas(adversarioTipo, 1); txt = "CEGOU! (+1 oponente)"; troca = true; }
            else if(gameState.primeiraBolaAtingida.tipo !== meuTipo) {
                if (gameState.bateuNaTabelaAntes) { removerBolas(adversarioTipo, 1); txt = "TABELA NA ERRADA! (+1 oponente)"; } 
                else { removerBolas(adversarioTipo, 2); txt = "DIRETO NA ERRADA! (+2 oponente)"; }
                troca = true;
            }
        }
        if(troca) gameState.turno = (gameState.turno === 1) ? 2 : 1;
        document.getElementById('status-text').innerText = txt;
        document.getElementById('turn-msg').innerText = "JOGADOR " + gameState.turno;
        document.getElementById('turn-msg').style.color = gameState.turno === 1 ? "#00ff88" : "#00d9ff";
    }

    // --- LÓGICA DE MIRA E CAMERA ---
    const dX = -Math.sin(angH), dZ = -Math.cos(angH);
    let distColisao = 1000, alvoMira = null;
    bolas.forEach(b => { 
        if(!b.userData.ativa || b===branca || b.userData.caindo) return; 
        const bx=b.position.x-branca.position.x, bz=b.position.z-branca.position.z, proj = bx*dX + bz*dZ; 
        if(proj>0) { 
            const dR = Math.hypot(bx-dX*proj, bz-dZ*proj); 
            if(dR < RAIO*2) { 
                const dC = proj - Math.sqrt(Math.pow(RAIO*2,2)-Math.pow(dR,2)); 
                if(dC < distColisao) { distColisao = dC; alvoMira = b; } 
            } 
        } 
    });

    if(distColisao === 1000) { 
        let tX = dX > 0 ? (LIMITE_X - branca.position.x)/dX : (-LIMITE_X - branca.position.x)/dX; 
        let tZ = dZ > 0 ? (LIMITE_Z - branca.position.z)/dZ : (-LIMITE_Z - branca.position.z)/dZ; 
        distColisao = Math.min(tX, tZ); 
    }

    ghostBall.visible = !mesaMovendo && !gameState.aguardandoReset;
    ghostStopBall.visible = !mesaMovendo && !gameState.aguardandoReset && rawForca > 0.05;
    
    if(ghostBall.visible) {
        ghostBall.position.set(branca.position.x + dX * distColisao, Y_BOLAS, branca.position.z + dZ * distColisao);
        
        if(alvoMira) {
            const meuTipo = (gameState.turno === 1) ? gameState.p1Tipo : gameState.p2Tipo;
            if(!gameState.modoDefinido) {
                ghostBall.material.color.setHex(alvoMira.userData.tipo === 'par' ? 0x00ff00 : 0x00d9ff);
            } else {
                ghostBall.material.color.setHex(alvoMira.userData.tipo === meuTipo ? 0x00ff00 : 0xff0000);
            }
            ghostBall.material.opacity = 0.6;
        } else {
            ghostBall.material.color.setHex(0xffffff);
            ghostBall.material.opacity = 0.15;
        }

        const distMax = (Math.pow(rawForca, 1.6)*4.2 / (1-FRICCAO))/6;
        ghostStopBall.position.set(branca.position.x + dX * Math.min(distColisao, distMax), Y_BOLAS + 0.01, branca.position.z + dZ * Math.min(distColisao, distMax));
        ghostStopBall.material.color.setHex(gameState.turno === 1 ? 0x00ff88 : 0x00d9ff);
    }

    taco.visible = !mesaMovendo && !gameState.aguardandoReset;
    if(taco.visible) { 
        const db = 13.5 + rawForca * 6; 
        taco.position.set(branca.position.x - dX * db, Y_BOLAS + 0.2, branca.position.z - dZ * db); 
        taco.lookAt(branca.position.x, Y_BOLAS, branca.position.z); 
        taco.rotateX(-Math.PI/2); 
    }

    camera.position.lerp(new THREE.Vector3(alvoCamera.position.x - dX * (1 + altCam * 0.9), altCam, alvoCamera.position.z - dZ * (1 + altCam * 0.9)), 0.08);
    camera.userData.currentLook.lerp(alvoCamera.position, 0.08); 
    camera.lookAt(camera.userData.currentLook);
    
    renderer.render(scene, camera);
}

loop();
