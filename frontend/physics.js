import * as CANNON from "https://cdn.skypack.dev/cannon-es";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function setupPhysics(scene) {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });

  // --- 床 ---
  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  // --- 壁（部屋の外枠と同じサイズ） ---
  const halfSize = 5;
  const wallMaterial = new CANNON.Material();

  // 壁6面
  const walls = [
    { pos: [0, 2.5, -halfSize], rot: [0, 0, 0] }, // 奥
    { pos: [0, 2.5, halfSize], rot: [0, Math.PI, 0] }, // 手前
    { pos: [-halfSize, 2.5, 0], rot: [0, Math.PI / 2, 0] }, // 左
    { pos: [halfSize, 2.5, 0], rot: [0, -Math.PI / 2, 0] }, // 右
    { pos: [0, 5, 0], rot: [Math.PI / 2, 0, 0] }, // 天井
  ];

  for (const w of walls) {
    const wall = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: wallMaterial,
    });
    wall.position.set(...w.pos);
    wall.quaternion.setFromEuler(...w.rot);
    world.addBody(wall);
  }

  // --- 球体 ---
  const radius = 0.5;
  const sphereBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(radius),
    position: new CANNON.Vec3(0, 5, 0),
  });
  world.addBody(sphereBody);

  const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xff5533 })
  );
  scene.add(sphereMesh);

  // --- カメラ用（プレイヤー）物理ボディ ---
  const playerBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(0.3),
    position: new CANNON.Vec3(0, 1.6, 3),
    linearDamping: 0.9, // 慣性を軽減
  });
  world.addBody(playerBody);

  return { world, sphereBody, sphereMesh, playerBody };
}
