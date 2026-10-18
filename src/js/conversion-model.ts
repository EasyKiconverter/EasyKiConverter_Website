import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const storySeparation = (progress: number) => {
  const keyframes = [0, 1, 0.36, 0];
  const position = clamp(progress, 0, 1) * (keyframes.length - 1);
  const index = Math.min(Math.floor(position), keyframes.length - 2);
  const amount = position - index;
  const easedAmount = amount * amount * (3 - 2 * amount);
  return keyframes[index] + (keyframes[index + 1] - keyframes[index]) * easedAmount;
};

export const startConversionModel = async (host: HTMLElement) => {
  const canvas = host.querySelector<HTMLCanvasElement>('[data-conversion-canvas]');
  const viewport = canvas?.parentElement;
  const modelUrl = host.dataset.modelUrl;
  const storyRail = host.closest<HTMLElement>('[data-story-rail]');
  if (!canvas || !viewport || !modelUrl || !storyRail) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    viewport.dataset.webglError = 'true';
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfffbef, 0x776d62, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(-2.8, -3.6, 5.2);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xe1d8ff, 1.15);
  fillLight.position.set(3.6, 1.2, 2.6);
  scene.add(fillLight);

  const camera = new THREE.PerspectiveCamera(33, 1, 0.02, 50);
  camera.up.set(0, 0, 1);
  camera.position.set(2, -2.7, 3.65);
  camera.lookAt(0, 0, 0);
  const assembly = new THREE.Group();
  scene.add(assembly);

  let visible = false;
  let pageVisible = !document.hidden;
  let frame = 0;
  let loaded = false;
  let disposed = false;
  let parts: Array<{ mesh: THREE.Mesh; base: THREE.Vector3; direction: THREE.Vector3; distance: number }> = [];

  const draw = () => {
    frame = 0;
    if (!loaded || !visible || !pageVisible) return;

    const progress = motionPreference.matches
      ? 1
      : clamp(Number.parseFloat(getComputedStyle(storyRail).getPropertyValue('--story-progress')) || 0, 0, 1);
    const separation = motionPreference.matches ? 0 : storySeparation(progress);
    let displacedPartCount = 0;
    parts.forEach(({ mesh, base, direction }) => {
      mesh.position.copy(base).addScaledVector(direction, separation);
      if (mesh.position.distanceToSquared(base) > 1e-12) displacedPartCount += 1;
    });
    viewport.dataset.partSeparation = separation.toFixed(3);
    viewport.dataset.displacedPartCount = String(displacedPartCount);
    assembly.rotation.z = (progress - 0.5) * 0.08;
    assembly.position.x = (progress - 0.5) * 0.06;
    renderer.render(scene, camera);
  };
  const scheduleDraw = () => {
    if (!disposed && !frame && visible && pageVisible && loaded) frame = window.requestAnimationFrame(draw);
  };
  const resize = () => {
    const { width, height } = viewport.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    scheduleDraw();
  };

  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) scheduleDraw();
    else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: '80px 0px', threshold: 0 });
  const onScroll = () => {
    if (!motionPreference.matches) scheduleDraw();
  };
  const resizeObserver = new ResizeObserver(resize);
  const onVisibilityChange = () => {
    pageVisible = !document.hidden;
    if (pageVisible) scheduleDraw();
    else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
  };
  const onMotionPreferenceChange = () => scheduleDraw();
  let onContextLost: (event: Event) => void = () => {};
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    window.visualViewport?.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    motionPreference.removeEventListener('change', onMotionPreferenceChange);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
  };
  onContextLost = (event: Event) => {
    event.preventDefault();
    loaded = false;
    viewport.removeAttribute('data-webgl-ready');
    viewport.dataset.webglError = 'true';
    cleanup();
    renderer.dispose();
  };

  observer.observe(host);
  resizeObserver.observe(viewport);
  canvas.addEventListener('webglcontextlost', onContextLost);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
  motionPreference.addEventListener('change', onMotionPreferenceChange);

  try {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(modelUrl);
    if (disposed) return;
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const sourceBounds = new THREE.Box3().setFromObject(model);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const sourceSpan = Math.max(sourceSize.x, sourceSize.y, sourceSize.z, 0.01);
    model.scale.multiplyScalar(2.3 / sourceSpan);
    assembly.add(model);
    assembly.updateMatrixWorld(true);
    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const modelCenter = bounds.getCenter(new THREE.Vector3());
    const modelSize = bounds.getSize(new THREE.Vector3());
    model.position.sub(modelCenter);
    model.updateMatrixWorld(true);

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const partBounds = new THREE.Box3().setFromObject(object);
      if (partBounds.isEmpty()) return;
      const partCenter = partBounds.getCenter(new THREE.Vector3());
      const partSize = partBounds.getSize(new THREE.Vector3());
      const base = object.position.clone();
      const index = parts.length;
      object.castShadow = false;
      object.receiveShadow = false;
      const materialList = Array.isArray(object.material) ? object.material : [object.material];
      materialList.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.roughness = Math.max(material.roughness, 0.38);
          material.metalness = Math.min(material.metalness, 0.18);
        }
      });

      const planarExtent = Math.max(partSize.x, partSize.y);
      const isBoard = planarExtent > Math.max(modelSize.x, modelSize.y) * 0.72;
      const relativeCenter = partCenter.clone();
      const radial = new THREE.Vector3(relativeCenter.x * 0.68, relativeCenter.y * 0.68, 0.82 + (index % 7) * 0.06);
      if (radial.lengthSq() < 0.0001) radial.set(Math.cos(index * 2.4), Math.sin(index * 2.4), 0.5);
      radial.normalize();
      const distance = isBoard ? 0 : 0.18 + (index % 5) * 0.04;
      const parent = object.parent;
      const direction = radial.clone().multiplyScalar(distance);
      if (parent && distance > 0) {
        const targetWorldPosition = object.getWorldPosition(new THREE.Vector3()).addScaledVector(radial, distance);
        const targetParentPosition = targetWorldPosition.applyMatrix4(parent.matrixWorld.clone().invert());
        direction.copy(targetParentPosition.sub(base));
      }
      parts.push({
        mesh: object,
        base,
        direction,
        distance,
      });
    });

    loaded = true;
    viewport.dataset.webglReady = 'true';
    viewport.dataset.partCount = String(parts.length);
    viewport.dataset.movingPartCount = String(parts.filter((part) => part.distance > 0).length);
    resize();
    scheduleDraw();
  } catch {
    cleanup();
    viewport.dataset.webglError = 'true';
    renderer.dispose();
  }
};
