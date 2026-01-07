// Dentro do loop de movimento no script.js
let naBoca = false;
cacapas.forEach(c => {
    const d = Math.hypot(b.position.x - c.x, b.position.z - c.z);
    if(d < 1.6) { // Se estiver perto do buraco
        naBoca = true; 
        if(d < 1.1) b.userData.caindo = true; // Cai no buraco
    }
});

// SÓ rebate na parede se NÃO estiver na boca da caçapa
if(!naBoca) {
    if(Math.abs(b.position.x) > LIMITE_X) {
        b.userData.vx *= -REBOTE_TABELA;
        b.position.x = Math.sign(b.position.x) * LIMITE_X;
    }
    if(Math.abs(b.position.z) > LIMITE_Z) {
        b.userData.vz *= -REBOTE_TABELA;
        b.position.z = Math.sign(b.position.z) * LIMITE_Z;
    }
}

