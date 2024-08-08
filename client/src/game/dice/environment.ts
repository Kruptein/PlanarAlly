// import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
// import "@babylonjs/core/Physics/physicsEngineComponent";
// import "@babylonjs/core/Physics/v1/physicsEngineComponent";
// import "@babylonjs/core/Materials/PBR/pbrBaseMaterial";
// import "@babylonjs/materials/shadowOnly/shadowOnly.fragment";
// import "@babylonjs/materials/shadowOnly/shadowOnly.vertex";

// import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
// import { Engine } from "@babylonjs/core/Engines/engine";
// import { Vector3 } from "@babylonjs/core/Maths/math.vector";
// import { Scene } from "@babylonjs/core/scene";
// import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly/shadowOnlyMaterial";
// import { Color3 } from "@babylonjs/core/Maths/math.color";

import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
// import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Color4, Vector3 } from "@babylonjs/core/Maths/math";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core/Physics";
import type { Scene } from "@babylonjs/core/scene";
// import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly";
import { ShadowOnlyMaterial } from "@babylonjs/materials";
import { DiceThrower } from "@planarally/dice/3d";
// import type { DieOptions } from "@planarally/dice";

import { baseAdjust } from "../../core/http";

import { loadAmmoModule } from "./ammo";
// import { diceStore } from "./state";

let diceThrower: DiceThrower | undefined;
// let dndParser: DndParser | undefined;

let light: DirectionalLight;

// This is in fact used in dice.ts using dynamic import
// eslint-disable-next-line import/no-unused-modules
export async function loadDiceEnv(): Promise<void> {
    const canvas = document.getElementById("babylon") as HTMLCanvasElement;

    await loadAmmoModule();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const Ammo = (window as any).Ammo;

    diceThrower = new DiceThrower({ canvas, tresholds: { linear: 0.05, angular: 0.1 } });
    const scene = diceThrower.scene;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await diceThrower.load(baseAdjust("/static/all_dice.babylon"), Ammo(), scene);

    /*
     * Currently the camera looks in such a way that the x-axis goes from negative right to positive left
     * and the y-axis goes from negative top to positive bottom
     * With (0, 0) at the center of the screen
     */
    scene.clearColor = new Color4(0, 0, 0, 0);
    const camera = new ArcRotateCamera("camera", 0, 0, 0, new Vector3(0, 0, 0), scene);
    camera.setPosition(new Vector3(0, 40, 0));
    camera.attachControl(canvas);
    camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light = new DirectionalLight("DirectionalLight", new Vector3(0, -1, 0), scene);
    light.position = new Vector3(0, 5, 0);
    light.intensity = 1;

    // scene.registerBeforeRender(() => {
    //     const meshes = scene.getActiveMeshCandidates();
    //     for (const meshData of meshes.data) {
    //         const i = meshData.getPhysicsImpostor();
    //         if (i === null || i === undefined) continue;
    //         const pos = meshData.position;
    //         if (pos.y > 3) continue;
    //         const linVel = i.getLinearVelocity()!;
    //         const linVelZero = linVel.x === 0 && linVel.y === 0 && linVel.z === 0;
    //         if (!linVelZero) i.setLinearVelocity(i.getLinearVelocity()!.multiplyByFloats(0.99, 0.99, 0.99));
    //         const angVel = i.getAngularVelocity()!;
    //         const angVelZero = angVel.x === 0 && angVel.y === 0 && angVel.z === 0;
    //         if (!angVelZero) i.setAngularVelocity(i.getAngularVelocity()!.multiplyByFloats(0.99, 0.99, 0.99));

    //         // if (!(linVelZero && angVelZero)) {
    //         //     const dim = diceStore.state.dimensions;
    //         //     if (pos.y < 0) pos.y = 19;
    //         //     else if (pos.y > 20) pos.y = 1;
    //         //     if (pos.x < -dim.width / 2) pos.x = 0.9 * (dim.width / 2);
    //         //     else if (pos.x > dim.width / 2) pos.x = 0.9 * (-dim.width / 2);
    //         //     if (pos.z < -dim.height / 2) pos.z = 0.9 * (dim.height / 2);
    //         //     else if (pos.z > dim.height / 2) pos.z = 0.9 * (-dim.height / 2);
    //         // }
    //     }
    // });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // (window as any).shadowGenerator = new ShadowGenerator(1024, light);

    loadDiceBox(scene);

    diceThrower.startRenderLoop();

    // dndParser = new DndParser(diceThrower);

    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // (window as any).diceThrower = diceThrower;
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // (window as any).Dice = Dice;
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // (window as any).p = dndParser;
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // (window as any).V3 = Vector3;
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // (window as any).r = async (inp: string, options?: DieOptions[]): Promise<void> => {
    //     diceStore.setIsPending(true);
    //     const results = await dndParser!.fromString(inp, options);
    //     diceStore.setResults(results.key, results.data);
    //     diceStore.setIsPending(false);
    //     diceStore.setShowDiceResults(results.key);
    // };

    // return diceThrower;
}

function paPredicate(mesh: AbstractMesh): boolean {
    return mesh.isPickable && mesh.isEnabled();
}

function loadDiceBox(scene: Scene): void {
    // Visual
    const ground = MeshBuilder.CreateGround("ground", { width: 2000, height: 2000, subdivisions: 2 }, scene);
    const material = new ShadowOnlyMaterial("shadowOnly", scene);
    material.activeLight = light;
    ground.material = material;
    ground.receiveShadows = true;

    const topLeft = scene.pick(0, 0, paPredicate).pickedPoint!;
    const topRight = scene.pick(window.innerWidth, 0, paPredicate).pickedPoint!;
    const botLeft = scene.pick(0, window.innerHeight, paPredicate).pickedPoint!;

    const width = Math.abs(topRight.x - topLeft.x);
    const height = Math.abs(botLeft.z - topLeft.z);
    // diceStore.setDimensions(width, height);

    const wall1 = MeshBuilder.CreateBox("north", { width, depth: 1, height: 40 }, scene);
    wall1.isVisible = false;
    wall1.position.z = height / 2;
    wall1.position.y = 20;
    const wall2 = MeshBuilder.CreateBox("south", { width, depth: 1, height: 40 }, scene);
    wall2.position.z = -height / 2;
    wall2.isVisible = false;
    wall2.position.y = 20;
    const wall3 = MeshBuilder.CreateBox("east", { width: 1, depth: height, height: 40 }, scene);
    wall3.position.x = width / 2;
    wall3.isVisible = false;
    wall3.position.y = 20;
    const wall4 = MeshBuilder.CreateBox("west", { width: 1, depth: height, height: 40 }, scene);
    wall4.position.x = -width / 2;
    wall4.isVisible = false;
    wall4.position.y = 20;
    const roof = MeshBuilder.CreateBox("roof", { width, depth: height }, scene);
    roof.position.y = 40;

    // // Physics
    // new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
    //     mass: 0,
    //     restitution: 0.1,
    //     friction: 10,
    // });
    // new PhysicsAggregate(wall1, PhysicsShapeType.BOX, {
    //     mass: 0,
    //     restitution: 0.5,
    //     friction: 0.5,
    // });
    // new PhysicsAggregate(wall2, PhysicsShapeType.BOX, {
    //     mass: 0,
    //     restitution: 0.5,
    //     friction: 0.5,
    // });
    // new PhysicsAggregate(wall3, PhysicsShapeType.BOX, {
    //     mass: 0,
    //     restitution: 0.5,
    //     friction: 0.5,
    // });
    // new PhysicsAggregate(wall4, PhysicsShapeType.BOX, {
    //     mass: 0,
    //     restitution: 0.5,
    //     friction: 0.5,
    // });
    // new PhysicsAggregate(roof, PhysicsShapeType.BOX, {
    //     mass: 0,
    //     restitution: 0.5,
    //     friction: 0.5,
    // });
}
