import * as THREE from "three";

type MeshMessage = {
  type: "mesh" | "error";
  meshes?: { positions: ArrayBuffer; indices: ArrayBuffer; color: number[] }[];
  triangleCount?: number;
  message?: string;
};

export const setupModel = (): void => {
  const canvas = document.querySelector<HTMLCanvasElement>("#model-canvas");
  const stage = document.querySelector<HTMLElement>("[data-model-stage]");
  if (!canvas || !stage || typeof Worker !== "function") {
    stage?.classList.add("model-fallback");
    return;
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch {
    stage.classList.add("model-fallback");
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
    storyProgress: 0,
    width: 1,
    height: 1,
    visible: true,
    frame: 0,
    modelRadius: 1,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
  };

  const fitCamera = (): void => {
    const aspect = state.width / state.height;
    const halfHeight = (state.modelRadius * 1.16) / Math.min(1, aspect);
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

  const timeline = document.querySelector<HTMLElement>(
    "[data-motion-timeline]",
  );
  const progressFill = timeline?.querySelector<HTMLElement>(
    ".motion-progress span",
  );
  const keyframes = [
    { at: 0, x: 0, y: 0, rx: -0.28, ry: 0.22, scale: 1 },
    { at: 0.23, x: -0.28, y: 0.02, rx: -0.12, ry: 1.3, scale: 0.92 },
    { at: 0.48, x: 0.3, y: -0.03, rx: -0.48, ry: 3.1, scale: 0.9 },
    { at: 0.73, x: 0.72, y: 0.02, rx: -0.2, ry: 4.7, scale: 0.65 },
    { at: 1, x: 1.15, y: -0.04, rx: 0.04, ry: 6.1, scale: 0.34 },
  ];

  const wake = (): void => {
    if (state.visible && !document.hidden && !state.frame)
      state.frame = requestAnimationFrame(render);
  };

  const render = (): void => {
    state.frame = 0;
    if (!state.visible || document.hidden) return;
    if (timeline && !state.reducedMotion) {
      const rect = timeline.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight);
      state.storyProgress = Math.max(0, Math.min(1, -rect.top / distance));
      if (progressFill)
        progressFill.style.transform = `scaleX(${state.storyProgress})`;
      const step =
        state.storyProgress < 0.22
          ? 0
          : state.storyProgress < 0.46
            ? 1
            : state.storyProgress < 0.72
              ? 2
              : 3;
      if (timeline.dataset.storyStep !== String(step))
        timeline.dataset.storyStep = String(step);
    }
    const progress = state.reducedMotion ? 0 : state.storyProgress;
    const nextIndex = keyframes.findIndex(({ at }) => at >= progress);
    const from = keyframes[Math.max(0, nextIndex - 1)];
    const to = keyframes[Math.max(0, nextIndex)];
    const mix =
      nextIndex < 0
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (progress - from.at) / Math.max(0.001, to.at - from.at),
            ),
          );
    const ease = mix * mix * (3 - 2 * mix);
    const blend = (start: number, end: number): number =>
      start + (end - start) * ease;
    group.rotation.y =
      blend(from.ry, to.ry) +
      (state.reducedMotion ? 0 : state.pointerX * 0.12);
    group.rotation.x =
      blend(from.rx, to.rx) +
      (state.reducedMotion ? 0 : state.pointerY * 0.06);
    group.position.x = blend(from.x, to.x);
    group.position.y = blend(from.y, to.y);
    group.scale.setScalar(0.8 * blend(from.scale, to.scale));
    renderer.render(scene, camera);
  };

  const uploadMesh = (
    meshes: NonNullable<MeshMessage["meshes"]>,
    triangleCount: number,
  ): void => {
    const materials = new Map<string, THREE.MeshStandardMaterial>();
    meshes.forEach(({ positions, indices, color }) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(positions), 3),
      );
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      const key = color.join(",");
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
    const sphere = new THREE.Box3()
      .setFromObject(group)
      .getBoundingSphere(new THREE.Sphere());
    state.modelRadius = Math.max(sphere.radius, 0.1);
    fitCamera();
    stage.dataset.modelTriangles = String(triangleCount);
    stage.classList.add("model-loaded");
    wake();
  };

  const worker = new Worker(new URL("./step-worker.ts", import.meta.url), {
    type: "classic",
  });
  worker.onmessage = ({ data }: MessageEvent<MeshMessage>): void => {
    if (data.type === "mesh" && data.meshes?.length && data.triangleCount)
      uploadMesh(data.meshes, data.triangleCount);
    else {
      stage.classList.add("model-fallback");
      console.warn("STEP model fallback:", data.message);
    }
    worker.terminate();
  };
  worker.onerror = (error): void => {
    stage.classList.add("model-fallback");
    console.warn("STEP model fallback:", error.message);
    worker.terminate();
  };
  const assetRoot = document.documentElement.lang === "en" ? "../" : "./";
  const modelQuality = stage.clientWidth < 520 ? 0.007 : 0.004;
  worker.postMessage({
    stepUrl: new URL(
      `${assetRoot}assets/model/Easykiconverter_展示模型.step`,
      document.baseURI,
    ).href,
    vendorRoot: new URL(`${assetRoot}assets/vendor/`, document.baseURI).href,
    linearDeflection: modelQuality,
  });

  const onPointerMove = (event: PointerEvent): void => {
    state.pointerX = event.clientX / Math.max(1, window.innerWidth) - 0.5;
    state.pointerY = event.clientY / Math.max(1, window.innerHeight) - 0.5;
    wake();
  };
  stage.addEventListener("pointermove", onPointerMove, { passive: true });
  stage.addEventListener("pointerleave", () => {
    state.pointerX = 0;
    state.pointerY = 0;
    wake();
  });
  window.addEventListener(
    "resize",
    () => {
      resize();
      wake();
    },
    { passive: true },
  );
  window.addEventListener("scroll", wake, { passive: true });
  document.addEventListener("visibilitychange", wake);
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  motionPreference.addEventListener("change", ({ matches }) => {
    state.reducedMotion = matches;
    if (matches) {
      state.pointerX = 0;
      state.pointerY = 0;
      state.storyProgress = 0;
      if (timeline) delete timeline.dataset.storyStep;
      if (progressFill) progressFill.style.transform = "scaleX(0)";
    }
    wake();
  });
  resize();
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      ([entry]) => {
        state.visible = entry.isIntersecting;
        wake();
      },
      { threshold: 0.01 },
    ).observe(stage);
  wake();
};
