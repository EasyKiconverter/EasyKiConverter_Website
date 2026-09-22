type Bounds = {
  x: [number, number];
  y: [number, number];
  z: [number, number];
};

type WorkerInput = {
  stepUrl: string;
  vendorRoot: string;
  bounds: Bounds;
  linearDeflection: number;
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

type PackedMesh = {
  positions: ArrayBuffer;
  indices: ArrayBuffer;
  color: number[];
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
      linearDeflection: data.linearDeflection,
      angularDeflection: 0.16,
    });
    if (!result.success) throw new Error('STEP triangulation failed');

    const { bounds } = data;
    const center = {
      x: (bounds.x[0] + bounds.x[1]) / 2,
      y: (bounds.y[0] + bounds.y[1]) / 2,
      z: (bounds.z[0] + bounds.z[1]) / 2,
    };
    const span = Math.max(bounds.x[1] - bounds.x[0], bounds.y[1] - bounds.y[0]);
    const meshes: PackedMesh[] = [];
    const transfers: ArrayBuffer[] = [];
    let triangles = 0;
    result.meshes.forEach((mesh: MeshData) => {
      if (!mesh.attributes?.position?.array || !mesh.index?.array) return;
      const positions = mesh.attributes.position.array;
      const indices = mesh.index.array;
      const color = mesh.color?.length === 3 ? mesh.color : [0.52, 0.71, 0.62];
      const normalizedPositions = new Float32Array(positions.length);
      for (let index = 0; index < positions.length; index += 3) {
        normalizedPositions[index] = (Number(positions[index]) - center.x) / span * 2;
        normalizedPositions[index + 1] = (Number(positions[index + 1]) - center.y) / span * 2;
        normalizedPositions[index + 2] = (Number(positions[index + 2]) - center.z) / span * 2;
      }
      const packedIndices = new Uint32Array(indices.length);
      for (let index = 0; index < indices.length; index += 1) packedIndices[index] = Number(indices[index]);
      meshes.push({ positions: normalizedPositions.buffer, indices: packedIndices.buffer, color });
      transfers.push(normalizedPositions.buffer, packedIndices.buffer);
      triangles += Math.floor(indices.length / 3);
    });
    if (!meshes.length) throw new Error('STEP file did not contain any renderable meshes');
    workerScope.postMessage({ type: 'mesh', meshes, triangleCount: triangles }, transfers);
  } catch (error) {
    workerScope.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
