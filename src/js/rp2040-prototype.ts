import * as THREE from 'three';
import { rp2040StoryComponent } from '../data/story-component';

const PACKAGE_BODY_MM = 6.25;
const PACKAGE_THICKNESS_MM = 0.72;
const CONTACT_PITCH_MM = 0.4;
const CONTACT_WIDTH_MM = 0.26;
const CONTACT_DEPTH_MM = 0.34;
const CONTACT_THICKNESS_MM = 0.055;

export interface ProtagonistPart {
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  direction: THREE.Vector3;
}

export const createRp2040Prototype = () => {
  const group = new THREE.Group();
  group.name = 'Illustrative Raspberry Pi RP2040 QFN-56 package';

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x292a30,
    roughness: 0.43,
    metalness: 0.12,
  });
  const contactMaterial = new THREE.MeshStandardMaterial({
    color: 0xc2a36e,
    roughness: 0.32,
    metalness: 0.66,
  });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(PACKAGE_BODY_MM, PACKAGE_BODY_MM, PACKAGE_THICKNESS_MM),
    bodyMaterial,
  );
  body.name = 'RP2040 package body · illustrative thickness';
  body.castShadow = true;
  group.add(body);

  const markingCanvas = document.createElement('canvas');
  markingCanvas.width = 512;
  markingCanvas.height = 112;
  const markingContext = markingCanvas.getContext('2d');
  if (markingContext) {
    markingContext.fillStyle = '#e8e4dc';
    markingContext.font = '600 64px Arial, sans-serif';
    markingContext.textAlign = 'center';
    markingContext.textBaseline = 'middle';
    markingContext.fillText(rp2040StoryComponent.name, markingCanvas.width / 2, markingCanvas.height / 2);
    const marking = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 0.92),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(markingCanvas),
        transparent: true,
        depthWrite: false,
      }),
    );
    marking.name = 'RP2040 package top marking';
    marking.position.z = PACKAGE_THICKNESS_MM / 2 + 0.006;
    group.add(marking);
  }

  const pinMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xf4c77b, roughness: 0.4, metalness: 0.24 }),
  );
  pinMarker.name = 'Illustrative pin-one marker';
  pinMarker.position.set(-2.55, 2.55, PACKAGE_THICKNESS_MM / 2 + 0.015);
  group.add(pinMarker);

  const contactGeometry = new THREE.BoxGeometry(CONTACT_WIDTH_MM, CONTACT_DEPTH_MM, CONTACT_THICKNESS_MM);
  const sideContactGeometry = new THREE.BoxGeometry(CONTACT_DEPTH_MM, CONTACT_WIDTH_MM, CONTACT_THICKNESS_MM);
  const exposedPad = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 2.7, CONTACT_THICKNESS_MM),
    contactMaterial,
  );
  exposedPad.name = 'Illustrative exposed ground pad';
  exposedPad.position.z = -(PACKAGE_THICKNESS_MM + CONTACT_THICKNESS_MM) / 2;
  group.add(exposedPad);

  const movableParts: ProtagonistPart[] = [{
    mesh: exposedPad,
    base: exposedPad.position.clone(),
    direction: new THREE.Vector3(0, 0, -1),
  }];
  const countPerSide = rp2040StoryComponent.contactsPerSide;
  const centerOffset = ((countPerSide - 1) * CONTACT_PITCH_MM) / 2;
  const contactEdge = rp2040StoryComponent.packageSizeMm / 2 - 0.16;
  const bodyBottom = -(PACKAGE_THICKNESS_MM + CONTACT_THICKNESS_MM) / 2;

  for (let side = 0; side < 4; side += 1) {
    for (let index = 0; index < countPerSide; index += 1) {
      const along = -centerOffset + index * CONTACT_PITCH_MM;
      const position = side === 0
        ? new THREE.Vector3(along, -contactEdge, bodyBottom)
        : side === 1
          ? new THREE.Vector3(contactEdge, along, bodyBottom)
          : side === 2
            ? new THREE.Vector3(-along, contactEdge, bodyBottom)
            : new THREE.Vector3(-contactEdge, -along, bodyBottom);
      const contact = new THREE.Mesh(side % 2 === 0 ? contactGeometry : sideContactGeometry, contactMaterial);
      contact.name = `Illustrative QFN contact ${side * countPerSide + index + 1}`;
      contact.position.copy(position);
      contact.castShadow = true;
      contact.userData.contactIndex = side * countPerSide + index + 1;
      group.add(contact);

      const direction = new THREE.Vector3(position.x * 0.55, position.y * 0.55, 1.4).normalize();
      movableParts.push({ mesh: contact, base: position.clone(), direction });
    }
  }

  return {
    group,
    movableParts,
    contactCount: rp2040StoryComponent.contactCount,
  };
};
