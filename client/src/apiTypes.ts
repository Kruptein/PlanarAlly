/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export type Nullable = null;

export interface ApiAura {
  uuid: string;
  shape: string;
  vision_source: boolean;
  visible: boolean;
  name: string;
  value: number;
  dim: number;
  colour: string;
  active: boolean;
  border_colour: string;
  angle: number;
  direction: number;
}
export interface ApiFloor {
  index: number;
  name: string;
  player_visible: boolean;
  type_: number;
  background_color: string | Nullable;
  layers: ApiLayer[];
}
export interface ApiLayer {
  name: string;
  type_: string;
  player_editable: boolean;
  selectable: boolean;
  index: number;
  shapes: ApiShape[];
  groups: ApiGroup[];
}
export interface ApiShape {
  uuid: string;
  layer: string;
  floor: string;
  type_: string;
  x: number;
  y: number;
  name: string;
  name_visible: boolean;
  fill_colour: string;
  stroke_colour: string;
  vision_obstruction: boolean;
  movement_obstruction: boolean;
  is_token: boolean;
  annotation: string;
  draw_operator: string;
  options: string;
  badge: number;
  show_badge: boolean;
  default_edit_access: boolean;
  default_vision_access: boolean;
  is_invisible: boolean;
  is_defeated: boolean;
  default_movement_access: boolean;
  is_locked: boolean;
  angle: number;
  stroke_width: number;
  asset: number | Nullable;
  group: string | Nullable;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
}
export interface ApiOwner {
  shape: string;
  user: string;
  edit_access: boolean;
  movement_access: boolean;
  vision_access: boolean;
}
export interface ApiTracker {
  uuid: string;
  shape: string;
  visible: boolean;
  name: string;
  value: number;
  maxvalue: number;
  draw: boolean;
  primary_color: string;
  secondary_color: string;
}
export interface ApiLabel {
  uuid: string;
  user: string;
  category: string;
  name: string;
  visible: boolean;
}
export interface ApiGroup {
  uuid: string;
  character_set: string;
  creation_order: string;
}
export interface AssetOptionsInfoFail {
  error: string;
  success: false;
}
export interface AssetOptionsInfoSuccess {
  name: string;
  options: string | Nullable;
  success: true;
}
export interface ClientConnected {
  client: string;
  player: number;
}
export interface ClientDisconnected {
  client: string;
}
export interface ClientGameboardSet {
  client: string;
  boardId: string;
}
export interface ClientMove {
  client: string;
  position: ClientPosition;
}
export interface ClientPosition {
  pan_x: number;
  pan_y: number;
  zoom_display: number;
}
export interface ClientOffsetSet {
  client: string;
  x?: number;
  y?: number;
}
export interface ClientViewport {
  client: string;
  viewport: Viewport;
}
export interface Viewport {
  height: number;
  width: number;
  zoom_factor: number;
  offset_x?: number;
  offset_y?: number;
}
export interface DiceRollResult {
  player: string;
  roll: string;
  result: number;
  shareWithAll: boolean;
}
export interface FloorBackgroundSet {
  name: string;
  background?: string;
}
export interface FloorCreate {
  floor: ApiFloor;
  creator: string;
}
export interface FloorRename {
  index: number;
  name: string;
}
export interface FloorTypeSet {
  name: string;
  floorType: number;
}
export interface FloorVisibleSet {
  name: string;
  visible: boolean;
}
export interface GroupJoin {
  group_id: string;
  members: GroupMemberBadge[];
}
export interface GroupMemberBadge {
  uuid: string;
  badge: number;
}
export interface GroupLeave {
  uuid: string;
  group_id: string;
}
export interface NotificationShow {
  uuid: string;
  message: string;
}
export interface RoomInfoPlayersAdd {
  id: number;
  name: string;
  location: number;
}
export interface TempClientPosition {
  temp: boolean;
  position: ClientPosition;
}
