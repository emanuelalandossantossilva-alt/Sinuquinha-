// Criando o tampo da mesa
const geometriaMesa = new THREE.BoxGeometry(20, 1, 12);
const mesa = new THREE.Mesh(geometriaMesa, feltroMat); // Seu material verde musgo
mesa.position.y = -0.5; // Ajusta para o topo ficar no nível 0
scene.add(mesa);

// Criando as bordas de madeira
const bordaLongaGeo = new THREE.BoxGeometry(21, 1.5, 1);
const borda1 = new THREE.Mesh(bordaLongaGeo, madeiraMat); // Seu material de mogno
borda1.position.set(0, 0.25, 5.5);
scene.add(borda1);

const borda2 = borda1.clone();
borda2.position.z = -5.5;
scene.add(borda2);

