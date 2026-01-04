// Mesa com feltro verde musgo (estilo pano surrado)
const feltroMat = new THREE.MeshStandardMaterial({ 
    color: 0x0a3d1e, 
    roughness: 1.0 
}); 

// Madeira escura para as bordas (estilo mogno antigo)
const madeiraMat = new THREE.MeshStandardMaterial({ 
    color: 0x3d2610, 
    roughness: 0.6 
}); 

// Adicione uma luz amarelada (luz de lâmpada de bar pendurada)
const luzBar = new THREE.PointLight(0xffaa00, 1.2);
luzBar.position.set(0, 20, 0);
scene.add(luzBar);

// Neblina escura para o fundo sumir no breu do bar
scene.fog = new THREE.FogExp2(0x0a0502, 0.015);

