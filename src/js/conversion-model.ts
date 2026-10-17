import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  let parts: Array<{ mesh: THREE.Mesh; base: THREE.Vector3; direction: THREE.Vector3; distance: number }> = [];

  const draw = () => {
    frame = 0;
    if (!loaded || !visible || !pageVisible) return;

    const progress = motionPreference.matches
      ? 1
      : clamp(Number.parseFloat(getComputedStyle(storyRail).getPropertyValue('--story-progress')) || 0, 0, 1);
    const separation = motionPreference.matches ? 0 : Math.sin(progress * Math.PI);
    parts.forEach(({ mesh, base, direction, distance }) => {
      mesh.position.copy(base).addScaledVector(direction, separation * distance);
    });
    viewport.dataset.partSeparation = separation.toFixed(3);
    assembly.rotation.z = (progress - 0.5) * 0.08;
    assembly.position.x = (progress - 0.5) * 0.06;
    renderer.render(scene, camera);
  };
  const scheduleDraw = () => {
    if (!frame && visible && pageVisible && loaded) frame = window.requestAnimationFrame(draw);
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
  observer.observe(host);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
    if (pageVisible) scheduleDraw();
    else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
  }, { passive: true });
  motionPreference.addEventListener('change', scheduleDraw);

  try {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(modelUrl);
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const modelCenter = bounds.getCenter(new THREE.Vector3());
    const modelSize = bounds.getSize(new THREE.Vector3());
    const modelSpan = Math.max(modelSize.x, modelSize.y, modelSize.z, 0.01);

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const geometry = object.geometry;
      geometry.computeBoundingBox();
      if (!geometry.boundingBox) return;
      const partCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
      const partSize = geometry.boundingBox.getSize(new THREE.Vector3());
      const base = object.position.clone().add(partCenter).sub(modelCenter);
      const index = parts.length;
      geometry.translate(-partCenter.x, -partCenter.y, -partCenter.z);
      object.position.copy(base);
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
      const radial = new THREE.Vector3(base.x * 0.68, base.y * 0.68, 0.82 + (index % 7) * 0.06);
      if (radial.lengthSq() < 0.0001) radial.set(Math.cos(index * 2.4), Math.sin(index * 2.4), 0.5);
      radial.normalize();
      parts.push({
        mesh: object,
        base,
        direction: radial,
        distance: isBoard ? 0 : 0.18 + (index % 5) * 0.04,
      });
    });

    const scale = 2.3 / modelSpan;
    model.scale.setScalar(scale);
    assembly.add(model);
    loaded = true;
    viewport.dataset.webglReady = 'true';
    viewport.dataset.partCount = String(parts.length);
    resize();
    scheduleDraw();
  } catch {
    viewport.dataset.webglError = 'true';
    renderer.dispose();
  }
};
