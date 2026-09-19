import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export interface MorphTargetInfo {
  name: string;
  index: number;
  meshName: string;
}

export interface LoadedAvatar {
  root: THREE.Group | THREE.Object3D;
  headMesh: THREE.SkinnedMesh | THREE.Mesh | null;
  allMorphMeshes: Array<THREE.SkinnedMesh | THREE.Mesh>;
  morphDictionary: Record<string, number>;
  morphNames: string[];
  headBone?: THREE.Bone | THREE.Object3D;
  initialBoneRotation?: THREE.Euler;
  isCustomModel: boolean;
}

/**
 * Smart resolver to map varied 3D avatar morph target names (CC4, ReadyPlayerMe,
 * Apple ARKit 52, Blender Shape Keys, Oculus Visemes) to standard speech & expression channels.
 */
export function resolveMorphWeight(
  meshMorphName: string,
  targetWeights: Record<string, number>
): number {
  if (targetWeights[meshMorphName] !== undefined) {
    return targetWeights[meshMorphName];
  }

  // Strip common mesh or namespace prefixes (e.g., "CC_Base_Head.", "Wolf3D_Head.", "BlendShape1.")
  const cleanName = meshMorphName.replace(/^[a-zA-Z0-9_-]+\./, "");
  if (targetWeights[cleanName] !== undefined) {
    return targetWeights[cleanName];
  }

  const norm = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Jaw Open / Mouth Open / Open Viseme
  if (
    norm.includes("jawopen") ||
    norm.includes("mouthopen") ||
    norm === "open" ||
    norm.includes("openmouth") ||
    norm.includes("mouthdrop") ||
    norm === "jaw"
  ) {
    return targetWeights["jawOpen"] ?? 0;
  }

  // 2. Visemes
  if (norm.includes("visemeaa") || norm === "aa" || norm.includes("mouthah")) {
    return targetWeights["viseme_aa"] ?? targetWeights["jawOpen"] ?? 0;
  }
  if (norm.includes("visemee") || norm === "ee") {
    return targetWeights["viseme_E"] ?? 0;
  }
  if (norm.includes("visemei") || norm === "ih") {
    return targetWeights["viseme_I"] ?? 0;
  }
  if (norm.includes("visemeo") || norm === "oh") {
    return targetWeights["viseme_O"] ?? targetWeights["mouthFunnel"] ?? 0;
  }
  if (norm.includes("visemeu") || norm === "ou") {
    return targetWeights["viseme_U"] ?? targetWeights["mouthPucker"] ?? 0;
  }
  if (norm.includes("visemepp") || norm.includes("visememb") || norm.includes("mouthclose")) {
    return targetWeights["viseme_PP"] ?? 0;
  }
  if (norm.includes("visemeff") || norm.includes("visemevv")) {
    return targetWeights["viseme_FF"] ?? 0;
  }
  if (norm.includes("visemeth")) {
    return targetWeights["viseme_TH"] ?? 0;
  }
  if (norm.includes("visemech") || norm.includes("visemedd")) {
    return targetWeights["viseme_CH"] ?? 0;
  }
  if (norm.includes("visemess")) {
    return targetWeights["viseme_SS"] ?? 0;
  }

  // 3. Smile Left / Right
  if (
    (norm.includes("smile") || norm.includes("grin")) &&
    (norm.includes("left") || norm.endsWith("l") || norm.includes("_l"))
  ) {
    return targetWeights["mouthSmileLeft"] ?? 0;
  }
  if (
    (norm.includes("smile") || norm.includes("grin")) &&
    (norm.includes("right") || norm.endsWith("r") || norm.includes("_r"))
  ) {
    return targetWeights["mouthSmileRight"] ?? 0;
  }
  if (norm.includes("smile")) {
    return targetWeights["mouthSmileLeft"] ?? targetWeights["mouthSmileRight"] ?? 0;
  }

  // 4. Eye Blink Left / Right
  if (
    (norm.includes("blink") || norm.includes("eyeclose") || norm.includes("eyesclose")) &&
    (norm.includes("left") || norm.endsWith("l") || norm.includes("_l"))
  ) {
    return targetWeights["eyeBlinkLeft"] ?? 0;
  }
  if (
    (norm.includes("blink") || norm.includes("eyeclose") || norm.includes("eyesclose")) &&
    (norm.includes("right") || norm.endsWith("r") || norm.includes("_r"))
  ) {
    return targetWeights["eyeBlinkRight"] ?? 0;
  }
  if (norm.includes("blink") || norm.includes("eyesclosed") || norm.includes("eyeclose")) {
    return targetWeights["eyeBlinkLeft"] ?? targetWeights["eyeBlinkRight"] ?? 0;
  }

  // 5. Mouth Pucker & Funnel
  if (norm.includes("pucker") || norm.includes("kiss") || norm.includes("whistle")) {
    return targetWeights["mouthPucker"] ?? 0;
  }
  if (norm.includes("funnel") || norm.includes("moutho")) {
    return targetWeights["mouthFunnel"] ?? 0;
  }

  // 6. Brows
  if (norm.includes("brow") && (norm.includes("up") || norm.includes("raise"))) {
    return targetWeights["browInnerUp"] ?? 0;
  }

  return 0;
}

export class AvatarModelLoader {
  private static gltfLoader: GLTFLoader | null = null;

  private static getGLTFLoader(): GLTFLoader {
    if (!this.gltfLoader) {
      const loader = new GLTFLoader();
      try {
        const draco = new DRACOLoader();
        draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
        draco.setDecoderConfig({ type: "js" });
        loader.setDRACOLoader(draco);
      } catch (e) {
        console.warn("Could not initialize DRACOLoader:", e);
      }
      this.gltfLoader = loader;
    }
    return this.gltfLoader;
  }

  /**
   * Loads custom 3D model directly from a user File in memory.
   * Handles .glb, .gltf, .vrm, and .obj formats with robust blob URL and arrayBuffer parsing.
   */
  public static async loadFromFile(file: File): Promise<LoadedAvatar> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (ext === "obj") {
      const text = await file.text();
      const objLoader = new OBJLoader();
      const root = objLoader.parse(text);
      return this.processLoadedScene(root);
    }

    // Try blob URL loading first (most reliable in Three.js for glTF binary, textures and images)
    const blobUrl = URL.createObjectURL(file);
    try {
      const loader = this.getGLTFLoader();
      return await new Promise<LoadedAvatar>((resolve, reject) => {
        loader.load(
          blobUrl,
          (gltf) => {
            try {
              const root = gltf.scene || (gltf.scenes && gltf.scenes[0]) || gltf;
              resolve(this.processLoadedScene(root as THREE.Group));
            } catch (err) {
              reject(err);
            }
          },
          undefined,
          (err) => reject(err)
        );
      });
    } catch (blobErr) {
      console.warn("Blob URL parsing failed, attempting ArrayBuffer fallback:", blobErr);
      const buffer = await file.arrayBuffer();
      const loader = this.getGLTFLoader();
      return await new Promise<LoadedAvatar>((resolve, reject) => {
        loader.parse(
          buffer,
          "",
          (gltf) => {
            try {
              const root = gltf.scene || (gltf.scenes && gltf.scenes[0]) || gltf;
              resolve(this.processLoadedScene(root as THREE.Group));
            } catch (err) {
              reject(err);
            }
          },
          (err) => reject(err)
        );
      });
    } finally {
      // Safely revoke the blob URL only after load or rejection finishes
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Loads a .glb/.gltf model from a URL or ArrayBuffer
   */
  public static async loadGLB(urlOrBuffer: string | ArrayBuffer): Promise<LoadedAvatar> {
    const loader = this.getGLTFLoader();

    if (typeof urlOrBuffer !== "string") {
      return new Promise((resolve, reject) => {
        loader.parse(
          urlOrBuffer,
          "",
          (gltf) => {
            try {
              const root = gltf.scene || (gltf.scenes && gltf.scenes[0]);
              resolve(this.processLoadedScene(root));
            } catch (err) {
              reject(err);
            }
          },
          reject
        );
      });
    }

    return new Promise((resolve, reject) => {
      loader.load(
        urlOrBuffer,
        (gltf) => {
          try {
            const root = gltf.scene || (gltf.scenes && gltf.scenes[0]);
            resolve(this.processLoadedScene(root));
          } catch (err) {
            reject(err);
          }
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Common scene processing: detects morph targets across all meshes,
   * configures materials, creates procedural fallbacks if needed, and normalizes scale.
   */
  private static processLoadedScene(root: THREE.Group | THREE.Object3D): LoadedAvatar {
    let headMesh: THREE.SkinnedMesh | THREE.Mesh | null = null;
    const allMorphMeshes: Array<THREE.SkinnedMesh | THREE.Mesh> = [];
    const combinedDictionary: Record<string, number> = {};
    let headBone: THREE.Bone | THREE.Object3D | undefined;

    root.traverse((child) => {
      // Find bone for head tilt & idle sway (prefer Head over Neck)
      if ((child as THREE.Bone).isBone) {
        const nameLower = child.name.toLowerCase();
        if (nameLower.includes("head") && !nameLower.includes("top") && !nameLower.includes("end")) {
          headBone = child;
        } else if (!headBone && nameLower.includes("neck")) {
          headBone = child;
        }
      }

      // Check meshes for morph targets and configure rendering
      if ((child as THREE.Mesh).isMesh || (child as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = child as THREE.SkinnedMesh | THREE.Mesh;

        // CRITICAL: Disable frustum culling so scaled and transformed skinned meshes don't disappear
        mesh.frustumCulled = false;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Enhance material rendering
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            // Only set DoubleSide on non-transparent materials to avoid alpha z-sorting glitches
            if (!mat.transparent) {
              mat.side = THREE.DoubleSide;
            }
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.roughness = Math.min(mat.roughness, 0.85);
              mat.envMapIntensity = 1.0;
              mat.needsUpdate = true;
            }
          });
        }

        // Check if morph attributes exist on geometry even if dictionary is unpopulated
        const geom = mesh.geometry;
        if (geom && geom.morphAttributes && geom.morphAttributes.position && geom.morphAttributes.position.length > 0) {
          if (!mesh.morphTargetDictionary) {
            mesh.morphTargetDictionary = {};
            geom.morphAttributes.position.forEach((attr: any, idx: number) => {
              const mName = attr.name || `morph_${idx}`;
              mesh.morphTargetDictionary![mName] = idx;
            });
          }
          if (!mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences = new Array(
              Object.keys(mesh.morphTargetDictionary).length
            ).fill(0);
          }
        }

        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          allMorphMeshes.push(mesh);

          const nameLower = mesh.name.toLowerCase();
          if (
            nameLower.includes("wolf3d_head") ||
            nameLower.includes("cc_base_head") ||
            nameLower === "head" ||
            nameLower.includes("head") ||
            nameLower.includes("face")
          ) {
            if (!headMesh) headMesh = mesh;
          }

          Object.keys(mesh.morphTargetDictionary).forEach((mName) => {
            combinedDictionary[mName] = mesh.morphTargetDictionary![mName];
          });
        }
      }
    });

    // Fallback to first morph mesh if headMesh not explicitly named
    if (!headMesh && allMorphMeshes.length > 0) {
      headMesh = allMorphMeshes[0];
    }

    // If no mesh had morph targets (e.g. static OBJ, standard low-poly head),
    // generate procedural jaw and expression morphs on the primary mesh so it can still animate!
    if (allMorphMeshes.length === 0) {
      let candidateMesh: THREE.Mesh | null = null;
      root.traverse((child) => {
        if (!candidateMesh && (child as THREE.Mesh).isMesh) {
          candidateMesh = child as THREE.Mesh;
        }
      });

      if (candidateMesh) {
        const meshToMorph: THREE.Mesh = candidateMesh;
        this.addProceduralMorphTargetsToMesh(meshToMorph);
        allMorphMeshes.push(meshToMorph);
        headMesh = meshToMorph;
        if (meshToMorph.morphTargetDictionary) {
          Object.keys(meshToMorph.morphTargetDictionary).forEach((mName) => {
            combinedDictionary[mName] = meshToMorph.morphTargetDictionary![mName];
          });
        }
      }
    }

    // Capture initial rest pose rotation of the head bone to avoid jerking during idle sway
    const initialBoneRotation = headBone ? headBone.rotation.clone() : undefined;

    // Reset root transforms first
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    root.updateMatrixWorld(true);

    // Compute unscaled target framing bounds
    const framingTarget = headMesh || root;
    framingTarget.updateMatrixWorld(true);
    let framingBox = new THREE.Box3().setFromObject(framingTarget);
    if (framingBox.isEmpty()) {
      framingBox = new THREE.Box3().setFromObject(root);
    }

    const framingCenter = framingBox.getCenter(new THREE.Vector3());
    const framingSize = framingBox.getSize(new THREE.Vector3());

    // Scale avatar so the head & face fit prominently in the viewport (height ~1.65)
    const targetHeight = Math.max(framingSize.y, framingSize.x * 0.85, 0.2);
    const desiredHeight = 1.65;
    const scale = desiredHeight / targetHeight;

    // Apply scale to root
    root.scale.setScalar(scale);

    // Position root so the target's center sits exactly at world origin (0, 0, 0)
    root.position.x = -framingCenter.x * scale;
    root.position.y = -framingCenter.y * scale;
    root.position.z = -framingCenter.z * scale;
    root.updateMatrixWorld(true);

    return {
      root,
      headMesh,
      allMorphMeshes,
      morphDictionary: combinedDictionary,
      morphNames: Object.keys(combinedDictionary),
      headBone,
      initialBoneRotation,
      isCustomModel: true,
    };
  }

  /**
   * Generates procedural facial blendshapes for static geometries that lack native morph targets
   */
  private static addProceduralMorphTargetsToMesh(mesh: THREE.Mesh | THREE.SkinnedMesh): void {
    const geom = mesh.geometry;
    if (!geom || !geom.attributes.position) return;

    const positionAttr = geom.attributes.position;
    const count = positionAttr.count;

    geom.computeBoundingBox();
    const box = geom.boundingBox || new THREE.Box3();
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const jawOpenArr = new Float32Array(count * 3);
    const smileLeftArr = new Float32Array(count * 3);
    const smileRightArr = new Float32Array(count * 3);
    const blinkLeftArr = new Float32Array(count * 3);
    const blinkRightArr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const z = positionAttr.getZ(i);

      const dy = (y - center.y) / (size.y * 0.5 || 1);
      const dz = (z - center.z) / (size.z * 0.5 || 1);
      const dx = (x - center.x) / (size.x * 0.5 || 1);

      // Mouth region (lower front)
      if (dy < 0 && dy > -0.7 && dz > 0.05) {
        const mouthWeight = Math.max(0, 1 - Math.abs(dx) * 2.5) * Math.max(0, 1 - Math.abs(dy + 0.3) * 3);
        jawOpenArr[i * 3 + 1] = -mouthWeight * 0.12 * size.y;
        jawOpenArr[i * 3 + 2] = mouthWeight * 0.03 * size.z;

        if (dx < -0.1) {
          smileLeftArr[i * 3] = mouthWeight * -0.04 * size.x;
          smileLeftArr[i * 3 + 1] = mouthWeight * 0.05 * size.y;
        }
        if (dx > 0.1) {
          smileRightArr[i * 3] = mouthWeight * 0.04 * size.x;
          smileRightArr[i * 3 + 1] = mouthWeight * 0.05 * size.y;
        }
      }

      // Eye region (upper front)
      if (dy > 0.05 && dy < 0.5 && dz > 0.15) {
        if (dx < -0.15 && dx > -0.65) {
          const eyeWeight = Math.max(0, 1 - Math.hypot(dx + 0.35, dy - 0.25) * 4);
          blinkLeftArr[i * 3 + 1] = -eyeWeight * 0.04 * size.y;
        }
        if (dx > 0.15 && dx < 0.65) {
          const eyeWeight = Math.max(0, 1 - Math.hypot(dx - 0.35, dy - 0.25) * 4);
          blinkRightArr[i * 3 + 1] = -eyeWeight * 0.04 * size.y;
        }
      }
    }

    const jawAttr = new THREE.BufferAttribute(jawOpenArr, 3);
    const smileLAttr = new THREE.BufferAttribute(smileLeftArr, 3);
    const smileRAttr = new THREE.BufferAttribute(smileRightArr, 3);
    const blinkLAttr = new THREE.BufferAttribute(blinkLeftArr, 3);
    const blinkRAttr = new THREE.BufferAttribute(blinkRightArr, 3);

    jawAttr.name = "jawOpen";
    smileLAttr.name = "mouthSmileLeft";
    smileRAttr.name = "mouthSmileRight";
    blinkLAttr.name = "eyeBlinkLeft";
    blinkRAttr.name = "eyeBlinkRight";

    geom.morphAttributes.position = [jawAttr, smileLAttr, smileRAttr, blinkLAttr, blinkRAttr];

    mesh.morphTargetDictionary = {
      jawOpen: 0,
      mouthSmileLeft: 1,
      mouthSmileRight: 2,
      eyeBlinkLeft: 3,
      eyeBlinkRight: 4,
    };
    mesh.morphTargetInfluences = [0, 0, 0, 0, 0];
    mesh.updateMorphTargets();
  }

  /**
   * Generates a procedural 3D stylized head with native ARKit & CC4 morph targets
   * so the app works immediately out of the box before a user uploads a .glb!
   */
  public static createDefaultRiggedHead(): LoadedAvatar {
    const group = new THREE.Group();
    group.name = "Default_Avatar_Rig";

    // 1. Head Sphere with Morph Targets
    const headRadius = 0.85;
    const widthSegments = 48;
    const heightSegments = 48;
    const headGeom = new THREE.SphereGeometry(headRadius, widthSegments, heightSegments);

    // Create morph targets on the geometry:
    // jawOpen, mouthSmileLeft, mouthSmileRight, mouthFunnel, mouthPucker, eyeBlinkLeft, eyeBlinkRight, browInnerUp
    const positionAttr = headGeom.attributes.position;
    const vertexCount = positionAttr.count;

    const jawOpenPositions = new Float32Array(vertexCount * 3);
    const smileLeftPositions = new Float32Array(vertexCount * 3);
    const smileRightPositions = new Float32Array(vertexCount * 3);
    const funnelPositions = new Float32Array(vertexCount * 3);
    const puckerPositions = new Float32Array(vertexCount * 3);
    const blinkLeftPositions = new Float32Array(vertexCount * 3);
    const blinkRightPositions = new Float32Array(vertexCount * 3);
    const browUpPositions = new Float32Array(vertexCount * 3);

    for (let i = 0; i < vertexCount; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const z = positionAttr.getZ(i);

      // Default copy
      jawOpenPositions[i * 3] = x;
      jawOpenPositions[i * 3 + 1] = y;
      jawOpenPositions[i * 3 + 2] = z;

      smileLeftPositions[i * 3] = x;
      smileLeftPositions[i * 3 + 1] = y;
      smileLeftPositions[i * 3 + 2] = z;

      smileRightPositions[i * 3] = x;
      smileRightPositions[i * 3 + 1] = y;
      smileRightPositions[i * 3 + 2] = z;

      funnelPositions[i * 3] = x;
      funnelPositions[i * 3 + 1] = y;
      funnelPositions[i * 3 + 2] = z;

      puckerPositions[i * 3] = x;
      puckerPositions[i * 3 + 1] = y;
      puckerPositions[i * 3 + 2] = z;

      blinkLeftPositions[i * 3] = x;
      blinkLeftPositions[i * 3 + 1] = y;
      blinkLeftPositions[i * 3 + 2] = z;

      blinkRightPositions[i * 3] = x;
      blinkRightPositions[i * 3 + 1] = y;
      blinkRightPositions[i * 3 + 2] = z;

      browUpPositions[i * 3] = x;
      browUpPositions[i * 3 + 1] = y;
      browUpPositions[i * 3 + 2] = z;

      // Jaw Open: Pull lower face vertices down & slightly back
      if (y < -0.2 && z > 0.1) {
        const falloff = Math.max(0, -y / 0.85);
        jawOpenPositions[i * 3 + 1] = y - 0.28 * falloff;
        jawOpenPositions[i * 3 + 2] = z - 0.08 * falloff;
      }

      // Smile: Pull corners of mouth (y: -0.3, z > 0.6) outwards and upwards
      if (y > -0.5 && y < -0.15 && z > 0.5) {
        if (x < -0.1) {
          // Left smile
          smileLeftPositions[i * 3] = x - 0.08;
          smileLeftPositions[i * 3 + 1] = y + 0.09;
        }
        if (x > 0.1) {
          // Right smile
          smileRightPositions[i * 3] = x + 0.08;
          smileRightPositions[i * 3 + 1] = y + 0.09;
        }
      }

      // Funnel (O shape): Push mouth region forward, pinch width
      if (y > -0.5 && y < -0.15 && z > 0.6) {
        funnelPositions[i * 3] = x * 0.75;
        funnelPositions[i * 3 + 2] = z + 0.12;
      }

      // Pucker (Kiss): Pinch mouth tightly forward
      if (y > -0.5 && y < -0.15 && z > 0.6) {
        puckerPositions[i * 3] = x * 0.5;
        puckerPositions[i * 3 + 2] = z + 0.18;
      }

      // Eyebrow Up: Raise forehead / upper brow vertices
      if (y > 0.35 && y < 0.65 && z > 0.45) {
        browUpPositions[i * 3 + 1] = y + 0.12;
      }
    }

    headGeom.morphAttributes.position = [
      new THREE.BufferAttribute(jawOpenPositions, 3),
      new THREE.BufferAttribute(smileLeftPositions, 3),
      new THREE.BufferAttribute(smileRightPositions, 3),
      new THREE.BufferAttribute(funnelPositions, 3),
      new THREE.BufferAttribute(puckerPositions, 3),
      new THREE.BufferAttribute(browUpPositions, 3),
      new THREE.BufferAttribute(jawOpenPositions, 3), // mapped to viseme_aa
      new THREE.BufferAttribute(smileLeftPositions, 3), // mapped to viseme_E
      new THREE.BufferAttribute(smileRightPositions, 3), // mapped to viseme_I
      new THREE.BufferAttribute(funnelPositions, 3), // mapped to viseme_O
      new THREE.BufferAttribute(puckerPositions, 3), // mapped to viseme_U
    ];

    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0x0369a1,
      emissiveIntensity: 0.15,
    });

    const headMesh = new THREE.Mesh(headGeom, headMaterial);
    headMesh.name = "CC_Base_Head";

    headMesh.morphTargetDictionary = {
      jawOpen: 0,
      mouthSmileLeft: 1,
      mouthSmileRight: 2,
      mouthFunnel: 3,
      mouthPucker: 4,
      browInnerUp: 5,
      viseme_aa: 6,
      viseme_E: 7,
      viseme_I: 8,
      viseme_O: 9,
      viseme_U: 10,
    };
    headMesh.morphTargetInfluences = new Array(11).fill(0);

    group.add(headMesh);

    // 2. Add Stylized Eyes with Eyelid meshes for blinking
    const eyeGeom = new THREE.SphereGeometry(0.14, 24, 24);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1,
    });

    const pupilGeom = new THREE.SphereGeometry(0.07, 16, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });

    // Left Eye
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.name = "LeftEye_Group";
    leftEyeGroup.position.set(-0.3, 0.15, 0.72);
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
    leftPupil.position.set(0, 0, 0.08);
    leftEyeGroup.add(leftEye);
    leftEyeGroup.add(leftPupil);
    group.add(leftEyeGroup);

    // Right Eye
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.name = "RightEye_Group";
    rightEyeGroup.position.set(0.3, 0.15, 0.72);
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
    rightPupil.position.set(0, 0, 0.08);
    rightEyeGroup.add(rightEye);
    rightEyeGroup.add(rightPupil);
    group.add(rightEyeGroup);

    // 3. Eyelids for Blinking
    const eyelidGeom = new THREE.SphereGeometry(0.155, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.4,
    });

    const leftEyelid = new THREE.Mesh(eyelidGeom, eyelidMat);
    leftEyelid.name = "Left_Eyelid";
    leftEyelid.position.set(-0.3, 0.16, 0.72);
    leftEyelid.rotation.x = -Math.PI * 0.5; // open
    group.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeom, eyelidMat);
    rightEyelid.name = "Right_Eyelid";
    rightEyelid.position.set(0.3, 0.16, 0.72);
    rightEyelid.rotation.x = -Math.PI * 0.5; // open
    group.add(rightEyelid);

    // 4. Stylized Futuristic Head Halo / Accents
    const haloGeom = new THREE.TorusGeometry(0.96, 0.02, 16, 64);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.rotation.x = Math.PI * 0.35;
    halo.position.set(0, 0.1, 0);
    group.add(halo);

    return {
      root: group,
      headMesh,
      allMorphMeshes: [headMesh],
      morphDictionary: headMesh.morphTargetDictionary,
      morphNames: Object.keys(headMesh.morphTargetDictionary),
      headBone: group,
      isCustomModel: false,
    };
  }
}
