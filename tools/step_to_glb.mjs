#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const usage = "Usage: node tools/step_to_glb.mjs --input model.step --runtime public/assets/vendor --output model.glb [--linear-deflection 0.004]";
const args = process.argv.slice(2);
const getOption = (name, fallback = undefined) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const inputPath = getOption("--input");
const runtimeRoot = getOption("--runtime");
const outputPath = getOption("--output");
const linearDeflection = Number(getOption("--linear-deflection", "0.004"));

if (!inputPath || !runtimeRoot || !outputPath || !Number.isFinite(linearDeflection) || linearDeflection <= 0) {
  console.error(usage);
  process.exit(2);
}

const readCommonJsExport = (filename) => {
  const module = { exports: {} };
  const require = createRequire(filename);
  const context = {
    module,
    exports: module.exports,
    require,
    process,
    __dirname: path.dirname(filename),
    console,
    setTimeout,
    clearTimeout,
    WebAssembly,
  };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), context, { filename });
  return module.exports;
};

const align4 = (value) => (value + 3) & ~3;
const chunks = [];
const bufferViews = [];
const accessors = [];
const materials = [];
const meshes = [];
const nodes = [];
const materialByColor = new Map();

const appendBuffer = (value, target) => {
  const offset = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  chunks.push(bytes);
  while (chunks.reduce((total, chunk) => total + chunk.length, 0) % 4 !== 0) chunks.push(Buffer.alloc(1));
  const view = { buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, target };
  bufferViews.push(view);
  return bufferViews.length - 1;
};

const addAccessor = (bufferView, componentType, count, type, min, max) => {
  accessors.push({ bufferView, componentType, count, type, min, max });
  return accessors.length - 1;
};

const getMaterial = (color) => {
  const normalized = color?.length === 3 ? color : [0.52, 0.71, 0.62];
  const key = normalized.map((value) => Number(value).toFixed(5)).join(",");
  if (materialByColor.has(key)) return materialByColor.get(key);
  const index = materials.length;
  materials.push({
    name: `STEP material ${index + 1}`,
    pbrMetallicRoughness: {
      baseColorFactor: [...normalized, 1],
      metallicFactor: 0.16,
      roughnessFactor: 0.34,
    },
  });
  materialByColor.set(key, index);
  return index;
};

const minMax = (values, stride) => {
  const min = Array(stride).fill(Infinity);
  const max = Array(stride).fill(-Infinity);
  for (let index = 0; index < values.length; index += stride) {
    for (let axis = 0; axis < stride; axis += 1) {
      min[axis] = Math.min(min[axis], values[index + axis]);
      max[axis] = Math.max(max[axis], values[index + axis]);
    }
  }
  return { min, max };
};

const buildNormals = (positions, indices) => {
  const normals = new Float32Array(positions.length);
  for (let index = 0; index + 2 < indices.length; index += 3) {
    const a = indices[index] * 3;
    const b = indices[index + 1] * 3;
    const c = indices[index + 2] * 3;
    const abx = positions[b] - positions[a];
    const aby = positions[b + 1] - positions[a + 1];
    const abz = positions[b + 2] - positions[a + 2];
    const acx = positions[c] - positions[a];
    const acy = positions[c + 1] - positions[a + 1];
    const acz = positions[c + 2] - positions[a + 2];
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    for (const vertex of [a, b, c]) {
      normals[vertex] += nx;
      normals[vertex + 1] += ny;
      normals[vertex + 2] += nz;
    }
  }
  for (let index = 0; index < normals.length; index += 3) {
    const length = Math.hypot(normals[index], normals[index + 1], normals[index + 2]) || 1;
    normals[index] /= length;
    normals[index + 1] /= length;
    normals[index + 2] /= length;
  }
  return normals;
};

const source = path.resolve(inputPath);
const runtime = path.resolve(runtimeRoot);
const output = path.resolve(outputPath);
const occt = await readCommonJsExport(path.join(runtime, "occt-import-js.js"))({
  locateFile: (file) => path.join(runtime, file),
});
const result = occt.ReadStepFile(new Uint8Array(fs.readFileSync(source)), {
  linearUnit: "millimeter",
  linearDeflectionType: "bounding_box_ratio",
  linearDeflection,
  angularDeflection: 0.16,
});
if (!result.success) throw new Error("STEP triangulation failed");

const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
result.meshes.forEach((mesh) => {
  const positions = mesh.attributes?.position?.array;
  if (!positions) return;
  for (let index = 0; index + 2 < positions.length; index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = Number(positions[index + axis]);
      bounds.min[axis] = Math.min(bounds.min[axis], value);
      bounds.max[axis] = Math.max(bounds.max[axis], value);
    }
  }
});
const center = bounds.min.map((min, axis) => (min + bounds.max[axis]) / 2);
const span = Math.max(...bounds.max.map((max, axis) => max - bounds.min[axis]));
if (!Number.isFinite(span) || span <= 0) throw new Error("STEP model has invalid geometry bounds");

let triangles = 0;
result.meshes.forEach((mesh, index) => {
  if (!mesh.attributes?.position?.array || !mesh.index?.array) return;
  const positions = Float32Array.from(mesh.attributes.position.array);
  for (let position = 0; position < positions.length; position += 3) {
    positions[position] = (positions[position] - center[0]) / span * 2;
    positions[position + 1] = (positions[position + 1] - center[1]) / span * 2;
    positions[position + 2] = (positions[position + 2] - center[2]) / span * 2;
  }
  const indices = Uint32Array.from(mesh.index.array);
  const normals = buildNormals(positions, indices);
  const positionView = appendBuffer(positions, 34962);
  const normalView = appendBuffer(normals, 34962);
  const indexView = appendBuffer(indices, 34963);
  const positionBounds = minMax(positions, 3);
  const meshIndex = meshes.length;
  meshes.push({
    name: `STEP mesh ${index + 1}`,
    primitives: [{
      attributes: {
        POSITION: addAccessor(positionView, 5126, positions.length / 3, "VEC3", positionBounds.min, positionBounds.max),
        NORMAL: addAccessor(normalView, 5126, normals.length / 3, "VEC3"),
      },
      indices: addAccessor(indexView, 5125, indices.length, "SCALAR"),
      material: getMaterial(mesh.color),
      mode: 4,
    }],
  });
  nodes.push({ name: `STEP mesh ${index + 1}`, mesh: meshIndex });
  triangles += Math.floor(indices.length / 3);
});
if (!meshes.length) throw new Error("STEP file did not contain any renderable meshes");

const binary = Buffer.concat(chunks);
const document = {
  asset: {
    version: "2.0",
    generator: "EasyKiConverter step_to_glb.mjs",
    extras: { sourceModelSpanMm: span, sourceModelCenterMm: center },
  },
  scene: 0,
  scenes: [{ nodes: nodes.map((_, index) => index) }],
  nodes,
  meshes,
  materials,
  accessors,
  bufferViews,
  buffers: [{ byteLength: binary.length }],
};
const json = Buffer.from(JSON.stringify(document));
const jsonPadded = Buffer.concat([json, Buffer.alloc(align4(json.length) - json.length, 0x20)]);
const binPadded = Buffer.concat([binary, Buffer.alloc(align4(binary.length) - binary.length)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + binPadded.length, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(jsonPadded.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binPadded.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header, jsonHeader, jsonPadded, binHeader, binPadded]));
console.log(JSON.stringify({ output, meshes: meshes.length, triangles, bytes: fs.statSync(output).size, linearDeflection }));
