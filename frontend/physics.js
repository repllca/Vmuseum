import * as CANNON from "https://cdn.skypack.dev/cannon-es";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function setupPhysics(scene, ROOM) {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });

  // --- 床 ---
  const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  // --- 壁（部屋サイズに合わせる） ---
  const halfW = ROOM.width / 2;
  const halfD = ROOM.depth / 2;
  const yCenter = ROOM.height / 2;

  const walls = [
    { pos: [0, yCenter, -halfD], rot: [0, 0, 0] },            // 正面（奥）
    { pos: [0, yCenter,  halfD], rot: [0, Math.PI, 0] },      // 背面（手前）
    { pos: [-halfW, yCenter, 0], rot: [0, Math.PI / 2, 0] },  // 左
    { pos: [ halfW, yCenter, 0], rot: [0, -Math.PI / 2, 0] }, // 右
    { pos: [0, ROOM.height, 0], rot: [Math.PI / 2, 0, 0] },   // 天井
  ];

  for (const w of walls) {
    const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    wall.position.set(...w.pos);
    wall.quaternion.setFromEuler(...w.rot);
    world.addBody(wall);
  }

  // --- 球体（デバッグ） ---
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

  // --- プレイヤー ---
  const playerBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(0.3),
    position: new CANNON.Vec3(0, 1.6, ROOM.depth * 0.2),
    linearDamping: 0.9,
  });
  world.addBody(playerBody);

  return { world, sphereBody, sphereMesh, playerBody };
}
