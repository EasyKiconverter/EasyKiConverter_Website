import * as THREE from 'three';

type ModelBounds = {
  x: [number, number];
  y: [number, number];
  z: [number, number];
};

type MeshMessage = {
  type: 'mesh' | 'error';
  vertices?: ArrayBuffer;
  vertexCount?: number;
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
  scene.add(new THREE.HemisphereLight(0xfff7ed, 0x758a82, 1.8));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(-2, 3, 4);
  scene.add(keyLight);

  const state = {
    pointerX: 0,
    pointerY: 0,
    scroll: 0,
    width: 1,
    height: 1,
    visible: true,
    frame: 0,
    start: performance.now(),
  };

  const resize = (): void => {
    const rect = stage.getBoundingClientRect();
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(state.width, state.height, false);
    const aspect = state.width / state.height;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
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

  const uploadMesh = (vertices: ArrayBuffer, vertexCount: number): void => {
    const data = new Float32Array(vertices);
    const geometry = new THREE.BufferGeometry();
    const interleaved = new THREE.InterleavedBuffer(data, 9);
    geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(interleaved, 3, 0));
    geometry.setAttribute('normal', new THREE.InterleavedBufferAttribute(interleaved, 3, 3));
    geometry.setAttribute('color', new THREE.InterleavedBufferAttribute(interleaved, 3, 6));
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.66, metalness: 0.05, side: THREE.DoubleSide });
    group.add(new THREE.Mesh(geometry, material));
    stage.dataset.modelTriangles = String(Math.round(vertexCount / 3));
    stage.classList.add('model-loaded');
    wake();
  };

  const worker = new Worker(new URL('./step-worker.ts', import.meta.url), { type: 'classic' });
  worker.onmessage = ({ data }: MessageEvent<MeshMessage>): void => {
    if (data.type === 'mesh' && data.vertices && data.vertexCount) uploadMesh(data.vertices, data.vertexCount);
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
  worker.postMessage({
    stepUrl: new URL(`${assetRoot}assets/model/Easykiconverter_展示模型.step`, document.baseURI).href,
    vendorRoot: new URL(`${assetRoot}assets/vendor/`, document.baseURI).href,
    bounds,
    maxTriangles: state.width < 520 ? 36000 : 75000,
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
