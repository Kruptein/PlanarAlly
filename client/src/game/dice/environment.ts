import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color4, Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { BoxBuilder } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { GroundBuilder } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { Scene } from "@babylonjs/core/scene";
import { Dice, DiceThrower, DieOptions, DndParser } from "@planarally/dice";

import { loadAmmoModule } from "./ammo";
import { diceStore } from "./state";

let diceThrower: DiceThrower | undefined;
let dndParser: DndParser | undefined;

export async function loadDiceEnv(): Promise<DiceThrower> {
    const canvas = document.getElementById("babylon") as HTMLCanvasElement;

    await loadAmmoModule();
    const Ammo = (window as any).Ammo;

    diceThrower = new DiceThrower({ canvas });
    await diceThrower.load("/static/babylon_test6.babylon", Ammo());

    const scene = diceThrower.scene;
    scene.clearColor = new Color4(0, 0, 0, 0);
    const camera = new ArcRotateCamera("camera", 0, 0, 0, new Vector3(0, 0, 0), scene);
    camera.setPosition(new Vector3(0, 40, 0));
    camera.attachControl(canvas);
    camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    loadDiceBox(scene);

    diceThrower.startRenderLoop();

    dndParser = new DndParser(diceThrower);

    (window as any).diceThrower = diceThrower;
    (window as any).Dice = Dice;
    (window as any).p = dndParser;
    (window as any).V3 = Vector3;
    (window as any).r = async (inp: string, options?: DieOptions[]): Promise<void> => {
        diceStore.setIsPending(true);
        diceStore.setResults(await dndParser!.fromString(inp, options));
        diceStore.setIsPending(false);
        diceStore.setShowDiceResults(true);
    };

    return diceThrower;
}

function paPredicate(mesh: AbstractMesh): boolean {
    return mesh.isPickable && mesh.isEnabled();
}

function loadDiceBox(scene: Scene): void {
    // Visual
    const ground = GroundBuilder.CreateGround("ground", { width: 2000, height: 2000, subdivisions: 2 }, scene);
    ground.position.y = -1;
    ground.isVisible = false;

    const topLeft = scene.pick(0, 0, paPredicate)!.pickedPoint!;
    const topRight = scene.pick(window.innerWidth, 0, paPredicate)!.pickedPoint!;
    const botLeft = scene.pick(0, window.innerHeight, paPredicate)!.pickedPoint!;

    const width = Math.abs(topRight.x - topLeft.x);
    const height = Math.abs(botLeft.z - topLeft.z);

    const wall1 = BoxBuilder.CreateBox("north", { width, depth: 1, height: 2 });
    wall1.isVisible = false;
    wall1.position.z = height / 2;
    const wall2 = BoxBuilder.CreateBox("south", { width, depth: 1, height: 2 });
    wall2.position.z = -height / 2;
    wall2.isVisible = false;
    const wall3 = BoxBuilder.CreateBox("east", { width: 1, depth: height, height: 2 });
    wall3.position.x = width / 2;
    wall3.isVisible = false;
    const wall4 = BoxBuilder.CreateBox("west", { width: 1, depth: height, height: 2 });
    wall4.position.x = -width / 2;
    wall4.isVisible = false;

    // Physics
    new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        restitution: 0.3,
        friction: 0.7,
    });
    new PhysicsImpostor(wall1, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        restitution: 0.9,
    });
    new PhysicsImpostor(wall2, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        restitution: 0.9,
    });
    new PhysicsImpostor(wall3, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        restitution: 0.9,
    });
    new PhysicsImpostor(wall4, PhysicsImpostor.BoxImpostor, {
        mass: 0,
        restitution: 0.9,
    });
}
