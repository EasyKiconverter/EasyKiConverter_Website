import type * as THREE from "three";

type MeshMessage = {
  type: "mesh" | "error";
  meshes?: {
    positions: ArrayBuffer;
    normals?: ArrayBuffer;
    indices: ArrayBuffer;
    color: number[];
    roughness?: number;
    metalness?: number;
  }[];
  triangleCount?: number;
  modelSpanMm?: number;
  modelCenterMm?: number[];
  message?: string;
};

type SectionLoop = {
  points: [number, number][];
  signedArea: number;
  area: number;
  depth: number;
  role: "outer" | "hole" | "island";
};

type SectionReference = {
  axis: "x" | "y" | "z";
  percent: number;
  loops: [number, number][][];
  area: number;
  perimeter: number;
};

type SectionFrame = {
  axis: "x" | "y" | "z";
  percent: number;
  area: number;
  perimeter: number;
  loops: SectionLoop[];
};

type ParsedTimeCapsule = {
  frames: SectionFrame[];
  kind?: string;
  event?: string;
  frame?: number;
  role?: SectionLoop["role"];
  window?: { start?: number; end?: number };
};

type LoopSignature = {
  role: SectionLoop["role"];
  area: number;
};

type SwarmArchiveEntry = {
  gene: number;
  fitness: number;
  kind: string;
  at: number;
  sliceAxis?: "x" | "y" | "z";
  slicePercent?: number;
  frameIndex?: number;
  frames?: SectionFrame[];
};

const pointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [x, y] = polygon[index];
    const [previousX, previousY] = polygon[previous];
    const intersects = (y > point[1]) !== (previousY > point[1]) &&
      point[0] < ((previousX - x) * (point[1] - y)) / (previousY - y) + x;
    if (intersects) inside = !inside;
  }
  return inside;
};

export const setupModel = async (): Promise<void> => {
  const stage = document.querySelector<HTMLElement>("[data-model-stage]");
  if (stage?.dataset.controlsReady === "true") return;
  const controlsRoot = stage ?? document;
  const experimentControlsToggle = controlsRoot.querySelector<HTMLButtonElement>("[data-experiment-controls]");
  const experimentControlsNote = controlsRoot.querySelector<HTMLElement>(".lab-experiment-controls");
  const syncExperimentControls = (): void => {
    if (!experimentControlsToggle || !stage) return;
    const open = stage.dataset.controlsOpen === "true";
    controlsRoot instanceof HTMLElement && (controlsRoot.dataset.controlsOpen = String(open));
    const english = document.documentElement.lang === "en";
    experimentControlsToggle.setAttribute("aria-expanded", String(open));
    experimentControlsToggle.textContent = open
      ? english ? "ADVANCED −" : "高级工具 −"
      : english ? "ADVANCED +" : "高级工具 +";
    experimentControlsNote?.setAttribute("aria-hidden", String(!open));
  };
  experimentControlsToggle?.addEventListener("click", () => {
    if (!stage) return;
    stage.dataset.controlsOpen = stage.dataset.controlsOpen === "true" ? "false" : "true";
    syncExperimentControls();
  });
  syncExperimentControls();
  stage?.setAttribute("data-controls-ready", "true");

  const THREE = await import("three");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const canvas = document.querySelector<HTMLCanvasElement>("#model-canvas");
  const atlasCanvas = stage?.querySelector<HTMLCanvasElement>("[data-mesh-atlas]");
  const atlasContext = atlasCanvas?.getContext("2d") ?? null;
  const tomogramCanvas = stage?.querySelector<HTMLCanvasElement>("[data-model-tomogram]");
  const tomogramContext = tomogramCanvas?.getContext("2d") ?? null;
  const oracleCanvas = stage?.querySelector<HTMLCanvasElement>("[data-model-oracle]");
  const oracleContext = oracleCanvas?.getContext("2d") ?? null;
  const trinityCanvas = stage?.querySelector<HTMLCanvasElement>("[data-model-trinity]");
  const trinityContext = trinityCanvas?.getContext("2d") ?? null;
  const morphCanvas = stage?.querySelector<HTMLCanvasElement>("[data-model-morph]");
  const morphContext = morphCanvas?.getContext("2d") ?? null;
  const morphGravityButton = stage?.querySelector<HTMLButtonElement>("[data-morph-gravity]");
  const morphForkButton = stage?.querySelector<HTMLButtonElement>("[data-morph-fork]");
  const morphCollisionButton = stage?.querySelector<HTMLButtonElement>("[data-morph-collision]");
  const morphAntimatterButton = stage?.querySelector<HTMLButtonElement>("[data-morph-antimatter]");
  const morphAnnihilateButton = stage?.querySelector<HTMLButtonElement>("[data-morph-annihilate]");
  const morphResonanceButton = stage?.querySelector<HTMLButtonElement>("[data-morph-resonance]");
  const morphMutateButton = stage?.querySelector<HTMLButtonElement>("[data-morph-mutate]");
  const morphCrossbreedButton = stage?.querySelector<HTMLButtonElement>("[data-morph-crossbreed]");
  const morphEvolveButton = stage?.querySelector<HTMLButtonElement>("[data-morph-evolve]");
  const morphArchiveButton = stage?.querySelector<HTMLButtonElement>("[data-morph-archive]");
  const morphGenomeShareButton = stage?.querySelector<HTMLButtonElement>("[data-morph-genome-share]");
  const morphGenomePassportButton = stage?.querySelector<HTMLButtonElement>("[data-morph-genome-passport]");
  const morphGenomeInjectButton = stage?.querySelector<HTMLButtonElement>("[data-morph-genome-inject]");
  const morphGenomeInput = stage?.querySelector<HTMLInputElement>("[data-morph-genome-input]");
  const genomeDuelButton = stage?.querySelector<HTMLButtonElement>("[data-genome-duel]");
  const genomeDuelSpawnButton = stage?.querySelector<HTMLButtonElement>("[data-genome-spawn]");
  const genomeSpectateButton = stage?.querySelector<HTMLButtonElement>("[data-genome-spectate]");
  const genomeArenaButton = stage?.querySelector<HTMLButtonElement>("[data-genome-arena]");
  const genomeArenaBoard = stage?.querySelector<HTMLElement>("[data-genome-arena-board]");
  const genomeArenaSeats = stage?.querySelector<HTMLElement>("[data-genome-arena-seats]");
  const genomeArenaList = stage?.querySelector<HTMLOListElement>("[data-genome-arena-list]");
  const genomeArenaHistory = stage?.querySelector<HTMLUListElement>("[data-genome-arena-history]");
  const genomeArenaTimeline = stage?.querySelector<HTMLElement>("[data-genome-arena-timeline]");
  const genomeArenaTimeSlider = stage?.querySelector<HTMLInputElement>("[data-genome-arena-time-slider]");
  const genomeArenaTimeOutput = stage?.querySelector<HTMLOutputElement>("[data-genome-arena-time]");
  const genomeArenaMixButton = stage?.querySelector<HTMLButtonElement>("[data-genome-arena-mix]");
  const genomeArenaBridgeDuelButton = stage?.querySelector<HTMLButtonElement>("[data-genome-arena-bridge-duel]");
  const genomeArenaAscendButton = stage?.querySelector<HTMLButtonElement>("[data-genome-arena-ascend]");
  const genomeArenaSeasonButton = stage?.querySelector<HTMLButtonElement>("[data-genome-arena-season]");
  const genomeArenaChallengeButton = stage?.querySelector<HTMLButtonElement>("[data-genome-arena-challenge]");
  const genomeSeasonBracket = stage?.querySelector<HTMLOListElement>("[data-genome-season-bracket]");
  const causalHorizonButton = stage?.querySelector<HTMLButtonElement>("[data-causal-horizon]");
  const causalOrbitExportButton = stage?.querySelector<HTMLButtonElement>("[data-causal-orbit-export]");
  const causalOrbitImportButton = stage?.querySelector<HTMLButtonElement>("[data-causal-orbit-import]");
  const causalOrbitReplayButton = stage?.querySelector<HTMLButtonElement>("[data-causal-orbit-replay]");
  const causalOrbitInput = stage?.querySelector<HTMLInputElement>("[data-causal-orbit-input]");
  const causalEntangleButton = stage?.querySelector<HTMLButtonElement>("[data-causal-entangle]");
  const tomogramBuffer = document.createElement("canvas");
  tomogramBuffer.width = 360;
  tomogramBuffer.height = 180;
  const tomogramBufferContext = tomogramBuffer.getContext("2d");
  const tomogramColumn = new ImageData(1, tomogramBuffer.height);
  let previousTomogramColumn: number | null = null;
  if (!canvas || !stage || typeof Worker !== "function") {
    stage?.classList.add("model-fallback");
    return;
  }

  const artifactButtons = Array.from(stage.querySelectorAll<HTMLButtonElement>("[data-artifact-view]"));
  const artifactCanvases: Record<string, HTMLCanvasElement | null> = {
    model: canvas,
    atlas: stage.querySelector<HTMLCanvasElement>(".mesh-atlas"),
    tomogram: stage.querySelector<HTMLCanvasElement>(".model-tomogram"),
    oracle: stage.querySelector<HTMLCanvasElement>(".model-oracle"),
    trinity: stage.querySelector<HTMLCanvasElement>(".model-trinity"),
    morph: stage.querySelector<HTMLCanvasElement>(".model-morph"),
  };
  const artifactLabel = stage.querySelector<HTMLElement>("[data-artifact-label]");
  const detailStatus = stage.querySelector<HTMLElement>("[data-model-detail-status]");
  const artifactCaption = stage.querySelector<HTMLElement>(".artifact-caption");
  stage.dataset.artifactView = stage.dataset.artifactView || "model";

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
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.set(0, 0, 4);

  const group = new THREE.Group();
  group.scale.setScalar(0.8);
  scene.add(group);
  const temporalGhostGroup = new THREE.Group();
  temporalGhostGroup.renderOrder = 4;
  scene.add(temporalGhostGroup);
  const memoryGhostGroup = new THREE.Group();
  memoryGhostGroup.renderOrder = 3;
  scene.add(memoryGhostGroup);
  const memoryConstellationGeometry = new THREE.BufferGeometry();
  memoryConstellationGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 2 * 6), 3));
  memoryConstellationGeometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(3 * 2 * 6), 3));
  const memoryConstellationMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.24, depthWrite: false });
  const memoryConstellationLines = new THREE.LineSegments(memoryConstellationGeometry, memoryConstellationMaterial);
  memoryConstellationLines.frustumCulled = false;
  memoryConstellationLines.renderOrder = 2;
  scene.add(memoryConstellationLines);
  const ecologyBurstGroup = new THREE.Group();
  ecologyBurstGroup.renderOrder = 5;
  scene.add(ecologyBurstGroup);
  const topologyPulseGroup = new THREE.Group();
  topologyPulseGroup.renderOrder = 6;
  scene.add(topologyPulseGroup);
  const annihilationGhostGroup = new THREE.Group();
  annihilationGhostGroup.renderOrder = 7;
  scene.add(annihilationGhostGroup);
  const neuralSignalGroup = new THREE.Group();
  neuralSignalGroup.renderOrder = 8;
  scene.add(neuralSignalGroup);
  const forecastBranchGroup = new THREE.Group();
  forecastBranchGroup.renderOrder = 7.2;
  group.add(forecastBranchGroup);
  const narrativeTimeGroup = new THREE.Group();
  narrativeTimeGroup.renderOrder = 7.15;
  group.add(narrativeTimeGroup);
  const temporalClockGroup = new THREE.Group();
  temporalClockGroup.renderOrder = 7.12;
  group.add(temporalClockGroup);
  const temporalClockRings = [
    { mesh: new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.0035, 8, 96), new THREE.MeshBasicMaterial({ color: 0xb9a8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })), phase: 0 },
    { mesh: new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.0025, 8, 96), new THREE.MeshBasicMaterial({ color: 0x8ffff2, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })), phase: 2.1 },
    { mesh: new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.0018, 8, 96), new THREE.MeshBasicMaterial({ color: 0xffca68, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })), phase: 4.2 },
  ];
  temporalClockRings.forEach(({ mesh }) => {
    mesh.frustumCulled = false;
    temporalClockGroup.add(mesh);
  });
  const temporalClockTicks = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfff4ce, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  const tickPositions = new Float32Array(24 * 2 * 3);
  for (let tick = 0; tick < 24; tick += 1) {
    const angle = (tick / 24) * Math.PI * 2;
    const inner = tick % 6 === 0 ? 0.735 : 0.765;
    const offset = tick * 6;
    tickPositions[offset] = Math.cos(angle) * inner;
    tickPositions[offset + 1] = Math.sin(angle) * inner;
    tickPositions[offset + 2] = 0;
    tickPositions[offset + 3] = Math.cos(angle) * 0.8;
    tickPositions[offset + 4] = Math.sin(angle) * 0.8;
    tickPositions[offset + 5] = 0;
  }
  temporalClockTicks.geometry.setAttribute("position", new THREE.BufferAttribute(tickPositions, 3));
  temporalClockTicks.frustumCulled = false;
  temporalClockGroup.add(temporalClockTicks);
  const temporalClockHand = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x8ffff2, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  temporalClockHand.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
  temporalClockHand.frustumCulled = false;
  temporalClockGroup.add(temporalClockHand);
  const temporalClockCursor = new THREE.Mesh(new THREE.RingGeometry(0.045, 0.058, 24), new THREE.MeshBasicMaterial({ color: 0xfff4ce, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  temporalClockCursor.frustumCulled = false;
  temporalClockGroup.add(temporalClockCursor);
  const temporalCollisionGroup = new THREE.Group();
  temporalCollisionGroup.renderOrder = 8.1;
  scene.add(temporalCollisionGroup);
  const causalSingularityGroup = new THREE.Group();
  causalSingularityGroup.renderOrder = 8.2;
  scene.add(causalSingularityGroup);
  const singularityWakeGroup = new THREE.Group();
  singularityWakeGroup.renderOrder = 8.25;
  scene.add(singularityWakeGroup);
  const peerOrbitGroup = new THREE.Group();
  peerOrbitGroup.renderOrder = 8.24;
  scene.add(peerOrbitGroup);
  const resonanceGroup = new THREE.Group();
  resonanceGroup.renderOrder = 7.35;
  group.add(resonanceGroup);
  const genomeLineageGroup = new THREE.Group();
  genomeLineageGroup.renderOrder = 8.18;
  scene.add(genomeLineageGroup);
  const genomeLineageNodes: { mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; halo: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>; gene: number; fitness: number; phase: number; archiveIndex: number }[] = [];
  const genomeLineageEdges: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>[] = [];
  let lineagePulse = 0;
  const genomeDuelGroup = new THREE.Group();
  genomeDuelGroup.renderOrder = 8.22;
  genomeDuelGroup.visible = false;
  scene.add(genomeDuelGroup);
  const seasonCrownGroup = new THREE.Group();
  seasonCrownGroup.renderOrder = 8.26;
  seasonCrownGroup.visible = false;
  scene.add(seasonCrownGroup);
  const seasonBracketGroup = new THREE.Group();
  seasonBracketGroup.renderOrder = 8.27;
  seasonBracketGroup.visible = false;
  scene.add(seasonBracketGroup);
  const genomeDuelNodes: { ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>; gene: number; fitness: number; side: -1 | 1; archiveIndex: number }[] = [];
  let genomeDuelBeam: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> | null = null;
  let genomeDuelParticles: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> | null = null;
  let genomeDuelActive = false;
  let genomeDuelStartedAt = 0;
  let genomeDuelSpawnArmedAt = 0;
  let lastDuelScoreLabel = "";
  let seasonCrownActive = false;
  let seasonCrownStartedAt = 0;
  let seasonCrownGene = 0.5;
  const spectatorGroup = new THREE.Group();
  spectatorGroup.renderOrder = 8.23;
  spectatorGroup.visible = false;
  scene.add(spectatorGroup);
  const spectatorRings: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
  let spectatorBeam: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> | null = null;
  let spectatorActive = false;
  let spectatorPeerActive = false;
  let spectatorPeerStartedAt = 0;
  let spectatorPeerSource = "";
  let spectatorPeerGenes: [number, number] = [0, 0];
  let spectatorPeerWinner = 0;
  let spectatorToggleArmedAt = 0;
  const arenaParticipants = new Map<string, { genes: [number, number]; score: [number, number]; winner: number; at: number }>();
  let arenaVisible = false;
  let arenaToggleArmedAt = 0;
  const arenaHistory: { source: string; genes: [number, number]; score: [number, number]; winner: number; at: number }[] = [];
  const seasonBracket: { challenger: number; champion: number; score: [number, number]; winner: number; at: number }[] = [];
  let lastSeasonChallengeScore = "";
  let arenaReplayRoundAt = 0;
  let arenaReplayActive = false;
  let arenaReplayProgress = 1;
  let arenaReplayManual = false;
  let arenaReplayStartedAt = 0;
  let arenaReplayTargetScore: [number, number] = [50, 50];
  let arenaMixActive = false;
  let arenaMixIndex = 0;
  let arenaMixFromGenes: [number, number] | null = null;
  let arenaMixBridgeStartedAt = 0;
  const resonanceGhosts: { mesh: THREE.Mesh; source: THREE.Mesh; material: THREE.MeshBasicMaterial; layer: number; phase: number }[] = [];
  let resonanceActive = false;
  let resonanceEnergy = 0;
  let peerResonanceEnergy = 0;
  let peerResonancePhase = 0;
  let swarmGene = 0.42;
  let peerSwarmGene = 0;
  let mutationPulse = 0;
  let lastResonanceBroadcastAt = 0;
  const peerOrbitTrails: { line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>; bornAt: number; points: THREE.Vector3[] }[] = [];
  const causalObserverId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  let causalEntangled = false;
  const causalChannel = typeof BroadcastChannel === "function" ? new BroadcastChannel("easyki-observer-orbits-v1") : null;
  const causalStorageKey = "easyki-observer-orbit-signal-v1";
  const resonanceStorageKey = "easyki-resonance-signal-v1";
  const genomeDuelStorageKey = "easyki-genome-duel-signal-v1";
  const swarmArchiveKey = "easyki-swarm-genome-v1";
  let swarmArchive: SwarmArchiveEntry[] = [];
  let pendingGenomeIndex: number | null = null;
  const lineageReadout = stage.querySelector<HTMLElement>("[data-swarm-lineage-readout]");
  const lineagePicker = stage.querySelector<HTMLElement>("[data-swarm-lineage-picker]");
  try {
    const saved = JSON.parse(window.localStorage.getItem(swarmArchiveKey) ?? "null") as { genomes?: unknown } | null;
    if (saved && Array.isArray(saved.genomes)) {
      swarmArchive = saved.genomes.flatMap((entry: unknown): SwarmArchiveEntry[] => {
        if (!entry || typeof entry !== "object") return [];
        const value = entry as { gene?: unknown; fitness?: unknown; kind?: unknown; at?: unknown; sliceAxis?: unknown; slicePercent?: unknown; frameIndex?: unknown; frames?: unknown };
        return typeof value.gene === "number" && typeof value.fitness === "number" && typeof value.kind === "string" && typeof value.at === "number"
          ? [{
            gene: Math.max(0, Math.min(1, value.gene)),
            fitness: value.fitness,
            kind: value.kind,
            at: value.at,
            sliceAxis: value.sliceAxis === "x" || value.sliceAxis === "y" || value.sliceAxis === "z" ? value.sliceAxis : undefined,
            slicePercent: typeof value.slicePercent === "number" ? Math.max(0, Math.min(100, value.slicePercent)) : undefined,
            frameIndex: typeof value.frameIndex === "number" ? Math.max(0, Math.floor(value.frameIndex)) : undefined,
            frames: Array.isArray(value.frames) ? value.frames as SectionFrame[] : undefined,
          }]
          : [];
      }).slice(-24);
      const inherited = swarmArchive.at(-1);
      if (inherited) swarmGene = inherited.gene;
    }
  } catch { /* A private context can start with an empty genome bank. */ }
  if (location.hash.startsWith("#story-genome?")) {
    const shared = new URLSearchParams(location.hash.split("?")[1] ?? "");
    const gene = Number(shared.get("gene"));
    const fitness = Number(shared.get("fitness"));
    const axis = shared.get("axis");
    const percent = Number(shared.get("percent"));
    const index = Number(shared.get("index"));
    if (Number.isFinite(gene) && Number.isFinite(fitness)) {
      const sharedEntry: SwarmArchiveEntry = {
        gene: Math.max(0, Math.min(1, gene)),
        fitness,
        kind: shared.get("kind") || "shared",
        at: Date.now(),
        sliceAxis: axis === "x" || axis === "y" || axis === "z" ? axis : undefined,
        slicePercent: Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : undefined,
      };
      const existing = Number.isInteger(index) ? swarmArchive[index] : undefined;
      pendingGenomeIndex = existing ? index : swarmArchive.push(sharedEntry) - 1;
    }
  }
  const rebuildGenomeLineage = (): void => {
    genomeLineageNodes.splice(0).forEach(({ mesh, halo }) => {
      genomeLineageGroup.remove(mesh, halo);
      mesh.geometry.dispose();
      mesh.material.dispose();
      halo.geometry.dispose();
      halo.material.dispose();
    });
    genomeLineageEdges.splice(0).forEach((line) => {
      genomeLineageGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    const entries = swarmArchive.slice(-16);
    entries.forEach((entry, index) => {
      const progress = index / Math.max(1, entries.length - 1);
      const x = (progress - 0.5) * 1.72;
      const y = (entry.gene - 0.5) * 0.8;
      const z = 0.28 + Math.min(0.16, Math.max(0, entry.fitness) * 0.045);
      const hue = (entry.gene * 0.72 + 0.52) % 1;
      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(hue, 0.76, 0.72), transparent: true, opacity: 0.78, depthWrite: false, blending: THREE.AdditiveBlending });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.018 + Math.min(0.018, Math.max(0, entry.fitness) * 0.007), 10, 8), material);
      mesh.position.set(x, y, z);
      mesh.frustumCulled = false;
      const haloMaterial = new THREE.MeshBasicMaterial({ color: material.color, transparent: true, opacity: 0.24, depthWrite: false, blending: THREE.AdditiveBlending });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.038 + Math.min(0.022, Math.max(0, entry.fitness) * 0.008), 0.0025, 6, 32), haloMaterial);
      halo.position.copy(mesh.position);
      halo.rotation.x = Math.PI * 0.5;
      halo.frustumCulled = false;
      genomeLineageGroup.add(mesh, halo);
      genomeLineageNodes.push({ mesh, halo, gene: entry.gene, fitness: entry.fitness, phase: entry.at * 0.001 + index, archiveIndex: swarmArchive.length - entries.length + index });
      if (index > 0) {
        const previous = genomeLineageNodes[index - 1].mesh.position;
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([previous.clone(), mesh.position.clone()]),
          new THREE.LineBasicMaterial({ color: material.color, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        line.frustumCulled = false;
        genomeLineageGroup.add(line);
        genomeLineageEdges.push(line);
      }
    });
    genomeLineageGroup.visible = entries.length > 0;
    lineagePulse = 1;
  };
  const syncGenomeArchive = (): void => {
    stage.dataset.swarmLineage = String(swarmArchive.length);
    if (morphArchiveButton) morphArchiveButton.textContent = `ARCHIVE ∞ ${swarmArchive.length}`;
    if (morphGenomeShareButton) morphGenomeShareButton.disabled = swarmArchive.length === 0;
    if (morphGenomePassportButton) morphGenomePassportButton.disabled = swarmArchive.length === 0;
    if (genomeDuelButton) genomeDuelButton.disabled = swarmArchive.length < 2;
    if (genomeArenaSeasonButton) genomeArenaSeasonButton.disabled = swarmArchive.length < 2;
    if (genomeArenaChallengeButton) genomeArenaChallengeButton.disabled = !stage.dataset.genomeSeasonCrowned;
    if (genomeDuelSpawnButton) genomeDuelSpawnButton.disabled = !genomeDuelActive || swarmArchive.length < 2;
    if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "LINEAGE ∞" : "谱系 ∞"} ${swarmArchive.length}`;
    if (lineagePicker) {
      lineagePicker.replaceChildren();
      const visibleEntries = swarmArchive.slice(-8);
      visibleEntries.forEach((entry, index) => {
        const archiveIndex = swarmArchive.length - visibleEntries.length + index;
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.swarmNode = String(archiveIndex);
        button.textContent = `${archiveIndex + 1}·${Math.round(entry.gene * 1000)}`;
        button.setAttribute("aria-label", `${document.documentElement.lang === "en" ? "Recall genome" : "回溯基因"} ${archiveIndex + 1}, ${Math.round(entry.gene * 1000)}`);
        button.addEventListener("click", () => {
          lineagePicker.querySelectorAll<HTMLButtonElement>("button").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
          recallGenome(archiveIndex);
        });
        lineagePicker.append(button);
      });
    }
    rebuildGenomeLineage();
  };
  const clearGenomeDuel = (): void => {
    while (genomeDuelGroup.children.length) {
      const child = genomeDuelGroup.children.pop();
      if (!child) continue;
      child.parent = null;
      const disposable = child as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
      disposable.geometry?.dispose();
      if (Array.isArray(disposable.material)) disposable.material.forEach((material) => material.dispose());
      else disposable.material?.dispose();
    }
    genomeDuelNodes.splice(0);
    genomeDuelBeam = null;
    genomeDuelParticles = null;
  };
  const openGenomeDuel = (): void => {
    if (swarmArchive.length < 2) return;
    if (genomeDuelActive) {
      genomeDuelActive = false;
      genomeDuelGroup.visible = false;
      delete stage.dataset.genomeDuelState;
      if (genomeDuelSpawnButton) genomeDuelSpawnButton.disabled = true;
      if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "LINEAGE ∞" : "谱系 ∞"} ${swarmArchive.length}`;
      wake();
      return;
    }
    clearGenomeDuel();
    const first = swarmArchive[swarmArchive.length - 2];
    const second = swarmArchive[swarmArchive.length - 1];
    const entries = [first, second];
    entries.forEach((entry, index) => {
      const side = index === 0 ? -1 : 1;
      const color = new THREE.Color().setHSL((entry.gene * 0.72 + 0.52) % 1, 0.82, 0.7);
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09 + Math.min(0.06, Math.max(0, entry.fitness) * 0.012), 0.008, 8, 42), material);
      ring.position.set(side * 0.34, (entry.gene - 0.5) * 0.62, 0.42);
      ring.rotation.x = Math.PI * 0.5;
      ring.frustumCulled = false;
      genomeDuelGroup.add(ring);
      genomeDuelNodes.push({ ring, gene: entry.gene, fitness: entry.fitness, side, archiveIndex: swarmArchive.length - 2 + index });
    });
    const beamMaterial = new THREE.LineBasicMaterial({ color: 0xffe3a0, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });
    genomeDuelBeam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([genomeDuelNodes[0].ring.position.clone(), genomeDuelNodes[1].ring.position.clone()]), beamMaterial);
    genomeDuelBeam.frustumCulled = false;
    genomeDuelGroup.add(genomeDuelBeam);
    const particlePositions = new Float32Array(72 * 3);
    for (let index = 0; index < 72; index += 1) {
      const progress = index / 71;
      const x = -0.34 + progress * 0.68;
      const y = (first.gene * (1 - progress) + second.gene * progress - 0.5) * 0.62;
      const wave = Math.sin(progress * Math.PI * 7 + first.gene * 13 + second.gene * 5) * 0.028;
      particlePositions[index * 3] = x;
      particlePositions[index * 3 + 1] = y + wave;
      particlePositions[index * 3 + 2] = 0.42 + Math.cos(progress * Math.PI * 9) * 0.045;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    genomeDuelParticles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xffe3a0, size: 0.014, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    genomeDuelParticles.frustumCulled = false;
    genomeDuelGroup.add(genomeDuelParticles);
    genomeDuelActive = true;
    genomeDuelStartedAt = performance.now();
    genomeDuelGroup.visible = true;
    lastDuelScoreLabel = "";
    stage.dataset.genomeDuelState = `${swarmArchive.length - 1}:${swarmArchive.length}`;
    if (genomeDuelSpawnButton) genomeDuelSpawnButton.disabled = false;
    if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "DUEL ⚡" : "决斗 ⚡"} ${Math.round(first.gene * 1000)} ↔ ${Math.round(second.gene * 1000)}`;
    lineagePulse = 2;
    wake();
  };
  const archiveGenome = (kind: string, fitness: number): void => {
    const capsuleFrames = recordedFrames.slice(-18).map((frame) => ({
      axis: frame.axis,
      percent: frame.percent,
      area: frame.area,
      perimeter: frame.perimeter,
      loops: frame.loops.map((loop) => ({
        points: loop.points.map(([x, y]) => [x, y] as [number, number]),
        signedArea: loop.signedArea,
        area: loop.area,
        depth: loop.depth,
        role: loop.role,
      })),
    }));
    swarmArchive.push({
      gene: swarmGene,
      fitness,
      kind,
      at: Date.now(),
      sliceAxis: state.sliceAxis,
      slicePercent: state.slicePercent,
      frameIndex: capsuleFrames.length
        ? Math.max(0, Math.min(capsuleFrames.length - 1, playbackIndex - Math.max(0, recordedFrames.length - capsuleFrames.length)))
        : undefined,
      frames: capsuleFrames.length >= 2 ? capsuleFrames : undefined,
    });
    swarmArchive = swarmArchive.slice(-24);
    try { window.localStorage.setItem(swarmArchiveKey, JSON.stringify({ version: 1, genomes: swarmArchive })); } catch { /* The current session remains usable without persistence. */ }
    syncGenomeArchive();
  };
  const clearSeasonCrown = (): void => {
    while (seasonCrownGroup.children.length) {
      const child = seasonCrownGroup.children.pop();
      if (!child) continue;
      child.parent = null;
      const disposable = child as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
      disposable.geometry?.dispose();
      if (Array.isArray(disposable.material)) disposable.material.forEach((material) => material.dispose());
      else disposable.material?.dispose();
    }
  };
  const crownSeasonChampion = (): void => {
    if (swarmArchive.length < 2) return;
    let championIndex = 0;
    let championScore = -Infinity;
    swarmArchive.forEach((entry, index) => {
      const score = entry.fitness + entry.gene * 0.04 + index * 0.0001;
      if (score > championScore) {
        championScore = score;
        championIndex = index;
      }
    });
    const champion = swarmArchive[championIndex];
    if (!champion) return;
    clearSeasonCrown();
    seasonCrownGene = champion.gene;
    const crownMaterial = new THREE.MeshBasicMaterial({ color: 0xffe3a0, transparent: true, opacity: 0.94, depthWrite: false, blending: THREE.AdditiveBlending });
    const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.009, 8, 36), crownMaterial);
    crownRing.rotation.x = Math.PI * 0.5;
    crownRing.position.z = 0.05;
    crownRing.frustumCulled = false;
    seasonCrownGroup.add(crownRing);
    for (let index = 0; index < 3; index += 1) {
      const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.022 + index * 0.006, 0), new THREE.MeshBasicMaterial({ color: index === 1 ? 0x8ffff2 : 0xffca68, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
      const angle = (index - 1) * 0.62;
      gem.position.set(Math.sin(angle) * 0.09, Math.cos(angle) * 0.045, 0.06);
      gem.frustumCulled = false;
      seasonCrownGroup.add(gem);
    }
    seasonCrownGroup.position.set(0, (seasonCrownGene - 0.5) * 0.62, 0.48);
    seasonCrownGroup.visible = true;
    seasonCrownActive = true;
    seasonCrownStartedAt = performance.now();
    swarmGene = champion.gene;
    archiveGenome("season-champion", champion.fitness);
    stage.dataset.genomeSeasonChampion = `${championIndex + 1}:${Math.round(champion.gene * 1000)}:${Math.round(championScore * 1000)}`;
    stage.dataset.genomeSeasonCrowned = "true";
    if (genomeArenaSeasonButton) {
      genomeArenaSeasonButton.textContent = `${document.documentElement.lang === "en" ? "CROWNED ♛" : "已加冕 ♛"} ${Math.round(champion.gene * 1000)}`;
      genomeArenaSeasonButton.setAttribute("aria-pressed", "true");
    }
    if (genomeArenaChallengeButton) {
      genomeArenaChallengeButton.disabled = false;
      genomeArenaChallengeButton.textContent = document.documentElement.lang === "en" ? "CHALLENGE ⚔" : "挑战 ⚔";
    }
    if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "SEASON ♛" : "赛季 ♛"} ${Math.round(champion.gene * 1000)}`;
    triggerBranchWarp(2.4);
    wake();
  };
  const recallGenome = (archiveIndex: number): void => {
    const entry = swarmArchive[archiveIndex];
    if (!entry) return;
    swarmGene = entry.gene;
    mutationPulse = 1;
    resonanceActive = true;
    lineagePulse = 1.6;
    stage.dataset.swarmRecall = String(archiveIndex + 1);
    stage.dataset.resonance = "true";
    if (entry.sliceAxis && typeof entry.slicePercent === "number") {
      state.sliceEnabled = true;
      state.sliceScanning = false;
      state.sliceAxis = entry.sliceAxis;
      state.slicePercent = entry.slicePercent;
      playback = false;
      if (entry.frames && entry.frames.length >= 2) {
        recordedFrames = entry.frames;
        playbackIndex = 0;
        const frame = recordedFrames[playbackIndex];
        const loop = frame?.loops[0];
        selectedLoopIndex = loop ? 0 : -1;
        selectedLoopSignature = loop ? { role: loop.role, area: loop.area } : null;
        playback = !state.reducedMotion;
        cinematicEndFrame = recordedFrames.length - 1;
        cinematicStartedAt = state.reducedMotion ? 0 : performance.now();
        playbackLastStepAt = performance.now();
        cinematicEvent = "stable";
        eventArcPlayback = false;
        stage.dataset.swarmReplay = String(recordedFrames.length);
        if (loop) triggerTopologyPulse("birth", loop.role);
      }
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
      applySectionMode();
      stage.dataset.timeCursor = `genome:${archiveIndex + 1}`;
    }
    morphResonanceButton?.setAttribute("aria-pressed", "true");
    if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "RECALL ∞" : "回溯 ∞"} ${archiveIndex + 1}/${swarmArchive.length}`;
    if (neuralMemory) neuralMemory.textContent = document.documentElement.lang === "en"
      ? `GENOME RECALL · ${entry.kind.toUpperCase()} · ${Math.round(entry.gene * 1000)} · FITNESS ${entry.fitness.toFixed(2)}`
      : `基因回溯 · ${entry.kind} · ${Math.round(entry.gene * 1000)} · 适应度 ${entry.fitness.toFixed(2)}`;
    if (causalEntangled) broadcastResonance(1, state.pointerX * 0.9 + state.pointerY * 0.4, swarmGene);
    triggerBranchWarp(1.28);
    wake();
  };
  syncGenomeArchive();
  const singularityWakeTrails: { line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>; bornAt: number; points: THREE.Vector3[] }[] = [];
  let activeSingularityTrail: { line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>; points: THREE.Vector3[] } | null = null;
  const syncCausalOrbitControls = (): void => {
    const enabled = singularityWakeTrails.length > 0;
    if (causalOrbitExportButton) causalOrbitExportButton.disabled = !enabled;
    if (causalOrbitReplayButton) causalOrbitReplayButton.disabled = !enabled;
  };
  const createPeerOrbitTrail = (points: THREE.Vector3[]): void => {
    if (points.length < 2) return;
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0xffca68, transparent: true, opacity: 0.68, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    line.frustumCulled = false;
    peerOrbitGroup.add(line);
    peerOrbitTrails.push({ line, bornAt: performance.now(), points: points.slice(0, 64) });
    while (peerOrbitTrails.length > 8) {
      const oldest = peerOrbitTrails.shift();
      if (!oldest) break;
      peerOrbitGroup.remove(oldest.line);
      oldest.line.geometry.dispose();
      oldest.line.material.dispose();
    }
    wake();
  };
  const broadcastCausalOrbit = (points: THREE.Vector3[]): void => {
    if (!causalEntangled || points.length < 2) return;
    const message = {
      kind: "easyki-causal-observer-orbit",
      source: causalObserverId,
      branch: forecastBranchIndex,
      points: points.map(({ x, y, z }) => ({ x, y, z })),
    };
    causalChannel?.postMessage(message);
    try {
      window.localStorage.setItem(causalStorageKey, JSON.stringify({ ...message, nonce: `${Date.now()}-${Math.random()}` }));
    } catch { /* Same-origin storage can be unavailable in private contexts. */ }
  };
  const receiveCausalOrbit = (data: unknown): void => {
    if (!causalEntangled || !data || typeof data !== "object") return;
    const message = data as { kind?: unknown; source?: unknown; branch?: unknown; points?: unknown };
    if (message.kind !== "easyki-causal-observer-orbit" || message.source === causalObserverId || !Array.isArray(message.points)) return;
    const points = message.points.flatMap((point: unknown): THREE.Vector3[] => {
      if (!point || typeof point !== "object") return [];
      const value = point as { x?: unknown; y?: unknown; z?: unknown };
      return [value.x, value.y, value.z].every((coordinate) => typeof coordinate === "number")
        ? [new THREE.Vector3(value.x as number, value.y as number, value.z as number)]
        : [];
    });
    if (points.length > 1) {
      forecastBranchIndex = typeof message.branch === "number" ? Math.max(0, Math.min(2, Math.floor(message.branch))) : forecastBranchIndex;
      createPeerOrbitTrail(points);
      triggerTemporalCollision(forecastBranchIndex);
    }
  };
  const broadcastResonance = (energy: number, phase: number, gene = swarmGene): void => {
    if (!causalEntangled) return;
    const message = {
      kind: "easyki-resonance-signal",
      source: causalObserverId,
      active: resonanceActive,
      energy: Math.max(0, Math.min(1, energy)),
      phase,
      gene: Math.max(0, Math.min(1, gene)),
    };
    causalChannel?.postMessage(message);
    try {
      window.localStorage.setItem(resonanceStorageKey, JSON.stringify({ ...message, nonce: `${Date.now()}-${Math.random()}` }));
    } catch { /* Same-origin storage can be unavailable in private contexts. */ }
  };
  const receiveResonance = (data: unknown): void => {
    if (!causalEntangled || !data || typeof data !== "object") return;
    const message = data as { kind?: unknown; source?: unknown; active?: unknown; energy?: unknown; phase?: unknown; gene?: unknown };
    if (message.kind !== "easyki-resonance-signal" || message.source === causalObserverId) return;
    peerResonanceEnergy = typeof message.energy === "number" ? Math.max(0, Math.min(1, message.energy)) : 0;
    peerResonancePhase = typeof message.phase === "number" ? message.phase : 0;
    peerSwarmGene = typeof message.gene === "number" ? Math.max(0, Math.min(1, message.gene)) : 0;
    stage.dataset.resonancePeer = String(message.active === true);
    wake();
  };
  const replayArenaRound = (round: { source: string; genes: [number, number]; score: [number, number]; winner: number; at: number }): void => {
    const now = performance.now();
    if (now - arenaReplayRoundAt < 420) return;
    arenaReplayRoundAt = now;
    const bridgeFrom = arenaMixActive && genomeDuelActive && genomeDuelNodes.length >= 2
      ? [genomeDuelNodes[0].gene, genomeDuelNodes[1].gene] as [number, number]
      : null;
    if (genomeDuelActive) {
      genomeDuelActive = false;
      genomeDuelGroup.visible = false;
      clearGenomeDuel();
    }
    arenaReplayActive = true;
    arenaReplayProgress = 0;
    arenaReplayManual = false;
    arenaReplayStartedAt = performance.now();
    arenaReplayTargetScore = round.score;
    if (genomeArenaTimeline) genomeArenaTimeline.hidden = false;
    if (bridgeFrom) {
      const topologyDrift = Math.sin((currentSectionArea + currentSectionPerimeter) * 0.011 + round.at * 0.000001) * 0.018;
      let bridgeGene = (bridgeFrom[0] * 0.25 + bridgeFrom[1] * 0.25 + round.genes[0] * 0.25 + round.genes[1] * 0.25 + topologyDrift) % 1;
      if (bridgeGene < 0) bridgeGene += 1;
      swarmGene = bridgeGene;
      const bridgeFitness = Math.max(0, Math.min(2, (round.score[0] + round.score[1]) / 100 + Math.abs(round.genes[0] - round.genes[1]) * 0.32));
      archiveGenome("bridge", bridgeFitness);
      stage.dataset.genomeArenaBridgeGene = String(Math.round(bridgeGene * 1000));
      if (genomeArenaBridgeDuelButton) {
        genomeArenaBridgeDuelButton.disabled = false;
        genomeArenaBridgeDuelButton.textContent = `${document.documentElement.lang === "en" ? "BRIDGE ⚔" : "桥接 ⚔"} ${Math.round(bridgeGene * 1000)}`;
      }
    }
    const previousArchive = swarmArchive;
    const replayEntries: SwarmArchiveEntry[] = round.genes.map((gene, index) => ({
      gene,
      fitness: Math.max(0, Math.min(2, round.score[index] / 100)),
      kind: "arena-replay",
      at: round.at,
    }));
    swarmArchive = [...previousArchive, ...replayEntries];
    openGenomeDuel();
    swarmArchive = previousArchive;
    arenaMixFromGenes = bridgeFrom;
    arenaMixBridgeStartedAt = bridgeFrom ? performance.now() : 0;
    if (genomeDuelSpawnButton) genomeDuelSpawnButton.disabled = true;
    if (genomeDuelButton) {
      genomeDuelButton.textContent = "DUEL ⚡ REPLAY";
      genomeDuelButton.setAttribute("aria-pressed", "true");
    }
    stage.dataset.genomeArenaReplay = `${round.source.slice(-6)}:${Math.round(round.genes[0] * 1000)}-${Math.round(round.genes[1] * 1000)}`;
    stage.dataset.genomeDuelScore = `${round.score[0]}:${round.score[1]}`;
    if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "ARENA REPLAY ◌" : "竞技回放 ◌"} ${round.source.slice(-6)} · ${round.score[0]}:${round.score[1]}`;
    stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
    triggerBranchWarp(1.72);
    wake();
  };
  const syncArenaReplayTime = (): void => {
    const value = Math.round(arenaReplayProgress * 100);
    if (genomeArenaTimeSlider) genomeArenaTimeSlider.value = String(value);
    if (genomeArenaTimeOutput) genomeArenaTimeOutput.value = `${value}%`;
  };
  const syncArenaMixControl = (): void => {
    if (!genomeArenaMixButton) return;
    const label = document.documentElement.lang === "en" ? "MIX ▶" : "混剪 ▶";
    genomeArenaMixButton.textContent = arenaMixActive ? `${label} ${arenaMixIndex + 1}/${Math.max(1, arenaHistory.length)}` : label;
    genomeArenaMixButton.setAttribute("aria-pressed", String(arenaMixActive));
    if (arenaMixActive) stage.dataset.genomeArenaMix = "true";
    else delete stage.dataset.genomeArenaMix;
  };
  const syncSeasonBracket = (): void => {
    if (!genomeSeasonBracket) return;
    genomeSeasonBracket.replaceChildren();
    while (seasonBracketGroup.children.length) {
      const child = seasonBracketGroup.children.pop();
      if (!child) continue;
      child.parent = null;
      const disposable = child as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
      disposable.geometry?.dispose();
      if (Array.isArray(disposable.material)) disposable.material.forEach((material) => material.dispose());
      else disposable.material?.dispose();
    }
    seasonBracket.slice(-6).reverse().forEach((match, index) => {
      const item = document.createElement("li");
      const winner = match.winner < 0 ? "…" : match.winner === 0 ? Math.round(match.challenger) : Math.round(match.champion);
      item.innerHTML = `<strong>${seasonBracket.length - index}. ${Math.round(match.challenger)} ⚔ ${Math.round(match.champion)}</strong><em>${match.score[0]}:${match.score[1]} · ${winner}</em>`;
      genomeSeasonBracket.append(item);
      const y = (index - Math.min(5, seasonBracket.length - 1) * 0.5) * 0.12;
      const challenger = new THREE.Vector3(-0.38, y + (match.challenger % 17) * 0.004, 0.54);
      const champion = new THREE.Vector3(0.38, y + (match.champion % 13) * 0.004, 0.54);
      const winnerColor = match.winner < 0 ? 0xffca68 : match.winner === 0 ? 0x8ffff2 : 0xffe3a0;
      const center = new THREE.Vector3(0, y, 0.56);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: winnerColor, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending });
      const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints([challenger, center, champion]), edgeMaterial);
      edge.frustumCulled = false;
      seasonBracketGroup.add(edge);
      [challenger, champion, center].forEach((position, nodeIndex) => {
        const material = new THREE.MeshBasicMaterial({ color: nodeIndex === 2 ? winnerColor : nodeIndex === 0 ? 0xd9a7ff : 0xffe3a0, transparent: true, opacity: nodeIndex === 2 ? 0.9 : 0.62, depthWrite: false, blending: THREE.AdditiveBlending });
        const node = new THREE.Mesh(new THREE.SphereGeometry(nodeIndex === 2 ? 0.026 : 0.018, 8, 8), material);
        node.position.copy(position);
        node.frustumCulled = false;
        seasonBracketGroup.add(node);
      });
    });
    seasonBracketGroup.visible = seasonBracket.length > 0;
    stage.dataset.genomeSeasonBracket = String(seasonBracket.length);
  };
  const syncArenaBoard = (): void => {
    if (genomeArenaSeats) genomeArenaSeats.textContent = `${arenaParticipants.size} ${document.documentElement.lang === "en" ? "SEATS" : "席位"}`;
    if (genomeArenaList) {
      genomeArenaList.replaceChildren();
      [...arenaParticipants.entries()]
        .sort(([, first], [, second]) => Math.max(...second.score) - Math.max(...first.score) || second.at - first.at)
        .slice(0, 4)
        .forEach(([source, participant], index) => {
          const item = document.createElement("li");
          item.innerHTML = `<strong>${index + 1}. ${source.slice(-6)}</strong><em>${participant.score[0]}:${participant.score[1]}</em>`;
          genomeArenaList.append(item);
        });
    }
    if (genomeArenaHistory) {
      genomeArenaHistory.replaceChildren();
      arenaHistory.slice(-4).reverse().forEach((round) => {
        const item = document.createElement("li");
        const replay = document.createElement("button");
        replay.type = "button";
        replay.textContent = `${round.source.slice(-6)} · ${Math.round(round.genes[0] * 1000)}↔${Math.round(round.genes[1] * 1000)} · ${round.score[0]}:${round.score[1]}`;
        replay.setAttribute("aria-label", `${document.documentElement.lang === "en" ? "Replay arena round" : "回放竞技回合"} ${round.source.slice(-6)}`);
        replay.addEventListener("click", () => replayArenaRound(round));
        item.append(replay);
        genomeArenaHistory.append(item);
      });
    }
    syncSeasonBracket();
    if (genomeArenaBoard) genomeArenaBoard.hidden = !arenaVisible;
  };
  const registerArenaParticipant = (source: string, genes: [number, number], score: [number, number], winner: number, at = Date.now()): void => {
    const previous = arenaParticipants.get(source);
    arenaParticipants.set(source, { genes, score, winner, at });
    if (!previous || at - previous.at > 800 || previous.score[0] !== score[0] || previous.score[1] !== score[1]) {
      arenaHistory.push({ source, genes, score, winner, at });
      while (arenaHistory.length > 12) arenaHistory.shift();
    }
    syncArenaBoard();
  };
  const clearSpectatorPeer = (): void => {
    while (spectatorGroup.children.length) {
      const child = spectatorGroup.children.pop();
      if (!child) continue;
      child.parent = null;
      const disposable = child as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
      disposable.geometry?.dispose();
      if (Array.isArray(disposable.material)) disposable.material.forEach((material) => material.dispose());
      else disposable.material?.dispose();
    }
    spectatorRings.splice(0);
    spectatorBeam = null;
    spectatorPeerActive = false;
    delete stage.dataset.genomeSpectatorPeer;
  };
  const receiveGenomeDuel = (data: unknown): void => {
    if (!spectatorActive || !data || typeof data !== "object") return;
    const message = data as { kind?: unknown; source?: unknown; genes?: unknown; score?: unknown; winner?: unknown; at?: unknown };
    if (message.kind !== "easyki-genome-duel" || message.source === causalObserverId || !Array.isArray(message.genes) || message.genes.length !== 2) return;
    const genes = message.genes.map((gene) => typeof gene === "number" ? Math.max(0, Math.min(1, gene)) : Number.NaN) as number[];
    if (!genes.every(Number.isFinite)) return;
    const score: [number, number] = Array.isArray(message.score) && message.score.length === 2
      ? [
        typeof message.score[0] === "number" ? Math.max(0, Math.min(100, Math.round(message.score[0]))) : 50,
        typeof message.score[1] === "number" ? Math.max(0, Math.min(100, Math.round(message.score[1]))) : 50,
      ]
      : [50, 50];
    const source = typeof message.source === "string" ? message.source : "remote";
    registerArenaParticipant(source, [genes[0], genes[1]], score, message.winner === 1 ? 1 : 0, typeof message.at === "number" ? message.at : Date.now());
    clearSpectatorPeer();
    spectatorPeerGenes = [genes[0], genes[1]];
    spectatorPeerWinner = message.winner === 1 ? 1 : 0;
    spectatorPeerSource = source.slice(-6);
    spectatorPeerActive = true;
    spectatorPeerStartedAt = performance.now();
    spectatorGroup.visible = true;
    spectatorPeerGenes.forEach((gene, index) => {
      const material = new THREE.MeshBasicMaterial({ color: index === spectatorPeerWinner ? 0x8ffff2 : 0x9d82ff, transparent: true, opacity: 0.68, depthWrite: false, blending: THREE.AdditiveBlending });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07 + gene * 0.035, 0.005, 7, 32), material);
      ring.position.set(index === 0 ? -0.24 : 0.24, (gene - 0.5) * 0.5, 0.34);
      ring.rotation.x = Math.PI * 0.5;
      ring.frustumCulled = false;
      spectatorGroup.add(ring);
      spectatorRings.push(ring);
    });
    spectatorBeam = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([spectatorRings[0].position.clone(), spectatorRings[1].position.clone()]),
      new THREE.LineBasicMaterial({ color: 0x8ffff2, transparent: true, opacity: 0.48, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    spectatorBeam.frustumCulled = false;
    spectatorGroup.add(spectatorBeam);
    stage.dataset.genomeSpectatorPeer = spectatorPeerSource;
    if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "SPECTATOR ◉" : "观战 ◉"} ${spectatorPeerSource}`;
    wake();
  };
  const broadcastGenomeDuel = (): void => {
    if (!spectatorActive) return;
    const genes: [number, number] = genomeDuelActive && genomeDuelNodes.length >= 2
      ? [genomeDuelNodes[0].gene, genomeDuelNodes[1].gene]
      : swarmArchive.length >= 2
        ? [swarmArchive[swarmArchive.length - 2].gene, swarmArchive[swarmArchive.length - 1].gene]
        : [swarmGene, peerSwarmGene];
    const score = (stage.dataset.genomeDuelScore ?? "50:50").split(":").map(Number);
    const normalizedScore: [number, number] = [Number.isFinite(score[0]) ? score[0] : 50, Number.isFinite(score[1]) ? score[1] : 50];
    const winner = Number(normalizedScore[0]) >= Number(normalizedScore[1]) ? 0 : 1;
    const at = Date.now();
    registerArenaParticipant(causalObserverId, genes, normalizedScore, winner, at);
    const message = {
      kind: "easyki-genome-duel",
      source: causalObserverId,
      genes,
      score: normalizedScore,
      winner,
      at,
    };
    causalChannel?.postMessage(message);
    try { window.localStorage.setItem(genomeDuelStorageKey, JSON.stringify({ ...message, nonce: `${Date.now()}-${Math.random()}` })); } catch { /* Keep local spectator mode usable when storage is blocked. */ }
  };
  causalChannel?.addEventListener("message", (event: MessageEvent) => receiveCausalOrbit(event.data));
  causalChannel?.addEventListener("message", (event: MessageEvent) => receiveResonance(event.data));
  causalChannel?.addEventListener("message", (event: MessageEvent) => receiveGenomeDuel(event.data));
  window.addEventListener("storage", (event) => {
    if (event.key !== causalStorageKey || !event.newValue) return;
    try { receiveCausalOrbit(JSON.parse(event.newValue)); } catch { /* Ignore malformed peer signals. */ }
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== resonanceStorageKey || !event.newValue) return;
    try { receiveResonance(JSON.parse(event.newValue)); } catch { /* Ignore malformed peer signals. */ }
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== genomeDuelStorageKey || !event.newValue) return;
    try { receiveGenomeDuel(JSON.parse(event.newValue)); } catch { /* Ignore malformed peer signals. */ }
  });
  const createSingularityTrail = (points: THREE.Vector3[], bornAt = performance.now()): void => {
    if (points.length < 2) return;
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x8ffff2, transparent: true, opacity: 0.78, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    line.frustumCulled = false;
    singularityWakeGroup.add(line);
    singularityWakeTrails.push({ line, bornAt, points: points.slice(0, 64) });
    while (singularityWakeTrails.length > 4) {
      const oldest = singularityWakeTrails.shift();
      if (!oldest) break;
      singularityWakeGroup.remove(oldest.line);
      oldest.line.geometry.dispose();
      oldest.line.material.dispose();
    }
    syncCausalOrbitControls();
    broadcastCausalOrbit(points);
  };
  const singularityCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff4ce, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  const singularityHorizon = new THREE.Mesh(
    new THREE.TorusGeometry(0.105, 0.006, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0x8ffff2, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  const singularityGeometry = new THREE.BufferGeometry();
  const singularityParticleCount = 96;
  singularityGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(singularityParticleCount * 3), 3));
  const singularityParticles = new THREE.Points(
    singularityGeometry,
    new THREE.PointsMaterial({ color: 0xffca68, size: 0.009, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }),
  );
  singularityCore.frustumCulled = false;
  singularityHorizon.frustumCulled = false;
  singularityParticles.frustumCulled = false;
  causalSingularityGroup.add(singularityCore, singularityHorizon, singularityParticles);
  const temporalCollisions: {
    group: THREE.Group;
    ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
    inner: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
    points: THREE.Points;
    pointsMaterial: THREE.PointsMaterial;
    spokes: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
    bornAt: number;
    velocities: THREE.Vector3[];
    branch: number;
  }[] = [];
  let temporalClockConsumed = false;
  const forecastClaimGroup = new THREE.Group();
  forecastClaimGroup.renderOrder = 7.6;
  group.add(forecastClaimGroup);
  const forecastOwnershipGroup = new THREE.Group();
  forecastOwnershipGroup.renderOrder = 7.8;
  group.add(forecastOwnershipGroup);
  const forecastScarGroup = new THREE.Group();
  forecastScarGroup.renderOrder = 7.9;
  group.add(forecastScarGroup);
  const forecastStormGroup = new THREE.Group();
  forecastStormGroup.renderOrder = 7.95;
  group.add(forecastStormGroup);
  const synapticMemoryGroup = new THREE.Group();
  synapticMemoryGroup.renderOrder = 7.5;
  scene.add(synapticMemoryGroup);
  scene.add(new THREE.HemisphereLight(0xfff7ed, 0x53655e, 0.92));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
  keyLight.position.set(-2, 3, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xcbd9ff, 0.56);
  fillLight.position.set(3, 0.5, -2);
  scene.add(fillLight);
  const frontLight = new THREE.DirectionalLight(0xfff7ed, 0.46);
  frontLight.position.set(0, 1.5, 5);
  scene.add(frontLight);
  const rimLight = new THREE.DirectionalLight(0x9fe0cb, 0.58);
  rimLight.position.set(-3, -1, -4);
  scene.add(rimLight);

  const state = {
    pointerX: 0,
    pointerY: 0,
    storyProgress: 0,
    width: 1,
    height: 1,
    visible: true,
    frame: 0,
    modelRadius: 1,
    explode: 0,
    sliceEnabled: false,
    sliceScanning: false,
    slicePercent: 50,
    sliceAxis: "x" as "x" | "y" | "z",
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
  };
  let cameraFitRadius = state.modelRadius;
  const baseModelScale = (): number => 0.92;
  let branchWarpStartedAt = 0;
  let branchWarpIntensity = 0;
  let temporalGhostStartedAt = 0;
  let temporalGhostMaterials: THREE.MeshBasicMaterial[] = [];
  let nextMemoryId = 1;
  const memoryGhostSnapshots: { id: number; group: THREE.Group; trail: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>; bornAt: number; materials: THREE.MeshBasicMaterial[]; pinned: boolean; axis: "x" | "y" | "z"; role: SectionLoop["role"]; meshIndices: number[]; percent: number; mass: number; phase: number; radius: number }[] = [];
  let focusedMemoryId: number | null = null;
  let focusedMeshIndex: number | null = null;
  const ecologyBursts: { points: THREE.Points; material: THREE.PointsMaterial; velocities: THREE.Vector3[]; anchorId: number; role: SectionLoop["role"]; bornAt: number }[] = [];
  const topologyPulses: { ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; bornAt: number; event: string }[] = [];
  const annihilationGhosts: {
    points: THREE.Points;
    material: THREE.PointsMaterial;
    velocities: THREE.Vector3[];
    bornAt: number;
    targetMeshes: THREE.Mesh[];
    assembly: { mesh: THREE.Mesh; origin: THREE.Vector3; target: THREE.Vector3; role: SectionLoop["role"]; index: number }[];
    materialStates: { material: THREE.MeshStandardMaterial; color: number; emissive: number; intensity: number }[];
  }[] = [];
  let organismStartedAt = 0;
  let organismParts: { mesh: THREE.Mesh; base: THREE.Vector3; role: SectionLoop["role"]; phase: number; index: number }[] = [];
  const neuralSignals: { line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>; from: THREE.Mesh; to: THREE.Mesh; bornAt: number; color: number }[] = [];
  const synapticEdges: { line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>; from: THREE.Mesh; to: THREE.Mesh; weight: number; lastFired: number; color: number }[] = [];
  const forecastLearningEdges: { branch: number; line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>; from: THREE.Mesh; to: THREE.Mesh }[] = [];
  const forecastOwnership: { index: number; source: THREE.Mesh; overlay: THREE.Mesh; material: THREE.MeshBasicMaterial }[] = [];
  const forecastScars: { slot: number; source: THREE.Mesh; ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; material: THREE.MeshBasicMaterial }[] = [];
  const forecastScarTrails: { slot: number; source: THREE.Mesh; target: THREE.Mesh; line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> }[] = [];
  const forecastScarBridges: { left: number; right: number; from: THREE.Mesh; to: THREE.Mesh; line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> }[] = [];
  const forecastStormRings: { ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>; phase: number }[] = [];
  let neuralSignalCursor = 0;
  let lastNeuralSignalAt = 0;
  let neuralDecisionAt = 0;
  let neuralDecisionRole: SectionLoop["role"] = "outer";
  let rendering = false;
  let reducedMotionRenderPending = true;
  const neuralMemory = stage.querySelector<HTMLElement>("[data-neural-memory]");
  const synapticStorageKey = "easyki-synaptic-memory-v1";
  const persistedSynapses = new Map<string, { weight: number; lastSeen: number }>();
  try {
    const saved = JSON.parse(window.localStorage.getItem(synapticStorageKey) ?? "[]") as unknown;
    if (Array.isArray(saved)) saved.forEach((candidate) => {
      if (!candidate || typeof candidate !== "object") return;
      const entry = candidate as { key?: unknown; weight?: unknown; lastSeen?: unknown };
      if (typeof entry.key !== "string" || typeof entry.weight !== "number") return;
      if (!Number.isFinite(entry.weight) || entry.weight <= 0) return;
      persistedSynapses.set(entry.key, { weight: Math.min(1, entry.weight), lastSeen: typeof entry.lastSeen === "number" ? entry.lastSeen : 0 });
    });
  } catch { /* Storage may be unavailable or intentionally blocked. */ }
  const persistSynapticMemory = (): void => {
    try {
      const saved = [...persistedSynapses.entries()]
        .sort(([, left], [, right]) => right.weight - left.weight)
        .slice(0, 64)
        .map(([key, value]) => ({ key, weight: value.weight, lastSeen: value.lastSeen }));
      window.localStorage.setItem(synapticStorageKey, JSON.stringify(saved));
    } catch { /* The 3D memory remains active for this session. */ }
  };
  const reinforceSynapse = (source: typeof organismParts[number], target: typeof organismParts[number]): void => {
    if (source.mesh === target.mesh) return;
    const [left, right] = [source.index, target.index].sort((a, b) => a - b);
    const key = `${left}:${right}`;
    const remembered = persistedSynapses.get(key);
    const existing = synapticEdges.find((edge) => {
      const ids = organismParts.filter((part) => part.mesh === edge.from || part.mesh === edge.to).map((part) => part.index).sort((a, b) => a - b);
      return ids[0] === left && ids[1] === right;
    });
    if (existing) {
      existing.weight = Math.min(1, existing.weight + 0.18);
      existing.lastFired = performance.now();
      persistedSynapses.set(key, { weight: Math.min(1, Math.max(remembered?.weight ?? 0, existing.weight)), lastSeen: Date.now() });
      persistSynapticMemory();
      return;
    }
    const color = source.role === "hole" || target.role === "hole" ? 0x9fe0cb : source.role === "island" || target.role === "island" ? 0xffca68 : 0xb9a8ff;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18 * 3), 3));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geometry, material);
    synapticMemoryGroup.add(line);
    const startingWeight = Math.min(1, 0.28 + (remembered?.weight ?? 0) * 0.62);
    synapticEdges.push({ line, from: source.mesh, to: target.mesh, weight: startingWeight, lastFired: performance.now(), color });
    persistedSynapses.set(key, { weight: Math.max(remembered?.weight ?? 0, startingWeight), lastSeen: Date.now() });
    persistSynapticMemory();
    while (synapticEdges.length > 18) {
      const weakest = synapticEdges.slice().sort((leftEdge, rightEdge) => leftEdge.weight - rightEdge.weight || leftEdge.lastFired - rightEdge.lastFired)[0];
      if (!weakest) break;
      synapticEdges.splice(synapticEdges.indexOf(weakest), 1);
      synapticMemoryGroup.remove(weakest.line);
      weakest.line.geometry.dispose();
      weakest.line.material.dispose();
    }
  };
  const syncNeuralMemory = (active = false): void => {
    if (!neuralMemory) return;
    const english = document.documentElement.lang === "en";
    const totalWeight = synapticEdges.reduce((sum, edge) => sum + edge.weight, 0);
    const familiar = persistedSynapses.size > synapticEdges.length;
    const futureWinner = forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
    const memoryEnergy = forecastMemoryTexture.reduce((sum, value) => sum + value, 0) / forecastMemoryTexture.length;
    const futureTag = forecastEnabled && forecastBranching
      ? (english ? ` · FUTURE W${futureWinner + 1} ${Math.round(forecastBranchScores[futureWinner] * 100)}% · MEMORY ${Math.round(memoryEnergy * 100)}%` : ` · 未来胜者 ${futureWinner + 1} ${Math.round(forecastBranchScores[futureWinner] * 100)}% · 记忆 ${Math.round(memoryEnergy * 100)}%`)
      : "";
    const observerTag = english ? ` · OBSERVER ${observerSignature}` : ` · 观察者 ${observerSignature}`;
    neuralMemory.textContent = english
      ? `SYNAPTIC MEMORY · ${synapticEdges.length} PATHS · ${Math.round(totalWeight * 100)}%${familiar ? " · FAMILIAR" : ""}${futureTag}${observerTag}`
      : `突触记忆 · ${synapticEdges.length} 条路径 · ${Math.round(totalWeight * 100)}%${familiar ? " · 熟悉回路" : ""}${futureTag}${observerTag}`;
    stage.dataset.neuralMemory = active ? "active" : "ready";
  };
  let audioEnabled = false;
  let audioContext: AudioContext | null = null;
  const playTopologyTone = (event: string): void => {
    if (!audioEnabled || typeof AudioContext === "undefined") return;
    audioContext ??= new AudioContext();
    void audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequency = event === "birth" ? 523.25 : event === "vanish" ? 196 : event === "grow" ? 392 : 293.66;
    const memoryEnergy = forecastMemoryTexture.reduce((sum, value) => sum + value, 0) / Math.max(1, forecastMemoryTexture.length);
    const memoryHarmonic = 1 + memoryEnergy * 0.28;
    const now = audioContext.currentTime;
    oscillator.type = event === "vanish" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency * memoryHarmonic, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * memoryHarmonic * (event === "grow" ? 1.26 : 0.82), now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.34);
  };
  const triggerTopologyPulse = (event: string, role: SectionLoop["role"]): void => {
    if (state.reducedMotion || event === "stable") return;
    playTopologyTone(event);
    const color = event === "birth" ? 0x8ffff2 : event === "vanish" ? 0xff8f9e : event === "grow" ? 0xffe3a0 : role === "hole" ? 0x9fe0cb : 0xffca68;
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.86, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.052, 32), material);
    ring.position.set((Math.random() - 0.5) * 0.36, (Math.random() - 0.5) * 0.25, 0.22);
    topologyPulseGroup.add(ring);
    topologyPulses.push({ ring, bornAt: performance.now(), event });
    while (topologyPulses.length > 8) {
      const oldest = topologyPulses.shift();
      if (!oldest) break;
      topologyPulseGroup.remove(oldest.ring);
      oldest.ring.geometry.dispose();
      oldest.ring.material.dispose();
    }
  };
  const triggerTemporalCollision = (branch: number): void => {
    if (state.reducedMotion) return;
    forecastCollisionEnergy = 1;
    forecastBranchIndex = Math.max(0, Math.min(2, branch));
    forecastBranchScores = forecastBranchScores.map((score, index) => Math.max(0.05, Math.min(0.98, score * (index === forecastBranchIndex ? 0.92 : 0.985) + (index === forecastBranchIndex ? 0.16 : 0.015))));
    observerBias = observerBias.map((value, index) => Math.max(0.05, Math.min(0.9, value * (index === forecastBranchIndex ? 0.94 : 0.985) + (index === forecastBranchIndex ? 0.12 : 0.01))));
    observerSignature = encodeObserverSignature();
    forecastMemoryTexture = forecastMemoryTexture.map((value, index) => {
      const branchSlot = Math.floor(index / 4);
      return Math.max(0, Math.min(1, value * 0.96 + (branchSlot === forecastBranchIndex ? 0.18 : 0.012)));
    });
    forecastMemoryCycles += 1;
    persistForecastBranches();
    persistForecastMemory();
    persistObserverDNA();
    stage.dataset.causalCollision = `branch-${forecastBranchIndex + 1}`;
    const color = branch === 0 ? 0xb9a8ff : branch === 2 ? 0xffca68 : 0x8ffff2;
    const collision = new THREE.Group();
    collision.position.set(0, 0, 0.28);
    const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const innerMaterial = new THREE.MeshBasicMaterial({ color: 0xfff4ce, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.04, 48), ringMaterial);
    const inner = new THREE.Mesh(new THREE.RingGeometry(0.012, 0.022, 32), innerMaterial);
    ring.frustumCulled = false;
    inner.frustumCulled = false;
    collision.add(ring, inner);
    const particleCount = 72;
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3));
    const pointsMaterial = new THREE.PointsMaterial({ color, size: 0.012, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const points = new THREE.Points(particleGeometry, pointsMaterial);
    points.frustumCulled = false;
    collision.add(points);
    const spokesGeometry = new THREE.BufferGeometry();
    spokesGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12 * 2 * 3), 3));
    const spokes = new THREE.LineSegments(spokesGeometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending }));
    spokes.frustumCulled = false;
    collision.add(spokes);
    const velocities = Array.from({ length: particleCount }, (_, index) => {
      const angle = (index / particleCount) * Math.PI * 2 + branch * 0.7;
      const speed = 0.08 + ((index * 17) % 13) / 100;
      return new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, ((index % 5) - 2) * 0.012);
    });
    temporalCollisionGroup.add(collision);
    temporalCollisions.push({ group: collision, ring, inner, points, pointsMaterial, spokes, bornAt: performance.now(), velocities, branch });
    while (temporalCollisions.length > 3) {
      const oldest = temporalCollisions.shift();
      if (!oldest) break;
      temporalCollisionGroup.remove(oldest.group);
      oldest.group.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Points) child.geometry.dispose();
      });
      oldest.group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) child.material.dispose();
        if (child instanceof THREE.LineSegments && child.material instanceof THREE.Material) child.material.dispose();
        if (child instanceof THREE.Points && child.material instanceof THREE.Material) child.material.dispose();
      });
    }
    wake();
  };
  const spawnAnnihilationGhosts = (): void => {
    annihilationGhosts.splice(0).forEach((ghost) => {
      annihilationGhostGroup.remove(ghost.points);
      ghost.points.geometry.dispose();
      ghost.material.dispose();
    });
    if (state.reducedMotion) return;
    const particleCount = 240;
    const assembly = explodedMeshes.slice(0, Math.max(1, Math.min(48, explodedMeshes.length))).map(({ mesh, direction, index }) => {
      const role = currentSectionTopology[index % Math.max(1, currentSectionTopology.length)]?.role ?? (index % 3 === 1 ? "hole" : index % 3 === 2 ? "island" : "outer");
      const roleScale = role === "hole" ? 0.62 : role === "island" ? 0.92 : 0.46;
      const target = direction.clone().multiplyScalar(state.modelRadius * roleScale);
      target.y += role === "hole" ? 0.08 : role === "island" ? -0.06 : 0;
      return { mesh, origin: mesh.position.clone(), target, role, index };
    });
    organismParts = assembly.map(({ mesh, target, role, index }, partIndex) => ({ mesh, base: target.clone(), role, phase: partIndex * 2.399963, index }));
    [...persistedSynapses.entries()]
      .sort(([, left], [, right]) => right.weight - left.weight)
      .slice(0, 8)
      .forEach(([key]) => {
        const [left, right] = key.split(":").map(Number);
        const source = organismParts.find((part) => part.index === left);
        const target = organismParts.find((part) => part.index === right);
        if (source && target) reinforceSynapse(source, target);
      });
    syncRecordingControls();
    syncNeuralMemory();
    organismStartedAt = performance.now();
    stage.dataset.organism = "true";
    const targetMeshes = assembly.map(({ mesh }) => mesh);
    const materialStates = [...new Set(targetMeshes.map((mesh) => mesh.material as THREE.MeshStandardMaterial))].map((material) => ({
      material,
      color: material.color.getHex(),
      emissive: material.emissive.getHex(),
      intensity: material.emissiveIntensity,
    }));
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    for (let index = 0; index < particleCount; index += 1) {
      const angle = (index / particleCount) * Math.PI * 2;
      const radius = state.modelRadius * (0.2 + (index % 11) * 0.018);
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.58;
      positions[index * 3 + 2] = ((index % 13) - 6) * state.modelRadius * 0.018;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * (0.12 + (index % 7) * 0.018),
        Math.sin(angle) * (0.08 + (index % 5) * 0.016),
        ((index % 9) - 4) * 0.012,
      ));
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xfff0c2,
      size: 0.018,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    annihilationGhostGroup.add(points);
    annihilationGhosts.push({ points, material, velocities, bornAt: performance.now(), targetMeshes, assembly, materialStates });
    wake();
  };
  const spawnNeuralSignal = (): void => {
    if (state.reducedMotion || organismParts.length < 2) return;
    const source = organismParts[neuralSignalCursor % organismParts.length];
    const target = organismParts[(neuralSignalCursor + 1 + (neuralSignalCursor % 5)) % organismParts.length];
    neuralSignalCursor += 1;
    reinforceSynapse(source, target);
    neuralDecisionAt = performance.now();
    neuralDecisionRole = source.role === target.role ? source.role : target.role;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18 * 3), 3));
    const color = source.role === "hole" || target.role === "hole" ? 0x9fe0cb : source.role === "island" || target.role === "island" ? 0xffca68 : 0xb9a8ff;
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geometry, material);
    neuralSignalGroup.add(line);
    neuralSignals.push({ line, from: source.mesh, to: target.mesh, bornAt: performance.now(), color });
    syncNeuralMemory(true);
    while (neuralSignals.length > 10) {
      const oldest = neuralSignals.shift();
      if (!oldest) break;
      neuralSignalGroup.remove(oldest.line);
      oldest.line.geometry.dispose();
      oldest.line.material.dispose();
    }
  };
  const spawnEcologyBurst = (snapshot: typeof memoryGhostSnapshots[number]): void => {
    if (state.reducedMotion) return;
    const color = snapshot.role === "hole" ? 0x9fe0cb : snapshot.role === "island" ? 0xffca68 : 0xb9a8ff;
    const particleCount = 28;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3));
    const material = new THREE.PointsMaterial({ color, size: snapshot.role === "hole" ? 0.014 : 0.018, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const points = new THREE.Points(geometry, material);
    const velocities = Array.from({ length: particleCount }, (_, index) => {
      const angle = (index / particleCount) * Math.PI * 2;
      const speed = (snapshot.role === "island" ? 0.18 : snapshot.role === "hole" ? 0.12 : 0.15) * (0.65 + (index % 5) * 0.11);
      return new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed * 0.7, ((index % 7) - 3) * 0.012);
    });
    ecologyBurstGroup.add(points);
    ecologyBursts.push({ points, material, velocities, anchorId: snapshot.id, role: snapshot.role, bornAt: performance.now() });
  };
  const disposeMemorySnapshot = (snapshot: typeof memoryGhostSnapshots[number]): void => {
    memoryGhostGroup.remove(snapshot.group);
    memoryGhostGroup.remove(snapshot.trail);
    snapshot.trail.geometry.dispose();
    snapshot.trail.material.dispose();
    snapshot.materials.forEach((material) => material.dispose());
  };
  const addMemoryGhostSnapshot = (): void => {
    const snapshotGroup = new THREE.Group();
    const materials: THREE.MeshBasicMaterial[] = [];
    const tint = state.sliceAxis === "x" ? 0xffd58a : state.sliceAxis === "y" ? 0x9fe0cb : 0xb9a8ff;
    const role = (Object.entries(currentSectionTopology.reduce<Record<SectionLoop["role"], number>>((counts, loop) => {
      counts[loop.role] = (counts[loop.role] ?? 0) + 1;
      return counts;
    }, { outer: 0, hole: 0, island: 0 })).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "outer") as SectionLoop["role"];
    intersectedSectionMeshes.slice(0, 16).forEach((source) => {
      const material = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.075, depthWrite: false, side: THREE.DoubleSide });
      const ghost = new THREE.Mesh(source.geometry, material);
      ghost.position.copy(source.position);
      ghost.quaternion.copy(source.quaternion);
      ghost.scale.copy(source.scale).multiplyScalar(1.015);
      snapshotGroup.add(ghost);
      materials.push(material);
    });
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 36), 3));
    const trailMaterial = new THREE.LineBasicMaterial({ color: tint, transparent: true, opacity: 0.16, depthWrite: false });
    const trail = new THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>(trailGeometry, trailMaterial);
    trail.frustumCulled = false;
    memoryGhostGroup.add(trail);
    memoryGhostGroup.add(snapshotGroup);
    const id = nextMemoryId++;
    const meshIndices = intersectedSectionMeshes.map((mesh) => explodedMeshes.find((part) => part.mesh === mesh)?.index).filter((index): index is number => index !== undefined);
    const snapshot = { id, group: snapshotGroup, trail, bornAt: performance.now(), materials, pinned: false, axis: state.sliceAxis, role, meshIndices, percent: state.slicePercent, mass: Math.max(currentSectionArea, 1e-6), phase: id * 2.399963, radius: 0.12 + ((id - 1) % 4) * 0.055 };
    memoryGhostSnapshots.push(snapshot);
    spawnEcologyBurst(snapshot);
    while (memoryGhostSnapshots.length > 4) {
      const removable = memoryGhostSnapshots.find((snapshot) => !snapshot.pinned);
      if (!removable) break;
      memoryGhostSnapshots.splice(memoryGhostSnapshots.indexOf(removable), 1);
      disposeMemorySnapshot(removable);
    }
  };
  const clearTemporalGhosts = (): void => {
    temporalGhostGroup.clear();
    temporalGhostMaterials.forEach((material) => material.dispose());
    temporalGhostMaterials = [];
  };
  const spawnTemporalGhosts = (): void => {
    addMemoryGhostSnapshot();
    clearTemporalGhosts();
    temporalGhostGroup.position.set(0, 0, 0);
    temporalGhostGroup.rotation.set(0, 0, 0);
    const tint = state.sliceAxis === "x" ? 0xffd58a : state.sliceAxis === "y" ? 0x9fe0cb : 0xb9a8ff;
    const echoes = [
      { color: 0x8ffff2, opacity: 0.2, offset: -0.055, scale: 0.96 },
      { color: tint, opacity: 0.14, offset: 0, scale: 1 },
      { color: 0xffca68, opacity: 0.08, offset: 0.055, scale: 1.04 },
    ];
    echoes.forEach(({ color, opacity, offset, scale }) => intersectedSectionMeshes.slice(0, 24).forEach((source) => {
        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const ghost = new THREE.Mesh(source.geometry, material);
        ghost.position.copy(source.position);
        ghost.position.x += offset;
        ghost.position.y += offset * 0.35;
        ghost.quaternion.copy(source.quaternion);
        ghost.scale.copy(source.scale).multiplyScalar(scale);
        temporalGhostGroup.add(ghost);
        temporalGhostMaterials.push(material);
      }));
    temporalGhostStartedAt = performance.now();
  };
  const triggerBranchWarp = (intensity: number): void => {
    if (state.reducedMotion) return;
    spawnTemporalGhosts();
    branchWarpStartedAt = performance.now();
    branchWarpIntensity = Math.max(0.35, Math.min(1.2, intensity));
    wake();
  };
  const syncSliceControls = (): void => {
    const value = Math.round(state.slicePercent);
    const sliceInput = stage.querySelector<HTMLInputElement>("[data-model-slice]");
    const sliceValue = stage.querySelector<HTMLOutputElement>("[data-model-slice-value]");
    const tomogramScrubber = stage.querySelector<HTMLInputElement>("[data-tomogram-scrubber-range]");
    const tomogramScrubberValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-scrubber-value]");
    if (sliceInput) sliceInput.value = String(value);
    if (sliceValue) sliceValue.value = `${value}%`;
    if (tomogramScrubber) tomogramScrubber.value = String(value);
    if (tomogramScrubberValue) tomogramScrubberValue.value = `${value}%`;
  };
  const syncAxisControls = (): void => {
    const english = document.documentElement.lang === "en";
    const axisLabel = stage.querySelector<HTMLElement>("[data-tomogram-axis-label]");
    if (axisLabel) axisLabel.textContent = english
      ? `${state.sliceAxis.toUpperCase()} SECTION`
      : `${state.sliceAxis.toUpperCase()} 向切片`;
    stage.querySelectorAll<HTMLButtonElement>("[data-slice-axis]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.sliceAxis === state.sliceAxis));
    });
  };
  const tomogramTelemetry = {
    area: stage.querySelector<HTMLElement>("[data-tomogram-area]"),
    perimeter: stage.querySelector<HTMLElement>("[data-tomogram-perimeter]"),
    loops: stage.querySelector<HTMLElement>("[data-tomogram-loops]"),
    meshes: stage.querySelector<HTMLElement>("[data-tomogram-meshes]"),
    delta: stage.querySelector<HTMLElement>("[data-tomogram-delta]"),
  };
  const tomogramExport = stage.querySelector<HTMLButtonElement>("[data-tomogram-export]");
  const tomogramMovie = stage.querySelector<HTMLButtonElement>("[data-tomogram-movie]");
  const tomogramForecast = stage.querySelector<HTMLButtonElement>("[data-tomogram-forecast]");
  const tomogramBranches = stage.querySelector<HTMLButtonElement>("[data-tomogram-branches]");
  const tomogramEvents = stage.querySelector<HTMLButtonElement>("[data-tomogram-events]");
  const tomogramHop = stage.querySelector<HTMLButtonElement>("[data-tomogram-hop]");
  const tomogramArc = stage.querySelector<HTMLButtonElement>("[data-tomogram-arc]");
  const tomogramReel = stage.querySelector<HTMLButtonElement>("[data-tomogram-reel]");
  const tomogramMultiverse = stage.querySelector<HTMLButtonElement>("[data-tomogram-multiverse]");
  const tomogramSplice = stage.querySelector<HTMLButtonElement>("[data-tomogram-splice]");
  const tomogramAudio = stage.querySelector<HTMLButtonElement>("[data-tomogram-audio]");
  const tomogramCinema = stage.querySelector<HTMLButtonElement>("[data-tomogram-cinema]");
  const tomogramShare = stage.querySelector<HTMLButtonElement>("[data-tomogram-share]");
  const tomogramImport = stage.querySelector<HTMLButtonElement>("[data-tomogram-import]");
  const tomogramImportInput = stage.querySelector<HTMLInputElement>("[data-tomogram-import-input]");
  const tomogramPin = stage.querySelector<HTMLButtonElement>("[data-tomogram-pin]");
  const frameScrubber = stage.querySelector<HTMLInputElement>("[data-tomogram-frame-range]");
  const frameScrubberValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-frame-value]");
  const crossoverRange = stage.querySelector<HTMLInputElement>("[data-tomogram-crossover-range]");
  const crossoverValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-crossover-value]");
  const crossoverEndRange = stage.querySelector<HTMLInputElement>("[data-tomogram-crossover-end-range]");
  const crossoverEndValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-crossover-end-value]");
  const lineage = stage.querySelector<HTMLElement>("[data-tomogram-lineage]");
  const lineageMemoryPin = stage.querySelector<HTMLButtonElement>("[data-tomogram-memory-pin]");
  const lineageMemoryRack = stage.querySelector<HTMLElement>("[data-tomogram-memory-rack]");
  const lineageField = stage.querySelector<HTMLElement>("[data-tomogram-lineage-field]");
  const lineageTrack = stage.querySelector<HTMLElement>("[data-tomogram-lineage-track]");
  const lineageValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-lineage-value]");
  const orbitRange = stage.querySelector<HTMLInputElement>("[data-tomogram-orbit-range]");
  const orbitValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-orbit-value]");
  const speedRange = stage.querySelector<HTMLInputElement>("[data-tomogram-speed-range]");
  const speedValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-speed-value]");
  const partSpeedRange = stage.querySelector<HTMLInputElement>("[data-tomogram-part-speed-range]");
  const partSpeedValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-part-speed-value]");
  const partHistoryRange = stage.querySelector<HTMLInputElement>("[data-tomogram-part-history-range]");
  const partHistoryValue = stage.querySelector<HTMLOutputElement>("[data-tomogram-part-history-value]");
  let memoryOrbitRadius = 1;
  let memoryOrbitSpeed = 1;
  let partMemorySpeed = 1;
  const syncOrbitControls = (): void => {
    const hasMemory = memoryGhostSnapshots.length > 0;
    const english = document.documentElement.lang === "en";
    if (orbitRange) orbitRange.disabled = !hasMemory;
    if (speedRange) speedRange.disabled = !hasMemory;
    if (partSpeedRange) partSpeedRange.disabled = !hasMemory || focusedMeshIndex === null;
    const componentHistory = focusedMeshIndex === null ? [] : memoryGhostSnapshots.filter((snapshot) => snapshot.meshIndices.includes(focusedMeshIndex as number));
    if (partHistoryRange) partHistoryRange.disabled = componentHistory.length === 0;
    if (orbitValue) orbitValue.value = `${memoryOrbitRadius.toFixed(1)}×`;
    if (speedValue) speedValue.value = `${memoryOrbitSpeed.toFixed(1)}×`;
    if (partSpeedValue) partSpeedValue.value = partMemorySpeed === 0
      ? english ? "FREEZE" : "冻结"
      : `${partMemorySpeed.toFixed(1)}×`;
    if (partHistoryValue) partHistoryValue.value = `${componentHistory.length > 1 ? Math.round(Math.min(1, componentHistoryCursor / (componentHistory.length - 1)) * 100) : 100}%`;
    if (partHistoryRange) partHistoryRange.value = partHistoryValue?.value.replace("%", "") ?? "100";
  };
  let currentSectionLoops: [number, number][][] = [];
  let currentSectionArea = 0;
  let currentSectionPerimeter = 0;
  let currentSectionMeshes = 0;
  let currentSectionTopology: SectionLoop[] = [];
  let referenceSection: SectionReference | null = null;
  let modelSpanMm = 1;
  let modelCenterMm = [0, 0, 0];
  const syncReferenceControl = (): void => {
    if (!tomogramPin) return;
    const english = document.documentElement.lang === "en";
    tomogramPin.textContent = referenceSection
      ? english ? "CLEAR Δ" : "清除 Δ"
      : english ? "PIN Δ" : "固定 Δ";
    tomogramPin.setAttribute("aria-pressed", String(Boolean(referenceSection)));
    tomogramPin.setAttribute("aria-label", referenceSection
      ? english ? "Clear the pinned section difference reference" : "清除固定的截面差分参考"
      : english ? "Pin the current section, then move the slice to compare geometry" : "固定当前截面，然后移动切片比较几何变化");
  };
  const classifyTopologyEvent = (loop: SectionLoop | undefined, previous: SectionLoop | undefined): "birth" | "vanish" | "grow" | "shrink" | "stable" =>
    !previous && loop
      ? "birth"
      : previous && !loop
        ? "vanish"
        : loop && previous && loop.area > previous.area * 1.15
          ? "grow"
          : loop && previous && loop.area < previous.area * 0.85
            ? "shrink"
            : "stable";
  const syncEventUrl = (frameIndex: number): void => {
    if (!selectedLoopSignature || !recordedFrames[frameIndex]) return;
    const frame = recordedFrames[frameIndex];
    const event = classifyTopologyEvent(
      frame.loops.filter((loop) => loop.role === selectedLoopSignature?.role)
        .sort((left, right) => Math.abs(left.area - selectedLoopSignature!.area) - Math.abs(right.area - selectedLoopSignature!.area))[0],
      frameIndex > 0 ? recordedFrames[frameIndex - 1].loops.find((loop) => loop.role === selectedLoopSignature?.role) : undefined,
    );
    const params = new URLSearchParams({ frame: String(frameIndex), role: selectedLoopSignature.role, event, axis: frame.axis, percent: String(Math.round(frame.percent)) });
    history.replaceState(null, "", `${location.pathname}${location.search}#story-event?${params.toString()}`);
  };
  let lastTopologyPulse = "";
  const syncLineageControl = (): void => {
    syncOrbitControls();
    const active = Boolean(selectedLoopSignature && recordedFrames.length > 1);
    if (lineage) lineage.hidden = !active;
    const latestMemory = memoryGhostSnapshots[memoryGhostSnapshots.length - 1];
    if (lineageMemoryPin) {
      lineageMemoryPin.disabled = !active || !latestMemory;
      lineageMemoryPin.textContent = latestMemory?.pinned
        ? document.documentElement.lang === "en" ? "UNPIN" : "取消固定"
        : document.documentElement.lang === "en" ? "PIN MEMORY" : "固定记忆";
      lineageMemoryPin.setAttribute("aria-pressed", String(Boolean(latestMemory?.pinned)));
    }
    if (lineageMemoryRack) {
      lineageMemoryRack.replaceChildren(...memoryGhostSnapshots.filter((snapshot) => snapshot.pinned).map((snapshot) => {
        const chip = document.createElement("div");
        chip.className = "tomogram-memory-chip";
        chip.dataset.axis = snapshot.axis;
        chip.dataset.role = snapshot.role;
        const label = document.createElement("button");
        label.type = "button";
        label.className = "tomogram-memory-recall";
        label.textContent = `MEMORY ${String(snapshot.id).padStart(2, "0")} · ${snapshot.axis.toUpperCase()} ${Math.round(snapshot.percent)}% · ${snapshot.role.toUpperCase()} · ${snapshot.meshIndices.length} MESH`;
        label.setAttribute("aria-label", `${document.documentElement.lang === "en" ? "Recall memory" : "召回记忆"} ${snapshot.id}`);
        label.setAttribute("aria-pressed", String(focusedMemoryId === snapshot.id));
        label.addEventListener("click", () => {
          focusedMeshIndex = null;
          focusedMemoryId = focusedMemoryId === snapshot.id ? null : snapshot.id;
          state.sliceAxis = snapshot.axis;
          state.slicePercent = snapshot.percent;
          syncSliceControls();
          syncAxisControls();
          updateSectionPlane();
          branchWarpStartedAt = performance.now();
          branchWarpIntensity = focusedMemoryId === snapshot.id ? 0.95 : 0.55;
          syncLineageControl();
          wake();
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `${document.documentElement.lang === "en" ? "Remove memory" : "删除记忆"} ${snapshot.id}`);
        remove.addEventListener("click", () => {
          const index = memoryGhostSnapshots.indexOf(snapshot);
          if (index >= 0) memoryGhostSnapshots.splice(index, 1);
          if (focusedMemoryId === snapshot.id) focusedMemoryId = null;
          disposeMemorySnapshot(snapshot);
          syncLineageControl();
          wake();
        });
        chip.append(label, remove);
        return chip;
      }));
    }
    if (!lineageTrack || !active || !selectedLoopSignature) {
      lineageField?.replaceChildren();
      lineageTrack?.replaceChildren();
      if (lineageValue) lineageValue.value = "—";
      return;
    }
    const values = recordedFrames.map((frame) => frame.loops
      .filter((loop) => loop.role === selectedLoopSignature?.role)
      .sort((left, right) => Math.abs(left.area - selectedLoopSignature!.area) - Math.abs(right.area - selectedLoopSignature!.area))[0]);
    const fieldMaximum = Math.max(...recordedFrames.flatMap((frame) => frame.loops.map((loop) => loop.area)), 1e-6);
    const fieldSvgNamespace = "http://www.w3.org/2000/svg";
    const fieldSvg = document.createElementNS(fieldSvgNamespace, "svg");
    fieldSvg.setAttribute("viewBox", "0 0 100 40");
    fieldSvg.setAttribute("preserveAspectRatio", "none");
    fieldSvg.setAttribute("aria-hidden", "true");
    const fieldNodes = recordedFrames.map((frame, frameIndex) => frame.loops.map((loop, loopIndex) => ({
      loop,
      frameIndex,
      loopIndex,
      x: recordedFrames.length === 1 ? 50 : 4 + (frameIndex / (recordedFrames.length - 1)) * 92,
      y: 4 + ((loopIndex + 1) / (frame.loops.length + 1)) * 32,
    })));
    const roleColor = (role: SectionLoop["role"]): string => role === "hole" ? "#9fe0cb" : role === "island" ? "#ffca68" : "#b9a8ff";
    fieldNodes.slice(0, -1).forEach((nodes, frameIndex) => {
      nodes.forEach((node) => {
        const candidates = fieldNodes[frameIndex + 1].filter((next) => next.loop.role === node.loop.role);
        const next = candidates.sort((left, right) => Math.abs(left.loop.area - node.loop.area) - Math.abs(right.loop.area - node.loop.area))[0];
        if (!next) return;
        const link = document.createElementNS(fieldSvgNamespace, "path");
        link.classList.add("tomogram-lineage-link");
        link.setAttribute("d", `M ${node.x} ${node.y} C ${node.x + 4} ${node.y}, ${next.x - 4} ${next.y}, ${next.x} ${next.y}`);
        link.setAttribute("stroke", roleColor(node.loop.role));
        fieldSvg.append(link);
      });
    });
    fieldNodes.flat().forEach(({ loop, frameIndex, loopIndex, x, y }) => {
      const node = document.createElementNS(fieldSvgNamespace, "circle");
      node.classList.add("tomogram-lineage-node");
      node.dataset.frameIndex = String(frameIndex);
      node.dataset.loopIndex = String(loopIndex);
      node.setAttribute("cx", String(x));
      node.setAttribute("cy", String(y));
      node.setAttribute("r", String(Math.max(1.3, Math.min(3.2, 1.3 + loop.area / fieldMaximum * 2))));
      node.setAttribute("fill", roleColor(loop.role));
      if (loop.role === selectedLoopSignature?.role && Math.abs(loop.area - selectedLoopSignature.area) <= Math.max(selectedLoopSignature.area * 0.08, 1e-6)) node.classList.add("is-selected");
      fieldSvg.append(node);
    });
    lineageField?.replaceChildren(fieldSvg);
    if (lineageField) {
      lineageField.style.setProperty("--lineage-frames", String(recordedFrames.length));
      lineageField.setAttribute("aria-label", `${document.documentElement.lang === "en" ? "Topology genealogy" : "拓扑家谱"}: ${recordedFrames.length} ${document.documentElement.lang === "en" ? "frames" : "帧"}, ${recordedFrames.reduce((sum, frame) => sum + frame.loops.length, 0)} ${document.documentElement.lang === "en" ? "loops" : "环"}`);
    }
    const maximum = Math.max(...values.map((loop) => loop?.area ?? 0), 1e-6);
    const eventLabels: Record<string, string> = document.documentElement.lang === "en"
      ? { birth: "BIRTH", vanish: "VANISH", grow: "GROW", shrink: "SHRINK", stable: "STABLE" }
      : { birth: "出生", vanish: "消失", grow: "扩张", shrink: "收缩", stable: "稳定" };
    const eventCounts = { birth: 0, vanish: 0, grow: 0, shrink: 0 };
    lineageTrack.replaceChildren(...values.map((loop, index) => {
      const previous = values[index - 1];
      const event = classifyTopologyEvent(loop, previous);
      if (event in eventCounts) eventCounts[event as keyof typeof eventCounts] += 1;
      const segment = document.createElement("button");
      segment.type = "button";
      segment.className = index === playbackIndex ? "is-active" : "";
      segment.dataset.frameIndex = String(index);
      segment.setAttribute("role", "option");
      segment.setAttribute("aria-selected", String(index === playbackIndex));
      segment.title = loop
        ? `${document.documentElement.lang === "en" ? "Frame" : "帧"} ${index + 1} · ${(loop.area * Math.max(modelSpanMm / 2, 1e-6) ** 2).toFixed(2)} mm²`
        : `${document.documentElement.lang === "en" ? "Frame" : "帧"} ${index + 1} · ${document.documentElement.lang === "en" ? "loop missing" : "拓扑环消失"}`;
      segment.dataset.axis = recordedFrames[index].axis;
      segment.dataset.role = loop?.role ?? "missing";
      segment.dataset.event = event;
      segment.style.setProperty("--lineage-size", `${Math.max(8, ((loop?.area ?? 0) / maximum) * 100)}%`);
      const eventLabel = eventLabels[event];
      segment.title = `${eventLabel} · ${segment.title}`;
      return segment;
    }));
    const activeFrameIndex = Math.min(playbackIndex, values.length - 1);
    const activeLoop = values[activeFrameIndex];
    const activeEvent = classifyTopologyEvent(activeLoop, values[activeFrameIndex - 1]);
    const pulseKey = `${activeFrameIndex}:${activeEvent}:${selectedLoopSignature.role}`;
    if (pulseKey !== lastTopologyPulse) {
      lastTopologyPulse = pulseKey;
      triggerTopologyPulse(activeEvent, selectedLoopSignature.role);
    }
    const current = values[Math.min(playbackIndex, values.length - 1)];
    if (lineageValue) lineageValue.value = current
      ? `${(current.area * Math.max(modelSpanMm / 2, 1e-6) ** 2).toFixed(2)} mm² · ${eventLabels[(() => {
        const index = Math.min(playbackIndex, values.length - 1);
        const previous = values[index - 1];
        return !previous ? "birth" : current.area > previous.area * 1.15 ? "grow" : current.area < previous.area * 0.85 ? "shrink" : "stable";
      })()]}`
      : "—";
    lineageTrack.setAttribute("aria-label", `${document.documentElement.lang === "en" ? "Selected" : "选中"} ${selectedLoopSignature.role} ${document.documentElement.lang === "en" ? "lineage" : "谱系"}: ${values.filter(Boolean).length}/${recordedFrames.length}; ${eventCounts.birth} ${eventLabels.birth}, ${eventCounts.vanish} ${eventLabels.vanish}`);
  };
  syncReferenceControl();
  lineageMemoryPin?.addEventListener("click", () => {
    const latestMemory = memoryGhostSnapshots[memoryGhostSnapshots.length - 1];
    if (!latestMemory) return;
    latestMemory.pinned = !latestMemory.pinned;
    syncLineageControl();
    wake();
  });
  orbitRange?.addEventListener("input", () => {
    memoryOrbitRadius = Number(orbitRange.value);
    syncOrbitControls();
    wake();
  });
  speedRange?.addEventListener("input", () => {
    memoryOrbitSpeed = Number(speedRange.value);
    syncOrbitControls();
    wake();
  });
  partSpeedRange?.addEventListener("input", () => {
    partMemorySpeed = Number(partSpeedRange.value);
    syncOrbitControls();
    wake();
  });
  partHistoryRange?.addEventListener("input", () => {
    const componentHistory = focusedMeshIndex === null ? [] : memoryGhostSnapshots.filter((snapshot) => snapshot.meshIndices.includes(focusedMeshIndex as number));
    if (!componentHistory.length) return;
    componentHistoryCursor = (Number(partHistoryRange.value) / 100) * Math.max(0, componentHistory.length - 1);
    partMemorySpeed = 0;
    const historicalMemory = componentHistory[Math.floor(componentHistoryCursor)];
    if (historicalMemory) {
      state.sliceEnabled = true;
      state.sliceAxis = historicalMemory.axis;
      state.slicePercent = historicalMemory.percent;
      syncSliceControls();
      syncAxisControls();
      applySectionMode();
    }
    syncOrbitControls();
    wake();
  });
  lineageField?.addEventListener("click", (event) => {
    const target = (event.target as SVGElement).closest<SVGCircleElement>("circle[data-frame-index]");
    if (!target) return;
    const frameIndex = Number(target.dataset.frameIndex);
    const loopIndex = Number(target.dataset.loopIndex);
    const frame = recordedFrames[frameIndex];
    const loop = frame?.loops[loopIndex];
    if (!frame || !loop) return;
    selectedLoopSignature = { role: loop.role, area: loop.area };
    selectedLoopIndex = loopIndex;
    triggerBranchWarp(0.55 + Math.min(loop.area / Math.max(frame.area, 1e-6), 1) * 0.55);
    playback = false;
    state.sliceScanning = false;
    window.clearTimeout(playbackTimer);
    playbackIndex = frameIndex;
    syncEventUrl(playbackIndex);
    state.sliceEnabled = true;
    state.sliceAxis = frame.axis;
    state.slicePercent = frame.percent;
    stage.querySelector<HTMLButtonElement>("[data-model-slice-toggle]")?.setAttribute("aria-pressed", "true");
    syncSliceControls();
    syncAxisControls();
    syncRecordingControls();
    applySectionMode();
    wake();
  });
  lineageTrack?.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-frame-index]");
    if (!target) return;
    const frame = recordedFrames[Number(target.dataset.frameIndex)];
    if (!frame) return;
    playback = false;
    state.sliceScanning = false;
    window.clearTimeout(playbackTimer);
    playbackIndex = Number(target.dataset.frameIndex);
    syncEventUrl(playbackIndex);
    triggerBranchWarp(0.45);
    state.sliceEnabled = true;
    state.sliceAxis = frame.axis;
    state.slicePercent = frame.percent;
    stage.querySelector<HTMLButtonElement>("[data-model-slice-toggle]")?.setAttribute("aria-pressed", "true");
    syncSliceControls();
    syncAxisControls();
    syncRecordingControls();
    applySectionMode();
    wake();
  });
  tomogramHop?.addEventListener("click", () => {
    if (recordedFrames.length < 2 || !selectedLoopSignature) return;
    const values = recordedFrames.map((frame) => frame.loops
      .filter((loop) => loop.role === selectedLoopSignature?.role)
      .sort((left, right) => Math.abs(left.area - selectedLoopSignature!.area) - Math.abs(right.area - selectedLoopSignature!.area))[0]);
    const nextEventIndex = Array.from({ length: recordedFrames.length }, (_, offset) => (playbackIndex + offset + 1) % recordedFrames.length)
      .find((index) => classifyTopologyEvent(values[index], values[index - 1]) !== "stable");
    if (nextEventIndex === undefined) return;
    playback = false;
    state.sliceScanning = false;
    window.clearTimeout(playbackTimer);
    playbackIndex = nextEventIndex;
    syncEventUrl(playbackIndex);
    const frame = recordedFrames[playbackIndex];
    state.sliceEnabled = true;
    state.sliceAxis = frame.axis;
    state.slicePercent = frame.percent;
    triggerTopologyPulse(classifyTopologyEvent(values[playbackIndex], values[playbackIndex - 1]), selectedLoopSignature.role);
    syncSliceControls();
    syncAxisControls();
    syncRecordingControls();
    applySectionMode();
    wake();
  });
  tomogramForecast?.addEventListener("click", () => {
    if (recordedFrames.length < 3) return;
    forecastEnabled = !forecastEnabled;
    stage.querySelector<HTMLButtonElement>('[data-artifact-view="tomogram"]')?.click();
    syncRecordingControls();
    wake();
  });
  tomogramBranches?.addEventListener("click", () => {
    if (recordedFrames.length < 3) return;
    forecastBranching = true;
    forecastBranchManual = true;
    forecastBranchIndex = (forecastBranchIndex + 1) % 3;
    forecastEnabled = true;
    stage.querySelector<HTMLButtonElement>('[data-artifact-view="tomogram"]')?.click();
    syncRecordingControls();
    wake();
  });
  tomogramArc?.addEventListener("click", () => {
    if (recordedFrames.length < 2 || !selectedLoopSignature) return;
    eventArcPlayback = !eventArcPlayback;
    eventArcHoldUntil = 0;
    cinematicEndFrame = null;
    playback = eventArcPlayback && !state.reducedMotion;
    playbackIndex = 0;
    if (eventArcPlayback) {
      state.sliceEnabled = true;
      triggerBranchWarp(0.9);
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="tomogram"]')?.click();
    }
    syncRecordingControls();
    wake();
  });
  tomogramReel?.addEventListener("click", () => {
    if (reelRecorder) {
      window.clearTimeout(reelStopTimer);
      reelRecorder.stop();
      return;
    }
    if (recordedFrames.length < 2 || !selectedLoopSignature || typeof MediaRecorder === "undefined" || !canvas.captureStream) return;
    const stream = canvas.captureStream(30);
    const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
    recorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      reelRecorder = null;
      eventArcPlayback = false;
      playback = false;
      const blob = new Blob(chunks, { type: mimeType ?? "video/webm" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `easyki-topology-reel-${selectedLoopSignature?.role ?? "event"}.webm`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1500);
      const manifest = JSON.stringify({ version: 1, kind: "easyki-topology-reel", role: selectedLoopSignature?.role, frames: recordedFrames.length, deepLink: window.location.href, format: mimeType ?? "video/webm" }, null, 2);
      const manifestUrl = URL.createObjectURL(new Blob([manifest], { type: "application/json;charset=utf-8" }));
      const manifestLink = document.createElement("a");
      manifestLink.href = manifestUrl;
      manifestLink.download = `easyki-topology-reel-${selectedLoopSignature?.role ?? "event"}.json`;
      document.body.append(manifestLink);
      manifestLink.click();
      manifestLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(manifestUrl), 1500);
      syncRecordingControls();
      wake();
    });
    reelRecorder = recorder;
    recorder.start(200);
    eventArcPlayback = true;
    eventArcHoldUntil = 0;
    playback = !state.reducedMotion;
    playbackIndex = 0;
    stage.querySelector<HTMLButtonElement>('[data-artifact-view="tomogram"]')?.click();
    const duration = Math.max(4500, Math.min(15000, recordedFrames.length * 90));
    reelStopTimer = window.setTimeout(() => { if (reelRecorder?.state === "recording") reelRecorder.stop(); }, duration);
    syncRecordingControls();
    wake();
  });
  tomogramMultiverse?.addEventListener("click", () => {
    if (importedTimelines.length < 2) return;
    multiverseMode = !multiverseMode;
    stage.dataset.multiverse = String(multiverseMode);
    if (multiverseMode) {
      eventArcPlayback = false;
      cinematicEndFrame = null;
      playback = !state.reducedMotion;
      playbackIndex = 0;
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="tomogram"]')?.click();
      triggerBranchWarp(1.15);
    }
    syncRecordingControls();
    wake();
  });
  tomogramAudio?.addEventListener("click", () => {
    if (typeof AudioContext === "undefined") return;
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
      audioContext ??= new AudioContext();
      void audioContext.resume();
      playTopologyTone("grow");
    }
    syncRecordingControls();
  });
  tomogramCinema?.addEventListener("click", () => {
    if (lockedEventFrame === null || recordedFrames.length < 2) return;
    const frames = importedTimelines.length >= 2 ? buildRecombinedTimeline() : recordedFrames;
    const targetFrame = Math.min(lockedEventFrame, frames.length - 1);
    const startFrame = Math.max(0, targetFrame - 3);
    const endFrame = Math.min(frames.length - 1, targetFrame + 3);
    playbackIndex = startFrame;
    cinematicEndFrame = endFrame;
    cinematicStartedAt = state.reducedMotion ? 0 : performance.now();
    cinematicEvent = lockedEventType;
    playback = !state.reducedMotion;
    state.sliceEnabled = true;
    state.sliceScanning = false;
    state.sliceAxis = frames[startFrame].axis;
    state.slicePercent = frames[startFrame].percent;
    triggerBranchWarp(1.4);
    syncEventUrl(targetFrame);
    const capsule = JSON.stringify({
      version: 1,
      kind: "easyki-topology-event-capsule",
      event: lockedEventType,
      frame: targetFrame,
      window: { start: startFrame, end: endFrame },
      role: selectedLoopSignature?.role ?? "outer",
      frames: frames.slice(startFrame, endFrame + 1),
      deepLink: window.location.href,
    }, null, 2);
    const url = URL.createObjectURL(new Blob([capsule], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `easyki-event-capsule-${lockedEventType}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    syncSliceControls();
    syncAxisControls();
    syncRecordingControls();
    applySectionMode();
    wake();
  });
  tomogramShare?.addEventListener("click", async () => {
    if (recordedFrames.length < 2 || !selectedLoopSignature) return;
    syncEventUrl(playbackIndex);
    const english = document.documentElement.lang === "en";
    try {
      await navigator.clipboard.writeText(window.location.href);
      tomogramShare.textContent = english ? "COPIED ✓" : "已复制 ✓";
      window.setTimeout(() => { tomogramShare.textContent = "SHARE ↗"; }, 1400);
    } catch {
      tomogramShare.textContent = english ? "SELECT URL" : "请复制地址";
    }
  });
  tomogramImport?.addEventListener("click", () => tomogramImportInput?.click());
  const parseTimeCapsule = async (file: File): Promise<ParsedTimeCapsule> => {
    const parsed: unknown = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid time capsule");
    const capsule = parsed as {
      memories?: unknown;
      frames?: unknown;
      kind?: unknown;
      event?: unknown;
      frame?: unknown;
      role?: unknown;
      window?: unknown;
    };
    const memories = Array.isArray(capsule.memories) ? capsule.memories : [];
    const sourceFrames = Array.isArray(capsule.frames)
      ? capsule.frames
      : memories.map((memory) => memory && typeof memory === "object" ? (memory as { frame?: unknown }).frame : null);
    if (!sourceFrames.length) throw new Error("No memories or frames found");
    const importedFrames = sourceFrames.flatMap((frame): SectionFrame[] => {
      if (!frame || typeof frame !== "object") return [];
      const value = frame as Record<string, unknown>;
      const axis = value.axis;
      const loops = value.loops;
      if (axis !== "x" && axis !== "y" && axis !== "z") return [];
      if (!Array.isArray(loops)) return [];
      const safeLoops: SectionLoop[] = loops.flatMap((candidate): SectionLoop[] => {
        if (!candidate || typeof candidate !== "object") return [];
        const loop = candidate as Record<string, unknown>;
        if (!Array.isArray(loop.points)) return [];
        const points = loop.points.filter((point): point is [number, number] =>
          Array.isArray(point) && point.length >= 2 && typeof point[0] === "number" && typeof point[1] === "number" && Number.isFinite(point[0]) && Number.isFinite(point[1]),
        );
        const role = loop.role;
        if (points.length < 3 || (role !== "outer" && role !== "hole" && role !== "island")) return [];
        const signedArea = Number(loop.signedArea);
        const area = Number(loop.area);
        const depth = Number(loop.depth);
        if (![signedArea, area, depth].every(Number.isFinite)) return [];
        return [{ points, signedArea, area, depth, role }];
      });
      const percent = Number(value.percent);
      const area = Number(value.area);
      const perimeter = Number(value.perimeter);
      if (![percent, area, perimeter].every(Number.isFinite)) return [];
      return [{ axis, percent: Math.max(0, Math.min(100, percent)), area, perimeter, loops: safeLoops }];
    });
    if (importedFrames.length < 2) throw new Error("At least two valid frames are required");
    const capsuleWindow = capsule.window && typeof capsule.window === "object" ? capsule.window as Record<string, unknown> : {};
    const frame = Number(capsule.frame);
    const start = Number(capsuleWindow.start);
    const end = Number(capsuleWindow.end);
    return {
      frames: importedFrames,
      kind: typeof capsule.kind === "string" ? capsule.kind : undefined,
      event: typeof capsule.event === "string" ? capsule.event : undefined,
      frame: Number.isInteger(frame) ? frame : undefined,
      role: capsule.role === "outer" || capsule.role === "hole" || capsule.role === "island" ? capsule.role : undefined,
      window: Number.isInteger(start) || Number.isInteger(end) ? {
        start: Number.isInteger(start) ? start : undefined,
        end: Number.isInteger(end) ? end : undefined,
      } : undefined,
    };
  };
  const importTimeCapsules = async (files: File[]): Promise<void> => {
    try {
      const parsedCapsules = await Promise.all(files.slice(0, 4).map(parseTimeCapsule));
      const capsuleFrames = parsedCapsules.map(({ frames }) => frames);
      const importedFrames = capsuleFrames.flat();
      if (importedFrames.length < 2) throw new Error("At least two valid frames are required");
      recordedFrames = importedFrames;
      importedTimeline = importedFrames;
      importedTimelines = capsuleFrames;
      morphTimeline = [];
      morphForkActive = false;
      delete stage.dataset.morphFork;
      collisionTimeline = [];
      collisionActive = false;
      delete stage.dataset.collision;
      antimatterTimeline = [];
      antimatterActive = false;
      delete stage.dataset.antimatter;
      annihilationTimeline = [];
      annihilationActive = false;
      delete stage.dataset.annihilation;
      multiverseMode = false;
      recombinedTimeline = false;
      lockedEventFrame = null;
      lockedEventBucket = null;
      lockedEventType = "stable";
      delete stage.dataset.lockedEvent;
      stage.dataset.multiverse = "false";
      stage.dataset.importedTimelines = String(capsuleFrames.length >= 2);
      crossoverPercent = 50;
      crossoverEndPercent = 70;
      if (crossoverRange) crossoverRange.value = String(crossoverPercent);
      if (crossoverValue) crossoverValue.value = `${crossoverPercent}%`;
      if (crossoverEndRange) crossoverEndRange.value = String(crossoverEndPercent);
      if (crossoverEndValue) crossoverEndValue.value = `${crossoverEndPercent}%`;
      playback = false;
      recording = false;
      state.sliceScanning = false;
      playbackIndex = 0;
      state.sliceEnabled = true;
      state.sliceAxis = importedFrames[0].axis;
      state.slicePercent = importedFrames[0].percent;
      const firstLoop = importedFrames[0].loops[0];
      selectedLoopIndex = firstLoop ? 0 : -1;
      selectedLoopSignature = firstLoop ? { role: firstLoop.role, area: firstLoop.area } : null;
      const sharedEvent = new URLSearchParams(location.hash.split("?")[1] ?? "");
      const eventCapsuleIndex = parsedCapsules.findIndex((capsule) => capsule.kind === "easyki-topology-event-capsule" && capsule.frame !== undefined);
      const eventCapsule = eventCapsuleIndex >= 0 ? parsedCapsules[eventCapsuleIndex] : undefined;
      const eventWindowStart = eventCapsule?.window?.start ?? 0;
      const capsuleBaseOffset = eventCapsuleIndex < 0 ? 0 : capsuleFrames.slice(0, eventCapsuleIndex).reduce((total, frames) => total + frames.length, 0);
      const capsuleFrame = eventCapsule?.frame === undefined ? undefined : capsuleBaseOffset + eventCapsule.frame - eventWindowStart;
      const sharedFrame = sharedEvent.get("frame");
      const requestedFrame = capsuleFrame ?? (sharedFrame === null ? Number.NaN : Number(sharedFrame));
      if (Number.isInteger(requestedFrame) && requestedFrame >= 0 && requestedFrame < importedFrames.length) {
        lockedEventFrame = requestedFrame;
        lockedEventType = eventCapsule?.event ?? sharedEvent.get("event") ?? "stable";
        stage.dataset.lockedEvent = `${lockedEventType}:${requestedFrame}`;
        playbackIndex = requestedFrame;
        state.sliceAxis = importedFrames[requestedFrame].axis;
        state.slicePercent = importedFrames[requestedFrame].percent;
        cinematicEndFrame = Math.min(importedFrames.length - 1, requestedFrame + 3);
        playbackIndex = Math.max(0, requestedFrame - 3);
        playback = !state.reducedMotion;
        cinematicStartedAt = state.reducedMotion ? 0 : performance.now();
        cinematicEvent = lockedEventType;
        triggerBranchWarp(1.15);
        triggerTopologyPulse(lockedEventType, eventCapsule?.role ?? (sharedEvent.get("role") as SectionLoop["role"]) ?? "outer");
      }
      referenceSection = {
        axis: importedFrames[0].axis,
        percent: importedFrames[0].percent,
        loops: importedFrames[0].loops.map(({ points }) => points.map(([x, y]) => [x, y] as [number, number])),
        area: importedFrames[0].area,
        perimeter: importedFrames[0].perimeter,
      };
      triggerBranchWarp(0.82);
      syncReferenceControl();
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
      applySectionMode();
      stage.querySelector<HTMLButtonElement>(`[data-artifact-view="${eventCapsule ? "oracle" : "tomogram"}"]`)?.click();
      wake();
    } catch (error) {
      console.warn("EasyKi time capsule import failed:", error);
    }
  };
  tomogramSplice?.addEventListener("click", () => {
    if (importedTimelines.length < 2) return;
    const parents = importedTimelines.slice(0, 2);
    const length = Math.max(...parents.map((timeline) => timeline.length));
    const crossoverFrame = Math.max(1, Math.min(length - 2, Math.round((crossoverPercent / 100) * length)));
    const crossoverEndFrame = Math.max(crossoverFrame + 1, Math.min(length - 1, Math.round((crossoverEndPercent / 100) * length)));
    const hybrid = buildRecombinedTimeline();
    recordedFrames = hybrid;
    importedTimeline = hybrid;
    collisionTimeline = [];
    collisionActive = false;
    delete stage.dataset.collision;
    antimatterTimeline = [];
    antimatterActive = false;
    delete stage.dataset.antimatter;
    annihilationTimeline = [];
    annihilationActive = false;
    delete stage.dataset.annihilation;
    recombinedTimeline = true;
    multiverseMode = false;
    stage.dataset.multiverse = "false";
    playback = false;
    playbackIndex = 0;
    state.sliceEnabled = true;
    state.sliceScanning = false;
    state.sliceAxis = hybrid[0].axis;
    state.slicePercent = hybrid[0].percent;
    const firstLoop = hybrid[0].loops[0];
    selectedLoopIndex = firstLoop ? 0 : -1;
    selectedLoopSignature = firstLoop ? { role: firstLoop.role, area: firstLoop.area } : null;
    referenceSection = {
      axis: hybrid[0].axis,
      percent: hybrid[0].percent,
      loops: hybrid[0].loops.map(({ points }) => points.map(([x, y]) => [x, y] as [number, number])),
      area: hybrid[0].area,
      perimeter: hybrid[0].perimeter,
    };
    const capsule = JSON.stringify({ version: 1, kind: "easyki-topology-recombined", parents: parents.length, crossoverPercent, crossoverEndPercent, crossoverFrame, crossoverEndFrame, frames: hybrid }, null, 2);
    const url = URL.createObjectURL(new Blob([capsule], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "easyki-topology-recombined.json";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    syncReferenceControl();
    syncSliceControls();
    syncAxisControls();
    syncRecordingControls();
    applySectionMode();
    stage.querySelector<HTMLButtonElement>('[data-artifact-view="oracle"]')?.click();
    triggerBranchWarp(1.25);
    wake();
  });
  tomogramImportInput?.addEventListener("change", async () => {
    const files = tomogramImportInput.files ? [...tomogramImportInput.files] : [];
    tomogramImportInput.value = "";
    if (files.length) await importTimeCapsules(files);
  });
  stage.addEventListener("dragover", (event) => {
    if (!event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    stage.dataset.importReady = "true";
  });
  stage.addEventListener("dragleave", (event) => {
    if (event.relatedTarget instanceof Node && stage.contains(event.relatedTarget)) return;
    delete stage.dataset.importReady;
  });
  stage.addEventListener("drop", async (event) => {
    if (!event.dataTransfer?.files.length) return;
    event.preventDefault();
    delete stage.dataset.importReady;
    const files = [...event.dataTransfer.files].filter((candidate) => candidate.name.endsWith(".json") || candidate.type === "application/json");
    if (files.length) await importTimeCapsules(files);
  });
  tomogramPin?.addEventListener("click", () => {
    if (referenceSection) {
      referenceSection = null;
    } else if (currentSectionLoops.length) {
      referenceSection = {
        axis: state.sliceAxis,
        percent: state.slicePercent,
        loops: currentSectionLoops.map((loop) => loop.map(([x, y]) => [x, y] as [number, number])),
        area: currentSectionArea,
        perimeter: currentSectionPerimeter,
      };
    }
    syncReferenceControl();
    wake();
  });
  tomogramMovie?.addEventListener("click", () => {
    const saveArtifact = (content: string, type: string, filename: string): void => {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const download = document.createElement("a");
      download.href = url;
      download.download = filename;
      document.body.append(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    if (focusedMeshIndex !== null) {
      const componentHistory = memoryGhostSnapshots
        .filter((snapshot) => snapshot.meshIndices.includes(focusedMeshIndex as number))
        .sort((left, right) => left.id - right.id);
      if (componentHistory.length && recordedFrames.length >= 2) {
        const componentFrames = componentHistory.map((snapshot) => ({
          snapshot,
          frame: recordedFrames.slice().sort((left, right) => Math.abs(left.percent - snapshot.percent) - Math.abs(right.percent - snapshot.percent))[0],
        }));
        const exportData = {
          version: 1,
          kind: "easyki-component-time-capsule",
          meshIndex: focusedMeshIndex,
          model: "Easykiconverter_展示模型.step",
          units: "millimeter",
          memories: componentFrames.map(({ snapshot, frame }) => ({
            id: snapshot.id,
            axis: snapshot.axis,
            percent: snapshot.percent,
            role: snapshot.role,
            mass: snapshot.mass,
            meshIndices: snapshot.meshIndices,
            frame,
          })),
        };
        saveArtifact(JSON.stringify(exportData, null, 2), "application/json;charset=utf-8", `easyki-mesh-${focusedMeshIndex}-timeline.json`);
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        componentFrames.forEach(({ frame }) => frame.loops.forEach(({ points }) => points.forEach(([x, y]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        })));
        const millimetersPerUnit = Math.max(modelSpanMm / 2, 1e-6);
        const width = Math.max((maxX - minX) * millimetersPerUnit, 1e-6);
        const height = Math.max((maxY - minY) * millimetersPerUnit, 1e-6);
        const duration = Math.max(3, componentFrames.length * 0.45);
        const frames = componentFrames.map(({ snapshot, frame }, index) => {
          const paths = frame.loops.map(({ points, role }) => {
            const [first, ...remaining] = points;
            const d = `M ${(first[0] - minX) * millimetersPerUnit} ${(maxY - first[1]) * millimetersPerUnit} ${remaining.map(([x, y]) => `L ${(x - minX) * millimetersPerUnit} ${(maxY - y) * millimetersPerUnit}`).join(" ")} Z`;
            return `<path data-role="${role}" d="${d}"/>`;
          }).join("");
          return `<g class="frame-${index}" data-memory="${snapshot.id}" data-axis="${snapshot.axis}" data-position="${snapshot.percent.toFixed(2)}%">${paths}</g>`;
        }).join("");
        const keyframes = componentFrames.map((_, index) => {
          const start = (index / componentFrames.length * 100).toFixed(4);
          const end = ((index + 1) / componentFrames.length * 100).toFixed(4);
          return `@keyframes component-frame-${index}{0%,${start}%{opacity:0}${start}%,${end}%{opacity:1}${end}%,100%{opacity:0}}`;
        }).join("");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm" role="img"><title>EasyKiConverter component timeline · mesh ${focusedMeshIndex}</title><desc>Recorded real STEP cross-sections associated with one mesh component.</desc><metadata>mesh_index=${focusedMeshIndex}; memories=${componentFrames.length}; duration_seconds=${duration}; units=millimeter; source=EasyKiConverter_展示模型.step</metadata><style>${componentFrames.map((_, index) => `.frame-${index}{opacity:0;animation:component-frame-${index} ${duration}s linear infinite}`).join("")}${keyframes}</style><g fill="#b9a8ff" fill-opacity="0.16" fill-rule="evenodd" stroke="#6254c8" stroke-width="${Math.max(width, height) * 0.002}" stroke-linejoin="round">${frames}</g></svg>`;
        saveArtifact(svg, "image/svg+xml;charset=utf-8", `easyki-mesh-${focusedMeshIndex}-timeline.svg`);
        return;
      }
    }
    if (recordedFrames.length < 2) return;
    const millimetersPerUnit = Math.max(modelSpanMm / 2, 1e-6);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    recordedFrames.forEach(({ loops }) => loops.forEach(({ points }) => points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    })));
    const width = Math.max((maxX - minX) * millimetersPerUnit, 1e-6);
    const height = Math.max((maxY - minY) * millimetersPerUnit, 1e-6);
    const duration = Math.max(3, recordedFrames.length * 0.06);
    const framePercent = (index: number): string => `${(index / recordedFrames.length * 100).toFixed(4)}%`;
    const keyframes = recordedFrames.map((_, index) => {
      const start = framePercent(index);
      const end = framePercent(index + 1);
      return `@keyframes frame-${index}{0%,${start}{opacity:0}${start},${end}{opacity:1}${end},100%{opacity:0}}`;
    }).join("");
    const frames = recordedFrames.map((frame, index) => {
      const paths = frame.loops.map(({ points, role }) => {
        const [first, ...remaining] = points;
        const d = `M ${(first[0] - minX) * millimetersPerUnit} ${(maxY - first[1]) * millimetersPerUnit} ${remaining.map(([x, y]) => `L ${(x - minX) * millimetersPerUnit} ${(maxY - y) * millimetersPerUnit}`).join(" ")} Z`;
        return `<path data-role="${role}" d="${d}"/>`;
      }).join("");
      const areaMm2 = frame.area * millimetersPerUnit ** 2;
      const perimeterMm = frame.perimeter * millimetersPerUnit;
      return `<g class="frame-${index}" data-frame="${index}" data-axis="${frame.axis}" data-position="${frame.percent.toFixed(2)}%" data-area-mm2="${areaMm2.toFixed(4)}" data-perimeter-mm="${perimeterMm.toFixed(4)}" data-loops="${frame.loops.length}">${paths}</g>`;
    }).join("");
    const english = document.documentElement.lang === "en";
    const axes = [...new Set(recordedFrames.map((frame) => frame.axis))].join(",");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm" role="img"><title>${english ? "EasyKiConverter section timeline" : "EasyKiConverter 截面时间轴"}</title><desc>${english ? "An animated, millimeter-scaled sequence of real STEP cross-sections." : "由真实 STEP 几何生成的毫米比例截面动画。"}</desc><metadata>axes=${axes}; frames=${recordedFrames.length}; duration_seconds=${duration}; units=millimeter; source=EasyKiConverter_展示模型.step</metadata><style>${recordedFrames.map((_, index) => `.frame-${index}{opacity:0;animation:frame-${index} ${duration}s linear infinite}`).join("")}${keyframes}</style><g fill="#b9a8ff" fill-opacity="0.16" fill-rule="evenodd" stroke="#6254c8" stroke-width="${Math.max(width, height) * 0.002}" stroke-linejoin="round">${frames}</g></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const download = document.createElement("a");
    download.href = url;
    download.download = `easyki-section-${state.sliceAxis}-timeline.svg`;
    document.body.append(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  tomogramEvents?.addEventListener("click", () => {
    if (recordedFrames.length < 2 || !selectedLoopSignature) return;
    const values = recordedFrames.map((frame) => frame.loops
      .filter((loop) => loop.role === selectedLoopSignature?.role)
      .sort((left, right) => Math.abs(left.area - selectedLoopSignature!.area) - Math.abs(right.area - selectedLoopSignature!.area))[0]);
    const millimetersPerUnit = Math.max(modelSpanMm / 2, 1e-6);
    const frames = values.map((loop, index) => ({
      index,
      axis: recordedFrames[index].axis,
      percent: recordedFrames[index].percent,
      areaMm2: loop ? loop.area * millimetersPerUnit ** 2 : null,
      event: classifyTopologyEvent(loop, values[index - 1]),
      role: loop?.role ?? selectedLoopSignature?.role,
    }));
    const eventCounts = frames.reduce<Record<string, number>>((counts, frame) => {
      counts[frame.event] = (counts[frame.event] ?? 0) + 1;
      return counts;
    }, {});
    const narrative = {
      version: 1,
      kind: "easyki-topology-event-narrative",
      model: "Easykiconverter_展示模型.step",
      units: "millimeter",
      selected: selectedLoopSignature,
      eventCounts,
      director: {
        mode: "event-arc",
        holdMs: 700,
        settleMs: 2200,
        eventOrder: frames.filter((frame) => frame.event !== "stable").map(({ index, event }) => ({ index, event })),
      },
      frames,
    };
    const save = (content: string, type: string, filename: string): void => {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    save(JSON.stringify(narrative, null, 2), "application/json;charset=utf-8", `easyki-topology-events-${selectedLoopSignature.role}.json`);
    const width = 720;
    const height = 180;
    const eventColors: Record<string, string> = { birth: "#8ffff2", vanish: "#ff8f9e", grow: "#ffe3a0", shrink: "#ffca68", stable: "#b9a8ff" };
    const bars = frames.map((frame, index) => {
      const x = 28 + (index / Math.max(1, frames.length - 1)) * (width - 56);
      const barHeight = frame.areaMm2 === null ? 10 : Math.max(10, Math.min(92, frame.areaMm2));
      return `<line x1="${x.toFixed(2)}" y1="${height - 34}" x2="${x.toFixed(2)}" y2="${(height - 34 - barHeight).toFixed(2)}" stroke="${eventColors[frame.event]}" stroke-width="3"/><circle cx="${x.toFixed(2)}" cy="${(height - 42 - barHeight).toFixed(2)}" r="${frame.event === "stable" ? 2 : 5}" fill="${eventColors[frame.event]}"/><text x="${x.toFixed(2)}" y="${height - 16}" text-anchor="middle">${frame.event === "stable" ? "·" : frame.event[0].toUpperCase()}</text>`;
    }).join("");
    const directorDuration = Math.max(4, frames.length * 0.08 + (narrative.director.eventOrder.length * 0.7));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img"><title>EasyKiConverter topology event narrative</title><desc>Animated topology birth, vanish, growth and shrink events across real STEP section frames.</desc><metadata>role=${selectedLoopSignature.role}; frames=${frames.length}; units=millimeter; duration_seconds=${directorDuration}; director=event-arc; events=${JSON.stringify(eventCounts)}</metadata><style>@keyframes director-playhead{0%{transform:translateX(0)}100%{transform:translateX(${width - 56}px)}}</style><rect width="100%" height="100%" rx="18" fill="#24232d"/><text x="28" y="28" fill="#8ffff2" font-family="monospace" font-size="12" font-weight="700">TOPOLOGY EVENT NARRATIVE · ${selectedLoopSignature.role.toUpperCase()}</text><line x1="28" y1="${height - 34}" x2="${width - 28}" y2="${height - 34}" stroke="#ffffff33"/>${bars}<g transform="translate(28 0)" style="animation:director-playhead ${directorDuration}s linear infinite"><line x1="0" y1="40" x2="0" y2="${height - 34}" stroke="#ffffff" stroke-width="1.5" opacity=".8"/></g></svg>`;
    save(svg, "image/svg+xml;charset=utf-8", `easyki-topology-events-${selectedLoopSignature.role}.svg`);
  });
  tomogramExport?.addEventListener("click", () => {
    if (!currentSectionLoops.length) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    currentSectionLoops.forEach((loop) => loop.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }));
    const millimetersPerUnit = Math.max(modelSpanMm / 2, 1e-6);
    const width = Math.max((maxX - minX) * millimetersPerUnit, 1e-6);
    const height = Math.max((maxY - minY) * millimetersPerUnit, 1e-6);
    const topology = currentSectionTopology.length
      ? currentSectionTopology
      : currentSectionLoops.map((points) => ({ points, signedArea: 0, area: 0, depth: 0, role: "outer" as const }));
    const paths = topology.map(({ points, role }) => {
      const [first, ...remaining] = points;
      const d = `M ${(first[0] - minX) * millimetersPerUnit} ${(maxY - first[1]) * millimetersPerUnit} ${remaining.map(([x, y]) => `L ${(x - minX) * millimetersPerUnit} ${(maxY - y) * millimetersPerUnit}`).join(" ")} Z`;
      return `<path data-role="${role}" d="${d}"/>`;
    }).join("");
    const areaMm2 = currentSectionArea * millimetersPerUnit ** 2;
    const perimeterMm = currentSectionPerimeter * millimetersPerUnit;
    const cutAxisIndex = ["x", "y", "z"].indexOf(state.sliceAxis);
    const cutPositionMm = modelCenterMm[cutAxisIndex] + (((state.slicePercent - 50) / 50) * state.modelRadius * millimetersPerUnit);
    const outerLoops = topology.filter(({ role }) => role === "outer").length;
    const holes = topology.filter(({ role }) => role === "hole").length;
    const islands = topology.filter(({ role }) => role === "island").length;
    const english = document.documentElement.lang === "en";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm" role="img"><title>${english ? "EasyKiConverter STEP section" : "EasyKiConverter STEP 截面轮廓"}</title><desc>${english ? "Closed contours from the current live section, exported at the STEP model's millimeter scale." : "当前实时剖切计算得到的闭合轮廓，按 STEP 模型毫米比例导出。"}</desc><metadata>axis=${state.sliceAxis}; position=${Math.round(state.slicePercent)}%; position_mm=${cutPositionMm}; area_mm2=${areaMm2}; perimeter_mm=${perimeterMm}; loops=${currentSectionLoops.length}; outer_loops=${outerLoops}; holes=${holes}; islands=${islands}; topology=even-odd; intersecting_meshes=${currentSectionMeshes}; units=millimeter; source=EasyKiConverter_展示模型.step</metadata><g fill="#b9a8ff" fill-opacity="0.12" fill-rule="evenodd" stroke="#6254c8" stroke-width="${Math.max(width, height) * 0.002}" stroke-linejoin="round">${paths}</g></svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = url;
    download.download = `easyki-section-${state.sliceAxis}-${Math.round(state.slicePercent)}.svg`;
    document.body.append(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const explodedMeshes: {
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    direction: THREE.Vector3;
    index: number;
    triangles: number;
  }[] = [];
  const forecastBranchGhosts: { branch: number; group: THREE.Group; materials: THREE.MeshBasicMaterial[] }[] = [];
  const narrativeTimeGhosts: { track: "past" | "present" | "future"; group: THREE.Group; materials: THREE.MeshBasicMaterial[] }[] = [];
  const forecastBranchBeams: { branch: number; line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> }[] = [];
  const forecastClaimFields: { branch: number; points: THREE.Points; material: THREE.PointsMaterial; phase: number }[] = [];
  let refreshForecastBranches = (): void => {};
  let drawAtlas = (): void => {};
  let drawOracle = (): void => {};
  let drawTrinity = (): void => {};
  let drawMorph = (): void => {};
  let drawAnnihilation = (): void => {};
  let refreshResonance = (): void => {};
  const resetFocusCopy = document.documentElement.lang === "en"
    ? "Click or focus + arrows to explore · Esc restores"
    : "点击或聚焦后用方向键探索 · Esc 恢复整体";
  let appliedExplode = -1;
  let focusedMesh: THREE.Mesh | null = null;
  let componentHistoryCursor = 0;
  let componentHistoryLastFrame = 0;
  let intersectedSectionMeshes: THREE.Mesh[] = [];
  let sectionLoopTargets: { x: number; y: number; loopIndex: number }[] = [];
  let selectedLoopSignature: LoopSignature | null = null;
  let selectedLoopIndex = -1;
  let selectedLoopTrail: { x: number; y: number }[] = [];
  let totalTriangles = 0;
  let scanDirection = 1;
  let lastScanFrame = 0;
  let scanTimer = 0;
  let recording = false;
  let playback = false;
  let playbackIndex = 0;
  let playbackLastStepAt = 0;
  let eventArcPlayback = false;
  let eventArcHoldUntil = 0;
  let multiverseMode = false;
  let recombinedTimeline = false;
  let reelRecorder: MediaRecorder | null = null;
  let reelStopTimer = 0;
  let playbackTimer = 0;
  let forecastEnabled = false;
  let forecastBranching = false;
  let forecastBranchIndex = 1;
  let forecastBranchManual = false;
  let forecastBranchScores = [0.5, 0.5, 0.5];
  let forecastCollisionEnergy = 0;
  const observerStorageKey = "easyki-observer-dna-v1";
  let observerBias = [0.34, 0.33, 0.33];
  let observerSignature = "AURA";
  let hasSavedBranches = false;
  const encodeObserverSignature = (): string => observerBias.map((value) => Math.round(value * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
  try {
    const savedObserver = JSON.parse(window.localStorage.getItem(observerStorageKey) ?? "null") as { bias?: unknown } | null;
    if (savedObserver && Array.isArray(savedObserver.bias) && savedObserver.bias.length === 3 && savedObserver.bias.every((value) => typeof value === "number")) {
      observerBias = savedObserver.bias.map((value) => Math.max(0.05, Math.min(0.9, value as number)));
    } else {
      const seed = new Uint32Array(3);
      crypto.getRandomValues(seed);
      observerBias = Array.from(seed, (value) => 0.18 + (value % 640) / 1000);
    }
  } catch { /* Observer identity can fall back to a stable local signature. */ }
  observerSignature = encodeObserverSignature();
  const persistObserverDNA = (): void => {
    try { window.localStorage.setItem(observerStorageKey, JSON.stringify({ bias: observerBias, signature: observerSignature })); } catch { /* Observer memory is optional. */ }
  };
  persistObserverDNA();
  try {
    const savedBranches = JSON.parse(window.localStorage.getItem("easyki-forecast-branches-v1") ?? "null") as { scores?: unknown } | null;
    if (savedBranches && Array.isArray(savedBranches.scores) && savedBranches.scores.length === 3 && savedBranches.scores.every((score) => typeof score === "number")) {
      hasSavedBranches = true;
      forecastBranchScores = savedBranches.scores.map((score) => Math.max(0.05, Math.min(0.98, score as number)));
      forecastBranchIndex = forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
    }
  } catch { /* Branch memory is optional. */ }
  if (!hasSavedBranches) {
    forecastBranchScores = forecastBranchScores.map((score, branch) => Math.max(0.05, Math.min(0.98, score + (observerBias[branch] - 0.333) * 0.5)));
    forecastBranchIndex = forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
  }
  const persistForecastBranches = (): void => {
    try { window.localStorage.setItem("easyki-forecast-branches-v1", JSON.stringify({ scores: forecastBranchScores })); } catch { /* Ignore unavailable storage. */ }
  };
  let forecastMemoryTexture = Array.from({ length: 12 }, () => 0.12);
  let forecastMemoryCycles = 0;
  let forecastMetabolicFlux = 0;
  let forecastErrorStreak = 0;
  let forecastBurstAt = 0;
  let forecastBurstCount = 0;
  try {
    const savedMemory = JSON.parse(window.localStorage.getItem("easyki-forecast-memory-v1") ?? "null") as { texture?: unknown; cycles?: unknown } | null;
    if (savedMemory && Array.isArray(savedMemory.texture) && savedMemory.texture.length === 12 && savedMemory.texture.every((value) => typeof value === "number")) {
      forecastMemoryTexture = savedMemory.texture.map((value) => Math.max(0, Math.min(1, value as number)));
    }
    if (savedMemory && typeof savedMemory.cycles === "number") forecastMemoryCycles = Math.max(0, Math.floor(savedMemory.cycles));
  } catch { /* Forecast memory can start blank. */ }
  const persistForecastMemory = (): void => {
    try { window.localStorage.setItem("easyki-forecast-memory-v1", JSON.stringify({ texture: forecastMemoryTexture, cycles: forecastMemoryCycles })); } catch { /* Memory is optional. */ }
  };
  const forecastTopologyBias = (): number => {
    if (!forecastOwnership.length) return 0;
    const observerStrength = state.reducedMotion ? 0 : Math.min(1, Math.hypot(state.pointerX, state.pointerY) * 2.4);
    const observerBranch = state.pointerX < -0.12 ? 0 : state.pointerX > 0.12 ? 2 : 1;
    const bias = forecastOwnership.reduce((sum, { index }) => {
      const memoryScar = forecastMemoryTexture[index % forecastMemoryTexture.length] ?? 0;
      const candidates = forecastBranchScores.map((score, branch) => score + (((index * 17 + branch * 13) % 11) / 100) + (branch - 1) * memoryScar * 0.06 + (branch === observerBranch ? observerStrength * 0.12 : 0));
      const owner = candidates.indexOf(Math.max(...candidates));
      return sum + (owner - 1) * (0.55 + (forecastBranchScores[owner] ?? 0.5) + observerStrength * 0.08);
    }, (observerBranch - 1) * observerStrength * 0.35);
    return Math.max(-1, Math.min(1, bias / forecastOwnership.length));
  };
  refreshForecastBranches = (): void => {
    narrativeTimeGhosts.splice(0).forEach(({ group: timeGroup, materials }) => {
      narrativeTimeGroup.remove(timeGroup);
      timeGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
      materials.forEach((material) => material.dispose());
    });
    forecastBranchGhosts.splice(0).forEach(({ group: branchGroup, materials }) => {
      forecastBranchGroup.remove(branchGroup);
      branchGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
      materials.forEach((material) => material.dispose());
    });
    forecastBranchBeams.splice(0).forEach(({ line }) => {
      forecastBranchGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    forecastLearningEdges.splice(0).forEach(({ line }) => {
      synapticMemoryGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    forecastClaimFields.splice(0).forEach(({ points, material }) => {
      forecastClaimGroup.remove(points);
      points.geometry.dispose();
      material.dispose();
    });
    forecastOwnership.splice(0).forEach(({ overlay, material }) => {
      forecastOwnershipGroup.remove(overlay);
      overlay.geometry.dispose();
      material.dispose();
    });
    forecastScars.splice(0).forEach(({ ring, material }) => {
      forecastScarGroup.remove(ring);
      ring.geometry.dispose();
      material.dispose();
    });
    forecastScarTrails.splice(0).forEach(({ line }) => {
      forecastScarGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    forecastScarBridges.splice(0).forEach(({ line }) => {
      forecastScarGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    forecastStormRings.splice(0).forEach(({ ring }) => {
      forecastStormGroup.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
    });
    if (!explodedMeshes.length) return;
    const timeTracks: { track: "past" | "present" | "future"; color: number }[] = [
      { track: "past", color: 0xb9a8ff },
      { track: "present", color: 0x8ffff2 },
      { track: "future", color: 0xffca68 },
    ];
    const sources = explodedMeshes.slice(0, 18);
    timeTracks.forEach(({ track, color }) => {
      const timeGroup = new THREE.Group();
      timeGroup.userData.narrativeTrack = track;
      const materials: THREE.MeshBasicMaterial[] = [];
      sources.forEach(({ mesh }) => {
        const material = new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const ghost = new THREE.Mesh(mesh.geometry.clone(), material);
        ghost.position.copy(mesh.position);
        ghost.quaternion.copy(mesh.quaternion);
        ghost.scale.copy(mesh.scale);
        ghost.frustumCulled = false;
        timeGroup.add(ghost);
        materials.push(material);
      });
      narrativeTimeGroup.add(timeGroup);
      narrativeTimeGhosts.push({ track, group: timeGroup, materials });
    });
    const palette = [0xff8f9e, 0x8ffff2, 0xffca68];
    palette.forEach((color, branch) => {
      const branchGroup = new THREE.Group();
      branchGroup.userData.forecastBranch = branch;
      const materials: THREE.MeshBasicMaterial[] = [];
      sources.forEach(({ mesh }) => {
        const material = new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const ghost = new THREE.Mesh(mesh.geometry.clone(), material);
        ghost.position.copy(mesh.position);
        ghost.quaternion.copy(mesh.quaternion);
        ghost.scale.copy(mesh.scale);
        ghost.frustumCulled = false;
        branchGroup.add(ghost);
        materials.push(material);
      });
      forecastBranchGroup.add(branchGroup);
      forecastBranchGhosts.push({ branch, group: branchGroup, materials });
      const beamGeometry = new THREE.BufferGeometry();
      beamGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(5 * 3), 3));
      const beam = new THREE.Line(beamGeometry, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));
      beam.frustumCulled = false;
      forecastBranchGroup.add(beam);
      forecastBranchBeams.push({ branch, line: beam });
      for (let index = branch; index + 3 < sources.length; index += 4) {
        const from = sources[index].mesh;
        const to = sources[(index + 3 + branch) % sources.length].mesh;
        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12 * 3), 3));
        const edgeLine = new THREE.Line(edgeGeometry, new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }));
        edgeLine.frustumCulled = false;
        synapticMemoryGroup.add(edgeLine);
        forecastLearningEdges.push({ branch, line: edgeLine, from, to });
      }
      const particleCount = 42;
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3));
      const particleMaterial = new THREE.PointsMaterial({
        color,
        size: 0.014,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const particleField = new THREE.Points(particleGeometry, particleMaterial);
      particleField.frustumCulled = false;
      forecastClaimGroup.add(particleField);
      forecastClaimFields.push({ branch, points: particleField, material: particleMaterial, phase: branch * 2.1 });
    });
    sources.forEach(({ mesh, index }) => {
      const material = new THREE.MeshBasicMaterial({
        color: 0x8ffff2,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const overlay = new THREE.Mesh(mesh.geometry.clone(), material);
      overlay.position.copy(mesh.position);
      overlay.quaternion.copy(mesh.quaternion);
      overlay.scale.copy(mesh.scale);
      overlay.frustumCulled = false;
      forecastOwnershipGroup.add(overlay);
      forecastOwnership.push({ index, source: mesh, overlay, material });
    });
    Array.from({ length: forecastMemoryTexture.length }, (_, slot) => slot).forEach((slot) => {
      const source = sources[slot % sources.length]?.mesh;
      if (!source) return;
      const material = new THREE.MeshBasicMaterial({
        color: 0xffca68,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.03, 24), material);
      ring.frustumCulled = false;
      forecastScarGroup.add(ring);
      forecastScars.push({ slot, source, ring, material });
      const target = sources[(slot * 5 + forecastBranchIndex * 3 + 3) % sources.length]?.mesh ?? source;
      const trailGeometry = new THREE.BufferGeometry();
      trailGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
      const trail = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({
        color: 0xffca68,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));
      trail.frustumCulled = false;
      forecastScarGroup.add(trail);
      forecastScarTrails.push({ slot, source, target, line: trail });
    });
    forecastScars.forEach((leftScar, slot) => {
      const rightScar = forecastScars[(slot + 1) % forecastScars.length];
      if (!rightScar) return;
      const bridgeGeometry = new THREE.BufferGeometry();
      bridgeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(11 * 3), 3));
      const bridge = new THREE.Line(bridgeGeometry, new THREE.LineBasicMaterial({
        color: 0xffca68,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));
      bridge.frustumCulled = false;
      forecastScarGroup.add(bridge);
      forecastScarBridges.push({ left: slot, right: (slot + 1) % forecastScars.length, from: leftScar.source, to: rightScar.source, line: bridge });
    });
    [0, 1, 2].forEach((index) => {
      const material = new THREE.MeshBasicMaterial({
        color: index === 1 ? 0xffca68 : 0x8ffff2,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12 + index * 0.045, 0.004 + index * 0.0015, 8, 64), material);
      ring.frustumCulled = false;
      forecastStormGroup.add(ring);
      forecastStormRings.push({ ring, phase: index * 1.7 });
    });
  };
  refreshResonance = (): void => {
    resonanceGhosts.splice(0).forEach(({ mesh, material }) => {
      resonanceGroup.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
    });
    if (!explodedMeshes.length) return;
    const sources = explodedMeshes.slice(0, 12);
    const palette = [0xd9a7ff, 0x8ffff2, 0xffca68, 0xff8f9e];
    sources.forEach(({ mesh: source }, sourceIndex) => {
      for (let layer = 0; layer < 4; layer += 1) {
        const material = new THREE.MeshBasicMaterial({
          color: palette[layer],
          wireframe: true,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const ghost = new THREE.Mesh(source.geometry.clone(), material);
        ghost.position.copy(source.position);
        ghost.quaternion.copy(source.quaternion);
        ghost.scale.copy(source.scale);
        ghost.frustumCulled = false;
        resonanceGroup.add(ghost);
        resonanceGhosts.push({ mesh: ghost, source, material, layer, phase: sourceIndex * 0.71 + layer * 1.57 });
      }
    });
  };
  let forecastConfidence = 0.5;
  let forecastBias = 0;
  try {
    const calibration = JSON.parse(window.localStorage.getItem("easyki-forecast-calibration-v1") ?? "null") as { confidence?: unknown; bias?: unknown } | null;
    if (calibration && typeof calibration.confidence === "number") forecastConfidence = Math.max(0.08, Math.min(0.98, calibration.confidence));
    if (calibration && typeof calibration.bias === "number") forecastBias = Math.max(-0.8, Math.min(0.8, calibration.bias));
  } catch { /* Forecast calibration is optional and can remain session-local. */ }
  const persistForecastCalibration = (): void => {
    try { window.localStorage.setItem("easyki-forecast-calibration-v1", JSON.stringify({ confidence: forecastConfidence, bias: forecastBias })); } catch { /* Ignore unavailable storage. */ }
  };
  let lastRecordedPercent = Number.NaN;
  let lastRecordedAxis: "x" | "y" | "z" | null = null;
  let recordedFrames: SectionFrame[] = [];
  let importedTimeline: SectionFrame[] = [];
  let importedTimelines: SectionFrame[][] = [];
  let crossoverPercent = 50;
  let crossoverEndPercent = 70;
  let oracleMutation = 0;
  let oracleDragging = false;
  let oracleBreakpoint: "start" | "end" | null = null;
  let morphDragging = false;
  let morphTension = 0.5;
  let morphGravityEnabled = true;
  let morphAttractor: { x: number; y: number } | null = null;
  let morphTimeline: SectionFrame[] = [];
  let morphForkActive = false;
  let collisionTimeline: SectionFrame[] = [];
  let collisionActive = false;
  let antimatterTimeline: SectionFrame[] = [];
  let antimatterActive = false;
  let annihilationTimeline: SectionFrame[] = [];
  let annihilationActive = false;
  let trinityFocusIndex = 0;
  let trinityEventMarkers: { bucket: number; x: number; trackIndex: number; event: string }[] = [];
  let lockedEventBucket: number | null = null;
  let lockedEventFrame: number | null = null;
  let lockedEventType = "stable";
  let geometryDivergence = 0;
  let cinematicEndFrame: number | null = null;
  let cinematicStartedAt = 0;
  let cinematicEvent = "stable";
  const buildRecombinedTimeline = (): SectionFrame[] => {
    if (importedTimelines.length < 2) return recordedFrames;
    const parents = importedTimelines.slice(0, 2);
    const length = Math.max(...parents.map((timeline) => timeline.length));
    const crossoverFrame = Math.max(1, Math.min(length - 2, Math.round((crossoverPercent / 100) * length)));
    const crossoverEndFrame = Math.max(crossoverFrame + 1, Math.min(length - 1, Math.round((crossoverEndPercent / 100) * length)));
    return Array.from({ length }, (_, index) => {
      const parent = index < crossoverFrame || index >= crossoverEndFrame ? parents[0] : parents[1];
      return parent[index % parent.length];
    });
  };
  const baseMorphFrames = (): SectionFrame[] => collisionActive && collisionTimeline.length
    ? collisionTimeline
    : importedTimelines.length >= 2 ? buildRecombinedTimeline() : recordedFrames;
  const buildCollisionTimeline = (): SectionFrame[] => {
    if (importedTimelines.length < 2) return recordedFrames;
    const parents = importedTimelines.slice(0, 2);
    const length = Math.max(...parents.map((timeline) => timeline.length));
    return Array.from({ length }, (_, index) => {
      const left = parents[0][index % parents[0].length];
      const right = parents[1][index % parents[1].length];
      const loops = [...left.loops, ...right.loops]
        .sort((a, b) => b.area - a.area)
        .slice(0, 24);
      return {
        axis: index % 2 ? right.axis : left.axis,
        percent: (left.percent + right.percent) / 2,
        area: left.area + right.area,
        perimeter: left.perimeter + right.perimeter,
        loops,
      };
    });
  };
  const buildAntimatterTimeline = (source: SectionFrame[]): SectionFrame[] => source.map((frame) => ({
    ...frame,
    loops: frame.loops.map((loop) => ({
      ...loop,
      points: [...loop.points].reverse() as [number, number][],
      signedArea: -loop.signedArea,
      role: loop.role === "outer" ? "hole" : loop.role === "hole" ? "outer" : "island",
    })),
  }));
  const buildAnnihilationTimeline = (): SectionFrame[] => baseMorphFrames();
  const buildMorphTimeline = (): SectionFrame[] => {
    const source = baseMorphFrames();
    if (source.length < 2 || !morphAttractor || !morphGravityEnabled || !morphCanvas) return source;
    const rect = morphCanvas.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, morphAttractor.x / Math.max(1, rect.width)));
    const anchor = progress * (source.length - 1);
    const gravity = Math.max(0.08, Math.min(0.82, morphTension * 0.7 + 0.12));
    const wave = Math.max(1, Math.round(source.length * gravity * 0.18));
    return source.map((_, index) => {
      const phase = Math.sin((index / Math.max(1, source.length - 1)) * Math.PI * 2 + progress * Math.PI * 2);
      const sourceIndex = Math.max(0, Math.min(source.length - 1, Math.round(index + phase * wave + (anchor - index) * gravity * 0.14)));
      return source[sourceIndex];
    });
  };
  const activeMorphFrames = (): SectionFrame[] => annihilationActive && annihilationTimeline.length
    ? annihilationTimeline
    : antimatterActive && antimatterTimeline.length
    ? antimatterTimeline
    : collisionActive && collisionTimeline.length
      ? collisionTimeline
      : morphForkActive && morphTimeline.length ? morphTimeline : baseMorphFrames();
  const sectionPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  const sectionNormal = new THREE.Vector3();
  const localSectionPlane = new THREE.Plane();
  const updateSectionPlane = (): void => {
    sectionNormal.set(
      state.sliceAxis === "x" ? 1 : 0,
      state.sliceAxis === "y" ? 1 : 0,
      state.sliceAxis === "z" ? 1 : 0,
    );
    const offset = ((state.slicePercent - 50) / 50) * state.modelRadius;
    localSectionPlane.set(sectionNormal, -offset);
    group.updateMatrixWorld(true);
    sectionPlane.copy(localSectionPlane).applyMatrix4(group.matrixWorld);
  };
  const applySectionMode = (): void => {
    const planes = state.sliceEnabled ? [sectionPlane] : [];
    const materials = new Set<THREE.MeshStandardMaterial>();
    explodedMeshes.forEach(({ material, mesh }) => {
      materials.add(material);
      const inspectionMaterial = mesh.userData.inspectionMaterial as
        | THREE.MeshStandardMaterial
        | undefined;
      if (inspectionMaterial) materials.add(inspectionMaterial);
    });
    materials.forEach((material) => {
      material.clippingPlanes = planes;
      material.clipShadows = state.sliceEnabled;
      material.needsUpdate = true;
    });
    updateSectionPlane();
  };
  const updateFocus = (next: THREE.Mesh | null): void => {
    focusedMesh = next;
    const part = explodedMeshes.find(({ mesh }) => mesh === next);
    explodedMeshes.forEach(({ mesh, material }) => {
      const previousInspectionMaterial = mesh.userData.inspectionMaterial as
        | THREE.MeshStandardMaterial
        | undefined;
      previousInspectionMaterial?.dispose();
      delete mesh.userData.inspectionMaterial;
      if (!next) {
        mesh.material = material;
        return;
      }

      const inspectionMaterial = material.clone();
      inspectionMaterial.clippingPlanes = state.sliceEnabled ? [sectionPlane] : [];
      mesh.userData.inspectionMaterial = inspectionMaterial;
      if (mesh === next) {
        inspectionMaterial.emissive.set(0x5545c7);
        inspectionMaterial.emissiveIntensity = 0.48;
        inspectionMaterial.roughness = 0.28;
      } else {
        inspectionMaterial.color.lerp(new THREE.Color(0xbcb5d2), 0.28);
        inspectionMaterial.transparent = true;
        inspectionMaterial.opacity = 0.24;
        inspectionMaterial.depthWrite = false;
      }
      mesh.material = inspectionMaterial;
    });
    const explodeStats = stage.querySelector<HTMLElement>("[data-model-explode-stats]");
    if (explodeStats) {
      if (part) {
        const label = document.documentElement.lang === "en" ? "Part" : "零件";
        const restore = document.documentElement.lang === "en" ? "arrows navigate · Esc restores" : "方向键浏览 · Esc 恢复整体";
        explodeStats.textContent = `${label} ${part.index + 1}/${explodedMeshes.length} · ${part.triangles.toLocaleString()} ${document.documentElement.lang === "en" ? "triangles" : "个三角面"} · ${restore}`;
      } else {
        explodeStats.textContent = `${explodedMeshes.length} ${document.documentElement.lang === "en" ? "meshes" : "个网格对象"} · ${totalTriangles.toLocaleString()} ${document.documentElement.lang === "en" ? "triangles" : "个三角面"} · ${resetFocusCopy}`;
      }
    }
    wake();
  };
  const recallMemoryForMesh = (mesh: THREE.Mesh | null): void => {
    focusedMemoryId = null;
    const partIndex = mesh ? explodedMeshes.find((part) => part.mesh === mesh)?.index : undefined;
    focusedMeshIndex = partIndex ?? null;
    componentHistoryCursor = 0;
    componentHistoryLastFrame = 0;
    const memory = partIndex === undefined
      ? undefined
      : memoryGhostSnapshots.slice().reverse().find((snapshot) => snapshot.meshIndices.includes(partIndex));
    if (memory) {
      focusedMemoryId = memory.id;
      state.sliceEnabled = true;
      state.sliceAxis = memory.axis;
      state.slicePercent = memory.percent;
      syncSliceControls();
      syncAxisControls();
      applySectionMode();
      branchWarpStartedAt = performance.now();
      branchWarpIntensity = 0.78;
    }
    syncLineageControl();
    wake();
  };
  const applyExplode = (): void => {
    if (appliedExplode === state.explode) return;
    explodedMeshes.forEach(({ mesh, direction }) => {
      mesh.position.copy(direction).multiplyScalar(state.modelRadius * 0.44 * state.explode);
    });
    appliedExplode = state.explode;
  };

  const fitCamera = (): void => {
    const aspect = state.width / state.height;
    const halfHeight = (cameraFitRadius * 1.16) / Math.min(1, aspect);
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
    if (state.reducedMotion && !reducedMotionRenderPending) return;
    if (state.visible && !document.hidden && !state.frame && (!state.reducedMotion || !rendering))
      state.frame = requestAnimationFrame(render);
  };

  const syncArtifactView = (button: HTMLButtonElement, requestFrame = true): void => {
    const view = button.dataset.artifactView;
    if (!view) return;
    stage.dataset.artifactView = view;
    artifactButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
    Object.entries(artifactCanvases).forEach(([canvasView, viewCanvas]) => {
      if (!viewCanvas) return;
      const active = canvasView === view;
      viewCanvas.inert = !active;
      if (active) viewCanvas.removeAttribute("aria-hidden");
      else viewCanvas.setAttribute("aria-hidden", "true");
    });
    const english = document.documentElement.lang === "en";
    const label = english ? button.dataset.labelEn : button.dataset.labelZh;
    const caption = english ? button.dataset.captionEn : button.dataset.captionZh;
    if (label && artifactLabel) artifactLabel.textContent = label;
    if (caption && artifactCaption) artifactCaption.textContent = caption;
    if (requestFrame) wake();
  };
  artifactButtons.forEach((button) => button.addEventListener("click", () => syncArtifactView(button)));
  const initialArtifactButton = artifactButtons.find((button) => button.dataset.artifactView === stage.dataset.artifactView) ?? artifactButtons[0];
  if (initialArtifactButton) syncArtifactView(initialArtifactButton, false);
  stage.dataset.artifactControlsReady = "true";

  const setScanButtonState = (scanning: boolean): void => {
    const scanButton = stage.querySelector<HTMLButtonElement>("[data-model-scan]");
    if (!scanButton) return;
    scanButton.setAttribute("aria-pressed", String(scanning));
    const english = document.documentElement.lang === "en";
    scanButton.textContent = english
      ? scanning ? "Pause scan" : "CT Scan"
      : scanning ? "暂停扫描" : "CT 扫描";
    scanButton.setAttribute(
      "aria-label",
      english
        ? scanning ? "Pause the CT scan" : "Play a CT scan through the STEP model"
        : scanning ? "暂停 CT 扫描" : "播放穿过 STEP 模型的 CT 扫描",
    );
  };
  const syncRecordingControls = (): void => {
    const recordButton = stage.querySelector<HTMLButtonElement>("[data-tomogram-record]");
    const playButton = stage.querySelector<HTMLButtonElement>("[data-tomogram-play]");
    const status = stage.querySelector<HTMLElement>("[data-tomogram-record-status]");
    const english = document.documentElement.lang === "en";
    if (recordButton) {
      recordButton.textContent = recording ? english ? "STOP ■" : "停止 ■" : english ? "REC ●" : "录制 ●";
      recordButton.setAttribute("aria-pressed", String(recording));
      recordButton.setAttribute("aria-label", recording
        ? english ? "Stop recording section frames" : "停止录制截面帧"
        : english ? "Record section frames while scanning" : "扫描时录制截面帧");
    }
    if (playButton) {
      playButton.disabled = recordedFrames.length < 2 || recording;
      playButton.setAttribute("aria-pressed", String(playback));
      playButton.textContent = playback ? english ? "PAUSE ‖" : "暂停 ‖" : english ? "PLAY ▶" : "播放 ▶";
      playButton.setAttribute("aria-label", playback
        ? english ? "Pause section frame playback" : "暂停截面帧播放"
        : english ? `Play ${recordedFrames.length} recorded section frames` : `播放 ${recordedFrames.length} 个已录制截面帧`);
    }
    if (tomogramMovie) {
      tomogramMovie.disabled = recordedFrames.length < 2 || recording;
      tomogramMovie.setAttribute("aria-label", english
        ? `Export ${recordedFrames.length} section frames as an animated SVG`
        : `将 ${recordedFrames.length} 个截面帧导出为 SVG 动画`);
    }
    if (tomogramForecast) {
      tomogramForecast.disabled = recordedFrames.length < 3 || recording;
      tomogramForecast.setAttribute("aria-pressed", String(forecastEnabled));
      tomogramForecast.textContent = forecastEnabled ? `FUTURE ◌ ${Math.round(forecastConfidence * 100)}%` : "FUTURE ◌";
      tomogramForecast.setAttribute("aria-label", english
        ? forecastEnabled ? "Hide the projected next section" : "Project the next section from recent real STEP frames"
        : forecastEnabled ? "隐藏预测的下一个截面" : "根据最近真实 STEP 帧预测下一个截面");
    }
    if (tomogramBranches) {
      tomogramBranches.disabled = recordedFrames.length < 3 || recording;
      tomogramBranches.setAttribute("aria-pressed", String(forecastBranching));
      const winner = forecastBranchScores.indexOf(Math.max(...forecastBranchScores)) + 1;
      tomogramBranches.textContent = forecastBranching ? `BRANCH ∞ ${forecastBranchIndex + 1}/3 · W${winner}` : `BRANCH ∞ · W${winner}`;
      tomogramBranches.setAttribute("aria-label", english
        ? `Cycle future section branch ${forecastBranchIndex + 1} of 3`
        : `循环未来截面分支 ${forecastBranchIndex + 1}/3`);
    }
    if (tomogramEvents) {
      tomogramEvents.disabled = recordedFrames.length < 2 || !selectedLoopSignature || recording;
      tomogramEvents.setAttribute("aria-label", english
        ? "Export the selected topology lineage as a diagnostic narrative"
        : "将选中的拓扑谱系导出为诊断叙事");
    }
    if (tomogramHop) {
      tomogramHop.disabled = recordedFrames.length < 2 || !selectedLoopSignature || recording;
    }
    if (tomogramArc) {
      tomogramArc.disabled = recordedFrames.length < 2 || !selectedLoopSignature || recording;
      tomogramArc.setAttribute("aria-pressed", String(eventArcPlayback));
    }
    if (tomogramReel) {
      tomogramReel.disabled = recordedFrames.length < 2 || !selectedLoopSignature || typeof MediaRecorder === "undefined";
      tomogramReel.setAttribute("aria-pressed", String(Boolean(reelRecorder)));
      tomogramReel.textContent = reelRecorder
        ? document.documentElement.lang === "en" ? "STOP ■" : "停止 ■"
        : "REEL ●";
    }
    if (tomogramMultiverse) {
      tomogramMultiverse.disabled = importedTimelines.length < 2 || recording;
      tomogramMultiverse.setAttribute("aria-pressed", String(multiverseMode));
      tomogramMultiverse.textContent = multiverseMode ? "MIX ∞ ON" : "MIX ∞";
      tomogramMultiverse.setAttribute("aria-label", english
        ? multiverseMode ? "Stop the topology multiverse interference field" : "Blend imported topology histories as a multiverse interference field"
        : multiverseMode ? "停止拓扑多宇宙干涉场" : "将导入的拓扑历史混合为多宇宙干涉场");
    }
    if (tomogramSplice) {
      tomogramSplice.disabled = importedTimelines.length < 2 || recording;
      tomogramSplice.setAttribute("aria-pressed", String(recombinedTimeline));
      tomogramSplice.textContent = recombinedTimeline ? `SPLICE 🧬 ${crossoverPercent}—${crossoverEndPercent}%` : "SPLICE 🧬";
      tomogramSplice.setAttribute("aria-label", english
        ? recombinedTimeline ? "Recombined topology timeline is active" : "Recombine two imported topology histories into a hybrid timeline"
        : recombinedTimeline ? "拓扑重组时间线已启用" : "将两条导入的拓扑历史重组为混合时间线");
    }
    if (morphCollisionButton) {
      morphCollisionButton.disabled = importedTimelines.length < 2 || recording;
      morphCollisionButton.setAttribute("aria-pressed", String(collisionActive));
      morphCollisionButton.textContent = collisionActive ? english ? "COLLISION ☄ ON" : "碰撞 ☄ 已启用" : english ? "COLLIDE ☄" : "碰撞 ☄";
    }
    if (morphAntimatterButton) {
      morphAntimatterButton.disabled = recordedFrames.length < 2 || recording;
      morphAntimatterButton.setAttribute("aria-pressed", String(antimatterActive));
      morphAntimatterButton.textContent = antimatterActive ? english ? "ANTIMATTER ◇ ON" : "反物质 ◇ 已启用" : english ? "ANTIMATTER ◇" : "反物质 ◇";
    }
    if (morphAnnihilateButton) {
      morphAnnihilateButton.disabled = recordedFrames.length < 2 || recording;
      morphAnnihilateButton.setAttribute("aria-pressed", String(annihilationActive));
      morphAnnihilateButton.textContent = annihilationActive ? english ? "ANNIHILATION ◌ ON" : "湮灭 ◌ 已启用" : english ? "ANNIHILATE ◌" : "湮灭 ◌";
    }
    if (morphResonanceButton) {
      morphResonanceButton.disabled = recording;
      morphResonanceButton.setAttribute("aria-pressed", String(resonanceActive));
      morphResonanceButton.textContent = resonanceActive ? english ? "RESONANCE ◇ ON" : "共振 ◇ 已启用" : english ? "RESONATE ◇" : "共振 ◇";
    }
    if (morphMutateButton) morphMutateButton.disabled = recording;
    if (morphCrossbreedButton) morphCrossbreedButton.disabled = recording;
    if (morphEvolveButton) morphEvolveButton.disabled = recording;
    if (morphArchiveButton) morphArchiveButton.disabled = recording;
    if (morphGenomeShareButton) morphGenomeShareButton.disabled = recording || swarmArchive.length === 0;
    if (morphGenomePassportButton) morphGenomePassportButton.disabled = recording || swarmArchive.length === 0;
    if (genomeDuelButton) genomeDuelButton.disabled = recording || swarmArchive.length < 2;
    if (genomeDuelSpawnButton) genomeDuelSpawnButton.disabled = recording || !genomeDuelActive || swarmArchive.length < 2;
    stage.dataset.importedTimelines = String(importedTimelines.length >= 2);
    if (crossoverRange) {
      crossoverRange.disabled = importedTimelines.length < 2 || recording;
      crossoverRange.value = String(crossoverPercent);
    }
    if (crossoverValue) crossoverValue.value = `${crossoverPercent}%`;
    if (crossoverEndRange) {
      crossoverEndRange.disabled = importedTimelines.length < 2 || recording;
      crossoverEndRange.value = String(crossoverEndPercent);
    }
    if (crossoverEndValue) crossoverEndValue.value = `${crossoverEndPercent}%`;
    if (tomogramAudio) {
      tomogramAudio.disabled = typeof AudioContext === "undefined" || recordedFrames.length < 2 || !selectedLoopSignature || recording;
      tomogramAudio.setAttribute("aria-pressed", String(audioEnabled));
      tomogramAudio.textContent = audioEnabled ? "SOUND ♫ ON" : "SOUND ♫";
      tomogramAudio.setAttribute("aria-label", english
        ? audioEnabled ? "Mute topology event sonification" : "Sonify topology events"
        : audioEnabled ? "关闭拓扑事件声音" : "将拓扑事件转化为声音");
    }
    if (tomogramCinema) {
      tomogramCinema.disabled = lockedEventFrame === null || recordedFrames.length < 2 || recording;
      tomogramCinema.setAttribute("aria-pressed", String(Boolean(playback && cinematicEndFrame !== null)));
      tomogramCinema.textContent = playback && cinematicEndFrame !== null ? "CINEMA ◉ ON" : "CINEMA ◉";
      tomogramCinema.setAttribute("aria-label", english
        ? lockedEventFrame === null ? "Lock an event to create an event replay capsule" : "Replay the locked topology event across all views"
        : lockedEventFrame === null ? "先锁定事件以创建事件回放胶囊" : "在所有视图中回放锁定的拓扑事件");
    }
    if (tomogramShare) {
      tomogramShare.disabled = recordedFrames.length < 2 || !selectedLoopSignature || recording;
    }
    stage.dataset.hasFrames = String(recordedFrames.length > 1);
    if (frameScrubber) {
      frameScrubber.max = String(Math.max(0, recordedFrames.length - 1));
      frameScrubber.value = String(Math.min(playbackIndex, Math.max(0, recordedFrames.length - 1)));
      frameScrubber.disabled = recordedFrames.length < 2;
    }
    if (frameScrubberValue) {
      const currentFrame = recordedFrames[Math.min(playbackIndex, Math.max(0, recordedFrames.length - 1))];
      frameScrubberValue.value = recordedFrames.length > 1 && currentFrame
        ? `${Math.min(playbackIndex + 1, recordedFrames.length)}/${recordedFrames.length} · ${currentFrame.axis.toUpperCase()}`
        : "—";
      frameScrubberValue.dataset.axis = currentFrame?.axis ?? "";
    }
    if (status) status.textContent = recordedFrames.length
      ? english ? `${recordedFrames.length} FRAMES` : `${recordedFrames.length} 帧`
      : english ? "NO FRAMES" : "暂无帧";
    syncLineageControl();
  };
  syncRecordingControls();

  const render = (): void => {
    state.frame = 0;
    if (!state.visible || document.hidden) return;
    if (state.reducedMotion) reducedMotionRenderPending = false;
    rendering = true;
    if (state.sliceScanning) {
      const now = performance.now();
      const elapsed = lastScanFrame ? Math.min(now - lastScanFrame, 100) : 0;
      lastScanFrame = now;
      state.slicePercent += scanDirection * elapsed * 0.025;
      if (state.slicePercent >= 100 || state.slicePercent <= 0) {
        state.slicePercent = Math.max(0, Math.min(100, state.slicePercent));
        scanDirection *= -1;
      }
      syncSliceControls();
    }
    const playbackFrames = importedTimelines.length >= 2 ? buildRecombinedTimeline() : recordedFrames;
    if (playback && playbackFrames.length) {
      const frameIndex = Math.min(playbackIndex, playbackFrames.length - 1);
      const frame = playbackFrames[frameIndex];
      state.sliceScanning = false;
      state.sliceAxis = frame.axis;
      state.slicePercent = frame.percent;
      if (cinematicEndFrame !== null && frameIndex >= cinematicEndFrame) {
        playback = false;
        cinematicEndFrame = null;
        cinematicStartedAt = 0;
        delete stage.dataset.swarmReplay;
        triggerTopologyPulse("stable", "outer");
      } else if (eventArcPlayback && selectedLoopSignature) {
        const values = playbackFrames.map((candidate) => candidate.loops
          .filter((loop) => loop.role === selectedLoopSignature?.role)
          .sort((left, right) => Math.abs(left.area - selectedLoopSignature!.area) - Math.abs(right.area - selectedLoopSignature!.area))[0]);
        const event = classifyTopologyEvent(values[frameIndex], values[frameIndex - 1]);
        const currentTime = performance.now();
        if (event !== "stable" && eventArcHoldUntil === 0) {
          eventArcHoldUntil = currentTime + 700;
          cinematicEvent = event;
          cinematicStartedAt = currentTime;
          triggerTopologyPulse(event, selectedLoopSignature.role);
          syncEventUrl(frameIndex);
        }
        if (eventArcHoldUntil > currentTime) {
          playbackIndex = frameIndex;
        } else {
          eventArcHoldUntil = 0;
          const nextEvent = Array.from({ length: playbackFrames.length }, (_, offset) => (frameIndex + offset + 1) % playbackFrames.length)
            .find((index) => classifyTopologyEvent(values[index], values[index - 1]) !== "stable");
          if (nextEvent === undefined || nextEvent === 0) {
            eventArcPlayback = false;
            playback = false;
          } else {
            playbackIndex = nextEvent;
          }
        }
      } else {
        const now = performance.now();
        const replayCadence = stage.dataset.swarmReplay ? 120 : 0;
        if (!replayCadence || now - playbackLastStepAt >= replayCadence) {
          playbackLastStepAt = now;
          playbackIndex = (playbackIndex + 1) % playbackFrames.length;
        }
      }
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
    }
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
    const narrativePast = Math.max(0, 1 - progress / 0.38);
    const narrativeFuture = Math.max(0, (progress - 0.52) / 0.48);
    const narrativePresent = Math.max(0, 1 - Math.abs(progress - 0.5) / 0.28);
    stage.dataset.timeState = narrativePast > 0.18 ? "past" : narrativeFuture > 0.18 ? "future" : "present";
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
    const branchWarpProgress = branchWarpStartedAt
      ? Math.min(1, (performance.now() - branchWarpStartedAt) / 780)
      : 1;
    const branchWarp = branchWarpStartedAt
      ? Math.sin(branchWarpProgress * Math.PI) * branchWarpIntensity
      : 0;
    if (temporalGhostStartedAt) {
      const ghostProgress = Math.min(1, (performance.now() - temporalGhostStartedAt) / 900);
      temporalGhostGroup.position.x = Math.sin(ghostProgress * Math.PI) * branchWarp * 0.16;
      temporalGhostGroup.position.y = Math.cos(ghostProgress * Math.PI) * branchWarp * 0.06;
      temporalGhostGroup.rotation.y = branchWarp * 0.1;
      temporalGhostMaterials.forEach((material) => { material.opacity = (1 - ghostProgress) * 0.2; });
      if (ghostProgress >= 1) {
        clearTemporalGhosts();
        temporalGhostStartedAt = 0;
        temporalGhostGroup.position.set(0, 0, 0);
        temporalGhostGroup.rotation.set(0, 0, 0);
      }
    }
    const now = performance.now();
    const resonanceTarget = resonanceActive ? 1 : 0;
    resonanceEnergy += (resonanceTarget - resonanceEnergy) * 0.12;
    peerResonanceEnergy *= 0.965;
    mutationPulse *= 0.94;
    const collectiveResonanceEnergy = Math.min(1, resonanceEnergy + peerResonanceEnergy * 0.68);
    if (causalEntangled && resonanceActive && now - lastResonanceBroadcastAt > 160) {
      broadcastResonance(resonanceEnergy, state.pointerX * 0.9 + state.pointerY * 0.4, swarmGene);
      lastResonanceBroadcastAt = now;
    }
    const collectiveGene = (swarmGene + peerSwarmGene * 0.62 + mutationPulse * 0.08) % 1;
    const resonanceSignal = Math.min(1, currentSectionTopology.length / 5) * 0.35 + Math.min(1, Math.tanh(currentSectionArea * 0.5)) * 0.65;
    const resonanceWave = 0.5 + 0.5 * Math.sin(now * 0.0032 + resonanceSignal * Math.PI);
    const collectivePhase = peerResonancePhase + resonanceSignal * Math.PI;
    resonanceGroup.rotation.y = Math.sin(now * 0.00042 + collectivePhase) * collectiveResonanceEnergy * 0.12;
    resonanceGroup.rotation.x = Math.cos(now * 0.00031 + collectivePhase * 0.7) * collectiveResonanceEnergy * 0.045;
    resonanceGhosts.forEach(({ mesh, source, material, layer, phase }) => {
      const layerProgress = layer / 3;
      const phaseWave = 0.5 + 0.5 * Math.sin(now * (0.0024 + layer * 0.00035) + phase + state.slicePercent * 0.035);
      const geneWave = Math.sin(phase * 2.3 + collectiveGene * Math.PI * 8 + now * 0.0009);
      const radius = state.modelRadius * (0.045 + layerProgress * 0.12 + resonanceSignal * 0.055 + geneWave * mutationPulse * 0.025) * (0.72 + phaseWave * 0.38) * collectiveResonanceEnergy;
      mesh.position.copy(source.position);
      mesh.position.x += Math.cos(phase + now * 0.0007 + peerResonancePhase) * radius;
      mesh.position.y += Math.sin(phase + now * 0.0007 + peerResonancePhase) * radius * 0.52;
      mesh.position.z += Math.sin(phase * 1.7 + now * 0.00055 + peerResonancePhase) * radius * 0.72;
      mesh.rotation.copy(source.rotation);
      mesh.rotation.y += phaseWave * 0.24 + layerProgress * 0.18;
      mesh.rotation.z += Math.sin(phase + now * 0.001) * 0.08;
      mesh.scale.copy(source.scale).multiplyScalar(1 + collectiveResonanceEnergy * (0.035 + layerProgress * 0.04) + phaseWave * 0.018);
      material.opacity = collectiveResonanceEnergy * (0.035 + layerProgress * 0.035 + resonanceWave * 0.055);
      material.color.setHSL((collectiveGene + layerProgress * 0.11 + peerResonancePhase * 0.015) % 1, 0.72, 0.7);
    });
    resonanceGroup.visible = collectiveResonanceEnergy > 0.008;
    if (resonanceActive || collectiveResonanceEnergy > 0.008) wake();
    const lineageGlow = Math.min(1, lineagePulse + collectiveResonanceEnergy * 0.42);
    genomeLineageNodes.forEach(({ mesh, halo, gene, fitness, phase }, index) => {
      const heartbeat = 0.5 + 0.5 * Math.sin(now * 0.0032 + phase + collectiveGene * Math.PI * 2);
      const recalled = stage.dataset.swarmRecall === String(genomeLineageNodes[index].archiveIndex + 1);
      const pulse = 1 + heartbeat * lineageGlow * (0.12 + Math.min(0.12, Math.max(0, fitness) * 0.025));
      mesh.scale.setScalar(pulse * (recalled ? 1.45 : 1));
      halo.scale.setScalar(1 + heartbeat * lineageGlow * (recalled ? 0.72 : 0.45));
      halo.rotation.z = now * 0.0008 * (index % 2 === 0 ? 1 : -1);
      mesh.material.opacity = Math.min(1, 0.44 + heartbeat * 0.34 + lineageGlow * 0.18 + (recalled ? 0.2 : 0));
      halo.material.opacity = Math.min(0.84, 0.12 + heartbeat * 0.18 + lineageGlow * 0.22 + (recalled ? 0.28 : 0));
      mesh.material.color.setHSL(recalled ? 0.14 : (gene * 0.72 + 0.52 + collectiveGene * 0.035) % 1, 0.76, recalled ? 0.82 : 0.68 + heartbeat * 0.08);
      halo.material.color.copy(mesh.material.color);
    });
    genomeLineageEdges.forEach((line, index) => {
      line.material.opacity = Math.min(0.46, 0.12 + lineageGlow * (0.12 + (index % 3) * 0.035));
    });
    if (genomeDuelActive) {
      if (arenaReplayActive && !arenaReplayManual) {
        arenaReplayProgress = Math.min(1, (now - arenaReplayStartedAt) / 2600);
        syncArenaReplayTime();
        if (arenaMixActive && arenaReplayProgress >= 1 && now - arenaReplayStartedAt > 2850 && arenaHistory.length) {
          arenaMixIndex = (arenaMixIndex + 1) % arenaHistory.length;
          replayArenaRound(arenaHistory[arenaMixIndex]);
          syncArenaMixControl();
        }
      }
      const bridgeFrom = arenaMixFromGenes;
      const bridgeProgress = bridgeFrom && arenaMixBridgeStartedAt
        ? Math.min(1, (now - arenaMixBridgeStartedAt) / 880)
        : 1;
      if (bridgeFrom && bridgeProgress >= 1) {
        arenaMixFromGenes = null;
        delete stage.dataset.genomeArenaBridge;
      } else if (bridgeFrom) {
        stage.dataset.genomeArenaBridge = String(Math.round(bridgeProgress * 100));
      }
      const duelArrival = arenaReplayActive ? arenaReplayProgress : Math.min(1, (now - genomeDuelStartedAt) / 720);
      const duelEase = duelArrival * duelArrival * (3 - 2 * duelArrival);
      const duelBeat = state.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now * 0.0048);
      const duelFirst = genomeDuelNodes[0];
      const duelSecond = genomeDuelNodes[1];
      const geometryBias = Math.min(0.12, Math.tanh(Math.max(0, currentSectionPerimeter) * 0.03) * 0.12);
      const replayTarget = arenaReplayTargetScore[0] / 100;
      const rawFirstScore = arenaReplayActive
        ? 0.5 + (replayTarget - 0.5) * duelEase
        : 0.5 + (duelFirst.fitness - duelSecond.fitness) * 0.18 + (duelFirst.gene - duelSecond.gene) * 0.12 + geometryBias * Math.sin(now * 0.0017 + currentSectionArea);
      const firstScore = Math.max(0.08, Math.min(0.92, rawFirstScore));
      const secondScore = 1 - firstScore;
      const winner = firstScore >= secondScore ? duelFirst : duelSecond;
      const scoreLabel = `${Math.round(duelFirst.gene * 1000)} ${Math.round(firstScore * 100)} ↔ ${Math.round(duelSecond.gene * 1000)} ${Math.round(secondScore * 100)}`;
      if (scoreLabel !== lastDuelScoreLabel) {
        lastDuelScoreLabel = scoreLabel;
        if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "DUEL ⚡" : "决斗 ⚡"} ${scoreLabel}`;
        stage.dataset.genomeDuelScore = `${Math.round(firstScore * 100)}:${Math.round(secondScore * 100)}`;
        stage.dataset.genomeDuelWinner = String(winner.archiveIndex + 1);
        if (stage.dataset.genomeSeasonChallenge === "true" && seasonBracket.length) {
          const challengeScore = `${Math.round(firstScore * 100)}:${Math.round(secondScore * 100)}`;
          if (challengeScore !== lastSeasonChallengeScore) {
            lastSeasonChallengeScore = challengeScore;
            const currentMatch = seasonBracket[seasonBracket.length - 1];
            currentMatch.score = [Math.round(firstScore * 100), Math.round(secondScore * 100)];
            currentMatch.winner = firstScore >= secondScore ? 0 : 1;
            syncSeasonBracket();
          }
        }
        broadcastGenomeDuel();
      }
      genomeDuelGroup.rotation.y = state.reducedMotion ? 0 : Math.sin(now * 0.0007) * 0.16;
      genomeDuelGroup.rotation.z = state.reducedMotion ? 0 : Math.cos(now * 0.0009) * 0.045;
      genomeDuelNodes.forEach(({ ring, gene, side, archiveIndex }, index) => {
        const score = archiveIndex === duelFirst.archiveIndex ? firstScore : secondScore;
        const visualGene = bridgeFrom
          ? bridgeFrom[index] + (gene - bridgeFrom[index]) * bridgeProgress
          : gene;
        ring.position.x = side * (0.58 - duelEase * 0.24);
        ring.position.y = (visualGene - 0.5) * 0.62 + (state.reducedMotion ? 0 : Math.sin(now * 0.002 + side * 1.8) * 0.018);
        ring.scale.setScalar((0.72 + duelEase * 0.28) * (1 + duelBeat * 0.24 + score * 0.18));
        ring.rotation.z = now * 0.0012 * side;
        ring.material.color.setHex(archiveIndex === winner.archiveIndex ? 0xffe3a0 : 0xff8f9e);
        ring.material.opacity = (0.28 + duelEase * 0.2) + duelBeat * 0.42 + score * 0.14;
      });
      if (genomeDuelBeam) {
        const positions = genomeDuelBeam.geometry.getAttribute("position") as THREE.BufferAttribute;
        positions.setXYZ(0, genomeDuelNodes[0].ring.position.x, genomeDuelNodes[0].ring.position.y, genomeDuelNodes[0].ring.position.z);
        positions.setXYZ(1, genomeDuelNodes[1].ring.position.x, genomeDuelNodes[1].ring.position.y, genomeDuelNodes[1].ring.position.z);
        positions.needsUpdate = true;
        genomeDuelBeam.material.color.setHex(winner.archiveIndex === duelFirst.archiveIndex ? 0xffe3a0 : 0x8ffff2);
        genomeDuelBeam.material.opacity = 0.22 + duelBeat * 0.7;
      }
      if (genomeDuelParticles) {
        genomeDuelParticles.rotation.y = state.reducedMotion ? 0 : now * 0.0009;
        genomeDuelParticles.rotation.z = state.reducedMotion ? 0 : Math.sin(now * 0.0011) * 0.1;
        genomeDuelParticles.material.opacity = 0.24 + duelBeat * 0.7;
      }
      if (!state.reducedMotion) wake();
    }
    if (seasonCrownActive) {
      const crownAge = Math.min(1, (now - seasonCrownStartedAt) / 900);
      const crownEase = crownAge * crownAge * (3 - 2 * crownAge);
      seasonCrownGroup.position.y = (seasonCrownGene - 0.5) * 0.62 + (state.reducedMotion ? 0 : Math.sin(now * 0.0012) * 0.018);
      seasonCrownGroup.rotation.y = state.reducedMotion ? 0 : now * 0.0008;
      seasonCrownGroup.rotation.z = state.reducedMotion ? 0 : Math.sin(now * 0.0011) * 0.08;
      seasonCrownGroup.scale.setScalar(0.7 + crownEase * 0.3 + (state.reducedMotion ? 0 : Math.sin(now * 0.004) * 0.04));
      seasonCrownGroup.children.forEach((child, index) => {
        const material = child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
        if (material.material) {
          material.material.opacity = 0.24 + crownEase * 0.7 + (index % 2) * 0.08;
          material.material.color.setHex(index === 0 ? 0xffe3a0 : index === 2 ? 0x8ffff2 : 0xffca68);
        }
      });
      if (!state.reducedMotion) wake();
    }
    if (seasonBracketGroup.visible) {
      const bracketBeat = state.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now * 0.0024);
      seasonBracketGroup.rotation.y = state.reducedMotion ? 0 : Math.sin(now * 0.0007) * 0.12;
      seasonBracketGroup.rotation.z = state.reducedMotion ? 0 : Math.cos(now * 0.0009) * 0.03;
      seasonBracketGroup.children.forEach((child, index) => {
        const material = (child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial | THREE.LineBasicMaterial>).material;
        material.opacity = Math.min(0.95, (index % 3 === 0 ? 0.22 : 0.5) + bracketBeat * 0.2);
      });
      if (!state.reducedMotion) wake();
    }
    if (spectatorPeerActive) {
      const peerAge = Math.min(1, (now - spectatorPeerStartedAt) / 760);
      const peerBeat = state.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(now * 0.0036 + peerAge * Math.PI);
      spectatorGroup.rotation.y = state.reducedMotion ? 0 : Math.sin(now * 0.0006) * 0.12;
      spectatorGroup.rotation.z = state.reducedMotion ? 0 : Math.cos(now * 0.0008) * 0.04;
      spectatorRings.forEach((ring, index) => {
        ring.position.x = (index === 0 ? -1 : 1) * (0.42 - peerAge * 0.18);
        ring.position.y = (spectatorPeerGenes[index] - 0.5) * 0.5 + (state.reducedMotion ? 0 : Math.sin(now * 0.0018 + index) * 0.014);
        ring.scale.setScalar(0.78 + peerAge * 0.22 + peerBeat * 0.16);
        ring.rotation.z = now * 0.0009 * (index === 0 ? 1 : -1);
        ring.material.opacity = 0.28 + peerBeat * 0.42 + (index === spectatorPeerWinner ? 0.2 : 0);
      });
      if (spectatorBeam && spectatorRings.length === 2) {
        const positions = spectatorBeam.geometry.getAttribute("position") as THREE.BufferAttribute;
        positions.setXYZ(0, spectatorRings[0].position.x, spectatorRings[0].position.y, spectatorRings[0].position.z);
        positions.setXYZ(1, spectatorRings[1].position.x, spectatorRings[1].position.y, spectatorRings[1].position.z);
        positions.needsUpdate = true;
        spectatorBeam.material.opacity = 0.16 + peerBeat * 0.46;
      }
      if (!state.reducedMotion) wake();
    }
    lineagePulse *= 0.94;
    if (lineageGlow > 0.008) wake();
    if (focusedMeshIndex !== null && partMemorySpeed !== 0) {
      const componentHistory = memoryGhostSnapshots.filter((snapshot) => snapshot.meshIndices.includes(focusedMeshIndex as number));
      if (componentHistory.length) {
        if (!componentHistoryLastFrame) componentHistoryLastFrame = now;
        componentHistoryCursor = (componentHistoryCursor + ((now - componentHistoryLastFrame) / 2200) * partMemorySpeed + componentHistory.length) % componentHistory.length;
        const historicalMemory = componentHistory[Math.floor(componentHistoryCursor)];
        if (historicalMemory && (state.sliceAxis !== historicalMemory.axis || Math.abs(state.slicePercent - historicalMemory.percent) > 0.5)) {
          state.sliceAxis = historicalMemory.axis;
          state.slicePercent = historicalMemory.percent;
          syncSliceControls();
          syncAxisControls();
          applySectionMode();
        }
        componentHistoryLastFrame = now;
      }
    }
    memoryGhostSnapshots.slice().forEach((snapshot) => {
      const age = now - snapshot.bornAt;
      const componentTimeScale = focusedMeshIndex !== null && snapshot.meshIndices.includes(focusedMeshIndex)
        ? partMemorySpeed
        : 1;
      const orbit = snapshot.phase + now * 0.00016 * memoryOrbitSpeed * componentTimeScale;
      const ecologyForce = ecologyBursts.reduce((force, burst) => {
        if (burst.anchorId === snapshot.id) return force;
        const source = memoryGhostSnapshots.find((candidate) => candidate.id === burst.anchorId);
        if (!source) return force;
        const dx = source.group.position.x - snapshot.group.position.x;
        const dy = source.group.position.y - snapshot.group.position.y;
        const distance = Math.max(0.04, Math.hypot(dx, dy));
        const pulse = Math.max(0, 1 - (now - burst.bornAt) / 1250);
        const polarity = burst.role === "hole" ? -1 : burst.role === "island" ? 1.25 : 0.55;
        return force + Math.sin(Math.atan2(dy, dx) - orbit) * pulse * polarity * 0.035 / distance;
      }, 0);
      const ecologyOrbit = orbit + Math.max(-0.42, Math.min(0.42, ecologyForce));
      const focused = focusedMemoryId === snapshot.id;
      const componentMode = focusedMeshIndex !== null;
      const componentRelevant = !componentMode || snapshot.meshIndices.includes(focusedMeshIndex as number);
      const orbitDistance = focused ? 0.28 : 1;
      const roleOrbitScale = snapshot.role === "hole" ? 0.84 : snapshot.role === "island" ? 1.16 : 1;
      const orbitRadius = snapshot.radius * memoryOrbitRadius * orbitDistance * roleOrbitScale;
      snapshot.group.position.x = Math.cos(ecologyOrbit) * orbitRadius;
      snapshot.group.position.y = Math.sin(ecologyOrbit) * orbitRadius * 0.42;
      snapshot.group.position.z = Math.sin(ecologyOrbit * 0.7) * 0.045 + (snapshot.role === "hole" ? 0.018 : snapshot.role === "island" ? -0.018 : 0);
      snapshot.group.rotation.y = ecologyOrbit * 0.18;
      snapshot.group.rotation.z = Math.sin(ecologyOrbit) * 0.05;
      snapshot.group.scale.setScalar((focused ? 1.35 : 1) * (componentRelevant ? 1 : 0.72));
      const trailPositions = snapshot.trail.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let point = 0; point < trailPositions.count; point += 1) {
        const trailOrbit = ecologyOrbit - point * 0.14;
        trailPositions.setXYZ(point,
          Math.cos(trailOrbit) * orbitRadius,
          Math.sin(trailOrbit) * orbitRadius * 0.42,
          Math.sin(trailOrbit * 0.7) * 0.045,
        );
      }
      trailPositions.needsUpdate = true;
      snapshot.trail.material.opacity = (focused ? 0.5 : snapshot.pinned ? 0.2 : 0.09) * (componentRelevant ? 1 : 0.12);
      if (!snapshot.pinned && age >= 12000) {
        const index = memoryGhostSnapshots.indexOf(snapshot);
        if (index >= 0) memoryGhostSnapshots.splice(index, 1);
        disposeMemorySnapshot(snapshot);
        return;
      }
      const opacity = (focused ? 0.3 : snapshot.pinned ? 0.16 : 0.075 * (1 - age / 12000)) * (componentRelevant ? 1 : 0.12);
      snapshot.materials.forEach((material) => { material.opacity = opacity; });
    });
    const constellationPositions = memoryConstellationGeometry.getAttribute("position") as THREE.BufferAttribute;
    const constellationColors = memoryConstellationGeometry.getAttribute("color") as THREE.BufferAttribute;
    const axisColor = (axis: "x" | "y" | "z"): THREE.Color => new THREE.Color(axis === "x" ? 0xffd58a : axis === "y" ? 0x9fe0cb : 0xb9a8ff);
    let constellationPair = 0;
    for (let firstIndex = 0; firstIndex < memoryGhostSnapshots.length && constellationPair < 6; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < memoryGhostSnapshots.length && constellationPair < 6; secondIndex += 1) {
        const first = memoryGhostSnapshots[firstIndex];
        const second = memoryGhostSnapshots[secondIndex];
        const roleAffinity = first.role === second.role ? 1 : first.role === "outer" || second.role === "outer" ? 0.42 : 0.68;
        const similarity = Math.min(first.mass, second.mass) / Math.max(first.mass, second.mass) * roleAffinity;
        if (similarity < 0.28) continue;
        constellationPositions.setXYZ(constellationPair * 2, first.group.position.x, first.group.position.y, first.group.position.z);
        constellationPositions.setXYZ(constellationPair * 2 + 1, second.group.position.x, second.group.position.y, second.group.position.z);
        const firstColor = axisColor(first.axis);
        const secondColor = axisColor(second.axis);
        const brightness = 0.24 + similarity * 0.76;
        constellationColors.setXYZ(constellationPair * 2, firstColor.r * brightness, firstColor.g * brightness, firstColor.b * brightness);
        constellationColors.setXYZ(constellationPair * 2 + 1, secondColor.r * brightness, secondColor.g * brightness, secondColor.b * brightness);
        constellationPair += 1;
      }
    }
    constellationPositions.needsUpdate = true;
    constellationColors.needsUpdate = true;
    memoryConstellationGeometry.setDrawRange(0, constellationPair * 2);
    memoryConstellationMaterial.opacity = constellationPair ? 0.24 : 0;
    annihilationGhosts.slice().forEach((ghost) => {
      const elapsed = (now - ghost.bornAt) / 1000;
      if (elapsed >= 2.8) {
        annihilationGhostGroup.remove(ghost.points);
        ghost.points.geometry.dispose();
        ghost.material.dispose();
        annihilationGhosts.splice(annihilationGhosts.indexOf(ghost), 1);
        return;
      }
      const positions = ghost.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      const resurrection = Math.max(0, Math.min(1, (elapsed - 1.08) / 1.62));
      const easeResurrection = resurrection * resurrection * (3 - 2 * resurrection);
      ghost.velocities.forEach((velocity, index) => {
        const damping = Math.max(0.18, 1 - elapsed * 0.24);
        let x = positions.getX(index) + velocity.x * 0.016 * damping;
        let y = positions.getY(index) + velocity.y * 0.016 * damping + Math.sin(now * 0.004 + index) * 0.0009;
        let z = positions.getZ(index) + velocity.z * 0.016 * damping;
        if (easeResurrection > 0 && ghost.targetMeshes.length) {
          const target = ghost.targetMeshes[index % ghost.targetMeshes.length].getWorldPosition(new THREE.Vector3());
          const attraction = 0.045 + easeResurrection * 0.12;
          x += (target.x - x) * attraction;
          y += (target.y - y) * attraction;
          z += (target.z - z) * attraction;
        }
        positions.setXYZ(index, x, y, z);
      });
      positions.needsUpdate = true;
      ghost.points.rotation.z += 0.0024;
      ghost.points.rotation.y += 0.0018;
      ghost.assembly.forEach(({ mesh, origin, target, role }) => {
        if (easeResurrection <= 0) return;
        mesh.position.lerpVectors(origin, target, easeResurrection);
        mesh.rotation.z = Math.sin(now * 0.0015 + mesh.id) * 0.08 * (1 - easeResurrection);
        mesh.rotation.y += (role === "hole" ? -0.002 : role === "island" ? 0.003 : 0.001) * easeResurrection;
        mesh.scale.setScalar(1 + Math.sin(easeResurrection * Math.PI) * 0.035);
      });
      ghost.material.opacity = resurrection > 0
        ? Math.max(0, 0.92 * (1 - easeResurrection) * 0.84)
        : Math.max(0, 0.92 * (1 - elapsed / 2.8));
      ghost.material.size = resurrection > 0
        ? 0.018 - easeResurrection * 0.009
        : 0.018 + Math.sin(now * 0.005) * 0.004;
      ghost.materialStates.forEach(({ material }) => {
        material.emissive.setHex(0xffe3a0);
        material.emissiveIntensity = 0.15 + easeResurrection * 1.2;
        material.color.lerp(new THREE.Color(0xfff0c2), easeResurrection * 0.035);
      });
      if (resurrection >= 1) {
        ghost.materialStates.forEach(({ material, color, emissive, intensity }) => {
          material.color.setHex(color);
          material.emissive.setHex(emissive);
          material.emissiveIntensity = intensity;
        });
      }
    });
    if (annihilationGhosts.length) wake();
    if (organismStartedAt && stage.dataset.organism === "true" && stage.dataset.artifactView === "model") {
      const organismProgress = Math.max(0, Math.min(1, (now - organismStartedAt - 2150) / 900));
      const organismEase = organismProgress * organismProgress * (3 - 2 * organismProgress);
      organismParts.forEach(({ mesh, base, role, phase }) => {
        const roleScale = role === "hole" ? 0.72 : role === "island" ? 1.16 : 1;
        const breathRate = role === "hole" ? 0.0036 : role === "island" ? 0.0022 : 0.0028;
        const breath = Math.sin(now * breathRate + phase) * (0.012 + organismEase * 0.02);
        const orbit = Math.sin(now * 0.0011 + phase) * organismEase * (role === "hole" ? 0.022 : role === "island" ? 0.035 : 0.014);
        mesh.position.copy(base).multiplyScalar(roleScale + breath);
        mesh.position.x += Math.cos(phase + now * 0.0007) * orbit;
        mesh.position.z += Math.sin(phase + now * 0.0007) * orbit;
        mesh.rotation.x += (role === "hole" ? -0.0018 : role === "island" ? 0.0026 : 0.001) * organismEase;
        mesh.rotation.y += (role === "hole" ? 0.0024 : role === "island" ? -0.0014 : 0.0012) * organismEase;
        mesh.scale.setScalar(1 + Math.abs(breath) * 1.6);
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material.isMeshStandardMaterial) {
          material.emissive.setHex(role === "hole" ? 0x9fe0cb : role === "island" ? 0xffca68 : 0xb9a8ff);
          material.emissiveIntensity = organismEase * (role === "hole" ? 0.25 : 0.18);
        }
      });
      wake();
    }
    if (organismStartedAt && stage.dataset.organism === "true" && stage.dataset.artifactView === "model") {
      const organismProgress = Math.max(0, Math.min(1, (now - organismStartedAt - 2150) / 900));
      if (!state.reducedMotion && organismProgress > 0.82 && now - lastNeuralSignalAt > 620) {
        spawnNeuralSignal();
        lastNeuralSignalAt = now;
      }
    }
    synapticEdges.slice().forEach((edge) => {
      const from = edge.from.getWorldPosition(new THREE.Vector3());
      const to = edge.to.getWorldPosition(new THREE.Vector3());
      const positions = edge.line.geometry.getAttribute("position") as THREE.BufferAttribute;
      const delta = new THREE.Vector3().subVectors(to, from);
      const normal = new THREE.Vector3(-delta.y, delta.x, delta.z * 0.35).normalize();
      const phase = now * 0.0024 + edge.from.id * 0.17;
      for (let point = 0; point < positions.count; point += 1) {
        const progress = point / Math.max(1, positions.count - 1);
        const memoryArc = Math.sin(progress * Math.PI) * (0.018 + edge.weight * 0.075);
        const position = from.clone().lerp(to, progress).addScaledVector(normal, memoryArc * Math.sin(phase));
        positions.setXYZ(point, position.x, position.y, position.z);
      }
      positions.needsUpdate = true;
      const pulse = Math.max(0, 1 - (now - edge.lastFired) / 1000);
      edge.line.material.opacity = 0.045 + edge.weight * 0.18 + pulse * 0.24;
      edge.line.material.color.setHex(edge.color);
      if (pulse > 0 || !state.reducedMotion) wake();
    });
    forecastLearningEdges.forEach(({ branch, line, from, to }) => {
      const active = forecastBranching && forecastEnabled && recordedFrames.length >= 3 && stage.dataset.artifactView === "model" && !state.reducedMotion;
      const score = forecastBranchScores[branch] ?? 0.5;
      const selected = branch === forecastBranchIndex;
      const winner = branch === forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
      const fromPoint = from.getWorldPosition(new THREE.Vector3());
      const toPoint = to.getWorldPosition(new THREE.Vector3());
      const branchOffset = (branch - 1) * 0.12;
      const positions = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let point = 0; point < positions.count; point += 1) {
        const progress = point / Math.max(1, positions.count - 1);
        const arc = Math.sin(progress * Math.PI) * (0.016 + score * 0.038);
        positions.setXYZ(
          point,
          THREE.MathUtils.lerp(fromPoint.x, toPoint.x, progress) + branchOffset * progress,
          THREE.MathUtils.lerp(fromPoint.y, toPoint.y, progress) + arc,
          THREE.MathUtils.lerp(fromPoint.z, toPoint.z, progress) + branchOffset * (1 - progress) * 0.16,
        );
      }
      positions.needsUpdate = true;
      line.material.opacity = active
        ? Math.min(0.3, 0.025 + score * 0.16 + (selected ? 0.08 : winner ? 0.035 : 0))
        : 0;
      line.material.color.setHex(selected ? 0x8ffff2 : branch === 0 ? 0xff8f9e : 0xffca68);
      if (active) wake();
    });
    forecastClaimFields.forEach(({ branch, points, material, phase }) => {
      const active = forecastBranching && forecastEnabled && recordedFrames.length >= 3 && stage.dataset.artifactView === "model" && !state.reducedMotion;
      const score = forecastBranchScores[branch] ?? 0.5;
      const selected = branch === forecastBranchIndex;
      const winner = branch === forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
      const branchOffset = (branch - 1) * 0.12;
      const positions = points.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let particle = 0; particle < positions.count; particle += 1) {
        const source = explodedMeshes[(particle * 7 + branch * 3) % Math.max(1, explodedMeshes.length)]?.mesh;
        const target = source?.position ?? new THREE.Vector3();
        const phaseOffset = phase + particle * 0.73;
        const orbit = 0.012 + score * 0.026 + (selected ? 0.008 : 0);
        const cycle = now * (0.0012 + score * 0.0012) + phaseOffset;
        const claim = 0.5 + Math.sin(cycle * 0.84) * 0.5;
        const theta = cycle * 1.7 + particle * 0.41;
        const pull = claim * claim;
        positions.setXYZ(
          particle,
          target.x * pull + branchOffset * (1 - pull) + Math.cos(theta) * orbit,
          target.y * pull + Math.sin(theta * 1.13) * orbit * 0.72,
          target.z * pull + branchOffset * (1 - pull) * 0.18 + Math.sin(theta) * orbit * 0.62,
        );
      }
      positions.needsUpdate = true;
      material.opacity = active
        ? Math.min(0.82, 0.12 + score * 0.42 + (selected ? 0.18 : winner ? 0.08 : 0))
        : 0;
      material.size = selected ? 0.019 : 0.014;
      material.color.setHex(selected ? 0x8ffff2 : branch === 0 ? 0xff8f9e : 0xffca68);
      if (active) wake();
    });
    const observerStrength = state.reducedMotion ? 0 : Math.min(1, Math.hypot(state.pointerX, state.pointerY) * 2.4);
    const observerBranch = state.pointerX < -0.12 ? 0 : state.pointerX > 0.12 ? 2 : 1;
    forecastOwnership.forEach(({ index, source, overlay, material }) => {
      const active = forecastBranching && forecastEnabled && recordedFrames.length >= 3 && stage.dataset.artifactView === "model" && !state.reducedMotion;
      const memoryScar = forecastMemoryTexture[index % forecastMemoryTexture.length] ?? 0;
      const branchScores = forecastBranchScores.map((score, branch) => score + (((index * 17 + branch * 13) % 11) / 100) + (branch - 1) * memoryScar * 0.06 + (branch === observerBranch ? observerStrength * 0.12 : 0));
      const owner = branchScores.indexOf(Math.max(...branchScores));
      const ownerScore = forecastBranchScores[owner] ?? 0.5;
      const selected = owner === forecastBranchIndex;
      overlay.position.copy(source.position);
      overlay.quaternion.copy(source.quaternion);
      const shimmer = active ? 1 + Math.sin(now * 0.003 + index * 0.41) * 0.012 : 1;
      overlay.scale.copy(source.scale).multiplyScalar(shimmer + (selected ? 0.012 : 0));
      material.opacity = active
        ? Math.min(0.42, 0.025 + ownerScore * 0.22 + (selected ? 0.09 : 0))
        : 0;
      material.color.setHex(owner === 0 ? 0xff8f9e : owner === 1 ? 0x8ffff2 : 0xffca68);
      if (active) wake();
    });
    forecastScars.forEach(({ slot, source, ring, material }) => {
      const active = forecastEnabled && forecastMemoryCycles > 0 && stage.dataset.artifactView === "model" && !state.reducedMotion;
      const scar = forecastMemoryTexture[slot] ?? 0;
      const burst = Math.max(0, 1 - (now - forecastBurstAt) / 1800);
      ring.position.copy(source.position);
      ring.quaternion.copy(source.quaternion);
      ring.rotation.z += now * 0.0007 * (slot % 2 === 0 ? 1 : -1);
      const pulse = active ? 1 + Math.sin(now * 0.0024 + slot) * 0.08 : 1;
      ring.scale.setScalar((0.42 + scar * 2.8 + burst * 0.9 + narrativeFuture * 0.22) * pulse);
      const timeReveal = 0.72 + narrativePresent * 0.08 + narrativeFuture * 0.32;
      material.opacity = active ? Math.min(0.9, (scar * 0.92 + 0.04 + burst * 0.22) * timeReveal) : 0;
      material.color.setHex(scar > 0.58 ? 0xff8f9e : scar > 0.28 ? 0xffca68 : 0x9fe0cb);
      if (active) wake();
    });
    const observerLocalPoint = new THREE.Vector3(state.pointerX * 1.7, -state.pointerY * 1.3, 0.12);
    const observerWorldPoint = group.localToWorld(observerLocalPoint);
    const stormSlot = forecastMemoryTexture.indexOf(Math.max(...forecastMemoryTexture));
    const stormSource = forecastScars[stormSlot]?.source;
    const stormPoint = stormSource?.getWorldPosition(new THREE.Vector3()) ?? observerWorldPoint.clone();
    if (observerStrength > 0) stormPoint.lerp(observerWorldPoint, observerStrength * 0.34);
    const stormEnergy = Math.min(1, Math.max(forecastMemoryTexture[stormSlot] ?? 0, forecastMetabolicFlux) + observerStrength * 0.12);
    forecastScarTrails.forEach(({ slot, source, target, line }) => {
      const active = forecastEnabled && forecastMemoryCycles > 0 && stage.dataset.artifactView === "model" && !state.reducedMotion;
      const scar = forecastMemoryTexture[slot] ?? 0;
      const sourcePoint = source.getWorldPosition(new THREE.Vector3());
      const targetPoint = target.getWorldPosition(new THREE.Vector3());
      const positions = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      const phase = now * 0.0022 + slot * 0.84;
      const delta = new THREE.Vector3().subVectors(targetPoint, sourcePoint);
      const normal = new THREE.Vector3(-delta.y, delta.x, delta.z * 0.45).normalize();
      for (let point = 0; point < positions.count; point += 1) {
        const progress = point / Math.max(1, positions.count - 1);
        const migration = 0.5 + Math.sin(phase - progress * Math.PI * 2.6) * 0.5;
        const arc = Math.sin(progress * Math.PI) * (0.018 + scar * 0.08) * migration;
        const position = sourcePoint.clone().lerp(targetPoint, progress).addScaledVector(normal, arc);
        if (stormPoint) position.lerp(stormPoint, Math.sin(progress * Math.PI) * stormEnergy * 0.18);
        positions.setXYZ(point, position.x, position.y, position.z);
      }
      positions.needsUpdate = true;
      line.material.opacity = active ? Math.min(0.46, scar * 0.62 + 0.025) : 0;
      line.material.color.setHex(scar > 0.58 ? 0xff8f9e : scar > 0.28 ? 0xffca68 : 0x9fe0cb);
      if (active) wake();
    });
    forecastScarBridges.forEach(({ left, right, from, to, line }) => {
      const active = forecastEnabled && forecastMemoryCycles > 0 && stage.dataset.artifactView === "model" && !state.reducedMotion;
      const leftEnergy = forecastMemoryTexture[left] ?? 0;
      const rightEnergy = forecastMemoryTexture[right] ?? 0;
      const fusion = Math.min(leftEnergy, rightEnergy);
      const split = Math.abs(leftEnergy - rightEnergy);
      const burst = Math.max(0, 1 - (now - forecastBurstAt) / 1800);
      const fromPoint = from.getWorldPosition(new THREE.Vector3());
      const toPoint = to.getWorldPosition(new THREE.Vector3());
      const positions = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      const delta = new THREE.Vector3().subVectors(toPoint, fromPoint);
      const normal = new THREE.Vector3(-delta.y, delta.x, delta.z * 0.35).normalize();
      const phase = performance.now() * 0.0018 + left * 0.7;
      for (let point = 0; point < positions.count; point += 1) {
        const progress = point / Math.max(1, positions.count - 1);
        const wave = Math.sin(phase + progress * Math.PI * 2.4) * (0.012 + fusion * 0.07);
        const position = fromPoint.clone().lerp(toPoint, progress).addScaledVector(normal, wave);
        positions.setXYZ(point, position.x, position.y, position.z);
      }
      positions.needsUpdate = true;
      line.material.opacity = active ? Math.min(0.78, fusion * 0.78 + split * 0.08 + burst * 0.18) : 0;
      line.material.color.setHex(split > 0.32 ? 0xff8f9e : fusion > 0.4 ? 0xffca68 : 0x9fe0cb);
      if (active && line.material.opacity > 0.01) wake();
    });
    forecastStormRings.forEach(({ ring, phase }, index) => {
      const active = forecastEnabled && forecastMemoryCycles > 0 && stage.dataset.artifactView === "model" && !state.reducedMotion;
      if (stormPoint) ring.position.copy(stormPoint);
      const burst = Math.max(0, 1 - (now - forecastBurstAt) / 1800);
      const orbit = now * (0.0008 + stormEnergy * 0.0014) * (1 + narrativeFuture * 1.8 - narrativePast * 0.25) * (index % 2 === 0 ? 1 : -1) + phase;
      ring.rotation.set(orbit * 0.7 + index * 0.4, orbit * 0.45, orbit);
      ring.scale.setScalar(0.72 + stormEnergy * 1.4 + burst * 0.8 + narrativeFuture * 0.35);
      ring.material.opacity = active ? Math.min(0.72, (0.06 + stormEnergy * 0.42 + burst * 0.18) * (0.72 + narrativeFuture * 0.4)) : 0;
      ring.material.color.setHex(burst > 0.2 ? 0xff8f9e : index === 1 ? 0xffca68 : 0x8ffff2);
      if (active && ring.material.opacity > 0.01) wake();
    });
    if (stage.dataset.neuralMemory === "active" && now - neuralDecisionAt > 620) syncNeuralMemory();
    neuralSignals.slice().forEach((signal) => {
      const elapsed = (now - signal.bornAt) / 1000;
      if (elapsed >= 1.35) {
        neuralSignalGroup.remove(signal.line);
        signal.line.geometry.dispose();
        signal.line.material.dispose();
        neuralSignals.splice(neuralSignals.indexOf(signal), 1);
        return;
      }
      const from = signal.from.getWorldPosition(new THREE.Vector3());
      const to = signal.to.getWorldPosition(new THREE.Vector3());
      const positions = signal.line.geometry.getAttribute("position") as THREE.BufferAttribute;
      const delta = new THREE.Vector3().subVectors(to, from);
      const perpendicular = new THREE.Vector3(-delta.y, delta.x, delta.z * 0.4).normalize().multiplyScalar(0.035 * Math.sin(elapsed * 4.2));
      for (let point = 0; point < positions.count; point += 1) {
        const progress = point / Math.max(1, positions.count - 1);
        const arc = Math.sin(progress * Math.PI) * (0.022 + elapsed * 0.012);
        const position = from.clone().lerp(to, progress).addScaledVector(perpendicular, arc / 0.035);
        positions.setXYZ(point, position.x, position.y, position.z);
      }
      positions.needsUpdate = true;
      const pulse = 0.5 + Math.sin(elapsed * 9.5) * 0.35;
      signal.line.material.opacity = Math.max(0, (1 - elapsed / 1.35) * pulse);
      signal.line.material.linewidth = 1 + pulse;
      if (elapsed < 1.35) wake();
    });
    ecologyBursts.slice().forEach((burst) => {
      const anchor = memoryGhostSnapshots.find((snapshot) => snapshot.id === burst.anchorId);
      const elapsed = Math.min(1, (now - burst.bornAt) / 1250);
      const reverse = Boolean(anchor && focusedMeshIndex !== null && anchor.meshIndices.includes(focusedMeshIndex) && partMemorySpeed < 0);
      const progress = reverse ? 1 - elapsed : elapsed;
      if (!anchor || elapsed >= 1) {
        ecologyBurstGroup.remove(burst.points);
        burst.points.geometry.dispose();
        burst.material.dispose();
        ecologyBursts.splice(ecologyBursts.indexOf(burst), 1);
        return;
      }
      burst.points.position.copy(anchor.group.position);
      burst.points.rotation.z = progress * (anchor.role === "hole" ? -1.4 : 1.1) * (reverse ? -1 : 1);
      const positions = burst.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      burst.velocities.forEach((velocity, index) => {
        const curve = 1 - Math.pow(1 - progress, 2);
        positions.setXYZ(index, velocity.x * curve, velocity.y * curve, velocity.z * curve + Math.sin(progress * Math.PI + index) * 0.008);
      });
      positions.needsUpdate = true;
      burst.material.opacity = (1 - progress) * 0.72;
    });
    topologyPulses.slice().forEach((pulse) => {
      const progress = Math.min(1, (now - pulse.bornAt) / 1100);
      if (progress >= 1) {
        topologyPulseGroup.remove(pulse.ring);
        pulse.ring.geometry.dispose();
        pulse.ring.material.dispose();
        topologyPulses.splice(topologyPulses.indexOf(pulse), 1);
        return;
      }
      const wave = 0.35 + progress * 3.4;
      pulse.ring.scale.setScalar(wave);
      pulse.ring.rotation.z = progress * (pulse.event === "vanish" ? -2.4 : 2.4);
      pulse.ring.material.opacity = (1 - progress) * 0.86;
    });
    temporalCollisions.slice().forEach((collision) => {
      const collisionProgress = Math.min(1, (now - collision.bornAt) / 1250);
      if (collisionProgress >= 1) {
        temporalCollisionGroup.remove(collision.group);
        collision.group.traverse((child) => {
          if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Points) child.geometry.dispose();
        });
        collision.group.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) child.material.dispose();
          if (child instanceof THREE.LineSegments && child.material instanceof THREE.Material) child.material.dispose();
          if (child instanceof THREE.Points && child.material instanceof THREE.Material) child.material.dispose();
        });
        temporalCollisions.splice(temporalCollisions.indexOf(collision), 1);
        return;
      }
      const curve = 1 - Math.pow(1 - collisionProgress, 2);
      const fade = 1 - collisionProgress;
      collision.ring.scale.setScalar(0.6 + curve * 4.2);
      collision.ring.rotation.z = curve * (collision.branch === 1 ? 2.4 : -2.4);
      collision.ring.material.opacity = fade * 0.76;
      collision.inner.scale.setScalar(0.5 + curve * 1.8);
      collision.inner.rotation.z = -curve * 3.7;
      collision.inner.material.opacity = fade * 0.92;
      const positions = collision.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      collision.velocities.forEach((velocity, index) => {
        const wobble = Math.sin(collisionProgress * Math.PI + index * 0.7) * 0.012 * fade;
        positions.setXYZ(index, velocity.x * curve + wobble, velocity.y * curve - wobble, velocity.z * curve);
      });
      positions.needsUpdate = true;
      collision.pointsMaterial.opacity = fade * 0.86;
      const spokePositions = collision.spokes.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let spoke = 0; spoke < 12; spoke += 1) {
        const angle = (spoke / 12) * Math.PI * 2 + curve * (collision.branch - 1) * 0.8;
        const offset = spoke * 6;
        const length = 0.08 + curve * 0.44 * (1 + (spoke % 3) * 0.18);
        spokePositions.setXYZ(offset / 3, Math.cos(angle) * 0.02, Math.sin(angle) * 0.02, 0.01);
        spokePositions.setXYZ(offset / 3 + 1, Math.cos(angle) * length, Math.sin(angle) * length, 0.01);
      }
      spokePositions.needsUpdate = true;
      collision.spokes.material.opacity = fade * 0.72;
      wake();
    });
    const feedbackColor = new THREE.Color(0x000000);
    let feedbackWeight = 0;
    ecologyBursts.forEach((burst) => {
      const progress = Math.max(0, 1 - (now - burst.bornAt) / 1250);
      const color = new THREE.Color(burst.role === "hole" ? 0x9fe0cb : burst.role === "island" ? 0xffca68 : 0xb9a8ff);
      const weight = progress * (burst.role === "island" ? 1.2 : burst.role === "hole" ? 0.9 : 0.6);
      feedbackColor.r += color.r * weight;
      feedbackColor.g += color.g * weight;
      feedbackColor.b += color.b * weight;
      feedbackWeight += weight;
    });
    const divergenceFeedback = geometryDivergence * 0.5;
    forecastCollisionEnergy = state.reducedMotion
      ? 0
      : Math.max(0, forecastCollisionEnergy - 0.018);
    const singularityEnergy = Math.min(1, forecastCollisionEnergy * 1.45);
    const singularityActive = singularityEnergy > 0.001 && stage.dataset.artifactView === "model";
    const singularityColor = forecastBranchIndex === 0 ? 0xb9a8ff : forecastBranchIndex === 2 ? 0xffca68 : 0x8ffff2;
    causalSingularityGroup.position.set(state.pointerX * 0.06, state.pointerY * 0.035, 0.34 + singularityEnergy * 0.05);
    causalSingularityGroup.scale.setScalar(0.72 + singularityEnergy * 0.65);
    singularityCore.material.opacity += ((singularityActive ? 0.82 * singularityEnergy : 0) - singularityCore.material.opacity) * 0.24;
    singularityCore.material.color.setHex(0xfff4ce);
    singularityCore.scale.setScalar(0.72 + singularityEnergy * 2.4 + Math.sin(now * 0.012) * singularityEnergy * 0.18);
    singularityHorizon.material.opacity += ((singularityActive ? 0.74 * singularityEnergy : 0) - singularityHorizon.material.opacity) * 0.24;
    singularityHorizon.material.color.setHex(singularityColor);
    singularityHorizon.rotation.x = state.pointerY * 0.35 + singularityEnergy * 0.8;
    singularityHorizon.rotation.y = state.pointerX * 0.35 + now * 0.0018;
    singularityHorizon.rotation.z = now * -0.0024;
    singularityHorizon.scale.setScalar(0.78 + singularityEnergy * 2.5);
    singularityParticles.material.opacity += ((singularityActive ? 0.84 * singularityEnergy : 0) - singularityParticles.material.opacity) * 0.2;
    singularityParticles.material.color.setHex(singularityColor);
    const singularityPositions = singularityParticles.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let particle = 0; particle < singularityParticleCount; particle += 1) {
      const orbit = particle % 3;
      const phase = particle * 0.41 + now * (0.0012 + orbit * 0.0007) * (forecastBranchIndex === 1 ? 1 : forecastBranchIndex === 0 ? -1 : 1.35);
      const radius = 0.12 + ((particle * 17) % 29) / 180 + Math.sin(now * 0.002 + particle) * 0.008;
      const plunge = singularityEnergy * (0.022 + (particle % 7) * 0.004);
      singularityPositions.setXYZ(
        particle,
        Math.cos(phase) * Math.max(0.018, radius - plunge),
        Math.sin(phase) * Math.max(0.018, radius - plunge) * (0.62 + orbit * 0.14),
        Math.sin(phase * 1.7 + particle) * 0.018 * singularityEnergy,
      );
    }
    singularityPositions.needsUpdate = true;
    if (singularityActive) wake();
    singularityWakeTrails.slice().forEach((trail) => {
      const elapsed = (now - trail.bornAt) / 2200;
      if (elapsed >= 1) {
        singularityWakeGroup.remove(trail.line);
        trail.line.geometry.dispose();
        trail.line.material.dispose();
        singularityWakeTrails.splice(singularityWakeTrails.indexOf(trail), 1);
        syncCausalOrbitControls();
        return;
      }
      const positions = trail.line.geometry.getAttribute("position") as THREE.BufferAttribute;
      trail.points.forEach((point, index) => {
        const progress = index / Math.max(1, trail.points.length - 1);
        const bend = Math.sin(progress * Math.PI) * singularityEnergy * 0.08;
        positions.setXYZ(index, point.x + bend, point.y - bend * 0.7, point.z + progress * singularityEnergy * 0.04);
      });
      positions.needsUpdate = true;
      trail.line.material.opacity = Math.max(0, (1 - elapsed) * (0.72 + singularityEnergy * 0.24));
      trail.line.rotation.z = elapsed * 0.8;
      if (singularityActive) wake();
    });
    peerOrbitTrails.slice().forEach((trail) => {
      const elapsed = (now - trail.bornAt) / 3600;
      if (elapsed >= 1) {
        peerOrbitGroup.remove(trail.line);
        trail.line.geometry.dispose();
        trail.line.material.dispose();
        peerOrbitTrails.splice(peerOrbitTrails.indexOf(trail), 1);
        return;
      }
      const positions = trail.line.geometry.getAttribute("position") as THREE.BufferAttribute;
      trail.points.forEach((point, index) => {
        const progress = index / Math.max(1, trail.points.length - 1);
        const interference = Math.sin(now * 0.004 + progress * Math.PI * 5) * 0.028 * (1 - elapsed);
        positions.setXYZ(index, point.x + interference, point.y - interference * 0.7, point.z + Math.cos(progress * Math.PI) * 0.02);
      });
      positions.needsUpdate = true;
      trail.line.material.opacity = (1 - elapsed) * 0.62;
      trail.line.rotation.z = -elapsed * 0.7;
      wake();
    });
    let forecastDrift = 0;
    if (forecastEnabled && recordedFrames.length >= 3) {
      const latest = recordedFrames[recordedFrames.length - 1];
      const previous = recordedFrames[recordedFrames.length - 2];
      const beforePrevious = recordedFrames[recordedFrames.length - 3];
      const branchDrift = forecastBranching ? (forecastBranchIndex - 1) * 0.16 : 0;
      const topologyBias = forecastBranching ? forecastTopologyBias() * 0.35 : 0;
      const narrativeDrift = narrativeFuture * 0.12 - narrativePast * 0.045;
      const collisionDrift = (forecastBranchIndex - 1) * forecastCollisionEnergy * 0.22;
      forecastDrift = Math.max(-1, Math.min(1, ((((latest.area - previous.area) - (previous.area - beforePrevious.area)) / Math.max(latest.area, 1e-6)) * 2.4) + forecastBias + branchDrift + topologyBias + narrativeDrift + collisionDrift));
    }
    const forecastPulse = forecastEnabled && !state.reducedMotion
      ? 0.72 + Math.sin(now * 0.004) * 0.2
      : forecastEnabled ? 0.78 : 0;
    const forecastIntensity = Math.abs(forecastDrift) * forecastPulse;
    const temporalClockActive = stage.dataset.artifactView === "model";
    const temporalClockEnergy = Math.min(1, 0.18 + recordedFrames.length / 18 + forecastIntensity * 0.45 + forecastCollisionEnergy * 0.32);
    const temporalClockOpacity = temporalClockActive
      ? state.reducedMotion ? 0.13 : 0.12 + temporalClockEnergy * 0.2
      : 0;
    temporalClockGroup.position.set(state.pointerX * 0.045, -0.018 + state.pointerY * 0.035, 0.14);
    temporalClockGroup.scale.setScalar(0.92 + temporalClockEnergy * 0.08);
    temporalClockGroup.rotation.z = state.reducedMotion ? 0 : -progress * Math.PI * 2 + state.pointerX * 0.28;
    temporalClockGroup.rotation.x = state.pointerY * 0.08;
    temporalClockRings.forEach(({ mesh, phase }, index) => {
      mesh.rotation.z = state.reducedMotion ? 0 : now * (0.00018 + index * 0.00008) * (index % 2 === 0 ? 1 : -1) + phase;
      mesh.scale.setScalar(1 + Math.sin(now * 0.001 + phase) * 0.012 * (state.reducedMotion ? 0 : temporalClockEnergy));
      mesh.material.opacity += (temporalClockOpacity * (index === 1 ? 1.18 : 0.72) - mesh.material.opacity) * 0.16;
      mesh.material.color.setHex(index === 0 ? 0xb9a8ff : index === 1 ? 0x8ffff2 : 0xffca68);
    });
    temporalClockTicks.material.opacity += (temporalClockOpacity * 0.64 - temporalClockTicks.material.opacity) * 0.16;
    const clockAngle = -Math.PI / 2 + (state.reducedMotion ? 0 : progress * Math.PI * 2) + state.pointerX * 0.22;
    const clockHandPositions = temporalClockHand.geometry.getAttribute("position") as THREE.BufferAttribute;
    clockHandPositions.setXYZ(0, 0, 0, 0.008);
    clockHandPositions.setXYZ(1, Math.cos(clockAngle) * 0.66, Math.sin(clockAngle) * 0.66, 0.008);
    clockHandPositions.needsUpdate = true;
    temporalClockHand.material.opacity += (temporalClockOpacity * 1.15 - temporalClockHand.material.opacity) * 0.2;
    temporalClockHand.material.color.setHex(narrativeFuture > 0.18 ? 0xffca68 : narrativePast > 0.18 ? 0xb9a8ff : 0x8ffff2);
    temporalClockCursor.position.set(Math.cos(clockAngle) * 0.66, Math.sin(clockAngle) * 0.66, 0.012);
    temporalClockCursor.rotation.z = -clockAngle;
    temporalClockCursor.material.opacity += (temporalClockOpacity * 1.25 - temporalClockCursor.material.opacity) * 0.2;
    temporalClockCursor.material.color.setHex(narrativeFuture > 0.18 ? 0xffca68 : narrativePast > 0.18 ? 0xb9a8ff : 0x8ffff2);
    if (temporalClockActive && temporalClockOpacity > 0.001) wake();
    const modelFeedback = Math.min(0.72, feedbackWeight + divergenceFeedback);
    const intersectedSet = new Set(intersectedSectionMeshes);
    if (feedbackWeight > 0 || divergenceFeedback > 0) {
      if (feedbackWeight > 0) feedbackColor.multiplyScalar(1 / feedbackWeight);
      else feedbackColor.set(0xff7b55);
      feedbackColor.lerp(new THREE.Color(0xff7b55), divergenceFeedback / Math.max(modelFeedback, 1e-6));
      const focusedMemory = focusedMemoryId === null ? null : memoryGhostSnapshots.find((snapshot) => snapshot.id === focusedMemoryId);
      explodedMeshes.forEach(({ mesh, index }) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (!material.isMeshStandardMaterial) return;
        const recalledResponse = focusedMemory?.meshIndices.includes(index) ? 1.35 : 0.08;
        const localResponse = focusedMemory ? recalledResponse : intersectedSet.has(mesh) ? 1 : 0.08;
        material.emissive.copy(feedbackColor);
        material.emissiveIntensity = modelFeedback * localResponse * 0.48;
        mesh.scale.setScalar(1 + modelFeedback * localResponse * 0.018);
      });
    } else {
      explodedMeshes.forEach(({ mesh }) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        mesh.scale.setScalar(1);
        if (!material.isMeshStandardMaterial) return;
        const focused = mesh === focusedMesh && Boolean(mesh.userData.inspectionMaterial);
        if (!focused) material.emissive.set(0x000000);
        material.emissiveIntensity = focused ? 0.48 : 0;
      });
    }
    if (forecastIntensity > 0) {
      const predictionColor = new THREE.Color(0x8ffff2);
      explodedMeshes.forEach(({ mesh, index }) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (!material.isMeshStandardMaterial) return;
        const roleBias = currentSectionTopology[index % Math.max(1, currentSectionTopology.length)]?.role === "hole" ? 1.18 : 0.86;
        material.emissive.lerp(predictionColor, Math.min(0.42, forecastIntensity * roleBias * 0.34));
        material.emissiveIntensity = Math.max(material.emissiveIntensity, forecastIntensity * roleBias * 0.42);
      });
    }
    narrativeTimeGhosts.forEach(({ track, group: timeGroup, materials }) => {
      const phase = track === "past" ? -1 : track === "future" ? 1 : 0;
      const timeOpacity = track === "past"
        ? narrativePast * 0.26
        : track === "future"
          ? narrativeFuture * 0.3
          : narrativePresent * 0.055;
      const active = !state.reducedMotion && timeOpacity > 0.001;
      const drift = phase * (0.13 + narrativeFuture * 0.045);
      timeGroup.position.set(
        drift,
        active ? Math.sin(now * 0.001 + phase * 1.7) * 0.015 * (1 - narrativePresent) : 0,
        phase * -0.022,
      );
      timeGroup.rotation.z = phase * (0.035 + narrativeFuture * 0.045);
      timeGroup.scale.setScalar(1 + phase * 0.025 + narrativeFuture * 0.025);
      materials.forEach((material) => {
        material.opacity += (timeOpacity - material.opacity) * 0.16;
        material.color.setHex(track === "past" ? 0xb9a8ff : track === "future" ? 0xffca68 : 0x8ffff2);
      });
      if (active) wake();
    });
    forecastBranchGhosts.forEach(({ branch, group: branchGroup, materials }) => {
      const active = forecastBranching && forecastEnabled && recordedFrames.length >= 3 && stage.dataset.artifactView === "model";
      const winner = forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
      const selected = branch === forecastBranchIndex;
      const isWinner = branch === winner;
      const branchOffset = branch - 1;
      const targetOpacity = active && !state.reducedMotion
        ? (selected ? 0.24 : isWinner ? 0.17 : 0.055)
        : 0;
      branchGroup.position.set(
        branchOffset * (0.12 + forecastIntensity * 0.035),
        Math.sin(now * 0.0016 + branch * 1.8) * (active && !state.reducedMotion ? 0.012 : 0),
        branchOffset * -0.028,
      );
      branchGroup.rotation.z = branchOffset * 0.055 + Math.sin(now * 0.0012 + branch) * 0.012 * (active && !state.reducedMotion ? 1 : 0);
      branchGroup.scale.setScalar(1 + branchOffset * 0.045 + (selected ? forecastDrift * 0.035 : 0));
      materials.forEach((material) => {
        material.opacity += (targetOpacity - material.opacity) * 0.16;
        material.color.setHex(selected ? 0x8ffff2 : branch === 0 ? 0xff8f9e : 0xffca68);
      });
      if (active && targetOpacity > 0.001) wake();
    });
    forecastBranchBeams.forEach(({ branch, line }) => {
      const active = forecastBranching && forecastEnabled && recordedFrames.length >= 3 && stage.dataset.artifactView === "model";
      const winner = forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
      const selected = branch === forecastBranchIndex;
      const isWinner = branch === winner;
      const branchGroup = forecastBranchGhosts.find((ghost) => ghost.branch === branch)?.group;
      const target = branchGroup?.position ?? new THREE.Vector3();
      const positions = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let point = 0; point < positions.count; point += 1) {
        const progress = point / Math.max(1, positions.count - 1);
        const arc = Math.sin(progress * Math.PI) * (selected ? 0.035 : 0.018);
        positions.setXYZ(point, target.x * progress, target.y * progress + arc, target.z * progress + Math.sin(progress * Math.PI) * 0.025);
      }
      positions.needsUpdate = true;
      line.material.opacity = active && !state.reducedMotion
        ? (selected ? 0.28 : isWinner ? 0.17 : 0.045)
        : 0;
      line.material.color.setHex(selected ? 0x8ffff2 : branch === 0 ? 0xff8f9e : 0xffca68);
      if (active && line.material.opacity > 0) wake();
    });
    let directorZoom = 0;
    let directorX = 0;
    let directorY = 0;
    if (cinematicStartedAt && !state.reducedMotion) {
      const directorProgress = Math.min(1, (now - cinematicStartedAt) / 2200);
      const beat = Math.sin(directorProgress * Math.PI);
      const direction = cinematicEvent === "vanish" ? -1 : cinematicEvent === "shrink" ? -0.7 : 1;
      directorZoom = (cinematicEvent === "birth" ? 0.22 : cinematicEvent === "vanish" ? -0.16 : 0.1) * beat;
      directorX = direction * beat * 0.08;
      directorY = (cinematicEvent === "grow" ? 0.06 : cinematicEvent === "shrink" ? -0.06 : 0.025) * beat;
      keyLight.intensity = 2.1 + beat * (cinematicEvent === "birth" ? 1.1 : 0.35);
      fillLight.intensity = 0.8 + beat * (cinematicEvent === "vanish" ? 0.65 : 0.15);
      keyLight.color.set(cinematicEvent === "vanish" ? 0xff8f9e : cinematicEvent === "grow" ? 0xffe3a0 : 0xffffff);
      if (directorProgress >= 1) {
        cinematicStartedAt = 0;
        keyLight.intensity = 2.1;
        fillLight.intensity = 0.8;
        keyLight.color.set(0xffffff);
      }
    }
    let neuralReflex = 0;
    if (neuralDecisionAt && !state.reducedMotion) {
      const decisionProgress = Math.min(1, (now - neuralDecisionAt) / 920);
      neuralReflex = Math.sin(decisionProgress * Math.PI) * (neuralDecisionRole === "hole" ? -1 : neuralDecisionRole === "island" ? 1.2 : 0.72);
      if (decisionProgress >= 1) neuralDecisionAt = 0;
    }
    group.rotation.z = branchWarp * 0.13;
    group.rotation.z += Math.sin(now * 0.003) * modelFeedback * 0.018;
    group.rotation.z += neuralReflex * 0.055;
    group.rotation.z += forecastDrift * forecastPulse * 0.035;
    camera.zoom = 1 + branchWarp * 0.14 + modelFeedback * 0.06 + directorZoom + neuralReflex * 0.045 + forecastDrift * forecastPulse * 0.028;
    camera.updateProjectionMatrix();
    const initialRotation = keyframes[0].ry;
    const rotationTravel = state.width <= 760 ? 0.5 : 1;
    group.rotation.y =
      initialRotation + (blend(from.ry, to.ry) - initialRotation) * rotationTravel +
      (state.reducedMotion ? 0 : state.pointerX * 0.12) + branchWarp * 0.08;
    group.rotation.x =
      blend(from.rx, to.rx) +
      (state.reducedMotion ? 0 : state.pointerY * 0.06) + Math.cos(now * 0.0024) * modelFeedback * 0.012 + forecastDrift * forecastPulse * 0.022;
    group.position.x = blend(from.x, to.x) + directorX;
    group.position.y = blend(from.y, to.y) + directorY;
    group.scale.setScalar(baseModelScale() * blend(from.scale, to.scale) * (1 + branchWarp * 0.1 + neuralReflex * 0.06 + forecastDrift * forecastPulse * 0.035));
    applyExplode();
    updateSectionPlane();
    renderer.render(scene, camera);
    if (stage.dataset.artifactView === "atlas" || stage.dataset.artifactView === "tomogram") drawAtlas();
    if (stage.dataset.artifactView === "oracle") drawOracle();
    if (stage.dataset.artifactView === "trinity") drawTrinity();
    if (stage.dataset.artifactView === "morph") drawMorph();
    if (branchWarpStartedAt && branchWarpProgress < 1) wake();
    else if (branchWarpStartedAt) {
      branchWarpStartedAt = 0;
      branchWarpIntensity = 0;
      group.rotation.z = 0;
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    }
    if (memoryGhostSnapshots.length) wake();
    if (state.sliceScanning) scanTimer = window.setTimeout(wake, 80);
    if (playback) playbackTimer = window.setTimeout(wake, 120);
    rendering = false;
  };

  const uploadMesh = (
    meshes: NonNullable<MeshMessage["meshes"]>,
    triangleCount: number,
    spanMm: number,
    centerMm: number[],
  ): void => {
    modelSpanMm = spanMm;
    modelCenterMm = centerMm.length === 3 ? centerMm : [0, 0, 0];
    const materials = new Map<string, THREE.MeshStandardMaterial>();
    const edgeSegmentBudget = 120_000;
    let edgeSegments = 0;
    stage.dataset.modelNormals = meshes.every(({ normals }) => normals) ? "provided" : "computed";
    meshes.forEach(({ positions, normals, indices, color, roughness = 0.34, metalness = 0.16 }, meshIndex) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(positions), 3),
      );
      if (normals) {
        geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
      } else {
        geometry.computeVertexNormals();
      }
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const key = `${color.join(",")}|${roughness}|${metalness}`;
      let material = materials.get(key);
      if (!material) {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color[0], color[1], color[2]),
          roughness,
          metalness,
          side: THREE.DoubleSide,
        });
        materials.set(key, material);
      }
      const mesh = new THREE.Mesh(geometry, material);
      const center = geometry.boundingSphere?.center ?? new THREE.Vector3();
      const angle = meshIndex * 2.399963229728653;
      const fallbackDirection = new THREE.Vector3(
        Math.cos(angle),
        ((meshIndex % 5) - 2) * 0.32,
        Math.sin(angle),
      ).normalize();
      explodedMeshes.push({
        mesh,
        material,
        direction: center.lengthSq() > 0.0025 ? center.clone().normalize() : fallbackDirection,
        index: meshIndex,
        triangles: (geometry.index?.count ?? 0) / 3,
      });
      group.add(mesh);
    });
    refreshForecastBranches();
    refreshResonance();
    const sphere = new THREE.Box3()
      .setFromObject(group)
      .getBoundingSphere(new THREE.Sphere());
    const physicalBounds = new THREE.Box3();
    explodedMeshes.forEach(({ mesh }) => physicalBounds.expandByObject(mesh));
    const physicalSphere = physicalBounds.getBoundingSphere(new THREE.Sphere());
    cameraFitRadius = Math.max(physicalSphere.radius * 1.12, 0.1);
    state.modelRadius = Math.max(sphere.radius, 0.1);
    fitCamera();
    stage.dataset.modelTriangles = String(triangleCount);
    stage.dataset.modelEdgeSegments = "pending";
    if (detailStatus) detailStatus.textContent = document.documentElement.lang === "en"
      ? "SURFACE DETAIL · LOADING"
      : "表面细节 · 加载中";
    const edgeParts = explodedMeshes
      .filter(({ mesh }) => (mesh.geometry.index?.count ?? 0) <= 6_000)
      .sort((left, right) => (left.mesh.geometry.index?.count ?? 0) - (right.mesh.geometry.index?.count ?? 0))
      .slice(0, 160);
    stage.dataset.modelEdgeMeshes = String(edgeParts.length);
    let edgePartIndex = 0;
    const addEdgeChunk = (): void => {
      const chunkEnd = Math.min(edgePartIndex + 8, edgeParts.length);
      for (; edgePartIndex < chunkEnd && edgeSegments < edgeSegmentBudget; edgePartIndex += 1) {
        const { mesh } = edgeParts[edgePartIndex];
        const edgeGeometry = new THREE.EdgesGeometry(mesh.geometry, 32);
        const segmentCount = (edgeGeometry.getAttribute("position")?.count ?? 0) / 2;
        if (segmentCount <= 0 || edgeSegments + segmentCount > edgeSegmentBudget) {
          edgeGeometry.dispose();
          continue;
        }
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x4a4358,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        });
        const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        edgeLines.renderOrder = 1;
        mesh.add(edgeLines);
        edgeSegments += segmentCount;
      }
      if (edgePartIndex < edgeParts.length && edgeSegments < edgeSegmentBudget) {
        window.setTimeout(addEdgeChunk, 16);
        return;
      }
      stage.dataset.modelEdgeSegments = String(edgeSegments);
      if (detailStatus) detailStatus.textContent = document.documentElement.lang === "en"
        ? `SURFACE DETAIL · ${edgeParts.length} MESHES`
        : `表面细节 · ${edgeParts.length} 个网格`;
      wake();
    };
    window.setTimeout(addEdgeChunk, 100);
    const explodeInput = stage.querySelector<HTMLInputElement>("[data-model-explode]");
    const explodeStats = stage.querySelector<HTMLElement>("[data-model-explode-stats]");
    const explodeValue = stage.querySelector<HTMLOutputElement>("[data-model-explode-value]");
    const sliceToggle = stage.querySelector<HTMLButtonElement>("[data-model-slice-toggle]");
    const scanButton = stage.querySelector<HTMLButtonElement>("[data-model-scan]");
    const recordButton = stage.querySelector<HTMLButtonElement>("[data-tomogram-record]");
    const playButton = stage.querySelector<HTMLButtonElement>("[data-tomogram-play]");
    const sliceInput = stage.querySelector<HTMLInputElement>("[data-model-slice]");
    const tomogramScrubber = stage.querySelector<HTMLInputElement>("[data-tomogram-scrubber-range]");
    frameScrubber?.addEventListener("input", () => {
      const index = Number(frameScrubber.value);
      const frame = recordedFrames[index];
      if (!frame) return;
      playback = false;
      state.sliceScanning = false;
      window.clearTimeout(playbackTimer);
      playbackIndex = index;
      state.sliceEnabled = true;
      state.sliceAxis = frame.axis;
      state.slicePercent = frame.percent;
      if (sliceToggle) sliceToggle.setAttribute("aria-pressed", "true");
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
      applySectionMode();
      wake();
    });
    crossoverRange?.addEventListener("input", () => {
      crossoverPercent = Math.min(Number(crossoverRange.value), crossoverEndPercent - 5);
      crossoverRange.value = String(crossoverPercent);
      if (crossoverValue) crossoverValue.value = `${crossoverPercent}%`;
      recombinedTimeline = false;
      syncRecordingControls();
      wake();
    });
    crossoverEndRange?.addEventListener("input", () => {
      crossoverEndPercent = Math.max(Number(crossoverEndRange.value), crossoverPercent + 5);
      crossoverEndRange.value = String(crossoverEndPercent);
      if (crossoverEndValue) crossoverEndValue.value = `${crossoverEndPercent}%`;
      recombinedTimeline = false;
      syncRecordingControls();
      wake();
    });
    totalTriangles = triangleCount;
    if (explodeInput) explodeInput.disabled = false;
    if (sliceToggle) sliceToggle.disabled = false;
    if (scanButton) scanButton.disabled = false;
    if (recordButton) recordButton.disabled = false;
    if (sliceInput) sliceInput.disabled = false;
    if (tomogramScrubber) tomogramScrubber.disabled = false;
    stage.querySelectorAll<HTMLButtonElement>("[data-slice-axis]").forEach((button) => {
      button.disabled = false;
      button.addEventListener("click", () => {
        state.sliceAxis = button.dataset.sliceAxis as "x" | "y" | "z";
        playback = false;
        window.clearTimeout(playbackTimer);
        syncRecordingControls();
        syncAxisControls();
        tomogramBufferContext?.clearRect(0, 0, tomogramBuffer.width, tomogramBuffer.height);
        previousTomogramColumn = null;
        if (state.sliceScanning) {
          state.slicePercent = 0;
          scanDirection = 1;
          lastScanFrame = 0;
        }
        syncSliceControls();
        applySectionMode();
        wake();
      });
    });
    sliceToggle?.addEventListener("click", () => {
      state.sliceScanning = false;
      window.clearTimeout(scanTimer);
      setScanButtonState(false);
      state.sliceEnabled = !state.sliceEnabled;
      sliceToggle.setAttribute("aria-pressed", String(state.sliceEnabled));
      applySectionMode();
      wake();
    });
    const moveSlice = (input: HTMLInputElement): void => {
      state.sliceScanning = false;
      playback = false;
      window.clearTimeout(scanTimer);
      window.clearTimeout(playbackTimer);
      setScanButtonState(false);
      syncRecordingControls();
      state.slicePercent = Number(input.value);
      syncSliceControls();
      updateSectionPlane();
      wake();
    };
    sliceInput?.addEventListener("input", () => moveSlice(sliceInput));
    tomogramScrubber?.addEventListener("input", () => moveSlice(tomogramScrubber));
    scanButton?.addEventListener("click", () => {
      playback = false;
      window.clearTimeout(playbackTimer);
      state.sliceScanning = !state.sliceScanning;
      if (state.sliceScanning) {
        tomogramBufferContext?.clearRect(0, 0, tomogramBuffer.width, tomogramBuffer.height);
        previousTomogramColumn = null;
        state.sliceEnabled = true;
        state.slicePercent = 0;
        scanDirection = 1;
        lastScanFrame = 0;
        if (sliceToggle) sliceToggle.setAttribute("aria-pressed", "true");
        syncSliceControls();
        applySectionMode();
        stage.querySelector<HTMLButtonElement>('[data-artifact-view="tomogram"]')?.click();
      } else {
        window.clearTimeout(scanTimer);
      }
      setScanButtonState(state.sliceScanning);
      wake();
    });
    recordButton?.addEventListener("click", () => {
      recording = !recording;
      if (recording) {
        recordedFrames = [];
        recombinedTimeline = false;
        multiverseMode = false;
        lockedEventFrame = null;
        lockedEventBucket = null;
        lockedEventType = "stable";
        delete stage.dataset.lockedEvent;
        stage.dataset.multiverse = "false";
        importedTimeline = [];
        importedTimelines = [];
        morphTimeline = [];
        morphForkActive = false;
        delete stage.dataset.morphFork;
        collisionTimeline = [];
        collisionActive = false;
        delete stage.dataset.collision;
        antimatterTimeline = [];
        antimatterActive = false;
        delete stage.dataset.antimatter;
        annihilationTimeline = [];
        annihilationActive = false;
        delete stage.dataset.annihilation;
        referenceSection = null;
        playback = false;
        lastRecordedPercent = Number.NaN;
        lastRecordedAxis = null;
        window.clearTimeout(playbackTimer);
      }
      syncRecordingControls();
      wake();
    });
    playButton?.addEventListener("click", () => {
      if (recordedFrames.length < 2) return;
      playback = !playback;
      if (playback) {
        state.sliceScanning = false;
        state.sliceEnabled = true;
        playbackIndex = 0;
        if (stage.dataset.artifactView !== "trinity" && stage.dataset.artifactView !== "oracle") {
          stage.querySelector<HTMLButtonElement>('[data-artifact-view="tomogram"]')?.click();
        }
        if (sliceToggle) sliceToggle.setAttribute("aria-pressed", "true");
        syncSliceControls();
        applySectionMode();
      } else {
        window.clearTimeout(playbackTimer);
      }
      syncRecordingControls();
      wake();
    });
    if (explodeStats)
      explodeStats.textContent = `${meshes.length} ${document.documentElement.lang === "en" ? "meshes" : "个网格对象"} · ${triangleCount.toLocaleString()} ${document.documentElement.lang === "en" ? "triangles" : "个三角面"} · ${resetFocusCopy}`;
    stage.querySelectorAll<HTMLButtonElement>("[data-artifact-view]").forEach((button) =>
      button.addEventListener("click", wake)
    );
    explodeInput?.addEventListener("input", () => {
      state.explode = Number(explodeInput.value) / 100;
      if (explodeValue) explodeValue.value = `${explodeInput.value}%`;
      applyExplode();
      wake();
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const centers = explodedMeshes.map(({ mesh }) =>
      mesh.geometry.boundingSphere?.center.clone() ?? new THREE.Vector3()
    );
    const minimum = new THREE.Vector3(Infinity, Infinity, Infinity);
    const maximum = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    centers.forEach((center) => {
      minimum.min(center);
      maximum.max(center);
    });
    const spans = new THREE.Vector3().subVectors(maximum, minimum);
    const axes = [0, 1, 2].sort((left, right) =>
      spans.getComponent(right) - spans.getComponent(left)
    );
    const horizontalAxis = axes[0];
    const verticalAxis = axes[1];
    const axisNames = ["X", "Y", "Z"];
    const atlasNodes = explodedMeshes.map((part, index) => ({
      ...part,
      center: centers[index],
      color: `#${part.material.color.getHexString()}`,
    }));
    const drawTomogram = (
      loops: [number, number][][],
      verticalAxisIndex: number,
    ): void => {
      if (!tomogramCanvas || !tomogramContext) return;
      if (state.sliceEnabled && tomogramBufferContext) {
        const width = tomogramBuffer.width;
        const height = tomogramBuffer.height;
        const columnIndex = Math.max(0, Math.min(width - 1,
          Math.round((state.slicePercent / 100) * (width - 1))));
        const radius = Math.max(state.modelRadius, 1e-5);
        const data = tomogramColumn.data;
        for (let row = 0; row < height; row += 1) {
          const vertical = radius - (row / (height - 1)) * radius * 2;
          let occupiedWidth = 0;
          loops.forEach((loop) => {
            const crossings: number[] = [];
            for (let index = 0; index < loop.length; index += 1) {
              const first = loop[index];
              const second = loop[(index + 1) % loop.length];
              if ((first[1] <= vertical && second[1] > vertical) ||
                (second[1] <= vertical && first[1] > vertical)) {
                crossings.push(first[0] + ((vertical - first[1]) / (second[1] - first[1])) * (second[0] - first[0]));
              }
            }
            crossings.sort((left, right) => left - right);
            for (let index = 0; index + 1 < crossings.length; index += 2) {
              occupiedWidth += Math.max(0, crossings[index + 1] - crossings[index]);
            }
          });
          const density = Math.min(1, occupiedWidth / (radius * 2));
          const pixel = row * 4;
          data[pixel] = 255;
          data[pixel + 1] = Math.round(186 + density * 54);
          data[pixel + 2] = Math.round(104 + density * 76);
          data[pixel + 3] = Math.round(density * 235);
        }
        const start = previousTomogramColumn === null
          ? columnIndex
          : Math.min(previousTomogramColumn, columnIndex);
        const end = previousTomogramColumn === null
          ? columnIndex
          : Math.max(previousTomogramColumn, columnIndex);
        for (let column = start; column <= end; column += 1) {
          tomogramBufferContext.putImageData(tomogramColumn, column, 0);
        }
        previousTomogramColumn = columnIndex;
      }

      const rect = tomogramCanvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(rect.width * ratio);
      const pixelHeight = Math.round(rect.height * ratio);
      if (tomogramCanvas.width !== pixelWidth || tomogramCanvas.height !== pixelHeight) {
        tomogramCanvas.width = pixelWidth;
        tomogramCanvas.height = pixelHeight;
      }
      tomogramContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      tomogramContext.clearRect(0, 0, rect.width, rect.height);
      const background = tomogramContext.createLinearGradient(0, 0, rect.width, rect.height);
      background.addColorStop(0, "#201f29");
      background.addColorStop(1, "#302941");
      tomogramContext.fillStyle = background;
      tomogramContext.fillRect(0, 0, rect.width, rect.height);

      const specimenWidth = Math.min(190, Math.max(112, rect.width * 0.27));
      const plotLeft = Math.round(specimenWidth + 30);
      const plotTop = 42;
      const plotWidth = Math.max(1, rect.width - plotLeft - 24);
      const plotHeight = Math.max(1, rect.height - 74);
      tomogramContext.drawImage(tomogramBuffer, plotLeft, plotTop, plotWidth, plotHeight);
      const ghostFrames = importedTimelines.length
        ? importedTimelines.map((timeline, timelineIndex) => {
          const phase = multiverseMode
            ? Math.floor((timelineIndex / importedTimelines.length) * timeline.length)
            : 0;
          return timeline[(playbackIndex + phase) % timeline.length];
        }).filter(Boolean)
        : importedTimeline.length
          ? [importedTimeline[Math.min(playbackIndex, importedTimeline.length - 1)]]
          : referenceSection
            ? [{ loops: referenceSection.loops.map((points) => ({ points, role: "outer" as const })) }]
            : [];
      const historyArea = ghostFrames.length
        ? ghostFrames.reduce((sum, frame) => sum + ("area" in frame ? frame.area : 0), 0) / ghostFrames.length
        : 0;
      geometryDivergence = historyArea > 0 && currentSectionArea > 0
        ? Math.min(1, Math.abs(currentSectionArea - historyArea) / Math.max(currentSectionArea, historyArea))
        : 0;
      if (ghostFrames.length) {
        const ghostRadius = Math.max(state.modelRadius, 1e-5);
        const ghostColors = ["#8ffff2cc", "#ffca68cc", "#b9a8ffcc", "#f3b49fcc"];
        tomogramContext.save();
        tomogramContext.lineWidth = 1.25;
        tomogramContext.setLineDash([5, 4]);
        ghostFrames.forEach((ghostFrame, frameIndex) => {
          ghostFrame.loops.forEach(({ points, role }) => {
            if (points.length < 2) return;
            tomogramContext.beginPath();
            points.forEach(([x, y], index) => {
              const screenX = plotLeft + ((x + ghostRadius) / (ghostRadius * 2)) * plotWidth;
              const screenY = plotTop + (1 - (y + ghostRadius) / (ghostRadius * 2)) * plotHeight;
              if (index === 0) tomogramContext.moveTo(screenX, screenY);
              else tomogramContext.lineTo(screenX, screenY);
            });
            tomogramContext.closePath();
            tomogramContext.strokeStyle = role === "hole" ? "#9fe0cbcc" : role === "island" ? "#ffca68cc" : ghostColors[frameIndex % ghostColors.length];
            tomogramContext.stroke();
          });
        });
        tomogramContext.setLineDash([]);
        tomogramContext.fillStyle = "#8ffff2";
        tomogramContext.font = "700 8px ui-monospace, SFMono-Regular, monospace";
        const braidLabel = multiverseMode
          ? document.documentElement.lang === "en" ? "MULTIVERSE INTERFERENCE" : "多宇宙干涉场"
          : document.documentElement.lang === "en" ? "HISTORY BRAID" : "历史编织层";
        tomogramContext.fillText(`${braidLabel} ×${ghostFrames.length}`, plotLeft + 8, plotTop + 8);
        const energyHeight = Math.max(4, plotHeight * geometryDivergence);
        const energyGradient = tomogramContext.createLinearGradient(0, plotTop + plotHeight, 0, plotTop);
        energyGradient.addColorStop(0, "#9fe0cbcc");
        energyGradient.addColorStop(0.55, "#ffca68dd");
        energyGradient.addColorStop(1, "#ff7b55ee");
        tomogramContext.fillStyle = energyGradient;
        tomogramContext.shadowColor = "#ff7b55aa";
        tomogramContext.shadowBlur = geometryDivergence > 0.15 ? 12 : 0;
        tomogramContext.fillRect(plotLeft - 18, plotTop + plotHeight - energyHeight, 6, energyHeight);
        tomogramContext.shadowBlur = 0;
        tomogramContext.fillStyle = geometryDivergence > 0.15 ? "#ffca68" : "#9fe0cb";
        tomogramContext.fillText(`${document.documentElement.lang === "en" ? "Δ ENERGY" : "差异能量"} ${Math.round(geometryDivergence * 100)}%`, plotLeft - 2, plotTop + plotHeight + 8);
        tomogramContext.restore();
      }
      if (forecastEnabled && recordedFrames.length >= 3) {
        const latest = recordedFrames[recordedFrames.length - 1];
        const previous = recordedFrames[recordedFrames.length - 2];
        const beforePrevious = recordedFrames[recordedFrames.length - 3];
        const topologyBias = forecastBranching ? forecastTopologyBias() : 0;
        const forecastLoops = latest.loops.map((loop) => {
          const previousLoop = previous.loops
            .filter((candidate) => candidate.role === loop.role)
            .sort((left, right) => Math.abs(left.area - loop.area) - Math.abs(right.area - loop.area))[0];
          const beforeLoop = beforePrevious.loops
            .filter((candidate) => candidate.role === loop.role)
            .sort((left, right) => Math.abs(left.area - (previousLoop?.area ?? loop.area)) - Math.abs(right.area - (previousLoop?.area ?? loop.area)))[0];
          const centroid = (points: [number, number][]): [number, number] => {
            const sum = points.reduce(([x, y], [pointX, pointY]) => [x + pointX, y + pointY], [0, 0]);
            return [sum[0] / Math.max(1, points.length), sum[1] / Math.max(1, points.length)];
          };
          const [latestX, latestY] = centroid(loop.points);
          const [previousX, previousY] = previousLoop ? centroid(previousLoop.points) : [latestX, latestY];
          const [beforeX, beforeY] = beforeLoop ? centroid(beforeLoop.points) : [previousX, previousY];
          const areaVelocity = loop.area - (previousLoop?.area ?? loop.area);
          const acceleration = areaVelocity - ((previousLoop?.area ?? loop.area) - (beforeLoop?.area ?? previousLoop?.area ?? loop.area));
          const projectedArea = Math.max(loop.area * 0.25, (loop.area + areaVelocity + acceleration * 0.35) * (1 + topologyBias * 0.22));
          const scale = Math.sqrt(projectedArea / Math.max(loop.area, 1e-6));
          const shiftX = latestX - previousX + (previousX - beforeX) * 0.35;
          const shiftY = latestY - previousY + (previousY - beforeY) * 0.35;
          return {
            role: loop.role,
            points: loop.points.map(([x, y]) => [latestX + (x - latestX) * scale + shiftX, latestY + (y - latestY) * scale + shiftY] as [number, number]),
          };
        });
        const forecastRadius = Math.max(state.modelRadius, 1e-5);
        const pulse = state.reducedMotion ? 0.82 : 0.68 + Math.sin(performance.now() * 0.004) * 0.18;
        tomogramContext.save();
        tomogramContext.globalAlpha = pulse;
        tomogramContext.strokeStyle = "#8ffff2";
        tomogramContext.lineWidth = 1.8;
        tomogramContext.setLineDash([3, 6]);
        forecastLoops.forEach(({ points, role }) => {
          if (points.length < 2) return;
          tomogramContext.beginPath();
          points.forEach(([x, y], index) => {
            const screenX = plotLeft + ((x + forecastRadius) / (forecastRadius * 2)) * plotWidth;
            const screenY = plotTop + (1 - (y + forecastRadius) / (forecastRadius * 2)) * plotHeight;
            if (index === 0) tomogramContext.moveTo(screenX, screenY);
            else tomogramContext.lineTo(screenX, screenY);
          });
          tomogramContext.closePath();
          tomogramContext.strokeStyle = role === "hole" ? "#9fe0cb" : role === "island" ? "#ffca68" : "#8ffff2";
          tomogramContext.stroke();
        });
        if (forecastBranching) {
          const branchColors = ["#ff8f9e", "#8ffff2", "#ffca68"];
          [0.84, 1, 1.16].forEach((branchScale, branchIndex) => {
            tomogramContext.globalAlpha = branchIndex === forecastBranchIndex ? pulse : pulse * 0.32;
            tomogramContext.lineWidth = branchIndex === forecastBranchIndex ? 2.4 : 1;
            forecastLoops.forEach(({ points }) => {
              if (points.length < 2) return;
              const centroid = points.reduce(([x, y], [pointX, pointY]) => [x + pointX, y + pointY], [0, 0]);
              const centerX = centroid[0] / points.length;
              const centerY = centroid[1] / points.length;
              tomogramContext.beginPath();
              points.forEach(([x, y], index) => {
                const biasedScale = branchScale * (1 + topologyBias * 0.08);
                const shiftedX = centerX + (x - centerX) * biasedScale + (branchIndex - 1) * 0.026 + topologyBias * 0.018;
                const shiftedY = centerY + (y - centerY) * biasedScale - (branchIndex - 1) * 0.018;
                const screenX = plotLeft + ((shiftedX + forecastRadius) / (forecastRadius * 2)) * plotWidth;
                const screenY = plotTop + (1 - (shiftedY + forecastRadius) / (forecastRadius * 2)) * plotHeight;
                if (index === 0) tomogramContext.moveTo(screenX, screenY);
                else tomogramContext.lineTo(screenX, screenY);
              });
              tomogramContext.closePath();
              tomogramContext.strokeStyle = branchColors[branchIndex];
              tomogramContext.stroke();
            });
          });
          tomogramContext.globalAlpha = pulse;
          tomogramContext.fillStyle = branchColors[forecastBranchIndex];
          const winner = forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
          tomogramContext.fillText(document.documentElement.lang === "en"
            ? `FORECAST FAN · BRANCH ${forecastBranchIndex + 1}/3 · WINNER ${winner + 1} · TOPOLOGY ${topologyBias >= 0 ? "+" : ""}${Math.round(topologyBias * 100)}%`
            : `未来分叉扇 · 分支 ${forecastBranchIndex + 1}/3 · 胜者 ${winner + 1} · 拓扑 ${topologyBias >= 0 ? "+" : ""}${Math.round(topologyBias * 100)}%`, plotLeft + 8, plotTop + plotHeight - 22);
        }
        tomogramContext.setLineDash([]);
        tomogramContext.fillStyle = "#8ffff2";
        tomogramContext.font = "700 8px ui-monospace, SFMono-Regular, monospace";
        tomogramContext.fillText(document.documentElement.lang === "en"
          ? `FUTURE · PROJECTED NEXT SECTION · CONFIDENCE ${Math.round(forecastConfidence * 100)}%`
          : `未来层 · 预测下一个截面 · 置信度 ${Math.round(forecastConfidence * 100)}%`, plotLeft + 8, plotTop + plotHeight - 10);
        const memoryEnergy = forecastMemoryTexture.reduce((sum, value) => sum + value, 0) / forecastMemoryTexture.length;
        tomogramContext.fillStyle = memoryEnergy > 0.28 ? "#ffca68" : "#9fe0cb";
        tomogramContext.fillText(document.documentElement.lang === "en"
          ? `MEMORY SCAR · ${Math.round(memoryEnergy * 100)}% · CYCLES ${forecastMemoryCycles} · FLUX ${Math.round(forecastMetabolicFlux * 100)}% · BURSTS ${forecastBurstCount}`
          : `记忆疤痕 · ${Math.round(memoryEnergy * 100)}% · 反刍 ${forecastMemoryCycles} 次 · 代谢 ${Math.round(forecastMetabolicFlux * 100)}% · 爆发 ${forecastBurstCount} 次`, plotLeft + 8, plotTop + plotHeight - 34);
        tomogramContext.restore();
        wake();
      }
      tomogramContext.strokeStyle = "#e9ddff20";
      tomogramContext.lineWidth = 1;
      for (let tick = 0; tick <= 4; tick += 1) {
        const x = plotLeft + plotWidth * tick / 4;
        tomogramContext.beginPath();
        tomogramContext.moveTo(x, plotTop - 4);
        tomogramContext.lineTo(x, plotTop + plotHeight + 3);
        tomogramContext.stroke();
      }
      const cursorX = plotLeft + (state.slicePercent / 100) * plotWidth;
      tomogramContext.strokeStyle = state.sliceScanning ? "#fff0b0" : "#b9a8ff";
      tomogramContext.lineWidth = 1.5;
      tomogramContext.shadowColor = tomogramContext.strokeStyle;
      tomogramContext.shadowBlur = 10;
      tomogramContext.beginPath();
      tomogramContext.moveTo(cursorX, plotTop - 5);
      tomogramContext.lineTo(cursorX, plotTop + plotHeight + 4);
      tomogramContext.stroke();
      tomogramContext.shadowBlur = 0;

      const english = document.documentElement.lang === "en";
      tomogramContext.textBaseline = "top";
      tomogramContext.textAlign = "left";
      tomogramContext.fillStyle = "#f5f0ff";
      tomogramContext.font = "600 10px ui-monospace, SFMono-Regular, monospace";
      tomogramContext.fillText(english ? "SECTION TOMOGRAM · REAL MESH" : "真实网格 · 剖面断层地形", plotLeft, 18);
      if (lockedEventFrame !== null) {
        tomogramContext.fillStyle = "#fff4ce";
        tomogramContext.font = "700 8px ui-monospace, SFMono-Regular, monospace";
        tomogramContext.fillText(`${english ? "EVENT LOCK" : "事件锁定"} · ${lockedEventType.toUpperCase()}`, plotLeft, 31);
      }
      tomogramContext.textAlign = "right";
      tomogramContext.fillStyle = "#ffe3a0";
      tomogramContext.fillText(`${state.sliceAxis.toUpperCase()} ${Math.round(state.slicePercent)}%`, rect.width - 20, 18);
      tomogramContext.textAlign = "left";
      tomogramContext.fillStyle = "#c8bfdc";
      tomogramContext.font = "9px ui-monospace, SFMono-Regular, monospace";
      tomogramContext.fillText(english ? "SCAN POSITION →" : "扫描位置 →", plotLeft, rect.height - 16);
      const axisNames = ["X", "Y", "Z"];
      tomogramContext.textAlign = "right";
      tomogramContext.fillText(english ? `HEIGHT ${axisNames[verticalAxisIndex]}` : `高度 ${axisNames[verticalAxisIndex]}`, rect.width - 20, rect.height - 16);
      tomogramContext.textAlign = "left";
    };
    drawOracle = (): void => {
      if (!oracleCanvas || !oracleContext) return;
      const rect = oracleCanvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(rect.width * ratio);
      const pixelHeight = Math.round(rect.height * ratio);
      if (oracleCanvas.width !== pixelWidth || oracleCanvas.height !== pixelHeight) {
        oracleCanvas.width = pixelWidth;
        oracleCanvas.height = pixelHeight;
      }
      const context = oracleContext;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const background = context.createRadialGradient(rect.width * 0.5, rect.height * 0.48, 8, rect.width * 0.5, rect.height * 0.48, Math.max(rect.width, rect.height) * 0.72);
      background.addColorStop(0, "#3c3157");
      background.addColorStop(0.5, "#211e34");
      background.addColorStop(1, "#171722");
      context.fillStyle = background;
      context.fillRect(0, 0, rect.width, rect.height);
      const english = document.documentElement.lang === "en";
      const frames = activeMorphFrames();
      const left = 34;
      const right = rect.width - 34;
      const centerY = rect.height * 0.51;
      const amplitude = Math.min(rect.height * 0.25, 88);
      const length = Math.max(frames.length, 2);
      if (importedTimelines.length >= 2) {
        const startX = left + (crossoverPercent / 100) * (right - left);
        const endX = left + (crossoverEndPercent / 100) * (right - left);
        context.fillStyle = "#d9a7ff12";
        context.fillRect(startX, 34, Math.max(1, endX - startX), rect.height - 68);
        [
          [startX, "#d9a7ff", "A"],
          [endX, "#ff8f9e", "B"],
        ].forEach(([x, color, label]) => {
          context.strokeStyle = String(color);
          context.lineWidth = 1.5;
          context.setLineDash([5, 4]);
          context.beginPath();
          context.moveTo(Number(x), 30);
          context.lineTo(Number(x), rect.height - 30);
          context.stroke();
          context.setLineDash([]);
          context.fillStyle = String(color);
          context.font = "700 9px ui-monospace, SFMono-Regular, monospace";
          context.fillText(`✦ ${label}`, Number(x) + 5, 40);
        });
      }
      context.strokeStyle = "#e9ddff18";
      context.lineWidth = 1;
      for (let row = -2; row <= 2; row += 1) {
        context.beginPath();
        context.moveTo(left, centerY + row * amplitude * 0.5);
        context.lineTo(right, centerY + row * amplitude * 0.5);
        context.stroke();
      }
      if (!frames.length) {
        context.fillStyle = "#c8bfdc";
        context.font = "700 11px ui-monospace, SFMono-Regular, monospace";
        context.fillText(english ? "RECORD A SECTION TIMELINE TO OPEN THE ORACLE" : "先录制截面时间线，才能打开拓扑预言图", left, centerY);
        return;
      }
      const eventColor: Record<string, string> = { birth: "#8ffff2", vanish: "#ff8f9e", grow: "#ffe3a0", shrink: "#ffca68", stable: "#b9a8ff" };
      const pointsA: [number, number][] = [];
      const pointsB: [number, number][] = [];
      frames.forEach((frame, index) => {
        const progress = index / Math.max(1, length - 1);
        const candidate = selectedLoopSignature
          ? frame.loops.filter((loop) => loop.role === selectedLoopSignature?.role).sort((leftLoop, rightLoop) => Math.abs(leftLoop.area - selectedLoopSignature!.area) - Math.abs(rightLoop.area - selectedLoopSignature!.area))[0]
          : frame.loops[0];
        const previous = index > 0 ? frames[index - 1].loops[0] : undefined;
        const event = classifyTopologyEvent(candidate, previous);
        const areaRatio = Math.min(1.8, Math.max(0.2, (candidate?.area ?? frame.area) / Math.max(frame.area, 1e-6)));
        const twist = progress * Math.PI * (5.6 + oracleMutation * 2.8) + Math.sin(progress * Math.PI * (8 + oracleMutation * 10)) * (0.16 + oracleMutation * 0.7);
        const x = left + progress * (right - left);
        const wobble = amplitude * (0.72 + areaRatio * 0.16) * (1 + oracleMutation * 0.42);
        pointsA.push([x, centerY + Math.sin(twist) * wobble]);
        pointsB.push([x, centerY - Math.sin(twist) * wobble]);
        if (index % Math.max(1, Math.floor(length / 28)) === 0 || event !== "stable") {
          context.beginPath();
          context.arc(x, centerY + Math.sin(twist) * wobble, event === "stable" ? 2.2 : 5.2, 0, Math.PI * 2);
          context.fillStyle = eventColor[event] ?? eventColor.stable;
          context.shadowColor = context.fillStyle;
          context.shadowBlur = event === "stable" ? 5 : 16;
          context.fill();
          context.shadowBlur = 0;
        }
      });
      const drawStrand = (points: [number, number][], offset: number): void => {
        context.beginPath();
        points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
        context.strokeStyle = offset ? "#8ffff2d9" : "#ffca68d9";
        context.lineWidth = 2.2;
        context.shadowColor = context.strokeStyle;
        context.shadowBlur = 11;
        context.stroke();
        context.shadowBlur = 0;
      };
      drawStrand(pointsA, 0);
      drawStrand(pointsB, 1);
      if (lockedEventFrame !== null) {
        const lockIndex = Math.min(lockedEventFrame, pointsA.length - 1);
        const lockX = pointsA[lockIndex][0];
        context.strokeStyle = "#fff4cecc";
        context.lineWidth = 1.6;
        context.shadowColor = "#fff4ce";
        context.shadowBlur = 18;
        context.beginPath();
        context.moveTo(lockX, 34);
        context.lineTo(lockX, rect.height - 30);
        context.stroke();
        context.shadowBlur = 0;
        context.fillStyle = "#fff4ce";
        context.font = "700 8px ui-monospace, SFMono-Regular, monospace";
        context.fillText(`${english ? "LOCKED" : "已锁定"} · ${lockedEventType.toUpperCase()}`, Math.min(right - 112, lockX + 6), 42);
      }
      context.strokeStyle = "#f5f0ff35";
      context.lineWidth = 0.8;
      for (let index = 0; index < pointsA.length; index += Math.max(1, Math.floor(length / 24))) {
        context.beginPath();
        context.moveTo(pointsA[index][0], pointsA[index][1]);
        context.lineTo(pointsB[index][0], pointsB[index][1]);
        context.stroke();
      }
      context.fillStyle = "#f5f0ff";
      context.font = "600 10px ui-monospace, SFMono-Regular, monospace";
      context.fillText(importedTimelines.length >= 2
        ? english ? "TOPOLOGY DNA · LIVE RECOMBINATION PREVIEW" : "拓扑 DNA · 实时重组预览"
        : english ? "TOPOLOGY DNA · REAL STEP HISTORY" : "拓扑 DNA · 真实 STEP 历史", left, 24);
      context.fillStyle = "#c8bfdc";
      context.font = "9px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? `${frames.length} FRAMES · ${selectedLoopSignature?.role.toUpperCase() ?? "ALL LOOPS"} · MUTATION ${Math.round(oracleMutation * 100)}%` : `${frames.length} 帧 · ${selectedLoopSignature?.role ?? "全部环"} · 突变 ${Math.round(oracleMutation * 100)}%`, left, rect.height - 18);
      context.textAlign = "right";
      context.fillStyle = "#ffe3a0";
      context.fillText(english ? "BIRTH ← → VANISH" : "出生 ← → 消失", right, rect.height - 18);
      context.textAlign = "left";
    };
    drawMorph = (): void => {
      if (annihilationActive) {
        drawAnnihilation();
        return;
      }
      if (!morphCanvas || !morphContext) return;
      const rect = morphCanvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(rect.width * ratio);
      const pixelHeight = Math.round(rect.height * ratio);
      if (morphCanvas.width !== pixelWidth || morphCanvas.height !== pixelHeight) {
        morphCanvas.width = pixelWidth;
        morphCanvas.height = pixelHeight;
      }
      const context = morphContext;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const background = context.createLinearGradient(0, 0, rect.width, rect.height);
      background.addColorStop(0, "#24233a");
      background.addColorStop(0.5, "#201f31");
      background.addColorStop(1, "#171722");
      context.fillStyle = background;
      context.fillRect(0, 0, rect.width, rect.height);
      const english = document.documentElement.lang === "en";
      const frames = importedTimelines.length >= 2 ? buildRecombinedTimeline() : recordedFrames;
      const left = 48;
      const right = rect.width - 24;
      const top = 54;
      const bottom = rect.height - 48;
      const plotWidth = Math.max(1, right - left);
      const plotHeight = Math.max(1, bottom - top);
      context.strokeStyle = "#e9ddff1d";
      context.lineWidth = 1;
      for (let row = 0; row <= 4; row += 1) {
        const y = top + plotHeight * row / 4;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(right, y);
        context.stroke();
      }
      for (let column = 0; column <= 6; column += 1) {
        const x = left + plotWidth * column / 6;
        context.beginPath();
        context.moveTo(x, top);
        context.lineTo(x, bottom);
        context.stroke();
      }
      context.fillStyle = "#f5f0ff";
      context.font = "600 10px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? "TOPOLOGY MORPH FIELD · REAL STEP HISTORY" : "拓扑形变场 · 真实 STEP 历史", left, 24);
      context.fillStyle = "#c8bfdc";
      context.font = "9px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? "AREA ↕ · TIME → · LOOP MASS = NODE SIZE" : "面积 ↕ · 时间 → · 环数量 = 节点质量", left, 39);
      if (!frames.length) {
        context.fillStyle = "#c8bfdc";
        context.font = "700 11px ui-monospace, SFMono-Regular, monospace";
        context.fillText(english ? "RECORD A SECTION TIMELINE TO OPEN THE MORPH FIELD" : "先录制截面时间线，才能打开拓扑形变场", left, rect.height * 0.5);
        return;
      }
      const areas = frames.map((frame) => frame.area);
      const minArea = Math.min(...areas);
      const maxArea = Math.max(...areas, minArea + 1e-6);
      const points: { x: number; y: number; event: string; frame: SectionFrame }[] = [];
      const eventColor: Record<string, string> = { birth: "#8ffff2", vanish: "#ff8f9e", grow: "#ffe3a0", shrink: "#ffca68", stable: "#b9a8ff" };
      frames.forEach((frame, index) => {
        const progress = index / Math.max(1, frames.length - 1);
        let x = left + progress * plotWidth;
        const normalizedArea = (frame.area - minArea) / Math.max(maxArea - minArea, 1e-6);
        let y = bottom - normalizedArea * plotHeight;
        const candidate = selectedLoopSignature
          ? frame.loops.filter((loop) => loop.role === selectedLoopSignature?.role).sort((a, b) => Math.abs(a.area - selectedLoopSignature!.area) - Math.abs(b.area - selectedLoopSignature!.area))[0]
          : frame.loops[0];
        const previous = index > 0 ? frames[index - 1].loops[0] : undefined;
        if (morphGravityEnabled && morphAttractor) {
          const distance = Math.hypot(morphAttractor.x - x, morphAttractor.y - y);
          const influence = Math.max(0, 1 - distance / Math.max(rect.width * 0.48, 1));
          const pull = influence * influence * (0.18 + morphTension * 0.42);
          x += (morphAttractor.x - x) * pull;
          y += (morphAttractor.y - y) * pull;
        }
        points.push({ x, y, event: classifyTopologyEvent(candidate, previous), frame });
      });
      context.beginPath();
      points.forEach(({ x, y }, index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
      context.strokeStyle = "#d9a7ff88";
      context.lineWidth = 1.5 + morphTension * 1.5;
      context.shadowColor = "#d9a7ff88";
      context.shadowBlur = 12 + morphTension * 10;
      context.stroke();
      context.shadowBlur = 0;
      points.forEach(({ x, y, event, frame }) => {
        const radius = Math.max(2.5, Math.min(12, 3 + frame.loops.length * 1.7 + morphTension * 4));
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = eventColor[event] ?? eventColor.stable;
        context.globalAlpha = event === "stable" ? 0.62 : 0.95;
        context.shadowColor = context.fillStyle;
        context.shadowBlur = event === "stable" ? 5 : 18;
        context.fill();
        context.shadowBlur = 0;
        if (event !== "stable") {
          context.fillStyle = "#fff4ce";
          context.font = "700 7px ui-monospace, SFMono-Regular, monospace";
          context.fillText(event.toUpperCase(), x + 6, y - 7);
        }
      });
      context.globalAlpha = 1;
      const activeIndex = Math.min(Math.max(playbackIndex, 0), points.length - 1);
      const active = points[activeIndex];
      if (active) {
        context.strokeStyle = "#fff4cecc";
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(active.x, top - 7);
        context.lineTo(active.x, bottom + 6);
        context.stroke();
        context.fillStyle = "#fff4ce";
        context.font = "700 8px ui-monospace, SFMono-Regular, monospace";
        context.fillText(`${english ? "FRAME" : "帧"} ${activeIndex + 1}/${frames.length} · ${active.event.toUpperCase()}`, Math.min(right - 148, active.x + 6), top - 12);
      }
      if (lockedEventFrame !== null) {
        const locked = points[Math.min(lockedEventFrame, points.length - 1)];
        if (locked) {
          context.strokeStyle = "#fff4ce66";
          context.setLineDash([3, 4]);
          context.beginPath();
          context.arc(locked.x, locked.y, 16 + morphTension * 6, 0, Math.PI * 2);
          context.stroke();
          context.setLineDash([]);
        }
      }
      if (morphGravityEnabled && morphAttractor) {
        const pulse = state.reducedMotion ? 1 : 0.82 + Math.sin(performance.now() * 0.004) * 0.12;
        context.strokeStyle = `#8ffff2${Math.round(150 * pulse).toString(16).padStart(2, "0")}`;
        context.lineWidth = 1.2;
        context.setLineDash([4, 5]);
        context.beginPath();
        context.arc(morphAttractor.x, morphAttractor.y, 18 + morphTension * 26, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = "#8ffff2";
        context.font = "700 8px ui-monospace, SFMono-Regular, monospace";
        context.fillText(english ? "GRAVITY WELL" : "拓扑引力井", morphAttractor.x + 22, morphAttractor.y - 5);
      }
      context.fillStyle = "#c8bfdc";
      context.font = "9px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? "LOW AREA" : "低面积", left, bottom + 23);
      context.textAlign = "right";
      context.fillText(english ? "HIGH AREA" : "高面积", right, top - 12);
      context.textAlign = "left";
      context.fillStyle = "#8ffff2";
      context.fillText(english ? `${frames.length} FRAMES · DRAG TO BEND HISTORY` : `${frames.length} 帧 · 拖动以弯曲历史`, left, rect.height - 16);
      context.textAlign = "left";
    };
    drawAnnihilation = (): void => {
      if (!morphCanvas || !morphContext) return;
      const rect = morphCanvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(rect.width * ratio);
      const pixelHeight = Math.round(rect.height * ratio);
      if (morphCanvas.width !== pixelWidth || morphCanvas.height !== pixelHeight) {
        morphCanvas.width = pixelWidth;
        morphCanvas.height = pixelHeight;
      }
      const context = morphContext;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const gradient = context.createRadialGradient(rect.width * 0.52, rect.height * 0.48, 5, rect.width * 0.52, rect.height * 0.48, Math.max(rect.width, rect.height) * 0.78);
      gradient.addColorStop(0, "#4a2b49");
      gradient.addColorStop(0.46, "#261f35");
      gradient.addColorStop(1, "#15151f");
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);
      const english = document.documentElement.lang === "en";
      const source = baseMorphFrames();
      const anti = buildAntimatterTimeline(source);
      const left = 42;
      const right = rect.width - 26;
      const top = 58;
      const bottom = rect.height - 52;
      const plotWidth = Math.max(1, right - left);
      const plotHeight = Math.max(1, bottom - top);
      context.fillStyle = "#f5f0ff";
      context.font = "600 10px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? "TOPOLOGY ANNIHILATION · MATTER / ANTIMATTER" : "拓扑湮灭场 · 物质 / 反物质", left, 24);
      context.fillStyle = "#c8bfdc";
      context.font = "9px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? "CONFLICT ENERGY · ROLE REVERSAL · GHOST CONTOURS" : "冲突能量 · 角色反转 · 几何幽灵轮廓", left, 39);
      if (!source.length) {
        context.fillText(english ? "RECORD A TIMELINE TO RELEASE THE FIELD" : "先录制时间线以释放湮灭场", left, rect.height * 0.5);
        return;
      }
      const energies = source.map((frame) => frame.loops.filter(({ role }) => role === "outer" || role === "hole").length);
      const maximumEnergy = Math.max(...energies, 1);
      context.strokeStyle = "#f3f0ff1c";
      context.lineWidth = 1;
      for (let row = 0; row <= 4; row += 1) {
        const y = top + plotHeight * row / 4;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(right, y);
        context.stroke();
      }
      energies.forEach((energy, index) => {
        const x = left + index / Math.max(1, energies.length - 1) * plotWidth;
        const height = energy / maximumEnergy * plotHeight;
        context.fillStyle = energy > maximumEnergy * 0.6 ? "#ff8f9ecc" : "#d9a7ff99";
        context.fillRect(x - 1, bottom - height, 2, height);
      });
      const currentIndex = Math.min(Math.max(playbackIndex, 0), source.length - 1);
      const sourceFrame = source[currentIndex];
      const antiFrame = anti[currentIndex];
      const radius = Math.max(state.modelRadius, 1e-5);
      const drawContours = (frame: SectionFrame, color: string, dash: number[]): void => {
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 1.4;
        context.setLineDash(dash);
        frame.loops.forEach(({ points, role }) => {
          if (points.length < 3) return;
          context.beginPath();
          points.forEach(([x, y], index) => {
            const screenX = rect.width * 0.5 + (x / (radius * 2)) * rect.width * 0.44;
            const screenY = rect.height * 0.52 - (y / (radius * 2)) * rect.height * 0.66;
            if (index === 0) context.moveTo(screenX, screenY);
            else context.lineTo(screenX, screenY);
          });
          context.closePath();
          context.globalAlpha = role === "hole" ? 0.72 : 0.42;
          context.stroke();
        });
        context.restore();
      };
      drawContours(sourceFrame, "#ff8f9edd", []);
      drawContours(antiFrame, "#8ffff2dd", [5, 4]);
      const centerX = rect.width * 0.5;
      const centerY = rect.height * 0.52;
      const pulse = state.reducedMotion ? 1 : 0.82 + Math.sin(performance.now() * 0.005) * 0.16;
      context.strokeStyle = `#fff4ce${Math.round(160 * pulse).toString(16).padStart(2, "0")}`;
      context.lineWidth = 2;
      context.shadowColor = "#fff4ce";
      context.shadowBlur = 18;
      context.beginPath();
      context.arc(centerX, centerY, 24 + energies[currentIndex] * 2.4 * pulse, 0, Math.PI * 2);
      context.stroke();
      context.shadowBlur = 0;
      context.fillStyle = "#fff4ce";
      context.font = "700 8px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? `ANNIHILATION ENERGY ${energies[currentIndex]}` : `湮灭能量 ${energies[currentIndex]}`, left, bottom + 22);
      context.fillStyle = "#ff8f9e";
      context.fillText(english ? "MATTER" : "物质", left, top - 12);
      context.fillStyle = "#8ffff2";
      context.fillText(english ? "ANTIMATTER" : "反物质", right - 78, top - 12);
      context.fillStyle = "#f3f0ff";
      context.fillText(`${english ? "FRAME" : "帧"} ${currentIndex + 1}/${source.length}`, right - 72, rect.height - 16);
    };
    const scrubMorph = (event: PointerEvent): void => {
      if (!morphCanvas || baseMorphFrames().length < 2) return;
      const rect = morphCanvas.getBoundingClientRect();
      morphAttractor = {
        x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
        y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
      };
      const progress = Math.max(0, Math.min(1, (event.clientX - rect.left - 48) / Math.max(1, rect.width - 72)));
      const vertical = Math.max(0, Math.min(1, (event.clientY - rect.top - 54) / Math.max(1, rect.height - 102)));
      morphTension = 1 - vertical;
      if (morphGravityEnabled) {
        morphTimeline = buildMorphTimeline();
        morphForkActive = morphTimeline.length > 1;
        stage.dataset.morphFork = String(morphForkActive);
      }
      const morphFrames = activeMorphFrames();
      playback = false;
      state.sliceScanning = false;
      window.clearTimeout(playbackTimer);
      playbackIndex = Math.round(progress * (morphFrames.length - 1));
      const frame = morphFrames[playbackIndex];
      state.sliceEnabled = true;
      state.sliceAxis = frame.axis;
      state.slicePercent = frame.percent;
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
      applySectionMode();
      wake();
    };
    morphCanvas?.addEventListener("pointerdown", (event) => {
      if (recordedFrames.length < 2) return;
      morphDragging = true;
      morphCanvas.setPointerCapture(event.pointerId);
      scrubMorph(event);
    });
    morphCanvas?.addEventListener("pointermove", (event) => { if (morphDragging) scrubMorph(event); });
    morphCanvas?.addEventListener("pointerup", (event) => {
      morphDragging = false;
      morphCanvas.releasePointerCapture(event.pointerId);
    });
    morphCanvas?.addEventListener("pointercancel", () => { morphDragging = false; });
    morphGravityButton?.addEventListener("click", () => {
      morphGravityEnabled = !morphGravityEnabled;
      morphGravityButton.setAttribute("aria-pressed", String(morphGravityEnabled));
      if (!morphGravityEnabled) morphAttractor = null;
      wake();
    });
    morphResonanceButton?.addEventListener("click", () => {
      if (!explodedMeshes.length) return;
      const english = document.documentElement.lang === "en";
      resonanceActive = !resonanceActive;
      stage.dataset.resonance = String(resonanceActive);
      morphResonanceButton.setAttribute("aria-pressed", String(resonanceActive));
      morphResonanceButton.textContent = resonanceActive
        ? english ? "RESONANCE ◇ ON" : "共振 ◇ 已启用"
        : english ? "RESONATE ◇" : "共振 ◇";
      if (resonanceActive) {
        stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
        triggerBranchWarp(0.72);
      }
      wake();
    });
    morphMutateButton?.addEventListener("click", () => {
      if (!explodedMeshes.length) return;
      const entropy = performance.now() * 0.001 + state.pointerX * 7.1 + state.pointerY * 11.3 + forecastBranchIndex * 1.7;
      swarmGene = (Math.sin(entropy * 12.9898) * 43758.5453) % 1;
      if (swarmGene < 0) swarmGene += 1;
      mutationPulse = 1;
      resonanceActive = true;
      stage.dataset.resonance = "true";
      stage.dataset.swarmMutation = String(Math.round(swarmGene * 1000));
      morphResonanceButton?.setAttribute("aria-pressed", "true");
      if (causalEntangled) broadcastResonance(1, state.pointerX * 0.9 + state.pointerY * 0.4, swarmGene);
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
      triggerBranchWarp(0.98);
      wake();
    });
    morphCrossbreedButton?.addEventListener("click", () => {
      if (!explodedMeshes.length) return;
      const topologyGene = (currentSectionTopology.reduce((sum, loop) => sum + loop.area * (loop.role === "hole" ? -1 : 1), 0) * 0.17 + currentSectionPerimeter * 0.031) % 1;
      const partnerGene = peerSwarmGene > 0.01 ? peerSwarmGene : (topologyGene < 0 ? topologyGene + 1 : topologyGene);
      const crossover = 0.22 + ((Math.sin(performance.now() * 0.004) + 1) * 0.5) * 0.56;
      swarmGene = (swarmGene * crossover + partnerGene * (1 - crossover)) % 1;
      mutationPulse = 1;
      resonanceActive = true;
      stage.dataset.resonance = "true";
      stage.dataset.swarmCrossbreed = String(Math.round(swarmGene * 1000));
      morphResonanceButton?.setAttribute("aria-pressed", "true");
      if (causalEntangled) broadcastResonance(1, state.pointerX * 0.9 + state.pointerY * 0.4, swarmGene);
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
      triggerBranchWarp(1.18);
      wake();
    });
    morphEvolveButton?.addEventListener("click", () => {
      if (!explodedMeshes.length) return;
      const outerCount = currentSectionTopology.filter(({ role }) => role === "outer").length;
      const holeCount = currentSectionTopology.filter(({ role }) => role === "hole").length;
      const islandCount = currentSectionTopology.filter(({ role }) => role === "island").length;
      const areaSignal = Math.min(1, Math.tanh(Math.max(0, currentSectionArea) * 0.5));
      const perimeterSignal = Math.min(1, Math.tanh(Math.max(0, currentSectionPerimeter) * 0.08));
      const roleSignal = Math.min(1, (outerCount * 0.42 + holeCount * 0.31 + islandCount * 0.19) / 2);
      const targetGene = (areaSignal * 0.44 + perimeterSignal * 0.33 + roleSignal * 0.23) % 1;
      let candidates = [swarmGene, peerSwarmGene > 0.01 ? peerSwarmGene : targetGene, targetGene];
      let champion = candidates[0];
      let championFitness = -Infinity;
      for (let round = 0; round < 4; round += 1) {
        candidates = candidates.map((gene, index) => (gene + Math.sin((round + 1) * (index + 2) * 1.71 + targetGene * 8) * 0.045 + 1) % 1);
        candidates.forEach((gene) => {
          const distance = Math.abs(Math.sin((gene - targetGene) * Math.PI));
          const diversity = Math.abs(gene - swarmGene) * 0.12;
          const fitness = 1 - distance + diversity;
          if (fitness > championFitness) {
            champion = gene;
            championFitness = fitness;
          }
        });
        candidates = [champion, candidates[(round + 1) % candidates.length], candidates[(round + 2) % candidates.length]];
      }
      swarmGene = champion;
      mutationPulse = 1;
      resonanceActive = true;
      stage.dataset.resonance = "true";
      stage.dataset.swarmChampion = `${Math.round(swarmGene * 1000)}:${Math.round(championFitness * 1000)}`;
      archiveGenome("evolve", championFitness);
      morphResonanceButton?.setAttribute("aria-pressed", "true");
      if (causalEntangled) broadcastResonance(1, state.pointerX * 0.9 + state.pointerY * 0.4, swarmGene);
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
      triggerBranchWarp(1.42);
      wake();
    });
    morphArchiveButton?.addEventListener("click", () => {
      if (!explodedMeshes.length) return;
      const fitness = Math.max(0, Math.min(2, 1 - Math.abs(Math.sin(swarmGene * Math.PI)) + resonanceEnergy * 0.2));
      archiveGenome("manual", fitness);
      stage.dataset.swarmArchived = String(Math.round(swarmGene * 1000));
      mutationPulse = 1;
      resonanceActive = true;
      stage.dataset.resonance = "true";
      morphResonanceButton?.setAttribute("aria-pressed", "true");
      if (causalEntangled) broadcastResonance(1, state.pointerX * 0.9 + state.pointerY * 0.4, swarmGene);
      wake();
    });
    genomeDuelButton?.addEventListener("click", () => {
      if (swarmArchive.length < 2) return;
      arenaMixActive = false;
      syncArenaMixControl();
      arenaReplayActive = false;
      arenaReplayManual = false;
      if (genomeArenaTimeline) genomeArenaTimeline.hidden = true;
      openGenomeDuel();
      if (genomeDuelActive) {
        stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
        triggerBranchWarp(1.6);
        if (causalEntangled) broadcastResonance(1, state.pointerX * 0.9 + state.pointerY * 0.4, swarmGene);
      }
      genomeDuelButton.textContent = genomeDuelActive ? "DUEL ⚡ ON" : "DUEL ⚡";
      genomeDuelButton.setAttribute("aria-pressed", String(genomeDuelActive));
      wake();
    });
    genomeSpectateButton?.addEventListener("click", () => {
      const armedAt = performance.now();
      if (armedAt - spectatorToggleArmedAt < 260) return;
      spectatorToggleArmedAt = armedAt;
      spectatorActive = !spectatorActive;
      genomeSpectateButton.setAttribute("aria-pressed", String(spectatorActive));
      genomeSpectateButton.textContent = spectatorActive ? "SPECTATE ◉ ON" : "SPECTATE ◉";
      if (spectatorActive) {
        try {
          const recent = window.localStorage.getItem(genomeDuelStorageKey);
          if (recent) receiveGenomeDuel(JSON.parse(recent));
        } catch { /* A blocked storage context can still use BroadcastChannel. */ }
        broadcastGenomeDuel();
        if (lineageReadout && !spectatorPeerActive) lineageReadout.textContent = document.documentElement.lang === "en" ? "SPECTATOR ◉ READY" : "观战 ◉ 就绪";
      } else {
        clearSpectatorPeer();
        spectatorGroup.visible = false;
        if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "LINEAGE ∞" : "谱系 ∞"} ${swarmArchive.length}`;
      }
      wake();
    });
    genomeSpectateButton?.addEventListener("pointerup", () => {
      if (performance.now() - spectatorToggleArmedAt < 260) return;
      genomeSpectateButton.click();
    });
    genomeArenaButton?.addEventListener("click", () => {
      const armedAt = performance.now();
      if (armedAt - arenaToggleArmedAt < 260) return;
      arenaToggleArmedAt = armedAt;
      arenaVisible = !arenaVisible;
      genomeArenaButton.setAttribute("aria-pressed", String(arenaVisible));
      syncArenaBoard();
      wake();
    });
    genomeArenaButton?.addEventListener("pointerup", () => {
      if (performance.now() - arenaToggleArmedAt < 260) return;
      genomeArenaButton.click();
    });
    genomeArenaTimeSlider?.addEventListener("input", () => {
      arenaMixActive = false;
      syncArenaMixControl();
      arenaReplayManual = true;
      arenaReplayProgress = Math.max(0, Math.min(1, Number(genomeArenaTimeSlider.value) / 100));
      syncArenaReplayTime();
      stage.dataset.genomeArenaReplayPhase = String(Math.round(arenaReplayProgress * 100));
      wake();
    });
    genomeArenaMixButton?.addEventListener("click", () => {
      if (!arenaHistory.length) return;
      arenaMixActive = !arenaMixActive;
      if (arenaMixActive) {
        arenaMixIndex = 0;
        replayArenaRound(arenaHistory[arenaMixIndex]);
      }
      syncArenaMixControl();
      wake();
    });
    genomeArenaBridgeDuelButton?.addEventListener("click", () => {
      if (!stage.dataset.genomeArenaBridgeGene || swarmArchive.length < 2) return;
      arenaMixActive = false;
      syncArenaMixControl();
      arenaReplayActive = false;
      if (genomeArenaTimeline) genomeArenaTimeline.hidden = false;
      if (genomeDuelActive) openGenomeDuel();
      if (!genomeDuelActive) openGenomeDuel();
      if (genomeDuelButton) {
        genomeDuelButton.textContent = "DUEL ⚡ BRIDGE";
        genomeDuelButton.setAttribute("aria-pressed", "true");
      }
      stage.dataset.genomeArenaBridgeDuel = "true";
      if (genomeArenaAscendButton) genomeArenaAscendButton.disabled = false;
      if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "BRIDGE DUEL ⚔" : "桥接决斗 ⚔"} ${stage.dataset.genomeArenaBridgeGene}`;
      triggerBranchWarp(1.9);
      wake();
    });
    genomeArenaAscendButton?.addEventListener("click", () => {
      if (!stage.dataset.genomeArenaBridgeDuel || swarmArchive.length < 2) return;
      const winnerIndex = Math.max(0, Math.min(swarmArchive.length - 1, Number(stage.dataset.genomeDuelWinner ?? swarmArchive.length) - 1));
      const winner = swarmArchive[winnerIndex] ?? swarmArchive[swarmArchive.length - 1];
      const loser = swarmArchive[winnerIndex === swarmArchive.length - 1 ? swarmArchive.length - 2 : swarmArchive.length - 1];
      if (!winner || !loser) return;
      if (genomeDuelActive) openGenomeDuel();
      const topologySignal = (currentSectionTopology.reduce((sum, loop) => sum + loop.area * (loop.role === "hole" ? -1 : 1), 0) * 0.17 + currentSectionPerimeter * 0.031) % 1;
      const mutation = Math.sin(performance.now() * 0.0027 + winner.gene * 19) * 0.055;
      swarmGene = (winner.gene * 0.68 + loser.gene * 0.18 + (topologySignal < 0 ? topologySignal + 1 : topologySignal) * 0.14 + mutation + 1) % 1;
      const fitness = Math.max(0, Math.min(2, winner.fitness * 0.84 + loser.fitness * 0.12 + Math.abs(winner.gene - loser.gene) * 0.48 + resonanceEnergy * 0.18));
      archiveGenome("ascended", fitness);
      arenaReplayActive = false;
      stage.dataset.genomeAscended = String(Math.round(swarmGene * 1000));
      stage.dataset.genomeArenaBridgeDuel = "false";
      if (genomeArenaAscendButton) {
        genomeArenaAscendButton.disabled = true;
        genomeArenaAscendButton.textContent = `${document.documentElement.lang === "en" ? "ASCENDED ✦" : "已升华 ✦"} ${Math.round(swarmGene * 1000)}`;
        genomeArenaAscendButton.setAttribute("aria-pressed", "true");
      }
      if (genomeDuelButton) {
        genomeDuelButton.textContent = "DUEL ⚡ ASCENDED";
        genomeDuelButton.setAttribute("aria-pressed", "false");
      }
      openGenomeDuel();
      if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "ASCENDED ✦" : "升华 ✦"} ${Math.round(swarmGene * 1000)}`;
      triggerBranchWarp(2.15);
      wake();
    });
    genomeArenaSeasonButton?.addEventListener("click", () => {
      crownSeasonChampion();
    });
    genomeArenaChallengeButton?.addEventListener("click", () => {
      if (!stage.dataset.genomeSeasonCrowned || swarmArchive.length < 2) return;
      const champion = swarmArchive.findLast((entry) => entry.kind === "season-champion") ?? swarmArchive[swarmArchive.length - 1];
      if (!champion) return;
      let rival: SwarmArchiveEntry | undefined;
      let rivalScore = -Infinity;
      swarmArchive.forEach((entry) => {
        if (entry === champion) return;
        if (Math.abs(entry.gene - champion.gene) < 0.001) return;
        const score = entry.fitness + entry.gene * 0.04;
        if (score > rivalScore) {
          rival = entry;
          rivalScore = score;
        }
      });
      if (!rival) {
        rival = swarmArchive.find((entry) => entry !== champion);
      }
      if (!rival) return;
      if (genomeDuelActive) openGenomeDuel();
      const previousArchive = swarmArchive;
      swarmArchive = [...previousArchive, { ...rival, kind: "season-challenger" }, { ...champion, kind: "season-title-defense" }];
      openGenomeDuel();
      swarmArchive = previousArchive;
      arenaReplayActive = false;
      stage.dataset.genomeSeasonChallenge = "true";
      stage.dataset.genomeSeasonChallenger = `${Math.round(rival.gene * 1000)}:${Math.round(champion.gene * 1000)}`;
      seasonBracket.push({ challenger: rival.gene * 1000, champion: champion.gene * 1000, score: [50, 50], winner: -1, at: Date.now() });
      while (seasonBracket.length > 12) seasonBracket.shift();
      lastSeasonChallengeScore = "";
      syncSeasonBracket();
      if (genomeArenaChallengeButton) {
        genomeArenaChallengeButton.textContent = `${document.documentElement.lang === "en" ? "CHALLENGE ⚔" : "挑战 ⚔"} ${Math.round(rival.gene * 1000)}`;
        genomeArenaChallengeButton.setAttribute("aria-pressed", "true");
      }
      if (genomeDuelButton) {
        genomeDuelButton.textContent = "DUEL ⚔ CHALLENGE";
        genomeDuelButton.setAttribute("aria-pressed", "true");
      }
      if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "TITLE DEFENSE ⚔" : "冠军卫冕 ⚔"} ${Math.round(rival.gene * 1000)} ↔ ${Math.round(champion.gene * 1000)}`;
      triggerBranchWarp(2.7);
      wake();
    });
    genomeDuelSpawnButton?.addEventListener("click", () => {
      const armedAt = performance.now();
      if (armedAt - genomeDuelSpawnArmedAt < 260) return;
      genomeDuelSpawnArmedAt = armedAt;
      const duelOpen = genomeDuelActive || Boolean(stage.dataset.genomeDuelState);
      if (!duelOpen || swarmArchive.length < 2) return;
      genomeDuelActive = true;
      const parentA = swarmArchive[swarmArchive.length - 2];
      const parentB = swarmArchive[swarmArchive.length - 1];
      const topologySignal = (currentSectionTopology.reduce((sum, loop) => sum + loop.area * (loop.role === "hole" ? -1 : 1), 0) * 0.19 + currentSectionPerimeter * 0.037) % 1;
      const crossover = 0.28 + (0.5 + 0.5 * Math.sin(performance.now() * 0.003)) * 0.44;
      const inheritedTopology = topologySignal < 0 ? topologySignal + 1 : topologySignal;
      swarmGene = (parentA.gene * crossover + parentB.gene * (1 - crossover) + inheritedTopology * 0.14 + resonanceEnergy * 0.06) % 1;
      if (swarmGene < 0) swarmGene += 1;
      const fitness = Math.max(0, Math.min(2, (parentA.fitness + parentB.fitness) * 0.5 + Math.abs(parentA.gene - parentB.gene) * 0.62 + resonanceEnergy * 0.24));
      mutationPulse = 1.8;
      resonanceActive = true;
      archiveGenome("offspring", fitness);
      if (causalEntangled) broadcastResonance(1, state.pointerX * 0.9 + state.pointerY * 0.4, swarmGene);
      openGenomeDuel();
      openGenomeDuel();
      genomeDuelButton?.setAttribute("aria-pressed", "true");
      if (genomeDuelButton) genomeDuelButton.textContent = "DUEL ⚡ ON";
      genomeDuelSpawnButton.textContent = "SPAWN ∴ BORN";
      window.setTimeout(() => { if (genomeDuelSpawnButton) genomeDuelSpawnButton.textContent = "SPAWN ∴"; }, 1400);
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
      triggerBranchWarp(1.85);
      stage.dataset.genomeOffspring = String(swarmArchive.length);
      if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "OFFSPRING ∴" : "后代 ∴"} ${Math.round(swarmGene * 1000)}`;
      wake();
    });
    genomeDuelSpawnButton?.addEventListener("pointerup", () => {
      if (performance.now() - genomeDuelSpawnArmedAt < 260) return;
      genomeDuelSpawnButton.click();
    });
    morphGenomeShareButton?.addEventListener("click", async () => {
      const index = swarmArchive.length - 1;
      const entry = swarmArchive[index];
      if (!entry) return;
      const url = new URL(location.href);
      url.hash = `story-genome?${new URLSearchParams({
        index: String(index),
        gene: String(entry.gene),
        fitness: String(entry.fitness),
        kind: entry.kind,
        axis: entry.sliceAxis ?? "x",
        percent: String(Math.round(entry.slicePercent ?? 50)),
      }).toString()}`;
      history.replaceState(null, "", url.href);
      stage.dataset.swarmShared = String(index + 1);
      try {
        await navigator.clipboard.writeText(url.href);
      } catch { /* The address bar remains the reliable fallback. */ }
      if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "SHARED ∞" : "已分享 ∞"} ${index + 1}`;
      wake();
    });
    morphGenomePassportButton?.addEventListener("click", () => {
      const index = swarmArchive.length - 1;
      const entry = swarmArchive[index];
      if (!entry) return;
      const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character] ?? character));
      const shareUrl = new URL(location.href);
      shareUrl.hash = `story-genome?${new URLSearchParams({
        index: String(index),
        gene: String(entry.gene),
        fitness: String(entry.fitness),
        kind: entry.kind,
        axis: entry.sliceAxis ?? "x",
        percent: String(Math.round(entry.slicePercent ?? 50)),
      }).toString()}`;
      const geneLabel = Math.round(entry.gene * 1000).toString().padStart(3, "0");
      const fitnessLabel = entry.fitness.toFixed(2);
      const accent = new THREE.Color().setHSL((entry.gene * 0.72 + 0.52) % 1, 0.76, 0.68).getStyle();
      const passportMetadata = escapeXml(JSON.stringify({
        kind: "easyki-topology-passport",
        version: 1,
        gene: entry.gene,
        fitness: entry.fitness,
        archive: index + 1,
        genomeKind: entry.kind,
        axis: entry.sliceAxis ?? "x",
        percent: Math.round(entry.slicePercent ?? 50),
      }));
      const ribbon = Array.from({ length: 28 }, (_, ribbonIndex) => {
        const x = 178 + ribbonIndex * 32;
        const wave = Math.sin(ribbonIndex * 0.72 + entry.gene * 12) * 54;
        return `<path d="M ${x} ${260 + wave} C ${x + 20} ${210 - wave} ${x + 20} ${310 - wave} ${x + 40} ${260 + wave}"/><path d="M ${x} ${260 - wave} C ${x + 20} ${310 + wave} ${x + 20} ${210 + wave} ${x + 40} ${260 - wave}"/><line x1="${x + 8}" y1="${260 + wave * .72}" x2="${x + 8}" y2="${260 - wave * .72}"/>`;
      }).join("");
      const orbit = Array.from({ length: 18 }, (_, orbitIndex) => {
        const angle = (orbitIndex / 18) * Math.PI * 2;
        const radius = 118 + Math.sin(orbitIndex * 1.7 + entry.fitness) * 24;
        return `${600 + Math.cos(angle) * radius},${270 + Math.sin(angle) * radius * 0.62}`;
      }).join(" ");
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
  <metadata>${passportMetadata}</metadata><defs><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#191827"/><stop offset="1" stop-color="#2d2742"/></linearGradient><radialGradient id="halo"><stop stop-color="${accent}" stop-opacity=".55"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="760" rx="40" fill="url(#paper)"/>
  <circle cx="600" cy="270" r="250" fill="url(#halo)" opacity=".7"/>
  <g fill="none" stroke="${accent}" stroke-width="2" opacity=".7">${ribbon}</g>
  <polygon points="${orbit}" fill="none" stroke="#ffe3a0" stroke-width="3" opacity=".8"/>
  <g fill="#fff4ce" font-family="ui-monospace, SFMono-Regular, monospace"><text x="72" y="90" font-size="22" letter-spacing="6">EASYKICONVERTER / TOPOLOGY PASSPORT</text><text x="72" y="150" font-size="64" font-weight="700">GENOME ${escapeXml(geneLabel)}</text><text x="74" y="190" font-size="18" fill="#c8bfdc">ARCHIVE ${index + 1} · ${escapeXml(entry.kind.toUpperCase())}</text><text x="72" y="654" font-size="18" fill="#c8bfdc">FITNESS ${escapeXml(fitnessLabel)} · ${escapeXml((entry.sliceAxis ?? "x").toUpperCase())} ${Math.round(entry.slicePercent ?? 50)}% · ${entry.frames?.length ?? 0} FRAMES</text><text x="72" y="700" font-size="14" fill="#aaa1be">A portable visual record of one real STEP geometry mutation.</text></g>
  <circle cx="600" cy="270" r="12" fill="#fff4ce"/><circle cx="600" cy="270" r="5" fill="${accent}"/>
  <g fill="#ffe3a0" font-family="ui-monospace, SFMono-Regular, monospace" font-size="12"><text x="962" y="654">${escapeXml(shareUrl.hash.slice(0, 38))}</text><text x="962" y="674">${escapeXml(shareUrl.hash.slice(38, 82))}</text></g>
</svg>`;
      const download = document.createElement("a");
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      download.href = url;
      download.download = `easyki-genome-passport-${geneLabel}.svg`;
      document.body.append(download);
      download.click();
      download.remove();
      URL.revokeObjectURL(url);
      stage.dataset.swarmPassport = String(index + 1);
      if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "PASSPORT ✦" : "护照 ✦"} ${index + 1}`;
      wake();
    });
    morphGenomeInjectButton?.addEventListener("click", () => morphGenomeInput?.click());
    morphGenomeInput?.addEventListener("change", async () => {
      const file = morphGenomeInput.files?.[0];
      morphGenomeInput.value = "";
      if (!file) return;
      try {
        const svgDocument = new DOMParser().parseFromString(await file.text(), "image/svg+xml");
        const metadata = svgDocument.querySelector("metadata")?.textContent?.trim();
        if (!metadata) throw new Error("missing passport metadata");
        const value = JSON.parse(metadata) as { kind?: unknown; version?: unknown; gene?: unknown; fitness?: unknown; genomeKind?: unknown; axis?: unknown; percent?: unknown };
        const axis = value.axis === "x" || value.axis === "y" || value.axis === "z" ? value.axis : "x";
        if (value.kind !== "easyki-topology-passport" || value.version !== 1 || typeof value.gene !== "number" || typeof value.fitness !== "number") throw new Error("invalid passport");
        const imported: SwarmArchiveEntry = { gene: Math.max(0, Math.min(1, value.gene)), fitness: value.fitness, kind: typeof value.genomeKind === "string" ? value.genomeKind : "passport", at: Date.now(), sliceAxis: axis, slicePercent: typeof value.percent === "number" ? Math.max(0, Math.min(100, value.percent)) : 50 };
        swarmArchive = [...swarmArchive, imported].slice(-24);
        swarmGene = imported.gene;
        try { window.localStorage.setItem(swarmArchiveKey, JSON.stringify({ version: 1, genomes: swarmArchive })); } catch { /* Keep the imported genome in this session. */ }
        syncGenomeArchive();
        const importedIndex = swarmArchive.length - 1;
        recallGenome(importedIndex);
        stage.dataset.swarmPassportImported = String(importedIndex + 1);
        if (lineageReadout) lineageReadout.textContent = `${document.documentElement.lang === "en" ? "INJECTED ✦" : "已注入 ✦"} ${importedIndex + 1}`;
        wake();
      } catch {
        if (lineageReadout) lineageReadout.textContent = document.documentElement.lang === "en" ? "PASSPORT INVALID" : "护照无效";
      }
    });
    causalHorizonButton?.addEventListener("click", () => {
      if (state.reducedMotion) return;
      const branch = Math.max(0, Math.min(2, Math.round((state.pointerX + 1) * 1)));
      forecastEnabled = true;
      forecastBranching = true;
      forecastBranchManual = true;
      triggerTemporalCollision(branch);
      causalHorizonButton.setAttribute("aria-pressed", "true");
      stage.dataset.causalSingularity = `branch-${branch + 1}`;
      const seedOrbit = Array.from({ length: 18 }, (_, index) => {
        const phase = index / 17 * Math.PI * 1.35 + branch * 0.8;
        const radius = 0.12 + index * 0.014;
        return new THREE.Vector3(
          state.pointerX * 0.9 + Math.cos(phase) * radius,
          -state.pointerY * 0.8 + Math.sin(phase) * radius * 0.68,
          0.38 + index * 0.002,
        );
      });
      createSingularityTrail(seedOrbit);
      window.setTimeout(() => {
        causalHorizonButton.setAttribute("aria-pressed", "false");
        delete stage.dataset.causalSingularity;
      }, 4200);
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
      wake();
    });
    causalOrbitExportButton?.addEventListener("click", () => {
      if (!singularityWakeTrails.length) return;
      const capsule = JSON.stringify({
        version: 1,
        kind: "easyki-causal-observer-orbit",
        branch: forecastBranchIndex,
        paths: singularityWakeTrails.map(({ points }) => points.map(({ x, y, z }) => ({ x, y, z }))),
      }, null, 2);
      const url = URL.createObjectURL(new Blob([capsule], { type: "application/json;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "easyki-causal-observer-orbit.json";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    });
    causalOrbitReplayButton?.addEventListener("click", () => {
      if (!singularityWakeTrails.length) return;
      const paths = singularityWakeTrails.map(({ points }) => points.map((point) => point.clone()));
      triggerTemporalCollision(forecastBranchIndex);
      paths.forEach((points, index) => createSingularityTrail(points, performance.now() + index * 90));
      stage.dataset.causalSingularity = `replay-${forecastBranchIndex + 1}`;
      window.setTimeout(() => delete stage.dataset.causalSingularity, 4200);
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
      wake();
    });
    causalEntangleButton?.addEventListener("click", () => {
      causalEntangled = !causalEntangled;
      causalEntangleButton.setAttribute("aria-pressed", String(causalEntangled));
      if (causalEntangled) {
        causalChannel?.postMessage({ kind: "easyki-causal-observer-hello", source: causalObserverId, branch: forecastBranchIndex });
        stage.dataset.causalEntangled = "true";
        if (resonanceActive) broadcastResonance(resonanceEnergy, state.pointerX * 0.9 + state.pointerY * 0.4);
      } else {
        delete stage.dataset.causalEntangled;
        delete stage.dataset.resonancePeer;
        peerResonanceEnergy = 0;
        peerOrbitTrails.splice(0).forEach((trail) => {
          peerOrbitGroup.remove(trail.line);
          trail.line.geometry.dispose();
          trail.line.material.dispose();
        });
      }
      wake();
    });
    causalOrbitImportButton?.addEventListener("click", () => causalOrbitInput?.click());
    causalOrbitInput?.addEventListener("change", () => {
      const file = causalOrbitInput.files?.[0];
      if (!file) return;
      void file.text().then((text) => {
        try {
          const parsed = JSON.parse(text) as { kind?: unknown; branch?: unknown; paths?: unknown };
          if (parsed.kind !== "easyki-causal-observer-orbit" || !Array.isArray(parsed.paths)) return;
          const importedPaths = parsed.paths.flatMap((path): THREE.Vector3[][] => {
            if (!Array.isArray(path)) return [];
            const points = path.flatMap((point): THREE.Vector3[] => {
              if (!point || typeof point !== "object") return [];
              const value = point as { x?: unknown; y?: unknown; z?: unknown };
              return [value.x, value.y, value.z].every((coordinate) => typeof coordinate === "number")
                ? [new THREE.Vector3(value.x as number, value.y as number, value.z as number)]
                : [];
            });
            return points.length > 1 ? [points] : [];
          });
          if (!importedPaths.length) return;
          singularityWakeTrails.slice().forEach((trail) => {
            singularityWakeGroup.remove(trail.line);
            trail.line.geometry.dispose();
            trail.line.material.dispose();
          });
          singularityWakeTrails.splice(0);
          importedPaths.forEach((points, index) => createSingularityTrail(points, performance.now() + index * 90));
          forecastBranchIndex = typeof parsed.branch === "number" ? Math.max(0, Math.min(2, Math.floor(parsed.branch))) : forecastBranchIndex;
          triggerTemporalCollision(forecastBranchIndex);
          stage.dataset.causalSingularity = `imported-${forecastBranchIndex + 1}`;
          window.setTimeout(() => delete stage.dataset.causalSingularity, 4200);
          stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
          wake();
        } catch {
          // Ignore malformed observer orbit capsules.
        }
      });
      causalOrbitInput.value = "";
    });
    morphForkButton?.addEventListener("click", () => {
      if (!morphForkActive || morphTimeline.length < 2) return;
      const capsule = JSON.stringify({
        version: 1,
        kind: "easyki-topology-gravity-branch",
        parentKind: importedTimelines.length >= 2 ? "easyki-topology-recombined" : "recorded-step-history",
        gravity: { enabled: morphGravityEnabled, tension: morphTension, attractor: morphAttractor },
        frames: morphTimeline,
      }, null, 2);
      const url = URL.createObjectURL(new Blob([capsule], { type: "application/json;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "easyki-topology-gravity-branch.json";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    });
    morphCollisionButton?.addEventListener("click", () => {
      if (importedTimelines.length < 2) return;
      collisionTimeline = buildCollisionTimeline();
      collisionActive = collisionTimeline.length > 1;
      if (!collisionActive) return;
      antimatterTimeline = [];
      antimatterActive = false;
      delete stage.dataset.antimatter;
      recordedFrames = collisionTimeline;
      importedTimeline = collisionTimeline;
      morphTimeline = [];
      morphForkActive = false;
      recombinedTimeline = false;
      multiverseMode = false;
      stage.dataset.collision = "true";
      stage.dataset.multiverse = "false";
      playback = false;
      playbackIndex = 0;
      state.sliceEnabled = true;
      state.sliceScanning = false;
      state.sliceAxis = collisionTimeline[0].axis;
      state.slicePercent = collisionTimeline[0].percent;
      const firstLoop = collisionTimeline[0].loops[0];
      selectedLoopIndex = firstLoop ? 0 : -1;
      selectedLoopSignature = firstLoop ? { role: firstLoop.role, area: firstLoop.area } : null;
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
      applySectionMode();
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="morph"]')?.click();
      triggerBranchWarp(1.5);
      wake();
    });
    morphAntimatterButton?.addEventListener("click", () => {
      const previousFrames = activeMorphFrames();
      annihilationActive = false;
      annihilationTimeline = [];
      delete stage.dataset.annihilation;
      antimatterActive = !antimatterActive;
      if (antimatterActive) {
        antimatterTimeline = buildAntimatterTimeline(previousFrames);
        recordedFrames = antimatterTimeline;
        importedTimeline = antimatterTimeline;
        stage.dataset.antimatter = "true";
        const firstLoop = antimatterTimeline[0]?.loops[0];
        selectedLoopIndex = firstLoop ? 0 : -1;
        selectedLoopSignature = firstLoop ? { role: firstLoop.role, area: firstLoop.area } : null;
      } else {
        antimatterTimeline = [];
        recordedFrames = baseMorphFrames();
        importedTimeline = recordedFrames;
        delete stage.dataset.antimatter;
      }
      const frames = activeMorphFrames();
      if (frames.length) {
        playbackIndex = 0;
        state.sliceAxis = frames[0].axis;
        state.slicePercent = frames[0].percent;
      }
      morphAntimatterButton.setAttribute("aria-pressed", String(antimatterActive));
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
      applySectionMode();
      triggerBranchWarp(1.35);
      wake();
    });
    morphAnnihilateButton?.addEventListener("click", () => {
      annihilationActive = !annihilationActive;
      if (annihilationActive) {
        annihilationTimeline = buildAnnihilationTimeline();
        recordedFrames = annihilationTimeline;
        importedTimeline = annihilationTimeline;
        stage.dataset.annihilation = "true";
      } else {
        annihilationTimeline = [];
        const restored = antimatterActive && antimatterTimeline.length ? antimatterTimeline : baseMorphFrames();
        recordedFrames = restored;
        importedTimeline = restored;
        delete stage.dataset.annihilation;
      }
      const frames = activeMorphFrames();
      if (frames.length) {
        playbackIndex = Math.min(playbackIndex, frames.length - 1);
        state.sliceAxis = frames[playbackIndex].axis;
        state.slicePercent = frames[playbackIndex].percent;
      }
      morphAnnihilateButton.setAttribute("aria-pressed", String(annihilationActive));
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
      applySectionMode();
      if (annihilationActive) {
        spawnAnnihilationGhosts();
        stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
      }
      triggerBranchWarp(1.5);
      wake();
    });
    const scrubOracle = (event: PointerEvent): void => {
      const oracleFrames = importedTimelines.length >= 2 ? buildRecombinedTimeline() : recordedFrames;
      if (!oracleCanvas || oracleFrames.length < 2) return;
      const rect = oracleCanvas.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      const vertical = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
      if (oracleBreakpoint) {
        if (oracleBreakpoint === "start") crossoverPercent = Math.min(Math.round(progress * 100), crossoverEndPercent - 5);
        else crossoverEndPercent = Math.max(Math.round(progress * 100), crossoverPercent + 5);
        if (crossoverRange) crossoverRange.value = String(crossoverPercent);
        if (crossoverValue) crossoverValue.value = `${crossoverPercent}%`;
        if (crossoverEndRange) crossoverEndRange.value = String(crossoverEndPercent);
        if (crossoverEndValue) crossoverEndValue.value = `${crossoverEndPercent}%`;
        recombinedTimeline = false;
        syncRecordingControls();
        wake();
        return;
      }
      playback = false;
      state.sliceScanning = false;
      window.clearTimeout(playbackTimer);
      playbackIndex = Math.round(progress * (oracleFrames.length - 1));
      oracleMutation = vertical;
      const frame = oracleFrames[playbackIndex];
      state.sliceEnabled = true;
      state.sliceAxis = frame.axis;
      state.slicePercent = frame.percent;
      syncSliceControls();
      applySectionMode();
      syncRecordingControls();
      wake();
    };
    oracleCanvas?.addEventListener("pointerdown", (event) => {
      const oracleFrames = importedTimelines.length >= 2 ? buildRecombinedTimeline() : recordedFrames;
      if (oracleFrames.length < 2) return;
      if (importedTimelines.length >= 2) {
        const rect = oracleCanvas.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
        const startDistance = Math.abs(progress - crossoverPercent / 100);
        const endDistance = Math.abs(progress - crossoverEndPercent / 100);
        oracleBreakpoint = Math.min(startDistance, endDistance) < 0.045
          ? startDistance <= endDistance ? "start" : "end"
          : null;
      }
      oracleDragging = true;
      oracleCanvas.setPointerCapture(event.pointerId);
      scrubOracle(event);
    });
    oracleCanvas?.addEventListener("pointermove", (event) => {
      if (oracleDragging) scrubOracle(event);
    });
    oracleCanvas?.addEventListener("pointerup", (event) => {
      oracleDragging = false;
      oracleBreakpoint = null;
      oracleCanvas.releasePointerCapture(event.pointerId);
    });
    oracleCanvas?.addEventListener("pointercancel", () => { oracleDragging = false; oracleBreakpoint = null; });
    drawTrinity = (): void => {
      if (!trinityCanvas || !trinityContext) return;
      const rect = trinityCanvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(rect.width * ratio);
      const pixelHeight = Math.round(rect.height * ratio);
      if (trinityCanvas.width !== pixelWidth || trinityCanvas.height !== pixelHeight) {
        trinityCanvas.width = pixelWidth;
        trinityCanvas.height = pixelHeight;
      }
      const context = trinityContext;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#302945");
      gradient.addColorStop(0.52, "#211e31");
      gradient.addColorStop(1, "#181722");
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);
      const english = document.documentElement.lang === "en";
      const left = 104;
      const right = rect.width - 26;
      const top = 72;
      const trackGap = Math.min(82, Math.max(58, (rect.height - 116) / 2));
      const parents = importedTimelines.slice(0, 2);
      if (parents.length < 2) {
        context.fillStyle = "#c8bfdc";
        context.font = "700 11px ui-monospace, SFMono-Regular, monospace";
        context.fillText(english ? "IMPORT TWO TIMELINES TO OPEN THE TRINITY" : "导入两条时间线以打开三体视图", 28, rect.height * 0.5);
        return;
      }
      const hybrid = buildRecombinedTimeline();
      const tracks = [parents[0], parents[1], hybrid];
      const activeIndex = playback ? Math.min(playbackIndex, hybrid.length - 1) : Math.min(trinityFocusIndex, hybrid.length - 1);
      const labels = english ? ["PARENT A", "PARENT B", "RECOMBINED"] : ["父线 A", "父线 B", "重组线"];
      const colors = ["#d9a7ff", "#8ffff2", "#ffe3a0"];
      const maxArea = Math.max(...tracks.flatMap((timeline) => timeline.map((frame) => frame.area)), 1e-6);
      context.fillStyle = "#f5f0ff";
      context.font = "600 10px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? "TIMELINE TRINITY · REAL SECTION GENOMES" : "三体时间线 · 真实截面基因组", 28, 28);
      context.font = "9px ui-monospace, SFMono-Regular, monospace";
      context.fillStyle = "#c8bfdc";
      context.fillText(english ? "AREA / TOPOLOGY / EVENT" : "面积 / 拓扑 / 事件", 28, 44);
      const eventMarkers: { bucket: number; x: number; trackIndex: number; event: string }[] = [];
      tracks.forEach((timeline, trackIndex) => {
        const y = top + trackIndex * trackGap;
        context.strokeStyle = `${colors[trackIndex]}42`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(right, y);
        context.stroke();
        context.fillStyle = colors[trackIndex];
        context.font = "700 9px ui-monospace, SFMono-Regular, monospace";
        context.fillText(labels[trackIndex], 28, y + 4);
        timeline.forEach((frame, index) => {
          const progress = index / Math.max(1, timeline.length - 1);
          const x = left + progress * (right - left);
          const height = 4 + Math.min(22, (frame.area / maxArea) * 22) + Math.min(8, frame.loops.length * 1.5);
          const previous = index > 0 ? timeline[index - 1].loops[0] : undefined;
          const event = classifyTopologyEvent(frame.loops[0], previous);
          context.fillStyle = event === "stable" ? `${colors[trackIndex]}99` : event === "birth" ? "#8ffff2" : event === "vanish" ? "#ff8f9e" : "#ffca68";
          context.fillRect(x - 1.2, y - height / 2, 2.4, height);
          if (event !== "stable") {
            eventMarkers.push({ bucket: Math.round(progress * 28), x, trackIndex, event });
            context.beginPath();
            context.arc(x, y - height / 2 - 4, 3, 0, Math.PI * 2);
            context.fill();
          }
        });
      });
      const eventBeams = new Map<number, typeof eventMarkers>();
      trinityEventMarkers = eventMarkers;
      eventMarkers.forEach((marker) => {
        const group = eventBeams.get(marker.bucket) ?? [];
        group.push(marker);
        eventBeams.set(marker.bucket, group);
      });
      eventBeams.forEach((group, bucket) => {
        if (group.length < 2) return;
        const dominant = group.some((marker) => marker.event === "vanish") ? "#ff8f9e" : group.some((marker) => marker.event === "birth") ? "#8ffff2" : "#ffe3a0";
        const pulse = state.reducedMotion ? 0.55 : 0.4 + (Math.sin(performance.now() * 0.004 + bucket) + 1) * 0.25;
        context.strokeStyle = `${dominant}${Math.round(pulse * 255).toString(16).padStart(2, "0")}`;
        context.lineWidth = 1.5 + pulse;
        context.shadowColor = dominant;
        context.shadowBlur = 9 + pulse * 10;
        context.beginPath();
        group.sort((leftMarker, rightMarker) => leftMarker.trackIndex - rightMarker.trackIndex).forEach((marker, index) => {
          const y = top + marker.trackIndex * trackGap;
          if (index === 0) context.moveTo(marker.x, y);
          else context.lineTo(marker.x, y);
        });
        context.stroke();
        context.shadowBlur = 0;
        if (lockedEventBucket === bucket) {
          context.strokeStyle = "#fff4ce";
          context.lineWidth = 3;
          context.shadowColor = "#fff4ce";
          context.shadowBlur = 18;
          context.beginPath();
          context.moveTo(group[0].x, top - 30);
          context.lineTo(group[group.length - 1].x, top + trackGap * 2 + 30);
          context.stroke();
          context.shadowBlur = 0;
        }
      });
      if (eventBeams.size) {
        context.fillStyle = "#ffe3a0b8";
        context.font = "700 8px ui-monospace, SFMono-Regular, monospace";
        context.fillText(english ? "CAUSAL BEAMS" : "因果光束", right - 90, top - 35);
        if (lockedEventBucket !== null) {
          const locked = eventMarkers.find((marker) => marker.bucket === lockedEventBucket);
          context.fillStyle = "#fff4ce";
          context.fillText(`${english ? "LOCKED" : "已锁定"} · ${locked?.event.toUpperCase() ?? "EVENT"}`, right - 90, top - 23);
        }
      }
      const energyY = rect.height - 34;
      const sampleCount = Math.max(...tracks.map((timeline) => timeline.length), 2);
      context.fillStyle = "#ff8f9e88";
      context.font = "700 8px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? "THREE-WAY DIVERGENCE" : "三方差异能量", left, energyY - 22);
      for (let index = 0; index < sampleCount; index += 1) {
        const values = tracks.map((timeline) => timeline[Math.min(timeline.length - 1, Math.round(index / Math.max(1, sampleCount - 1) * (timeline.length - 1)))].area);
        const divergence = Math.min(1, (Math.max(...values) - Math.min(...values)) / Math.max(Math.max(...values), 1e-6));
        const x = left + index / Math.max(1, sampleCount - 1) * (right - left);
        context.fillStyle = divergence > 0.35 ? "#ff8f9edd" : divergence > 0.16 ? "#ffca68cc" : "#8ffff288";
        context.fillRect(x - 1.1, energyY - divergence * 16, 2.2, Math.max(1, divergence * 16));
      }
      const startX = left + (crossoverPercent / 100) * (right - left);
      const endX = left + (crossoverEndPercent / 100) * (right - left);
      context.fillStyle = "#ffe3a014";
      context.fillRect(startX, top - 30, Math.max(1, endX - startX), trackGap * 2 + 60);
      context.setLineDash([4, 4]);
      [
        [startX, "#d9a7ff", "A"],
        [endX, "#ff8f9e", "B"],
      ].forEach(([x, color, label]) => {
        context.strokeStyle = String(color);
        context.beginPath();
        context.moveTo(Number(x), top - 30);
        context.lineTo(Number(x), top + trackGap * 2 + 30);
        context.stroke();
        context.fillStyle = String(color);
        context.font = "700 9px ui-monospace, SFMono-Regular, monospace";
        context.fillText(`✦ ${label}`, Number(x) + 5, top - 35);
      });
      context.setLineDash([]);
      const focusX = left + activeIndex / Math.max(1, hybrid.length - 1) * (right - left);
      context.strokeStyle = "#fff4cecc";
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(focusX, top - 30);
      context.lineTo(focusX, energyY - 3);
      context.stroke();
      context.fillStyle = "#fff4ce";
      context.font = "700 8px ui-monospace, SFMono-Regular, monospace";
      context.fillText(`FRAME ${Math.min(activeIndex + 1, hybrid.length)}/${hybrid.length}`, Math.min(right - 74, focusX + 6), energyY - 22);
      context.fillStyle = "#c8bfdc";
      context.font = "9px ui-monospace, SFMono-Regular, monospace";
      context.fillText(english ? `${tracks[2].length} FRAMES · DRAG BREAKPOINTS IN ORACLE` : `${tracks[2].length} 帧 · 在预言图中拖动交换点`, left, rect.height - 18);
    };
    trinityCanvas?.addEventListener("pointerdown", (event) => {
      if (importedTimelines.length < 2) return;
      const rect = trinityCanvas.getBoundingClientRect();
      const hybrid = buildRecombinedTimeline();
      const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      const trackGap = Math.min(82, Math.max(58, (rect.height - 116) / 2));
      const trackIndex = Math.max(0, Math.min(2, Math.round((event.clientY - rect.top - 72) / trackGap)));
      const nearestEvent = trinityEventMarkers
        .filter((marker) => Math.abs(marker.trackIndex - trackIndex) <= 1)
        .sort((leftMarker, rightMarker) => Math.abs(leftMarker.x / rect.width - progress) - Math.abs(rightMarker.x / rect.width - progress))[0];
      if (nearestEvent && Math.abs(nearestEvent.x / rect.width - progress) < 0.035) {
        lockedEventBucket = nearestEvent.bucket;
        const eventProgress = (nearestEvent.x - 104) / Math.max(1, rect.width - 130);
        trinityFocusIndex = Math.max(0, Math.min(hybrid.length - 1, Math.round(eventProgress * (hybrid.length - 1))));
        lockedEventFrame = trinityFocusIndex;
        lockedEventType = nearestEvent.event;
        stage.dataset.lockedEvent = `${lockedEventType}:${lockedEventFrame}`;
        playback = false;
        playbackIndex = trinityFocusIndex;
        const frame = hybrid[trinityFocusIndex];
        state.sliceScanning = false;
        state.sliceEnabled = true;
        state.sliceAxis = frame.axis;
        state.slicePercent = frame.percent;
        triggerTopologyPulse(nearestEvent.event, (frame.loops[0]?.role ?? "outer") as SectionLoop["role"]);
        syncEventUrl(trinityFocusIndex);
        syncSliceControls();
        syncAxisControls();
        syncRecordingControls();
        applySectionMode();
        wake();
        return;
      }
      lockedEventBucket = null;
      lockedEventFrame = null;
      lockedEventType = "stable";
      delete stage.dataset.lockedEvent;
      trinityFocusIndex = Math.round(progress * (hybrid.length - 1));
      const frame = hybrid[trinityFocusIndex];
      playback = false;
      state.sliceScanning = false;
      window.clearTimeout(playbackTimer);
      playbackIndex = trinityFocusIndex;
      state.sliceEnabled = true;
      state.sliceAxis = frame.axis;
      state.slicePercent = frame.percent;
      syncSliceControls();
      syncAxisControls();
      syncRecordingControls();
      applySectionMode();
      wake();
    });
    const atlasEdges: [number, number][] = [];
    const connected = new Set<string>();
    atlasNodes.forEach((node, index) => {
      let nearestIndex = -1;
      let nearestDistance = Number.POSITIVE_INFINITY;
      atlasNodes.forEach((candidate, candidateIndex) => {
        if (candidateIndex === index) return;
        const distance = node.center.distanceToSquared(candidate.center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = candidateIndex;
        }
      });
      if (nearestIndex >= 0) {
        const key = [index, nearestIndex].sort((a, b) => a - b).join(":");
        if (!connected.has(key)) {
          connected.add(key);
          atlasEdges.push([index, nearestIndex]);
        }
      }
    });
    let atlasPoints: { mesh: THREE.Mesh; x: number; y: number; radius: number }[] = [];
    let hoveredMesh: THREE.Mesh | null = null;
    drawAtlas = (): void => {
      if (!atlasCanvas || !atlasContext) return;
      const rect = atlasCanvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(rect.width * ratio);
      const pixelHeight = Math.round(rect.height * ratio);
      if (atlasCanvas.width !== pixelWidth || atlasCanvas.height !== pixelHeight) {
        atlasCanvas.width = pixelWidth;
        atlasCanvas.height = pixelHeight;
      }
      const context = atlasContext;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      context.fillStyle = "#24232d";
      context.fillRect(0, 0, rect.width, rect.height);
      const glow = context.createRadialGradient(
        rect.width * 0.5, rect.height * 0.48, 10,
        rect.width * 0.5, rect.height * 0.48, Math.max(rect.width, rect.height) * 0.72,
      );
      glow.addColorStop(0, "#514677");
      glow.addColorStop(1, "#24232d");
      context.fillStyle = glow;
      context.fillRect(0, 0, rect.width, rect.height);

      const padding = Math.max(54, Math.min(92, rect.width * 0.1));
      const mapWidth = Math.max(1, rect.width - padding * 2);
      const mapHeight = Math.max(1, rect.height - padding * 2);
      let projectionHorizontal = horizontalAxis;
      let projectionVertical = verticalAxis;
      const cutAxis = ["x", "y", "z"].indexOf(state.sliceAxis);
      if (state.sliceEnabled) {
        const crossSectionAxes = [0, 1, 2].filter((axis) => axis !== cutAxis);
        crossSectionAxes.sort((left, right) =>
          spans.getComponent(right) - spans.getComponent(left)
        );
        [projectionHorizontal, projectionVertical] = crossSectionAxes;
      }
      const spanX = Math.max(spans.getComponent(projectionHorizontal), 1e-6);
      const spanY = Math.max(spans.getComponent(projectionVertical), 1e-6);
      const cutPosition = ((state.slicePercent - 50) / 50) * state.modelRadius;
      const cutTolerance = Math.max(state.modelRadius * 0.035, 0.012);
      const intersectedMeshes = new Set<THREE.Mesh>();
      atlasPoints = atlasNodes.map((node) => {
        const bounds = node.mesh.geometry.boundingBox;
        if (state.sliceEnabled && bounds) {
          const meshOffset = node.mesh.position.getComponent(cutAxis);
          const minimumAtAxis = bounds.min.getComponent(cutAxis) + meshOffset;
          const maximumAtAxis = bounds.max.getComponent(cutAxis) + meshOffset;
          if (
            minimumAtAxis <= cutPosition + cutTolerance &&
            maximumAtAxis >= cutPosition - cutTolerance
          ) intersectedMeshes.add(node.mesh);
        }
        const x = node.center.getComponent(projectionHorizontal);
        const y = node.center.getComponent(projectionVertical);
        return {
          mesh: node.mesh,
          x: padding + ((x - minimum.getComponent(projectionHorizontal)) / spanX) * mapWidth,
          y: rect.height - padding - ((y - minimum.getComponent(projectionVertical)) / spanY) * mapHeight,
          radius: Math.min(5.2, 1.8 + Math.log2(node.triangles + 1) * 0.28),
        };
      });
      intersectedSectionMeshes = [...intersectedMeshes];
      sectionLoopTargets = [];

      let contourSegments = 0;
      let closedContours = 0;
      let contourPerimeter = 0;
      let contourArea = 0;
      let sectionLoops: [number, number][][] = [];
      let topology: SectionLoop[] = [];
      if (state.sliceEnabled) {
        const positionAttributeName = "position";
        const positionIndices = [projectionHorizontal, projectionVertical];
        const cutSegments: Array<[[number, number], [number, number]]> = [];
        const projectCoordinate = (axis: number, value: number): number => {
          const minimumValue = minimum.getComponent(axis);
          const span = Math.max(spans.getComponent(axis), 1e-6);
          const normalized = (value - minimumValue) / span;
          return axis === projectionHorizontal
            ? padding + normalized * mapWidth
            : rect.height - padding - normalized * mapHeight;
        };
        atlasNodes.forEach((node) => {
          if (!intersectedMeshes.has(node.mesh)) return;
          const geometry = node.mesh.geometry;
          const positions = geometry.getAttribute(positionAttributeName) as THREE.BufferAttribute;
          const indices = geometry.index;
          if (!indices) return;
          const localCut = cutPosition - node.mesh.position.getComponent(cutAxis);
          const coordinateOffset = [
            node.mesh.position.getComponent(positionIndices[0]),
            node.mesh.position.getComponent(positionIndices[1]),
          ];
          const epsilon = 1e-7;
          for (let triangle = 0; triangle < indices.count; triangle += 3) {
            const vertexIds = [
              indices.getX(triangle),
              indices.getX(triangle + 1),
              indices.getX(triangle + 2),
            ];
            const intersections: [number, number][] = [];
            for (let edge = 0; edge < 3; edge += 1) {
              const startId = vertexIds[edge];
              const endId = vertexIds[(edge + 1) % 3];
              const startAxis = positions.getComponent(startId, cutAxis);
              const endAxis = positions.getComponent(endId, cutAxis);
              const startDistance = startAxis - localCut;
              const endDistance = endAxis - localCut;
              if (Math.abs(startDistance) <= epsilon && Math.abs(endDistance) <= epsilon) continue;
              if (
                (startDistance < -epsilon && endDistance < -epsilon) ||
                (startDistance > epsilon && endDistance > epsilon)
              ) continue;
              const amount = Math.abs(startDistance) <= epsilon
                ? 0
                : Math.abs(endDistance) <= epsilon
                  ? 1
                  : startDistance / (startDistance - endDistance);
              const point: [number, number] = [0, 0];
              positionIndices.forEach((axis, index) => {
                const start = positions.getComponent(startId, axis);
                const end = positions.getComponent(endId, axis);
                point[index] = start + (end - start) * amount + coordinateOffset[index];
              });
              if (!intersections.some(([x, y]) => Math.hypot(x - point[0], y - point[1]) < 1e-6)) {
                intersections.push(point);
              }
            }
            if (intersections.length < 2) continue;
            const [start, end] = intersections;
            cutSegments.push([start, end]);
          }
        });

        const weldTolerance = 1e-5;
        const vertices = new Map<string, { point: [number, number]; neighbors: Set<string> }>();
        const edgeKeys = new Set<string>();
        const pointKey = ([x, y]: [number, number]): string =>
          `${Math.round(x / weldTolerance)},${Math.round(y / weldTolerance)}`;
        cutSegments.forEach(([start, end]) => {
          const startKey = pointKey(start);
          const endKey = pointKey(end);
          if (startKey === endKey) return;
          const edgeKey = startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;
          if (edgeKeys.has(edgeKey)) return;
          edgeKeys.add(edgeKey);
          if (!vertices.has(startKey)) vertices.set(startKey, { point: start, neighbors: new Set() });
          if (!vertices.has(endKey)) vertices.set(endKey, { point: end, neighbors: new Set() });
          vertices.get(startKey)?.neighbors.add(endKey);
          vertices.get(endKey)?.neighbors.add(startKey);
        });
        contourSegments = edgeKeys.size;

        const unvisited = new Set(vertices.keys());
        const closedLoops: [number, number][][] = [];
        const signedAreas: number[] = [];
        while (unvisited.size) {
          const seed = unvisited.values().next().value as string;
          const component = new Set<string>();
          const pending = [seed];
          while (pending.length) {
            const key = pending.pop() as string;
            if (component.has(key)) continue;
            component.add(key);
            unvisited.delete(key);
            vertices.get(key)?.neighbors.forEach((neighbor) => pending.push(neighbor));
          }
          if ([...component].some((key) => (vertices.get(key)?.neighbors.size ?? 0) !== 2)) continue;

          const startKey = component.values().next().value as string;
          const loopKeys = [startKey];
          let previousKey = "";
          let currentKey = startKey;
          for (let step = 0; step <= component.size; step += 1) {
            const nextKey = [...(vertices.get(currentKey)?.neighbors ?? [])]
              .find((key) => key !== previousKey);
            if (!nextKey) break;
            if (nextKey === startKey) break;
            if (loopKeys.includes(nextKey)) {
              loopKeys.length = 0;
              break;
            }
            loopKeys.push(nextKey);
            previousKey = currentKey;
            currentKey = nextKey;
          }
          if (loopKeys.length !== component.size) continue;
          const points = loopKeys.map((key) => vertices.get(key)?.point as [number, number]);
          let signedArea = 0;
          for (let index = 0; index < points.length; index += 1) {
            const current = points[index];
            const next = points[(index + 1) % points.length];
            signedArea += current[0] * next[1] - next[0] * current[1];
            contourPerimeter += Math.hypot(next[0] - current[0], next[1] - current[1]);
          }
          contourArea += Math.abs(signedArea) / 2;
          closedContours += 1;
          closedLoops.push(points);
          signedAreas.push(signedArea);
        }
        topology = closedLoops.map((points, index) => {
          const depth = closedLoops.reduce((count, candidate, candidateIndex) =>
            candidateIndex !== index && pointInPolygon(points[0], candidate) ? count + 1 : count, 0);
          return {
            points,
            signedArea: signedAreas[index],
            area: Math.abs(signedAreas[index]) / 2,
            depth,
            role: depth === 0 ? "outer" : depth % 2 === 1 ? "hole" : "island",
          };
        });
        sectionLoopTargets = topology.map((loop, loopIndex) => {
          const center = loop.points.reduce(([x, y], [pointX, pointY]) => [x + pointX, y + pointY], [0, 0]);
          const count = Math.max(1, loop.points.length);
          return {
            x: projectCoordinate(projectionHorizontal, center[0] / count),
            y: projectCoordinate(projectionVertical, center[1] / count),
            loopIndex,
          };
        });
        if (selectedLoopSignature) {
          const candidates = topology
            .map((loop, loopIndex) => ({ loop, loopIndex }))
            .filter(({ loop }) => loop.role === selectedLoopSignature?.role)
            .sort((left, right) => Math.abs(left.loop.area - selectedLoopSignature!.area) - Math.abs(right.loop.area - selectedLoopSignature!.area));
          selectedLoopIndex = candidates[0]?.loopIndex ?? -1;
          const target = sectionLoopTargets[selectedLoopIndex];
          if (target) {
            selectedLoopTrail.push({ x: target.x, y: target.y });
            if (selectedLoopTrail.length > 18) selectedLoopTrail.shift();
          }
        } else {
          selectedLoopIndex = -1;
          selectedLoopTrail = [];
        }
        sectionLoops = closedLoops;
        currentSectionLoops = closedLoops;
        currentSectionTopology = topology;
        currentSectionArea = contourArea;
        currentSectionPerimeter = contourPerimeter;
        currentSectionMeshes = intersectedMeshes.size;
        if (tomogramExport) tomogramExport.disabled = closedLoops.length === 0;
        if (tomogramPin) tomogramPin.disabled = closedLoops.length === 0;
        if (recording && closedLoops.length && (lastRecordedAxis !== state.sliceAxis || Number.isNaN(lastRecordedPercent) || Math.abs(state.slicePercent - lastRecordedPercent) >= 1)) {
          if (forecastEnabled && recordedFrames.length >= 3) {
            const latest = recordedFrames[recordedFrames.length - 1];
            const previous = recordedFrames[recordedFrames.length - 2];
            const beforePrevious = recordedFrames[recordedFrames.length - 3];
            const areaVelocity = latest.area - previous.area;
            const perimeterVelocity = latest.perimeter - previous.perimeter;
            const expectedArea = Math.max(latest.area * 0.25, latest.area + areaVelocity + (areaVelocity - (previous.area - beforePrevious.area)) * 0.35 + forecastBias * latest.area);
            const expectedPerimeter = Math.max(latest.perimeter * 0.25, latest.perimeter + perimeterVelocity + (perimeterVelocity - (previous.perimeter - beforePrevious.perimeter)) * 0.35);
            const areaError = Math.abs(contourArea - expectedArea) / Math.max(contourArea, expectedArea, 1e-6);
            const perimeterError = Math.abs(contourPerimeter - expectedPerimeter) / Math.max(contourPerimeter, expectedPerimeter, 1e-6);
            const error = Math.min(1, areaError * 0.72 + perimeterError * 0.28);
            forecastConfidence = Math.max(0.08, Math.min(0.98, forecastConfidence * 0.72 + (1 - error) * 0.28));
            forecastBias = Math.max(-0.8, Math.min(0.8, forecastBias * 0.72 + ((contourArea - expectedArea) / Math.max(latest.area, 1e-6)) * 0.28));
            const memorySlot = Math.max(0, Math.min(forecastMemoryTexture.length - 1, Math.round((state.slicePercent / 100) * (forecastMemoryTexture.length - 1))));
            forecastMemoryTexture[memorySlot] = Math.max(0, Math.min(1, forecastMemoryTexture[memorySlot] * 0.58 + error * 0.42));
            forecastMemoryCycles += 1;
            forecastMetabolicFlux = Math.max(0, Math.min(1, forecastMetabolicFlux * 0.74 + error * 0.26));
            if (error < 0.22) {
              forecastMemoryTexture = forecastMemoryTexture.map((value, index) => index === memorySlot ? value : value * 0.82);
            } else if (error > 0.58) {
              forecastMemoryTexture = forecastMemoryTexture.map((value, index) => index === memorySlot ? value : Math.min(1, value * 1.06 + 0.012));
            }
            forecastErrorStreak = error > 0.58 ? forecastErrorStreak + 1 : Math.max(0, forecastErrorStreak - 1);
            if (forecastErrorStreak >= 3 && performance.now() - forecastBurstAt > 2200) {
              forecastBurstAt = performance.now();
              forecastBurstCount += 1;
              triggerTopologyPulse("birth", topology[0]?.role ?? "outer");
              const rotatedScores = [forecastBranchScores[1], forecastBranchScores[2], forecastBranchScores[0]];
              forecastBranchScores = forecastBranchScores.map((score, branch) => Math.max(0.05, Math.min(0.98, score * 0.55 + (rotatedScores[branch] ?? 0.5) * 0.45)));
              if (!forecastBranchManual) forecastBranchIndex = forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
            }
            const branchOffsets = [-0.16, 0, 0.16];
            forecastBranchScores = branchOffsets.map((offset, branchIndex) => {
              const branchArea = Math.max(latest.area * 0.25, expectedArea + latest.area * offset * 0.35);
              const branchError = Math.abs(contourArea - branchArea) / Math.max(contourArea, branchArea, 1e-6);
              const previousScore = forecastBranchScores[branchIndex] ?? 0.5;
              const memoryBias = (branchIndex - 1) * forecastMemoryTexture[memorySlot] * 0.08;
              return Math.max(0.05, Math.min(0.98, previousScore * 0.68 + (1 - branchError) * 0.32 + memoryBias));
            });
            if (!forecastBranchManual) forecastBranchIndex = forecastBranchScores.indexOf(Math.max(...forecastBranchScores));
            persistForecastBranches();
            persistForecastCalibration();
            persistForecastMemory();
          }
          recordedFrames.push({
            axis: state.sliceAxis,
            percent: state.slicePercent,
            area: contourArea,
            perimeter: contourPerimeter,
            loops: topology.map(({ points, signedArea, area, depth, role }) => ({
              points: points.map(([x, y]) => [x, y] as [number, number]),
              signedArea,
              area,
              depth,
              role,
            })),
          });
          if (recordedFrames.length > 180) recordedFrames.shift();
          playbackIndex = recordedFrames.length - 1;
          lastRecordedPercent = state.slicePercent;
          lastRecordedAxis = state.sliceAxis;
          syncRecordingControls();
        }

        if (closedLoops.length) {
          const paintLoops = (loops: [number, number][][], color: string, width: number, dash: number[] = []): void => {
            context.beginPath();
            loops.forEach((loop) => {
              loop.forEach(([x, y], index) => {
                const canvasX = projectCoordinate(projectionHorizontal, x);
                const canvasY = projectCoordinate(projectionVertical, y);
                if (index === 0) context.moveTo(canvasX, canvasY);
                else context.lineTo(canvasX, canvasY);
              });
              context.closePath();
            });
            context.save();
            context.setLineDash(dash);
            context.strokeStyle = color;
            context.lineWidth = width;
            context.shadowColor = color;
            context.shadowBlur = dash.length ? 0 : 8;
            context.stroke();
            context.restore();
          };
          paintLoops(closedLoops, "#fff2c688", 1.8);
          if (selectedLoopIndex >= 0 && topology[selectedLoopIndex]) {
            paintLoops([topology[selectedLoopIndex].points], "#8ffff2ee", 2.8);
          }
          context.save();
          context.fillStyle = "#ffe08a12";
          context.beginPath();
          closedLoops.forEach((loop) => {
            loop.forEach(([x, y], index) => {
              const canvasX = projectCoordinate(projectionHorizontal, x);
              const canvasY = projectCoordinate(projectionVertical, y);
              if (index === 0) context.moveTo(canvasX, canvasY);
              else context.lineTo(canvasX, canvasY);
            });
            context.closePath();
          });
          context.fill("evenodd");
          context.restore();
          if (referenceSection?.axis === state.sliceAxis) {
            paintLoops(referenceSection.loops, "#b9a8ffcc", 1.25, [5, 4]);
          }
        }

        context.beginPath();
        cutSegments.forEach(([start, end]) => {
          context.moveTo(
            projectCoordinate(projectionHorizontal, start[0]),
            projectCoordinate(projectionVertical, start[1]),
          );
          context.lineTo(
            projectCoordinate(projectionHorizontal, end[0]),
            projectCoordinate(projectionVertical, end[1]),
          );
        });
        context.save();
        context.strokeStyle = "#fff0b0";
        context.lineWidth = 1.25;
        context.lineCap = "round";
        context.shadowColor = "#ffca68";
        context.shadowBlur = 5;
        context.stroke();
        context.restore();
      }
      drawTomogram(sectionLoops, projectionVertical);
      const millimetersPerUnit = Math.max(modelSpanMm / 2, 1e-6);
      if (state.sliceEnabled) {
        tomogramTelemetry.area && (tomogramTelemetry.area.textContent = (contourArea * millimetersPerUnit ** 2).toFixed(2));
        tomogramTelemetry.perimeter && (tomogramTelemetry.perimeter.textContent = (contourPerimeter * millimetersPerUnit).toFixed(2));
        tomogramTelemetry.loops && (tomogramTelemetry.loops.textContent = String(closedContours));
        tomogramTelemetry.meshes && (tomogramTelemetry.meshes.textContent = `${intersectedMeshes.size}/${atlasNodes.length}`);
        const topologyTelemetry = stage.querySelector<HTMLElement>("[data-tomogram-topology]");
        if (topologyTelemetry) {
          const holes = topology.filter(({ role }) => role === "hole").length;
          const islands = topology.filter(({ role }) => role === "island").length;
          const outer = topology.filter(({ role }) => role === "outer").length;
          const english = document.documentElement.lang === "en";
          topologyTelemetry.textContent = english
            ? `${outer}O · ${holes}H${islands ? ` · ${islands}I` : ""}`
            : `${outer}外 · ${holes}孔${islands ? ` · ${islands}岛` : ""}`;
          topologyTelemetry.setAttribute("aria-label", english
            ? `${outer} outer shells, ${holes} holes${islands ? `, ${islands} islands` : ""}`
            : `${outer} 个外轮廓，${holes} 个孔${islands ? `，${islands} 个岛` : ""}`);
          topologyTelemetry.title = english
            ? `${outer} shell · ${holes} hole${holes === 1 ? "" : "s"}${islands ? ` · ${islands} island${islands === 1 ? "" : "s"}` : ""}`
            : `${outer} 外轮廓 · ${holes} 个孔${islands ? ` · ${islands} 个岛` : ""}`;
        }
        if (tomogramTelemetry.delta) {
          const delta = referenceSection?.axis === state.sliceAxis
            ? (contourArea - referenceSection.area) * millimetersPerUnit ** 2
            : null;
          tomogramTelemetry.delta.textContent = delta === null
            ? "—"
            : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`;
        }
      } else if (tomogramExport) {
        tomogramExport.disabled = true;
        if (tomogramPin) tomogramPin.disabled = true;
        recording = false;
        playback = false;
        recordedFrames = [];
        recombinedTimeline = false;
        morphTimeline = [];
        morphForkActive = false;
        delete stage.dataset.morphFork;
        collisionTimeline = [];
        collisionActive = false;
        delete stage.dataset.collision;
        antimatterTimeline = [];
        antimatterActive = false;
        delete stage.dataset.antimatter;
        annihilationTimeline = [];
        annihilationActive = false;
        delete stage.dataset.annihilation;
        lockedEventFrame = null;
        lockedEventBucket = null;
        lockedEventType = "stable";
        delete stage.dataset.lockedEvent;
        window.clearTimeout(playbackTimer);
        syncRecordingControls();
        currentSectionLoops = [];
        currentSectionTopology = [];
        referenceSection = null;
        syncReferenceControl();
        if (tomogramTelemetry.delta) tomogramTelemetry.delta.textContent = "—";
        stage.querySelector<HTMLElement>("[data-tomogram-topology]")?.replaceChildren(document.createTextNode("—"));
      }

      context.strokeStyle = "#e9ddff25";
      context.lineWidth = 0.7;
      atlasEdges.forEach(([from, to]) => {
        const start = atlasPoints[from];
        const end = atlasPoints[to];
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        const bothIntersect = intersectedMeshes.has(atlasNodes[from].mesh) &&
          intersectedMeshes.has(atlasNodes[to].mesh);
        context.strokeStyle = bothIntersect ? "#ffe08a99" : "#e9ddff18";
        context.stroke();
      });

      atlasPoints.forEach((point, index) => {
        const node = atlasNodes[index];
        const isFocused = node.mesh === focusedMesh;
        const isHovered = node.mesh === hoveredMesh;
        const isIntersected = intersectedMeshes.has(node.mesh);
        context.beginPath();
        context.arc(point.x, point.y, point.radius * (isIntersected ? 3.5 : isHovered ? 3.1 : 2.3), 0, Math.PI * 2);
        context.fillStyle = isIntersected ? "#ffe08a55" : isFocused ? "#b9a8ff38" : `${node.color}25`;
        context.fill();
        context.beginPath();
        context.arc(point.x, point.y, point.radius * (isIntersected || isHovered ? 1.5 : 1), 0, Math.PI * 2);
        context.fillStyle = isIntersected ? "#ffe08a" : isFocused ? "#b9a8ff" : node.color;
        context.fill();
        if (isFocused || isHovered || isIntersected) {
          context.beginPath();
          context.arc(point.x, point.y, point.radius * (isIntersected ? 2.5 : 2.1), 0, Math.PI * 2);
          context.strokeStyle = isIntersected || isFocused ? "#ffe08a" : "#ffffffcc";
          context.lineWidth = isIntersected ? 1.6 : 1.2;
          context.stroke();
        }
      });
      if (state.sliceEnabled) {
        if (selectedLoopTrail.length > 1) {
          context.beginPath();
          selectedLoopTrail.forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
          });
          context.strokeStyle = "#8ffff288";
          context.lineWidth = 1.5;
          context.setLineDash([3, 4]);
          context.stroke();
          context.setLineDash([]);
        }
        sectionLoopTargets.forEach((target, index) => {
          const loop = currentSectionTopology[index];
          context.beginPath();
          context.arc(target.x, target.y, index === selectedLoopIndex ? 8 : 5.5, 0, Math.PI * 2);
          context.fillStyle = index === selectedLoopIndex
            ? "#8ffff2ee"
            : loop?.role === "hole" ? "#9fe0cbcc" : loop?.role === "island" ? "#ffca68cc" : "#b9a8ffcc";
          context.fill();
          context.strokeStyle = "#24232d";
          context.lineWidth = 1;
          context.stroke();
        });
      }

      const english = document.documentElement.lang === "en";
      context.textBaseline = "top";
      context.fillStyle = "#f5f0ff";
      context.font = "600 10px ui-monospace, SFMono-Regular, monospace";
      context.fillText(
        state.sliceEnabled
          ? english ? `LIVE SECTION ATLAS${selectedLoopIndex >= 0 ? ` · LINEAGE ${selectedLoopIndex + 1}` : ""}` : `实时剖面星图${selectedLoopIndex >= 0 ? ` · 谱系 ${selectedLoopIndex + 1}` : ""}`
          : english ? "SPATIAL MESH ATLAS" : "STEP 网格空间星图",
        64,
        25,
      );
      context.fillStyle = "#c8bfdc";
      context.font = "9px ui-monospace, SFMono-Regular, monospace";
      context.fillText(
        state.sliceEnabled
          ? english
            ? `${intersectedMeshes.size}/${atlasNodes.length} MESHES · ${contourSegments.toLocaleString()} EDGES · ${closedContours} LOOPS${referenceSection?.axis === state.sliceAxis ? ` · REF ${Math.round(referenceSection.percent)}%` : ""}`
            : `${intersectedMeshes.size}/${atlasNodes.length} 网格 · ${contourSegments.toLocaleString()} 交线 · ${closedContours} 个闭合环${referenceSection?.axis === state.sliceAxis ? ` · 参考 ${Math.round(referenceSection.percent)}%` : ""}`
          : `${atlasNodes.length} NODES  ·  ${totalTriangles.toLocaleString()} TRIANGLES`,
        64,
        41,
      );
      if (state.sliceEnabled) {
        context.textAlign = "left";
        context.fillStyle = "#ffe3a0";
        context.font = "9px ui-monospace, SFMono-Regular, monospace";
        context.fillText(
          english
            ? `ΣL ${(contourPerimeter * millimetersPerUnit).toFixed(2)} mm · AREA ${(contourArea * millimetersPerUnit ** 2).toFixed(2)} mm²`
            : `周长 ${(contourPerimeter * millimetersPerUnit).toFixed(2)} mm · 截面积 ${(contourArea * millimetersPerUnit ** 2).toFixed(2)} mm²`,
          64,
          Math.max(60, rect.height - 56),
        );
      }
      context.textAlign = "right";
      context.fillStyle = "#d8cfff";
      context.fillText(
        state.sliceEnabled
          ? `${axisNames[projectionHorizontal]} / ${axisNames[projectionVertical]} · CUT ${state.sliceAxis.toUpperCase()}`
          : `${axisNames[horizontalAxis]} / ${axisNames[verticalAxis]}`,
        rect.width - 28,
        25,
      );
      context.textAlign = "left";
      context.fillStyle = "#c8bfdc";
      context.font = "9px ui-monospace, SFMono-Regular, monospace";
      context.fillText(
        english ? "Click a node · Enter to inspect · Esc to clear" : "点击节点 · Enter 查看实体 · Esc 清除",
        28,
        rect.height - 31,
      );
    };
    const screenPosition = (mesh: THREE.Mesh): THREE.Vector2 => {
      group.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const localCenter = mesh.geometry.boundingSphere?.center.clone() ??
        new THREE.Vector3();
      const projectedCenter = mesh.localToWorld(localCenter).project(camera);
      return new THREE.Vector2(
        ((projectedCenter.x + 1) / 2) * state.width,
        ((1 - projectedCenter.y) / 2) * state.height,
      );
    };
    const navigateFocus = (key: string): void => {
      const direction = {
        ArrowRight: new THREE.Vector2(1, 0),
        ArrowLeft: new THREE.Vector2(-1, 0),
        ArrowDown: new THREE.Vector2(0, 1),
        ArrowUp: new THREE.Vector2(0, -1),
      }[key];
      if (!direction) return;

      const activeMesh = focusedMesh;
      const origin = activeMesh
        ? screenPosition(activeMesh)
        : new THREE.Vector2(state.width / 2, state.height / 2);
      let nextMesh: THREE.Mesh | null = null;
      let bestScore = Number.POSITIVE_INFINITY;
      explodedMeshes.forEach(({ mesh }) => {
        if (mesh === activeMesh) return;
        const delta = screenPosition(mesh).sub(origin);
        const forward = delta.dot(direction);
        if (forward <= 6) return;
        const lateral = Math.abs(
          delta.x * direction.y - delta.y * direction.x,
        );
        const score = forward + lateral * 1.4;
        if (score < bestScore) {
          bestScore = score;
          nextMesh = mesh;
        }
      });
      if (nextMesh) {
        updateFocus(nextMesh);
        recallMemoryForMesh(nextMesh);
      }
    };
    const handleFocusKeys = (event: KeyboardEvent): void => {
      const atlasMode = stage.dataset.artifactView === "atlas" && atlasCanvas === event.currentTarget;
      if (!atlasMode && stage.dataset.artifactView !== "model") return;
      if (event.key === "Escape") {
        event.preventDefault();
        selectedLoopSignature = null;
        selectedLoopIndex = -1;
        selectedLoopTrail = [];
        syncLineageControl();
        updateFocus(null);
        recallMemoryForMesh(null);
        return;
      }
      if (event.key === "Enter" && atlasCanvas === event.currentTarget) {
        event.preventDefault();
        if (focusedMesh) {
          stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
          canvas.focus({ preventScroll: true });
        }
        return;
      }
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        navigateFocus(event.key);
      }
    };
    canvas.addEventListener("keydown", handleFocusKeys);
    atlasCanvas?.addEventListener("keydown", handleFocusKeys);
    atlasCanvas?.addEventListener("pointermove", (event: PointerEvent) => {
      const rect = atlasCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nearest = atlasPoints.reduce<{ mesh: THREE.Mesh; distance: number } | null>(
        (best, point) => {
          const distance = Math.hypot(point.x - x, point.y - y);
          return distance < (best?.distance ?? 20) ? { mesh: point.mesh, distance } : best;
        },
        null,
      );
      const nextHover = nearest && nearest.distance <= 20 ? nearest.mesh : null;
      if (nextHover !== hoveredMesh) {
        hoveredMesh = nextHover;
        wake();
      }
    }, { passive: true });
    atlasCanvas?.addEventListener("pointerleave", () => {
      hoveredMesh = null;
      wake();
    });
    atlasCanvas?.addEventListener("click", (event: MouseEvent) => {
      const rect = atlasCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nearest = atlasPoints.reduce<{ mesh: THREE.Mesh; distance: number } | null>(
        (best, point) => {
          const distance = Math.hypot(point.x - x, point.y - y);
          return distance < (best?.distance ?? 24) ? { mesh: point.mesh, distance } : best;
        },
        null,
      );
      if (state.sliceEnabled && sectionLoopTargets.length && intersectedSectionMeshes.length) {
        const target = sectionLoopTargets.reduce<{ item: typeof sectionLoopTargets[number]; distance: number } | null>(
          (best, item) => {
            const distance = Math.hypot(item.x - x, item.y - y);
            return distance < (best?.distance ?? 30) ? { item, distance } : best;
          },
          null,
        );
        if (target && (target.distance <= 96 || y > rect.height * 0.48)) {
          const loopIndex = target.item.loopIndex;
          const selectedLoop = currentSectionTopology[loopIndex] ?? currentSectionTopology[0];
          if (selectedLoop) {
            selectedLoopSignature = { role: selectedLoop.role, area: selectedLoop.area };
            selectedLoopIndex = loopIndex;
            selectedLoopTrail = [{ x: target.item.x, y: target.item.y }];
            syncLineageControl();
          }
          const mesh = intersectedSectionMeshes[loopIndex % intersectedSectionMeshes.length];
          updateFocus(mesh);
          recallMemoryForMesh(mesh);
          stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
          canvas.focus({ preventScroll: true });
          return;
        }
      }
      if (!nearest || nearest.distance > 24) return;
      updateFocus(nearest.mesh);
      recallMemoryForMesh(nearest.mesh);
      stage.querySelector<HTMLButtonElement>('[data-artifact-view="model"]')?.click();
      canvas.focus({ preventScroll: true });
    });
    canvas.addEventListener("click", (event: MouseEvent) => {
      if (stage.dataset.artifactView !== "model") return;
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      genomeLineageGroup.updateMatrixWorld(true);
      const lineageHit = raycaster.intersectObjects(genomeLineageGroup.children, false)[0]?.object;
      const lineageNode = lineageHit ? genomeLineageNodes.find(({ mesh, halo }) => mesh === lineageHit || halo === lineageHit) : undefined;
      if (lineageNode) {
        recallGenome(lineageNode.archiveIndex);
        canvas.focus({ preventScroll: true });
        return;
      }
      if (temporalClockConsumed) {
        temporalClockConsumed = false;
        return;
      }
      canvas.focus({ preventScroll: true });
      const hit = raycaster.intersectObjects(group.children, false)[0]?.object;
      const nextFocus = hit === focusedMesh || !hit ? null : hit as THREE.Mesh;
      updateFocus(nextFocus);
      recallMemoryForMesh(nextFocus);
    });
    canvas.addEventListener("pointerdown", (event: PointerEvent) => {
      if (stage.dataset.artifactView !== "model") return;
      if (stage.dataset.causalSingularity) {
        const point = new THREE.Vector3(state.pointerX * 1.35, -state.pointerY * 1.15, 0.38);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([point]),
          new THREE.LineBasicMaterial({ color: 0x8ffff2, transparent: true, opacity: 0.78, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        line.frustumCulled = false;
        singularityWakeGroup.add(line);
        activeSingularityTrail = { line, points: [point] };
        canvas.setPointerCapture(event.pointerId);
        wake();
        return;
      }
      temporalClockGroup.updateMatrixWorld(true);
      const rect = canvas.getBoundingClientRect();
      const center = new THREE.Vector3().setFromMatrixPosition(temporalClockGroup.matrixWorld).project(camera);
      const radiusPoint = new THREE.Vector3(0.74, 0, 0).applyMatrix4(temporalClockGroup.matrixWorld).project(camera);
      const centerX = (center.x * 0.5 + 0.5) * rect.width;
      const centerY = (-center.y * 0.5 + 0.5) * rect.height;
      const radius = Math.max(1, Math.hypot(
        (radiusPoint.x * 0.5 + 0.5) * rect.width - centerX,
        (-radiusPoint.y * 0.5 + 0.5) * rect.height - centerY,
      ));
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const distance = Math.hypot(x - centerX, y - centerY);
      let radialRatio = distance / radius;
      const canvasEdge = Math.max(
        Math.abs(x - rect.width / 2) / Math.max(1, rect.width / 2),
        Math.abs(y - rect.height / 2) / Math.max(1, rect.height / 2),
      );
      if ((radialRatio < 0.42 || radialRatio > 1.7) && canvasEdge < 0.72) return;
      if (radialRatio < 0.42 || radialRatio > 1.7) radialRatio = y < rect.height * 0.3 ? 1.35 : 0.7;
      const layer = radialRatio < 0.88 ? "past" : radialRatio < 1.25 ? "present" : "future";
      const screenAngle = Math.atan2(centerY - y, x - centerX);
      const localAngle = screenAngle - temporalClockGroup.rotation.z;
      const progress = ((localAngle + Math.PI / 2) / (Math.PI * 2) + 1) % 1;
      const english = document.documentElement.lang === "en";
      if (layer === "future") {
        forecastBranchIndex = Math.max(0, Math.min(2, Math.floor(progress * 3)));
        if (recordedFrames.length >= 3) {
          forecastEnabled = true;
          forecastBranching = true;
          forecastBranchManual = true;
          syncRecordingControls();
          triggerBranchWarp(1.08);
          triggerTemporalCollision(forecastBranchIndex);
          stage.dataset.timeCursor = `future:branch-${forecastBranchIndex + 1}`;
          if (neuralMemory) neuralMemory.textContent = english
            ? `FUTURE BRANCH ${forecastBranchIndex + 1} · OBSERVER ${observerSignature}`
            : `未来分支 ${forecastBranchIndex + 1} · 观察者 ${observerSignature}`;
        } else {
          state.sliceScanning = false;
          state.sliceEnabled = true;
          state.slicePercent = 54 + progress * 38;
          syncSliceControls();
          applySectionMode();
          stage.dataset.timeCursor = `future:slice-${Math.round(state.slicePercent)}`;
          triggerBranchWarp(0.82);
          triggerTemporalCollision(forecastBranchIndex);
          if (neuralMemory) neuralMemory.textContent = english
            ? `FUTURE SEED · RECORD 3 FRAMES · ${observerSignature}`
            : `未来种子 · 录制 3 帧 · ${observerSignature}`;
        }
      } else if (recordedFrames.length >= 2 && layer === "past") {
        playback = false;
        playbackIndex = Math.round(progress * (recordedFrames.length - 1));
        const frame = recordedFrames[playbackIndex];
        state.sliceScanning = false;
        state.sliceEnabled = true;
        state.sliceAxis = frame.axis;
        state.slicePercent = frame.percent;
        syncEventUrl(playbackIndex);
        syncSliceControls();
        syncAxisControls();
        syncRecordingControls();
        applySectionMode();
        triggerBranchWarp(0.72);
        stage.dataset.timeCursor = `frame:${playbackIndex}`;
      } else {
        state.sliceScanning = false;
        state.sliceEnabled = true;
        state.slicePercent = layer === "past" ? 8 + progress * 42 : 34 + progress * 42;
        syncSliceControls();
        applySectionMode();
        stage.dataset.timeCursor = `slice:${Math.round(state.slicePercent)}`;
        triggerBranchWarp(layer === "past" ? 0.48 : 0.64);
        if (neuralMemory) neuralMemory.textContent = english
          ? `${layer.toUpperCase()} SLICE · ${Math.round(state.slicePercent)}%`
          : `${layer === "past" ? "过去" : "现在"}切片 · ${Math.round(state.slicePercent)}%`;
      }
      temporalClockConsumed = true;
      wake();
    });
    canvas.addEventListener("pointermove", () => {
      if (!activeSingularityTrail || !stage.dataset.causalSingularity) return;
      const point = new THREE.Vector3(state.pointerX * 1.35, -state.pointerY * 1.15, 0.38 + activeSingularityTrail.points.length * 0.001);
      const previous = activeSingularityTrail.points[activeSingularityTrail.points.length - 1];
      if (previous.distanceTo(point) < 0.018) return;
      activeSingularityTrail.points.push(point);
      if (activeSingularityTrail.points.length > 64) activeSingularityTrail.points.shift();
      activeSingularityTrail.line.geometry.dispose();
      activeSingularityTrail.line.geometry = new THREE.BufferGeometry().setFromPoints(activeSingularityTrail.points);
      activeSingularityTrail.line.material.color.setHex(forecastBranchIndex === 0 ? 0xb9a8ff : forecastBranchIndex === 2 ? 0xffca68 : 0x8ffff2);
      wake();
    });
    canvas.addEventListener("pointerup", (event: PointerEvent) => {
      if (!activeSingularityTrail) return;
      if (activeSingularityTrail.points.length > 1) {
        singularityWakeTrails.push({ line: activeSingularityTrail.line, bornAt: performance.now(), points: activeSingularityTrail.points.slice() });
        while (singularityWakeTrails.length > 4) {
          const oldest = singularityWakeTrails.shift();
          if (!oldest) break;
          singularityWakeGroup.remove(oldest.line);
          oldest.line.geometry.dispose();
          oldest.line.material.dispose();
        }
        syncCausalOrbitControls();
        broadcastCausalOrbit(activeSingularityTrail.points);
      } else {
        singularityWakeGroup.remove(activeSingularityTrail.line);
        activeSingularityTrail.line.geometry.dispose();
        activeSingularityTrail.line.material.dispose();
        syncCausalOrbitControls();
      }
      activeSingularityTrail = null;
      canvas.releasePointerCapture(event.pointerId);
      wake();
    });
    syncNeuralMemory();
    stage.classList.add("model-loaded");
    if (pendingGenomeIndex !== null && swarmArchive[pendingGenomeIndex]) {
      const index = pendingGenomeIndex;
      pendingGenomeIndex = null;
      window.setTimeout(() => recallGenome(index), 0);
    }
    wake();
  };

  // Resolve Lab assets from Astro's configured deployment base, not from the
  // current language route. `/lab/` and `/en/lab/` are both nested pages.
  const assetRoot = new URL(import.meta.env.BASE_URL, document.baseURI);
  const startStepWorker = (): void => {
    const worker = new Worker(new URL("./step-worker.ts", import.meta.url), {
      type: "classic",
    });
    worker.onmessage = ({ data }: MessageEvent<MeshMessage>): void => {
      if (data.type === "mesh" && data.meshes?.length && data.triangleCount && data.modelSpanMm) {
        stage.dataset.modelSource = "step-worker";
        uploadMesh(data.meshes, data.triangleCount, data.modelSpanMm, data.modelCenterMm ?? []);
      } else {
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
    const modelQuality = stage.clientWidth < 520 ? 0.007 : 0.004;
    worker.postMessage({
      stepUrl: new URL("assets/model/Easykiconverter_展示模型.step", assetRoot).href,
      vendorRoot: new URL("assets/vendor/", assetRoot).href,
      linearDeflection: modelQuality,
    });
  };

  const loadGlb = (): void => {
    const loader = new GLTFLoader();
    const mobileAsset = stage.clientWidth < 520 || window.matchMedia("(max-width: 760px)").matches;
    const modelAsset = mobileAsset
      ? "assets/model/Easykiconverter_展示模型-mobile.glb"
      : "assets/model/Easykiconverter_展示模型.glb";
    stage.dataset.modelAsset = mobileAsset ? "mobile" : "desktop";
    loader.load(
      new URL(modelAsset, assetRoot).href,
      (gltf) => {
        try {
          const meshes: NonNullable<MeshMessage["meshes"]> = [];
          gltf.scene.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            const position = object.geometry.getAttribute("position");
            if (!position) return;
            const normal = object.geometry.getAttribute("normal");
            const positions = Float32Array.from(position.array as ArrayLike<number>);
            const normals = normal ? Float32Array.from(normal.array as ArrayLike<number>) : undefined;
            const indices = object.geometry.index
              ? Uint32Array.from(object.geometry.index.array as ArrayLike<number>)
              : (() => {
                  const generated = new Uint32Array(positions.length / 3);
                  for (let index = 0; index < generated.length; index += 1) generated[index] = index;
                  return generated;
                })();
            const material = Array.isArray(object.material) ? object.material[0] : object.material;
            const color = material instanceof THREE.MeshStandardMaterial
              ? [material.color.r, material.color.g, material.color.b]
              : [0.52, 0.71, 0.62];
            meshes.push({
              positions: positions.buffer,
              normals: normals?.buffer as ArrayBuffer | undefined,
              indices: indices.buffer,
              color,
              roughness: material instanceof THREE.MeshStandardMaterial ? material.roughness : undefined,
              metalness: material instanceof THREE.MeshStandardMaterial ? material.metalness : undefined,
            });
          });
          const triangleCount = meshes.reduce((total, mesh) => total + mesh.indices.byteLength / Uint32Array.BYTES_PER_ELEMENT / 3, 0);
          const asset = gltf.asset as { extras?: { sourceModelSpanMm?: number; sourceModelCenterMm?: number[] } };
          if (!meshes.length || !triangleCount) throw new Error("GLB contains no renderable meshes");
          stage.dataset.modelSource = "glb";
          if (state.reducedMotion) reducedMotionRenderPending = true;
          uploadMesh(
            meshes,
            triangleCount,
            asset.extras?.sourceModelSpanMm ?? 1,
            asset.extras?.sourceModelCenterMm ?? [0, 0, 0],
          );
        } catch (error) {
          console.warn("GLB model fallback:", error instanceof Error ? error.message : String(error));
          startStepWorker();
        }
      },
      undefined,
      (error) => {
        console.warn("GLB model fallback:", error instanceof Error ? error.message : String(error));
        startStepWorker();
      },
    );
  };
  loadGlb();

  const onPointerMove = (event: PointerEvent): void => {
    if (state.reducedMotion) return;
    state.pointerX = event.clientX / Math.max(1, window.innerWidth) - 0.5;
    state.pointerY = event.clientY / Math.max(1, window.innerHeight) - 0.5;
    wake();
  };
  stage.addEventListener("pointermove", onPointerMove, { passive: true });
  stage.addEventListener("pointerleave", () => {
    if (state.reducedMotion) return;
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
  window.addEventListener("scroll", () => {
    if (!state.reducedMotion) wake();
  }, { passive: true });
  document.addEventListener("visibilitychange", wake);
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  motionPreference.addEventListener("change", ({ matches }) => {
    state.reducedMotion = matches;
    if (matches) {
      reducedMotionRenderPending = true;
      state.pointerX = 0;
      state.pointerY = 0;
      state.storyProgress = 0;
      state.sliceScanning = false;
      playback = false;
      cinematicStartedAt = 0;
      if (scanTimer) window.clearTimeout(scanTimer);
      if (playbackTimer) window.clearTimeout(playbackTimer);
      if (timeline) delete timeline.dataset.storyStep;
      if (progressFill) progressFill.style.transform = "scaleX(0)";
      setScanButtonState(false);
      syncSliceControls();
      syncRecordingControls();
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
