import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { rp2040StoryComponent } from '../data/story-component';
import { createRp2040Prototype } from './rp2040-prototype';

const MODEL_SPAN = 2.3;
const CONTEXT_TRANSITION_START = 0.76;
const CONTEXT_TRANSITION_END = 0.92;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type OpacityState = {
  material: THREE.Material & { opacity: number };
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
};

const collectOpacityStates = (root: THREE.Object3D): OpacityState[] => {
  const states: OpacityState[] = [];
  const seen = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (seen.has(material) || !('opacity' in material)) return;
      seen.add(material);
      const opacityMaterial = material as THREE.Material & { opacity: number };
      states.push({
        material: opacityMaterial,
        opacity: opacityMaterial.opacity,
        transparent: opacityMaterial.transparent,
        depthWrite: opacityMaterial.depthWrite,
      });
    });
  });
  return states;
};

const setOpacity = (states: OpacityState[], amount: number) => {
  const blending = amount < 0.999;
  states.forEach((state) => {
    state.material.opacity = state.opacity * amount;
    state.material.depthWrite = blending ? false : state.depthWrite;
    const transparent = state.transparent || blending;
    if (state.material.transparent !== transparent) {
      state.material.transparent = transparent;
      state.material.needsUpdate = true;
    }
  });
};

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
    host.dataset.modelFallback = 'true';
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
  const cameraHome = new THREE.Vector3(2, -2.7, 3.65);
  camera.position.copy(cameraHome);
  camera.lookAt(0, 0, 0);
  const assembly = new THREE.Group();
  scene.add(assembly);
  const protagonist = createRp2040Prototype();
  assembly.add(protagonist.group);
  const protagonistMaterials = collectOpacityStates(protagonist.group);

  let visible = false;
  let pageVisible = !document.hidden;
  let frame = 0;
  let loaded = false;
  let disposed = false;
  let boardModel: THREE.Group | null = null;
  let boardMaterials: OpacityState[] = [];
  let componentZoom = 1;
  let parts: Array<{ mesh: THREE.Mesh; base: THREE.Vector3; direction: THREE.Vector3; distance: number }> = [];

  const draw = () => {
    frame = 0;
    if (!loaded || !visible || !pageVisible) return;

    const progress = clamp(Number.parseFloat(getComputedStyle(storyRail).getPropertyValue('--story-progress')) || 0, 0, 1);
    const transitionProgress = motionPreference.matches
      ? progress >= 0.84 ? 1 : 0
      : clamp((progress - CONTEXT_TRANSITION_START) / (CONTEXT_TRANSITION_END - CONTEXT_TRANSITION_START), 0, 1);
    const boardContext = transitionProgress === 1;
    const separation = motionPreference.matches ? 0 : storySeparation(progress);
    let displacedPartCount = 0;
    const activeParts = boardContext ? parts : protagonist.movableParts;
    protagonist.group.visible = transitionProgress < 1;
    setOpacity(protagonistMaterials, 1 - transitionProgress);
    if (boardModel) boardModel.visible = transitionProgress > 0;
    setOpacity(boardMaterials, transitionProgress);
    activeParts.forEach(({ mesh, base, direction }) => {
      mesh.position.copy(base).addScaledVector(direction, separation);
      if (mesh.position.distanceToSquared(base) > 1e-12) displacedPartCount += 1;
    });
    if (!boardContext) parts.forEach(({ mesh, base }) => mesh.position.copy(base));
    viewport.dataset.partSeparation = separation.toFixed(3);
    viewport.dataset.displacedPartCount = String(displacedPartCount);
    viewport.dataset.activeVisual = boardContext ? 'illustrative-board-context' : 'rp2040-package';
    if (transitionProgress > 0 && transitionProgress < 1) viewport.dataset.activeVisual = 'component-to-board-transition';
    viewport.dataset.activePartCount = String(activeParts.length);
    viewport.dataset.protagonistContactCount = String(protagonist.contactCount);
    viewport.dataset.transitionProgress = transitionProgress.toFixed(3);
    const cameraZoom = motionPreference.matches
      ? boardContext ? 1 : componentZoom
      : componentZoom + (1 - componentZoom) * transitionProgress;
    viewport.dataset.cameraZoom = cameraZoom.toFixed(4);
    camera.position.copy(cameraHome).multiplyScalar(cameraZoom);
    camera.lookAt(0, 0, 0);
    assembly.rotation.z = motionPreference.matches ? 0 : (progress - 0.5) * 0.08;
    assembly.position.x = motionPreference.matches ? 0 : (progress - 0.5) * 0.06;
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
  const onScroll = () => scheduleDraw();
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
    host.dataset.modelFallback = 'true';
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
    boardModel = model;
    boardModel.visible = false;
    model.updateMatrixWorld(true);
    const sourceBounds = new THREE.Box3().setFromObject(model);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const sourceSpan = Math.max(sourceSize.x, sourceSize.y, sourceSize.z, 0.01);
    const sourceModelSpanMm = gltf.parser.json.asset.extras?.sourceModelSpanMm;
    if (typeof sourceModelSpanMm !== 'number' || !Number.isFinite(sourceModelSpanMm) || sourceModelSpanMm <= 0) {
      throw new Error('Story GLB is missing its source model span metadata');
    }
    componentZoom = rp2040StoryComponent.packageSizeMm / sourceModelSpanMm;
    protagonist.group.scale.setScalar(MODEL_SPAN / sourceModelSpanMm);
    viewport.dataset.modelSourceSpanMm = sourceModelSpanMm.toFixed(3);
    viewport.dataset.protagonistScale = protagonist.group.scale.x.toFixed(6);
    boardMaterials = collectOpacityStates(model);
    model.scale.multiplyScalar(MODEL_SPAN / sourceSpan);
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
    host.dataset.modelFallback = 'true';
    renderer.dispose();
  }
};
