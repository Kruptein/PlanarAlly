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

interface ThrowerConfig {
    thrower: DiceThrower;
    width: number;
    height: number;
}

const throwers = new Map<HTMLCanvasElement, ThrowerConfig>();

// This is in fact used in dice.ts using dynamic import
// eslint-disable-next-line import/no-unused-modules
export async function loadDiceEnv(canvas?: HTMLCanvasElement): Promise<void> {
    let cameraHeight = 15;
    if (canvas === undefined) {
        canvas = document.getElementById("babylon") as unknown as HTMLCanvasElement;
        cameraHeight = 40;
    }
    const existingThrower = throwers.get(canvas);

    if (existingThrower) {
        diceThrower = existingThrower.thrower;
        diceSystem.set3dDimensions(existingThrower.width, existingThrower.height);
        return;
    }

    diceThrower = new DiceThrower({ canvas, tresholds: { linear: 0.05, angular: 0.1 } });
    const scene = diceThrower.scene;

    scene.clearColor = new Color4(0, 0, 0, 0);

    await diceThrower.loadPhysics(new Vector3(0, -15, 0));
    await diceThrower.loadMeshes(baseAdjust("/static/all_dice.babylon"), scene);

    /*
     * Currently the camera looks in such a way that the x-axis goes from negative right to positive left
     * and the y-axis goes from negative top to positive bottom
     * With (0, 0) at the center of the screen
     */
    const camera = new ArcRotateCamera("camera", 0, 0, 0, new Vector3(0, 0, 0), scene);

    camera.setPosition(new Vector3(0, cameraHeight, 0));
    camera.attachControl(canvas);
    camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    camera.inputs.attached.mousewheel?.detachControl();

    const hemiLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.4;

    const light = new DirectionalLight("dirlight", new Vector3(0, -1, 0), scene);
    light.position = new Vector3(0, 10, 0);
    light.intensity = 0.7;

    const groundMat = new ShadowOnlyMaterial("shadowOnly", scene);
    groundMat.activeLight = light;

    loadDiceBox(scene, canvas);

    diceThrower.startRenderLoop();
}

function paPredicate(mesh: AbstractMesh): boolean {
    return mesh.isPickable && mesh.isEnabled();
}

function loadDiceBox(scene: Scene, canvas: HTMLCanvasElement): void {
    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.position = new Vector3(0, 0, 0);
    ground.material = scene.getMaterialByName("shadowOnly");
    ground.receiveShadows = true;

    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.5, restitution: 0.01 });

    // Visual
    const topLeft = scene.pick(0, 0, paPredicate).pickedPoint!;
    const topRight = scene.pick(canvas.offsetWidth, 0, paPredicate).pickedPoint!;
    const botLeft = scene.pick(0, canvas.offsetHeight, paPredicate).pickedPoint!;

    const width = Math.abs(topRight.x - topLeft.x);
    const height = Math.abs(botLeft.z - topLeft.z);
    throwers.set(canvas, { thrower: diceThrower!, width: width, height: height });
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

    const restitution = 0.5;
    const friction = 0.5;

    new PhysicsAggregate(wall1, PhysicsShapeType.BOX, {
        mass: 0,
        restitution,
        friction,
    });
    new PhysicsAggregate(wall2, PhysicsShapeType.BOX, {
        mass: 0,
        restitution,
        friction,
    });
    new PhysicsAggregate(wall3, PhysicsShapeType.BOX, {
        mass: 0,
        restitution,
        friction,
    });
    new PhysicsAggregate(wall4, PhysicsShapeType.BOX, {
        mass: 0,
        restitution,
        friction,
    });
    new PhysicsAggregate(roof, PhysicsShapeType.BOX, {
        mass: 0,
        restitution,
        friction,
    });
}
