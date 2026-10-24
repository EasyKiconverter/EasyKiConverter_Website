import { resolve } from 'node:path';
import { statSync, writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';

const root = resolve(import.meta.dirname, '..');
const sourceRoot = resolve(root, 'src/assets/source/model');
const outputRoot = resolve(root, 'public/assets/model');
const assets = [
  {
    name: 'desktop',
    input: resolve(sourceRoot, 'Easykiconverter_展示模型.glb'),
    output: resolve(outputRoot, 'Easykiconverter_展示模型.glb'),
  },
  {
    name: 'mobile',
    input: resolve(sourceRoot, 'Easykiconverter_展示模型-mobile.glb'),
    output: resolve(outputRoot, 'Easykiconverter_展示模型-mobile.glb'),
  },
];

await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const deliverySizes = {};

for (const asset of assets) {
  const document = await io.read(asset.input);
  const meshCount = document.getRoot().listMeshes().length;
  if (meshCount === 0) throw new Error(`${asset.input}: source GLB has no meshes`);

  await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(asset.output, document);

  const deliveryBytes = statSync(asset.output).size;
  deliverySizes[asset.name] = deliveryBytes;
  console.log(JSON.stringify({
    name: asset.name,
    input: asset.input,
    output: asset.output,
    meshes: meshCount,
    sourceBytes: statSync(asset.input).size,
    deliveryBytes,
  }));
}

const sizeManifest = resolve(root, 'src/data/lab-model-sizes.json');
writeFileSync(sizeManifest, `${JSON.stringify(deliverySizes, null, 2)}\n`);
console.log(`Updated ${sizeManifest}`);
