import type { RouteParams } from "vue-router";

import type { LocalPoint } from "../../core/geometry";
import type { PressedModifiers } from "../common/events";
import type { DrawToolState } from "../common/tools/draw";
import type { Canvas } from "../core/canvas";
import type { LocalId } from "../core/id";
import type { Floor, FloorId, FloorIndex, LayerName, FloorType } from "../core/models/floor";
import type { ToolFeatures, ToolName } from "../core/models/tools";
import type { SelectFeatures } from "../dom/tools/models/select";

export interface Message<T extends string, X = unknown> {
    msg: T;
    options: X;
}

// UI -> Worker

type BackgroundFloorMsg = Message<"Floor.Background.Set", { id: FloorId; background: string | undefined }>;
type ChangeFloorMsg = Message<"Floor.Change", { targetFloor: number; shiftPressed: boolean; altPressed: boolean }>;
type CompleteFloorMsg = Message<"Floor.Complete", { floorId: FloorId; selectFloor: boolean }>;
type RenameFloorMsg = Message<"Floor.Rename", { index: FloorIndex; name: string }>;
type SelectFloorMsg = Message<"Floor.Select", FloorId>;
type TypeFloorMsg = Message<"Floor.Type.Set", { index: FloorIndex; type: FloorType }>;
type StartGameMsg = Message<"Game.Start", { params: RouteParams }>;
type StopGameMsg = Message<"Game.Stop">;
type KeyboardDeselectMsg = Message<"Keyboard.Deselect">;
type KeyboardPanMsg = Message<"Keyboard.Pan", { code: string; shiftPressed: boolean }>;
type CreateLayerMsg = Message<
    "Layer.Create",
    { canvas: Canvas; name: LayerName; floorId: FloorId; width: number; height: number }
>;
type SelectLayerMsg = Message<"Layer.Select", { name: LayerName }>;
type DrawToolDownMsg = Message<
    "Tool.Draw.Down",
    { lp: LocalPoint; state: DrawToolState; pressed: PressedModifiers | undefined }
>;
type DrawToolMoveMsg = Message<"Tool.Draw.Move", { lp: LocalPoint; pressed: PressedModifiers | undefined }>;
type DrawToolSelectMsg = Message<"Tool.Draw.Select", DrawToolState>;
type DrawToolUpMsg = Message<"Tool.Draw.Up", { lp: LocalPoint; pressed: PressedModifiers | undefined }>;
type PanToolMsg = Message<"Tool.Pan", { origin: LocalPoint; target: LocalPoint; full: boolean }>;
type RulerToolCleanupMsg = Message<"Tool.Ruler.Cleanup">;
type RulerToolDownMsg = Message<"Tool.Ruler.Down", { lp: LocalPoint; pressed: PressedModifiers | undefined }>;
type RulerToolMoveMsg = Message<"Tool.Ruler.Move", { lp: LocalPoint; pressed: PressedModifiers | undefined }>;
type RulerToolSplitMsg = Message<"Tool.Ruler.Split">;
type RulerToolPublicMsg = Message<"Tool.Ruler.Public.Set", boolean>;
type SelectToolDownMsg = Message<
    "Tool.Select.Down",
    { lp: LocalPoint; features: ToolFeatures<SelectFeatures>; pressed: PressedModifiers | undefined }
>;
type SelectToolMoveMsg = Message<
    "Tool.Select.Move",
    { lp: LocalPoint; pressed: PressedModifiers | undefined; features: ToolFeatures<SelectFeatures> }
>;
type SelectToolRotationUiMsg = Message<
    "Tool.Select.Rotation.Ui",
    { show: true; features: ToolFeatures<SelectFeatures> } | { show: false }
>;
type SelectToolUpMsg = Message<
    "Tool.Select.Up",
    { lp: LocalPoint; pressed: PressedModifiers | undefined; features: ToolFeatures<SelectFeatures> }
>;
type UsernameMsg = Message<"username", { username: string }>;
export type WorkerMessages =
    | BackgroundFloorMsg
    | ChangeFloorMsg
    | CompleteFloorMsg
    | RenameFloorMsg
    | SelectFloorMsg
    | TypeFloorMsg
    | StartGameMsg
    | StopGameMsg
    | KeyboardDeselectMsg
    | KeyboardPanMsg
    | CreateLayerMsg
    | SelectLayerMsg
    | DrawToolDownMsg
    | DrawToolMoveMsg
    | DrawToolSelectMsg
    | DrawToolUpMsg
    | PanToolMsg
    | RulerToolCleanupMsg
    | RulerToolDownMsg
    | RulerToolMoveMsg
    | RulerToolPublicMsg
    | RulerToolSplitMsg
    | SelectToolDownMsg
    | SelectToolMoveMsg
    | SelectToolRotationUiMsg
    | SelectToolUpMsg
    | UsernameMsg;

// Worker -> UI

type CanvasVisibilityMsg = Message<"Canvas.Visibility", { name: string; visible: boolean; index?: string }[]>;
type SetCursorMsg = Message<"Cursor.Set", string>;
type CreateFloorMsg = Message<"Floor.Create", { floorId: FloorId; layers: LayerName[]; selectFloor: boolean }>;
type SetFloorIndexMsg = Message<
    "Floor.Index.Set",
    { index: number; layerIndex: number; layers: { name: LayerName; available: boolean }[] }
>;
type SetFloorsMsg = Message<"Floors.Set", Floor[]>;
type SetIsDmMsg = Message<"Game.Dm.Set", boolean>;
type SetLayerIndexMsg = Message<"Layer.Index.Set", number>;
type AddSelectedMsg = Message<"Selected.Add", LocalId[]>;
type ClearSelectedMsg = Message<"Selected.Clear">;
type RemoveSelectedMsg = Message<"Selected.Remove", LocalId>;
type ToolActiveMsg = Message<"Tool.Active.Set", { name: ToolName; active: boolean }>;
export type DomMessages =
    | CanvasVisibilityMsg
    | SetCursorMsg
    | CreateFloorMsg
    | SetFloorIndexMsg
    | SetFloorsMsg
    | SetIsDmMsg
    | SetLayerIndexMsg
    | AddSelectedMsg
    | ClearSelectedMsg
    | RemoveSelectedMsg
    | ToolActiveMsg;
