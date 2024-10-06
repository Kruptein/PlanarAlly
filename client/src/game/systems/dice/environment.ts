import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color4, Vector3 } from "@babylonjs/core/Maths/math";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core/Physics";
import type { Scene } from "@babylonjs/core/scene";
import { ShadowOnlyMaterial } from "@babylonjs/materials/shadowOnly";
import { DiceThrower } from "@planarally/dice/3d";

import { baseAdjust } from "../../../core/http";

import { diceSystem } from ".";

export let diceThrower: DiceThrower | undefined;

let light: DirectionalLight;

// This is in fact used in dice.ts using dynamic import
// eslint-disable-next-line import/no-unused-modules
export async function loadDiceEnv(): Promise<void> {
    const canvas = document.getElementById("babylon") as unknown as HTMLCanvasElement;

    diceThrower = new DiceThrower({ canvas, tresholds: { linear: 0.05, angular: 0.1 } });
    const scene = diceThrower.scene;

    scene.clearColor = new Color4(0, 0, 0, 0);

    await diceThrower.loadPhysics();
    await diceThrower.loadMeshes(baseAdjust("/static/all_dice.babylon"), scene);

    /*
     * Currently the camera looks in such a way that the x-axis goes from negative right to positive left
     * and the y-axis goes from negative top to positive bottom
     * With (0, 0) at the center of the screen
     */
    const camera = new ArcRotateCamera("camera", 0, 0, 0, new Vector3(0, 0, 0), scene);
    camera.setPosition(new Vector3(0, 40, 0));
    camera.attachControl(canvas);
    camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light = new DirectionalLight("DirectionalLight", new Vector3(0, -1, 0), scene);
    light.position = new Vector3(0, 5, 0);
    light.intensity = 1;

    loadDiceBox(scene);

    diceThrower.startRenderLoop();
}

function paPredicate(mesh: AbstractMesh): boolean {
    return mesh.isPickable && mesh.isEnabled();
}

function loadDiceBox(scene: Scene): void {
    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.position = new Vector3(0, 0, 0);
    const material = new ShadowOnlyMaterial("shadowOnly", scene);
    material.activeLight = light;
    ground.material = material;
    ground.receiveShadows = true;

    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 });

    // Visual
    const topLeft = scene.pick(0, 0, paPredicate).pickedPoint!;
    const topRight = scene.pick(window.innerWidth, 0, paPredicate).pickedPoint!;
    const botLeft = scene.pick(0, window.innerHeight, paPredicate).pickedPoint!;

    const width = Math.abs(topRight.x - topLeft.x);
    const height = Math.abs(botLeft.z - topLeft.z);
    diceSystem.set3dDimensions(width, height);

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

    new PhysicsAggregate(wall1, PhysicsShapeType.BOX, {
        mass: 0,
        restitution: 0.5,
        friction: 0.5,
    });
    new PhysicsAggregate(wall2, PhysicsShapeType.BOX, {
        mass: 0,
        restitution: 0.5,
        friction: 0.5,
    });
    new PhysicsAggregate(wall3, PhysicsShapeType.BOX, {
        mass: 0,
        restitution: 0.5,
        friction: 0.5,
    });
    new PhysicsAggregate(wall4, PhysicsShapeType.BOX, {
        mass: 0,
        restitution: 0.5,
        friction: 0.5,
    });
    new PhysicsAggregate(roof, PhysicsShapeType.BOX, {
        mass: 0,
        restitution: 0.5,
        friction: 0.5,
    });
}
