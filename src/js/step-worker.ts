type Bounds = {
  x: [number, number];
  y: [number, number];
  z: [number, number];
};

type WorkerInput = {
  stepUrl: string;
  vendorRoot: string;
  bounds: Bounds;
  maxTriangles: number;
};

type MeshData = {
  attributes?: { position?: { array?: ArrayLike<number> } };
  index?: { array?: ArrayLike<number> };
  color?: number[];
};

type StepResult = {
  success: boolean;
  meshes: MeshData[];
};

type OcctModule = {
  ReadStepFile: (data: Uint8Array, options: Record<string, string | number>) => StepResult;
};

type WorkerScope = {
  importScripts: (...urls: string[]) => void;
  onmessage: ((event: MessageEvent<WorkerInput>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  occtimportjs: (options: { locateFile: (file: string) => string }) => Promise<OcctModule>;
};

const workerScope = self as unknown as WorkerScope;

/* Parse and prepare the real STEP model away from the page's main thread. */
workerScope.onmessage = async ({ data }: MessageEvent<WorkerInput>): Promise<void> => {
  try {
    workerScope.importScripts(`${data.vendorRoot}occt-import-js.js`);
    const occt = await workerScope.occtimportjs({ locateFile: (file: string) => `${data.vendorRoot}${file}` });
    const response = await fetch(data.stepUrl, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`STEP ${response.status}`);
    const buffer = await response.arrayBuffer();
    const result = occt.ReadStepFile(new Uint8Array(buffer), {
      linearUnit: 'millimeter',
      linearDeflectionType: 'bounding_box_ratio',
      linearDeflection: 0.012,
      angularDeflection: 0.35,
    });
    if (!result.success) throw new Error('STEP triangulation failed');

    const { bounds, maxTriangles } = data;
    const center = {
      x: (bounds.x[0] + bounds.x[1]) / 2,
      y: (bounds.y[0] + bounds.y[1]) / 2,
      z: (bounds.z[0] + bounds.z[1]) / 2,
    };
    const span = Math.max(bounds.x[1] - bounds.x[0], bounds.y[1] - bounds.y[0]);
    const vertices: number[] = [];
    let triangles = 0;
    result.meshes.forEach((mesh: MeshData) => {
      if (!mesh.attributes?.position?.array || !mesh.index?.array || triangles >= maxTriangles) return;
      const positions = mesh.attributes.position.array;
      const indices = mesh.index.array;
      const color = mesh.color?.length === 3 ? mesh.color : [0.52, 0.71, 0.62];
      const stride = Math.max(1, Math.ceil(indices.length / 3 / Math.max(1, maxTriangles - triangles)));
      for (let triangle = 0; triangle < indices.length / 3 && triangles < maxTriangles; triangle += stride) {
        const ia = Number(indices[triangle * 3]) * 3;
        const ib = Number(indices[triangle * 3 + 1]) * 3;
        const ic = Number(indices[triangle * 3 + 2]) * 3;
        const a = [(Number(positions[ia]) - center.x) / span * 2, (Number(positions[ia + 1]) - center.y) / span * 2, (Number(positions[ia + 2]) - center.z) / span * 2];
        const b = [(Number(positions[ib]) - center.x) / span * 2, (Number(positions[ib + 1]) - center.y) / span * 2, (Number(positions[ib + 2]) - center.z) / span * 2];
        const c = [(Number(positions[ic]) - center.x) / span * 2, (Number(positions[ic + 1]) - center.y) / span * 2, (Number(positions[ic + 2]) - center.z) / span * 2];
        const ux = b[0] - a[0]; const uy = b[1] - a[1]; const uz = b[2] - a[2];
        const vx = c[0] - a[0]; const vy = c[1] - a[1]; const vz = c[2] - a[2];
        const nx = uy * vz - uz * vy; const ny = uz * vx - ux * vz; const nz = ux * vy - uy * vx;
        [a, b, c].forEach((point) => vertices.push(point[0], point[1], point[2], nx, ny, nz, color[0], color[1], color[2]));
        triangles += 1;
      }
    });
    const output = new Float32Array(vertices);
    workerScope.postMessage({ type: 'mesh', vertices: output.buffer, vertexCount: output.length / 9 }, [output.buffer]);
  } catch (error) {
    workerScope.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
