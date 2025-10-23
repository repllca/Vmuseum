import { createScene } from "./scene.js";
import { setupControls } from "./controls.js";

const { scene, camera, renderer } = createScene();
const controls = setupControls(camera, renderer.domElement);

document.body.appendChild(renderer.domElement);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
