import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  AvatarModelLoader,
  LoadedAvatar,
  resolveMorphWeight,
} from "../../services/avatarModelLoader";
import { LipSyncEngine, VisemeWeights } from "../../services/lipSyncEngine";

import {
  Upload,
  RefreshCw,
  Sparkles,
  Sliders,
  Volume2,
  Mic,
  Eye,
  Maximize2,
  CheckCircle2,
  Link,
  ChevronDown,
  User,
  Layers,
  X,
  Search,
  RotateCcw,
  ListTodo,
  Star,
  LayoutDashboard,
  Move,
} from "lucide-react";

const STARTUP_MODEL_URL = "/api/models/nova.compressed.glb";

interface AvatarCanvasProps {
  isSpeaking: boolean;
  audioLevel?: number;
  onSpeakGreeting?: () => void;
  onQuickAction?: (action: "todo" | "important" | "inspect") => void;
  onToggleListening?: () => void;
  onCaptureScreen?: () => void;
  onToggleFullView?: () => void;
  modelOnly?: boolean;
  className?: string;
}

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  isSpeaking,
  audioLevel = 0,
  onSpeakGreeting,
  onQuickAction,
  onToggleListening,
  onCaptureScreen,
  onToggleFullView,
  modelOnly = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const avatarRef = useRef<LoadedAvatar | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const modelOnlyRef = useRef(modelOnly);
  const dragRef = useRef<{x: number; y: number} | null>(null);

  // Blendshape tracking
  const currentMorphInfluences = useRef<{ [key: string]: number }>({});
  const targetMorphInfluences = useRef<{ [key: string]: number }>({});

  // Idle micro-animation state refs (Phase 4)
  const blinkStateRef = useRef<{
    isBlinking: boolean;
    blinkStartTime: number;
    nextBlinkTime: number;
    duration: number;
  }>({
    isBlinking: false,
    blinkStartTime: 0,
    nextBlinkTime: Date.now() + 2500,
    duration: 140, // 140ms natural blink duration
  });

  const saccadeStateRef = useRef<{
    nextSaccadeTime: number;
    targetX: number;
    targetY: number;
    currentX: number;
    currentY: number;
  }>({
    nextSaccadeTime: Date.now() + 2000,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
  });

  // UI state
  const [modelName, setModelName] = useState<string>("ReadyPlayerMe Avatar (avatar.glb)");
  const [isCustomModel, setIsCustomModel] = useState<boolean>(true);
  const [morphTargetNames, setMorphTargetNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [manualWeights, setManualWeights] = useState<Record<string, number>>({});
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Initializing 3D avatar...");
  const [showModelMenu, setShowModelMenu] = useState<boolean>(false);
  const [showUrlDialog, setShowUrlDialog] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>("");
  const [morphSearchQuery, setMorphSearchQuery] = useState<string>("");

  useEffect(() => {
    modelOnlyRef.current = modelOnly;
    if (avatarRef.current) {
      frameAvatar(avatarRef.current.root, modelOnly);
    }
  }, [modelOnly]);

  const frameAvatar = useCallback((root: THREE.Object3D, fitFullBody: boolean) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const height = Math.max(size.y, 0.5);
    const verticalFov = THREE.MathUtils.degToRad(cameraRef.current.fov);
    const distance = fitFullBody
      ? height / (2 * Math.tan(verticalFov / 2) * 0.045)
      : Math.max(2.8, height / (2 * Math.tan(verticalFov / 2) * 0.72));
    const targetY = fitFullBody ? center.y - height * 0.15 : bounds.min.y + height * 0.86;

    cameraRef.current.position.set(center.x, targetY, distance);
    controlsRef.current.target.set(center.x, targetY, 0);
    controlsRef.current.update();
  }, []);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    (window as any).magicWindow?.moveBy(deltaX, deltaY);
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  /**
   * Helper to load the procedural default head
   */
  const loadDefaultHead = useCallback((scene?: THREE.Scene) => {
    const targetScene = scene || sceneRef.current;
    if (!targetScene) return;

    if (avatarRef.current) {
      targetScene.remove(avatarRef.current.root);
    }

    const defaultAvatar = AvatarModelLoader.createDefaultRiggedHead();
    targetScene.add(defaultAvatar.root);
    avatarRef.current = defaultAvatar;

    setModelName("Default Rig (Procedural ARKit)");
    setIsCustomModel(false);
    setMorphTargetNames(defaultAvatar.morphNames);
    setStatusMessage("Loaded procedural head with ARKit 52 morphs");
    setShowModelMenu(false);
  }, []);

  /**
   * Load model from URL path (.glb, .gltf)
   */
  const loadModelFromPath = useCallback(async (url: string, scene?: THREE.Scene) => {
    const targetScene = scene || sceneRef.current;
    if (!targetScene) return;

    setIsLoading(true);
    setLoadProgress(null);
    const fileName = url.split("/").pop() || "3D Model";
    setStatusMessage(`Loading 3D model: ${fileName}...`);

    try {
      const loadedAvatar = await AvatarModelLoader.loadGLB(url, (event) => {
        if (event.lengthComputable && event.total > 0) {
          setLoadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      if (targetScene !== sceneRef.current) return;

      if (avatarRef.current) {
        targetScene.remove(avatarRef.current.root);
      }

      targetScene.add(loadedAvatar.root);
      avatarRef.current = loadedAvatar;

      if (cameraRef.current && controlsRef.current) {
        frameAvatar(loadedAvatar.root, modelOnlyRef.current);
      }

      const displayName = url === STARTUP_MODEL_URL ? "nova.compressed.glb" : fileName;
      setModelName(displayName);
      setIsCustomModel(true);
      setMorphTargetNames(loadedAvatar.morphNames);
      setStatusMessage(`Loaded ${displayName} (${loadedAvatar.morphNames.length} blendshapes active)`);
    } catch (err: any) {
      console.warn(`Failed to load 3D model from ${url}:`, err);
      setStatusMessage(`Failed to load ${fileName}: ${err.message || "Parse error"}. Falling back to procedural rig.`);
      loadDefaultHead(targetScene);
    } finally {
      setIsLoading(false);
      setLoadProgress(null);
      setShowModelMenu(false);
    }
  }, [frameAvatar, loadDefaultHead]);

  /**
   * Load custom user 3D model (.glb, .gltf, .vrm, .obj - e.g. Reallusion CC4, ReadyPlayerMe, Blender)
   */
  const loadCustomModelFile = useCallback(async (file: File) => {
    if (!sceneRef.current) return;
    setIsLoading(true);
    setLoadProgress(null);
    setStatusMessage(`Parsing 3D mesh and morph targets from ${file.name}...`);

    try {
      const loadedAvatar = await AvatarModelLoader.loadFromFile(file);

      // Remove existing model from scene
      if (avatarRef.current) {
        sceneRef.current.remove(avatarRef.current.root);
      }

      sceneRef.current.add(loadedAvatar.root);
      avatarRef.current = loadedAvatar;

      // Adjust camera and orbit controls to frame the avatar
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 0, 2.8);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      setModelName(file.name);
      setIsCustomModel(true);
      setMorphTargetNames(loadedAvatar.morphNames);
      setStatusMessage(
        `Loaded ${file.name} (${loadedAvatar.morphNames.length} morph targets detected)`
      );
      frameAvatar(loadedAvatar.root, modelOnlyRef.current);
    } catch (err: any) {
      console.error("Error parsing 3D file:", err);
      setStatusMessage(
        `Failed to parse 3D file: ${err.message || "Invalid or unsupported file format"}`
      );
    } finally {
      setIsLoading(false);
      setLoadProgress(null);
      setShowModelMenu(false);
    }
  }, []);

  /**
   * Initialize Three.js Scene, Camera, Lighting, Controls
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 2.8);
    cameraRef.current = camera;

    // 3. Renderer with SRGB color space and ACES tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Room Environment for realistic PBR shading & reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTexture = pmrem.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTexture;

    // Balanced studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.2);
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbbe8f2, 0.7);
    fillLight.position.set(-2, 1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa5b4fc, 0.8);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);


    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.0;
    controls.maxDistance = 100.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 6. Load the startup avatar with fallback to procedural head
    loadModelFromPath(STARTUP_MODEL_URL, scene);

    // 7. Subscribe to LipSyncEngine
    const lipSync = LipSyncEngine.getInstance();
    const unsubLipSync = lipSync.subscribe((weights) => {
      Object.entries(weights).forEach(([key, val]) => {
        if (typeof val === "number") {
          targetMorphInfluences.current[key] = val;
        }
      });
    });

    // 8. Main Render Loop with THREE.Timer and Phase 4 Micro-Animations
    const timer = new THREE.Timer();

    const animate = (timestamp?: number) => {
      animFrameRef.current = requestAnimationFrame(animate);

      timer.update(timestamp);
      const elapsedTime = timer.getElapsed();
      const now = Date.now();

      // Controls update
      controls.update();

      const avatar = avatarRef.current;
      if (avatar) {
        // ==========================================
        // PHASE 4: PROCEDURAL LIFE-LIKE MICRO-ANIMATIONS
        // ==========================================

        // A. Subtle Head Tilt & Sway (preserve rest pose rotation)
        const tiltGroup = avatar.headBone || avatar.root;
        if (tiltGroup) {
          const base = avatar.initialBoneRotation;
          const baseX = base ? base.x : 0;
          const baseY = base ? base.y : 0;
          const baseZ = base ? base.z : 0;

          tiltGroup.rotation.y = baseY + Math.sin(elapsedTime * 0.6) * 0.04;
          tiltGroup.rotation.x = baseX + Math.sin(elapsedTime * 0.9) * 0.025;
          tiltGroup.rotation.z = baseZ + Math.cos(elapsedTime * 0.4) * 0.015;

          // React to speech activity: slightly nod during talking
          if (isSpeaking) {
            tiltGroup.rotation.x += Math.sin(elapsedTime * 5.0) * 0.02;
          }
        }

        // B. Eye Blinking (Every 3-5 seconds, ramp up for 120ms then down)
        const blink = blinkStateRef.current;
        if (!blink.isBlinking && now >= blink.nextBlinkTime) {
          blink.isBlinking = true;
          blink.blinkStartTime = now;
        }

        let blinkWeight = 0;
        if (blink.isBlinking) {
          const progress = (now - blink.blinkStartTime) / blink.duration;
          if (progress < 0.5) {
            // Closing: ramp from 0 to 1
            blinkWeight = progress * 2;
          } else if (progress < 1.0) {
            // Opening: ramp from 1 to 0
            blinkWeight = (1.0 - progress) * 2;
          } else {
            // Blink finished, schedule next random blink (3 to 5 seconds)
            blink.isBlinking = false;
            blink.nextBlinkTime = now + 2800 + Math.random() * 2500;
          }
        }

        targetMorphInfluences.current["eyeBlinkLeft"] = blinkWeight;
        targetMorphInfluences.current["eyeBlinkRight"] = blinkWeight;

        // If procedural eyelid meshes exist (for default head)
        const leftEyelid = avatar.root.getObjectByName("Left_Eyelid");
        const rightEyelid = avatar.root.getObjectByName("Right_Eyelid");
        if (leftEyelid && rightEyelid) {
          const closedRot = 0;
          const openRot = -Math.PI * 0.5;
          const eyelidRot = THREE.MathUtils.lerp(openRot, closedRot, blinkWeight);
          leftEyelid.rotation.x = eyelidRot;
          rightEyelid.rotation.x = eyelidRot;
        }

        // C. Eye Saccades (Small random shifts of gaze every 2-4 seconds)
        const saccade = saccadeStateRef.current;
        if (now >= saccade.nextSaccadeTime) {
          saccade.targetX = (Math.random() - 0.5) * 0.08;
          saccade.targetY = (Math.random() - 0.5) * 0.05;
          saccade.nextSaccadeTime = now + 1800 + Math.random() * 2200;
        }
        saccade.currentX = THREE.MathUtils.lerp(saccade.currentX, saccade.targetX, 0.15);
        saccade.currentY = THREE.MathUtils.lerp(saccade.currentY, saccade.targetY, 0.15);

        // Procedural eye groups
        const leftEyeGroup = avatar.root.getObjectByName("LeftEye_Group");
        const rightEyeGroup = avatar.root.getObjectByName("RightEye_Group");
        if (leftEyeGroup && rightEyeGroup) {
          leftEyeGroup.rotation.y = saccade.currentX;
          leftEyeGroup.rotation.x = -saccade.currentY;
          rightEyeGroup.rotation.y = saccade.currentX;
          rightEyeGroup.rotation.x = -saccade.currentY;
        }

        // Blendshape-driven eye gaze for rigged avatars
        if (saccade.currentX > 0) {
          targetMorphInfluences.current["eyeLookOutLeft"] = saccade.currentX * 2.5;
          targetMorphInfluences.current["eyeLookInRight"] = saccade.currentX * 2.5;
          targetMorphInfluences.current["eyeLookInLeft"] = 0;
          targetMorphInfluences.current["eyeLookOutRight"] = 0;
        } else {
          targetMorphInfluences.current["eyeLookInLeft"] = -saccade.currentX * 2.5;
          targetMorphInfluences.current["eyeLookOutRight"] = -saccade.currentX * 2.5;
          targetMorphInfluences.current["eyeLookOutLeft"] = 0;
          targetMorphInfluences.current["eyeLookInRight"] = 0;
        }
        if (saccade.currentY > 0) {
          targetMorphInfluences.current["eyeLookUpLeft"] = saccade.currentY * 2.5;
          targetMorphInfluences.current["eyeLookUpRight"] = saccade.currentY * 2.5;
          targetMorphInfluences.current["eyeLookDownLeft"] = 0;
          targetMorphInfluences.current["eyeLookDownRight"] = 0;
        } else {
          targetMorphInfluences.current["eyeLookDownLeft"] = -saccade.currentY * 2.5;
          targetMorphInfluences.current["eyeLookDownRight"] = -saccade.currentY * 2.5;
          targetMorphInfluences.current["eyeLookUpLeft"] = 0;
          targetMorphInfluences.current["eyeLookUpRight"] = 0;
        }

        // ==========================================
        // DAMPING & BLENDSHAPE APPLICATION (PHASE 2 & 3)
        // ==========================================
        // Apply smooth interpolation (lerp) to each morph target influence
        avatar.allMorphMeshes.forEach((mesh) => {
          if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

          Object.keys(mesh.morphTargetDictionary).forEach((morphName) => {
            const index = mesh.morphTargetDictionary![morphName];
            // Resolve target using alias map (supports ARKit, CC4, ReadyPlayerMe, Oculus visemes, Blender keys)
            const targetVal = resolveMorphWeight(morphName, targetMorphInfluences.current);
            const currentVal = currentMorphInfluences.current[morphName] ?? 0;

            // Damping lerp factor: 0.35 for rapid speech sync, 0.2 for subtle eye shifts
            const isSpeechMorph =
              morphName.toLowerCase().includes("jaw") ||
              morphName.toLowerCase().includes("viseme") ||
              morphName.toLowerCase().includes("mouth") ||
              morphName.toLowerCase().includes("open");
            const lerpSpeed = isSpeechMorph ? 0.35 : 0.2;
            const smoothedVal = THREE.MathUtils.lerp(currentVal, targetVal, lerpSpeed);

            currentMorphInfluences.current[morphName] = smoothedVal;
            mesh.morphTargetInfluences![index] = smoothedVal;
          });
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      unsubLipSync();
      timer.dispose();
      controls.dispose();
      renderer.dispose();
      if (sceneRef.current === scene) {
        sceneRef.current = null;
      }
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [loadModelFromPath]);

  /**
   * Handle Drag and Drop of 3D files (.glb, .gltf, .vrm, .obj)
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "glb" || ext === "gltf" || ext === "vrm" || ext === "obj") {
        loadCustomModelFile(file);
      } else {
        setStatusMessage("Please drop a 3D file (.glb, .gltf, .vrm, or .obj).");
      }
    }
  };

  /**
   * File input change
   */
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      loadCustomModelFile(file);
      e.target.value = "";
    }
  };

  /**
   * Reset Camera view
   */
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0, 4.0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  /**
   * Manual slider adjustment for testing morphs
   */
  const handleSliderChange = (morphName: string, value: number) => {
    setManualWeights((prev) => ({ ...prev, [morphName]: value }));
    targetMorphInfluences.current[morphName] = value;
  };

  /**
   * Filtered morph target names for inspector
   */
  const filteredMorphNames = morphTargetNames.filter((name) =>
    name.toLowerCase().includes(morphSearchQuery.toLowerCase())
  );

  return (
    <div
      className={`relative w-full h-full flex flex-col ${modelOnly || new URLSearchParams(window.location.search).has("desktop") ? "bg-transparent" : "bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950"} overflow-hidden select-none ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Canvas Viewport */}
      <div ref={containerRef} className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {modelOnly && (
        <div className="absolute inset-x-0 top-[14%] flex items-center justify-center gap-2 pointer-events-none z-40">
          <button
            onClick={onSpeakGreeting}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/30 bg-slate-950/75 text-sky-200 shadow-lg backdrop-blur-xl transition hover:bg-sky-500/20"
            title="Talk to Magic"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleListening}
            className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border bg-slate-950/75 shadow-lg backdrop-blur-xl transition hover:bg-emerald-500/20 ${
              isSpeaking ? "border-emerald-300/50 text-emerald-200" : "border-white/20 text-slate-200"
            }`}
            title="Toggle microphone"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            onClick={onCaptureScreen}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-purple-300/30 bg-slate-950/75 text-purple-200 shadow-lg backdrop-blur-xl transition hover:bg-purple-500/20"
            title="Scan desktop screen"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onQuickAction?.("todo")}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-slate-950/75 text-cyan-200 shadow-lg shadow-cyan-950/30 backdrop-blur-xl transition hover:bg-cyan-500/20"
            title="Ask Magic to manage your to-do list"
          >
            <ListTodo className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onQuickAction?.("important")}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/30 bg-slate-950/75 text-amber-200 shadow-lg shadow-amber-950/30 backdrop-blur-xl transition hover:bg-amber-500/20"
            title="Ask Magic to surface important items"
          >
            <Star className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggleFullView}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/75 text-slate-200 shadow-lg backdrop-blur-xl transition hover:bg-white/15"
            title="Open the full assistant"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {modelOnly && (
        <div
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto flex cursor-move items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-[10px] font-semibold text-slate-300 shadow-lg backdrop-blur-xl"
          title="Drag Magic around your desktop"
        >
          <Move className="h-3.5 w-3.5" />
          <span>Drag Magic</span>
        </div>
      )}

      {/* Drag Overlay Feedback */}
      {dragOver && (
        <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-md border-2 border-dashed border-sky-400 flex flex-col items-center justify-center text-white z-40">
          <Upload className="w-12 h-12 text-sky-400 animate-bounce mb-3" />
          <p className="text-lg font-semibold">Drop 3D Model Here (.glb, .gltf, .vrm, .obj)</p>
          <p className="text-xs text-sky-200 mt-1">Automatic blendshape extraction & real-time lip-sync mapping</p>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-3" />
          <p className="text-sm font-medium">{statusMessage}</p>
          <div className="mt-4 w-64 max-w-[75%]">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-sky-400 transition-[width] duration-200 ${
                  loadProgress === null ? "w-1/3 animate-pulse" : ""
                }`}
                style={loadProgress === null ? undefined : {width: `${loadProgress}%`}}
              />
            </div>
            <div className="mt-1 text-center text-[10px] text-slate-400">
              {loadProgress === null ? "Preparing model..." : `${loadProgress}%`}
            </div>
          </div>
        </div>
      )}

      {/* Top Header Badge & Action Controls */}
      <div className={`${modelOnly ? "hidden" : ""} absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20`}>
        {/* Model Info with Selector Trigger */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-2.5 bg-slate-900/85 hover:bg-slate-900 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg text-left transition group"
            title="Click to switch or load 3D models"
          >
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isSpeaking ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" : "bg-sky-400"
              }`}
            />
            <div>
              <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                <span className="truncate max-w-[170px] sm:max-w-[220px]">{modelName}</span>
                {isCustomModel ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                    3D GLB
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Procedural
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition" />
              </div>
              <div className="text-[10px] text-slate-400">
                {morphTargetNames.length > 0
                  ? `${morphTargetNames.length} blendshapes active`
                  : "Standard ARKit 52"}
              </div>
            </div>
          </button>

          {/* Model Switcher Menu Dropdown */}
          {showModelMenu && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 text-slate-200 animate-in fade-in duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400 border-b border-white/10 mb-1">
                Choose 3D Avatar
              </div>

              {/* ReadyPlayerMe Default */}
              <button
                onClick={() => loadModelFromPath("/models/avatar.glb")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/10 text-left transition"
              >
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-slate-100">ReadyPlayerMe Avatar</div>
                  <div className="text-[10px] text-slate-400">avatar.glb (72 ARKit visemes & blendshapes)</div>
                </div>
              </button>

              {/* Procedural Head */}
              <button
                onClick={() => loadDefaultHead()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/10 text-left transition"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-slate-100">Procedural ARKit Head</div>
                  <div className="text-[10px] text-slate-400">Geometric rigged rig with ARKit 52 morphs</div>
                </div>
              </button>

              <div className="my-1 border-t border-white/10" />

              {/* Upload file */}
              <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/10 text-left cursor-pointer transition">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-slate-100">Upload 3D Model File</div>
                  <div className="text-[10px] text-slate-400">.glb, .gltf, .vrm, or .obj</div>
                </div>
                <input
                  type="file"
                  accept=".glb,.gltf,.vrm,.obj"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>

              {/* Load from URL */}
              <button
                onClick={() => {
                  setShowModelMenu(false);
                  setShowUrlDialog(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/10 text-left transition"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Link className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-slate-100">Load from URL...</div>
                  <div className="text-[10px] text-slate-400">Paste public .glb or .gltf URL</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <label
            title="Upload custom 3D model (.glb, .gltf, .vrm, .obj)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850/90 hover:bg-slate-750 text-sky-300 border border-sky-500/20 text-xs font-medium cursor-pointer shadow-lg transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Model</span>
            <input
              type="file"
              accept=".glb,.gltf,.vrm,.obj"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (avatarRef.current) {
                avatarRef.current.root.rotation.y += Math.PI;
              }
            }}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 transition shadow-lg"
            title="Rotate 180°"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-2 rounded-xl border transition shadow-lg ${
              showInspector
                ? "bg-sky-600 text-white border-sky-400"
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-white/10"
            }`}
            title="Morph Target Inspector"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 transition shadow-lg"
            title="Reset Camera View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* URL Dialog Modal */}
      {showUrlDialog && !modelOnly && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm text-white">
                <Link className="w-4 h-4 text-purple-400" />
                <span>Load 3D Model from URL</span>
              </div>
              <button
                onClick={() => setShowUrlDialog(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter the HTTP or HTTPS URL to any public <code>.glb</code> or <code>.gltf</code> model:
            </p>

            <input
              type="url"
              placeholder="https://example.com/model.glb or /models/avatar.glb"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUrlDialog(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                disabled={!customUrlInput.trim()}
                onClick={() => {
                  if (customUrlInput.trim()) {
                    loadModelFromPath(customUrlInput.trim());
                    setShowUrlDialog(false);
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium transition"
              >
                Load Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Action Bar */}
      <div className={`${modelOnly ? "hidden" : ""} absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-20`}>
        {/* Interactive Speech & Viseme Trigger Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onSpeakGreeting && (
            <button
              onClick={onSpeakGreeting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Say "Hi, how can I help you?"</span>
            </button>
          )}
        </div>
      </div>

      {/* Slide-out Morph Target Inspector Panel */}
      {showInspector && !modelOnly && (
        <div className="absolute top-16 right-4 w-80 max-h-[75vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-4 text-slate-200 z-30 space-y-3 animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>Morph Target Debugger</span>
            </div>
            <button
              onClick={() => {
                setManualWeights({});
                LipSyncEngine.getInstance().resetWeights();
              }}
              className="flex items-center gap-1 text-[10px] text-sky-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            {morphTargetNames.length > 0
              ? `${morphTargetNames.length} blendshapes detected on this mesh. Drag sliders to articulately test facial expressions:`
              : "Standard ARKit 52 blendshapes. Drag sliders to articulately test facial expressions:"}
          </p>

          {/* Search Box for Morph Targets */}
          {morphTargetNames.length > 0 && (
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search morphs (e.g. viseme, jaw, eye)..."
                value={morphSearchQuery}
                onChange={(e) => setMorphSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-950/60 border border-white/10 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
          )}

          {/* Morph Target Sliders */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {(morphSearchQuery
              ? filteredMorphNames
              : [
                  "jawOpen",
                  "mouthOpen",
                  "mouthSmileLeft",
                  "mouthSmileRight",
                  "mouthFunnel",
                  "mouthPucker",
                  "eyeBlinkLeft",
                  "eyeBlinkRight",
                  "browInnerUp",
                  "viseme_aa",
                  "viseme_E",
                  "viseme_I",
                  "viseme_O",
                  "viseme_U",
                  "viseme_PP",
                  "viseme_SS",
                ]
            ).map((morphKey) => {
              const currentVal = manualWeights[morphKey] ?? targetMorphInfluences.current[morphKey] ?? 0;
              return (
                <div key={morphKey} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-300 truncate max-w-[180px]">{morphKey}</span>
                    <span className="text-sky-400 font-bold">{currentVal.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={currentVal}
                    onChange={(e) => handleSliderChange(morphKey, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-sky-500"
                  />
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Phase 2: Three.js SkinnedMesh & Materials</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Phase 3: Phonetic Lip-Sync Sync Engine</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Phase 4: Saccades, Blinking & Smooth Lerp</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

