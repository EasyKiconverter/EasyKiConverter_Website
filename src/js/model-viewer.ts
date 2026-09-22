import * as THREE from 'three';

type ModelBounds = {
  x: [number, number];
  y: [number, number];
  z: [number, number];
};

type MeshMessage = {
  type: 'mesh' | 'error';
  meshes?: { positions: ArrayBuffer; indices: ArrayBuffer; color: number[] }[];
  triangleCount?: number;
  message?: string;
};

const bounds: ModelBounds = {
  x: [-6.649971, 54.089408],
  y: [-42.278385, 5.002515],
  z: [-2.000004, 15.999996],
};

export const setupModel = (): void => {
  const canvas = document.querySelector<HTMLCanvasElement>('#model-canvas');
  const stage = document.querySelector<HTMLElement>('[data-model-stage]');
  if (!canvas || !stage || typeof Worker !== 'function') {
    stage?.classList.add('model-fallback');
    return;
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    stage.classList.add('model-fallback');
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.set(0, 0, 4);

  const group = new THREE.Group();
  group.scale.setScalar(0.8);
  scene.add(group);
  scene.add(new THREE.HemisphereLight(0xfff7ed, 0x758a82, 1.45));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(-2, 3, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xe2ebff, 0.8);
  fillLight.position.set(3, 0.5, -2);
  scene.add(fillLight);

  const state = {
    pointerX: 0,
    pointerY: 0,
    scroll: 0,
    width: 1,
    height: 1,
    visible: true,
    frame: 0,
    start: performance.now(),
    modelRadius: 1,
  };

  const fitCamera = (): void => {
    const aspect = state.width / state.height;
    const halfHeight = state.modelRadius * 1.16 / Math.min(1, aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  };

  const resize = (): void => {
    const rect = stage.getBoundingClientRect();
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(state.width, state.height, false);
    fitCamera();
  };

  const updateScroll = (): void => {
    const rect = stage.getBoundingClientRect();
    state.scroll = Math.max(-1, Math.min(1, (window.innerHeight * 0.55 - (rect.top + rect.height * 0.5)) / (window.innerHeight * 1.2)));
  };

  const wake = (): void => {
    if (state.visible && !document.hidden && !state.frame) state.frame = requestAnimationFrame(render);
  };

  const render = (time: number): void => {
    state.frame = 0;
    if (!state.visible || document.hidden) return;
    const elapsed = time - state.start;
    group.rotation.y = 0.24 + elapsed * 0.00006 + state.pointerX * 0.25 + state.scroll * 0.42;
    group.rotation.x = -0.28 + state.pointerY * 0.12;
    group.position.x = state.scroll * 0.16;
    group.position.y = state.scroll * -0.04;
    renderer.render(scene, camera);
    wake();
  };

  const uploadMesh = (meshes: NonNullable<MeshMessage['meshes']>, triangleCount: number): void => {
    const materials = new Map<string, THREE.MeshStandardMaterial>();
    meshes.forEach(({ positions, indices, color }) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      const key = color.join(',');
      let material = materials.get(key);
      if (!material) {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color[0], color[1], color[2]),
          roughness: 0.42,
          metalness: 0.12,
          side: THREE.DoubleSide,
        });
        materials.set(key, material);
      }
      group.add(new THREE.Mesh(geometry, material));
    });
    const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere());
    state.modelRadius = Math.max(sphere.radius, 0.1);
    fitCamera();
    stage.dataset.modelTriangles = String(triangleCount);
    stage.classList.add('model-loaded');
    wake();
  };

  const worker = new Worker(new URL('./step-worker.ts', import.meta.url), { type: 'classic' });
  worker.onmessage = ({ data }: MessageEvent<MeshMessage>): void => {
    if (data.type === 'mesh' && data.meshes?.length && data.triangleCount) uploadMesh(data.meshes, data.triangleCount);
    else {
      stage.classList.add('model-fallback');
      console.warn('STEP model fallback:', data.message);
    }
    worker.terminate();
  };
  worker.onerror = (error): void => {
    stage.classList.add('model-fallback');
    console.warn('STEP model fallback:', error.message);
    worker.terminate();
  };
  const assetRoot = document.documentElement.lang === 'en' ? '../' : './';
  const modelQuality = stage.clientWidth < 520 ? 0.007 : 0.004;
  worker.postMessage({
    stepUrl: new URL(`${assetRoot}assets/model/Easykiconverter_展示模型.step`, document.baseURI).href,
    vendorRoot: new URL(`${assetRoot}assets/vendor/`, document.baseURI).href,
    bounds,
    linearDeflection: modelQuality,
  });

  const onPointerMove = (event: PointerEvent): void => {
    const rect = stage.getBoundingClientRect();
    state.pointerX = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    state.pointerY = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
  };
  stage.addEventListener('pointermove', onPointerMove, { passive: true });
  stage.addEventListener('pointerleave', () => { state.pointerX = 0; state.pointerY = 0; });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('visibilitychange', wake);
  resize();
  updateScroll();
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; wake(); }, { threshold: 0.01 }).observe(stage);
  wake();
};
