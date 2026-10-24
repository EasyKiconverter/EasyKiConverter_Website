import { resolve } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';

const root = resolve(import.meta.dirname, '..');
const input = resolve(root, 'src/assets/source/model/Easykiconverter_展示模型.glb');
const output = resolve(root, 'public/assets/showcase/easyki-conversion-story.glb');

await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const document = await io.read(input);
await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(output, document);
console.log(`Optimized conversion-story model: ${output}`);
