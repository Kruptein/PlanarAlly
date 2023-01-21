import type { GlobalId } from "./game/id";
import type { LayerName } from "./game/models/floor";
import type { AuraId } from "./game/systems/auras/models";
import type { ClientId } from "./game/systems/client/models";
import type { TrackerId } from "./game/systems/trackers/models";

export type ApiShape = ApiAssetRectShape | ApiRectShape | ApiCircleShape | ApiCircularTokenShape | ApiPolygonShape | ApiTextShape | ApiLineShape | ApiToggleCompositeShape

/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface ApiAssetRectShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  width: number;
  height: number;
  src: string;
}
export interface ApiShapeOwner {
  edit_access: boolean;
  movement_access: boolean;
  vision_access: boolean;
  shape: GlobalId;
  user: string;
}
export interface ApiTracker {
  uuid: TrackerId;
  shape: GlobalId;
  visible: boolean;
  name: string;
  value: number;
  maxvalue: number;
  draw: boolean;
  primary_color: string;
  secondary_color: string;
}
export interface ApiAura {
  uuid: AuraId;
  shape: GlobalId;
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
export interface ApiLabel {
  uuid: string;
  user: string;
  category: string;
  name: string;
  visible: boolean;
}
export interface ApiBaseRectShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  width: number;
  height: number;
}
export interface ApiCircleShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  radius: number;
  viewing_angle: number | null;
}
export interface ApiCircularTokenShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  radius: number;
  viewing_angle: number | null;
  text: string;
  font: string;
}
export interface ApiCoreShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
}
export interface ApiDefaultShapeOwner {
  edit_access: boolean;
  movement_access: boolean;
  vision_access: boolean;
  shape: GlobalId;
}
export interface ApiFloor {
  index: number;
  name: string;
  player_visible: boolean;
  type_: number;
  background_color: string | null;
  layers: ApiLayer[];
}
export interface ApiLayer {
  name: string;
  type_: string;
  player_editable: boolean;
  selectable: boolean;
  index: number;
  shapes: (
    | ApiAssetRectShape
    | ApiRectShape
    | ApiCircleShape
    | ApiCircularTokenShape
    | ApiPolygonShape
    | ApiTextShape
    | ApiLineShape
    | ApiToggleCompositeShape
  )[];
  groups: ApiGroup[];
}
export interface ApiRectShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  width: number;
  height: number;
}
export interface ApiPolygonShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  vertices: string;
  line_width: number;
  open_polygon: boolean;
}
export interface ApiTextShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  text: string;
  font_size: number;
}
export interface ApiLineShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  x2: number;
  y2: number;
  line_width: number;
}
export interface ApiToggleCompositeShape {
  uuid: GlobalId;
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
  asset: number | null;
  group: string | null;
  annotation_visible: boolean;
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  labels: ApiLabel[];
  active_variant: GlobalId;
  variants: ToggleVariant[];
}
export interface ToggleVariant {
  uuid: GlobalId;
  name: string;
}
export interface ApiGroup {
  uuid: string;
  character_set: string;
  creation_order: string;
}
export interface ApiInitiative {
  location: number;
  round: number;
  turn: number;
  sort: number;
  data: ApiInitiativeData[];
  isActive: boolean;
}
export interface ApiInitiativeData {
  shape: GlobalId;
  initiative?: number;
  isVisible: boolean;
  isGroup: boolean;
  effects: ApiInitiativeEffect[];
}
export interface ApiInitiativeEffect {
  name: string;
  turns: string;
  highlightsActor: boolean;
}
export interface ApiLocationUserOption {
  pan_x: number;
  pan_y: number;
  zoom_display: number;
  active_layer?: string;
  active_floor?: string;
}
export interface ApiNote {
  uuid: string;
  title: string;
  text: string;
}
export interface ApiOptionalAura {
  uuid: AuraId;
  shape: GlobalId;
  vision_source?: boolean;
  visible?: boolean;
  name?: string;
  value?: number;
  dim?: number;
  colour?: string;
  active?: boolean;
  border_colour?: string;
  angle?: number;
  direction?: number;
}
export interface ApiOptionalUserOptions {
  fow_colour?: string | null;
  grid_colour?: string | null;
  ruler_colour?: string | null;
  use_tool_icons?: boolean | null;
  show_token_directions?: boolean | null;
  invert_alt?: boolean | null;
  disable_scroll_to_zoom?: boolean | null;
  default_tracker_mode?: boolean | null;
  mouse_pan_mode?: number | null;
  use_high_dpi?: boolean | null;
  grid_size?: number | null;
  use_as_physical_board?: boolean | null;
  mini_size?: number | null;
  ppi?: number | null;
  initiative_camera_lock?: boolean | null;
  initiative_vision_lock?: boolean | null;
  initiative_effect_visibility?: string | null;
  initiative_open_on_activate?: boolean | null;
  render_all_floors?: boolean | null;
}
export interface ApiUserOptions {
  fow_colour: string;
  grid_colour: string;
  ruler_colour: string;
  use_tool_icons: boolean;
  show_token_directions: boolean;
  invert_alt: boolean;
  disable_scroll_to_zoom: boolean;
  default_tracker_mode: boolean;
  mouse_pan_mode: number;
  use_high_dpi: boolean;
  grid_size: number;
  use_as_physical_board: boolean;
  mini_size: number;
  ppi: number;
  initiative_camera_lock: boolean;
  initiative_vision_lock: boolean;
  initiative_effect_visibility: string;
  initiative_open_on_activate: boolean;
  render_all_floors: boolean;
}
export interface AssetOptionsInfoFail {
  error: string;
  success: false;
}
export interface AssetOptionsInfoSuccess {
  name: string;
  options: string | null;
  success: true;
}
export interface AssetOptionsSet {
  asset: number;
  options: string;
}
export interface AuraMove {
  shape: GlobalId;
  aura: AuraId;
  new_shape: GlobalId;
}
export interface AuraRef {
  uuid: AuraId;
  shape: GlobalId;
}
export interface ClientActiveLayerSet {
  floor: string;
  layer: string;
}
export interface ClientConnected {
  client: ClientId;
  player: number;
}
export interface ClientDisconnected {
  client: ClientId;
}
export interface ClientGameboardSet {
  client: ClientId;
  boardId: string;
}
export interface ClientMove {
  client: ClientId;
  position: ClientPosition;
}
export interface ClientPosition {
  pan_x: number;
  pan_y: number;
  zoom_display: number;
}
export interface ClientOffsetSet {
  client: ClientId;
  x?: number;
  y?: number;
}
export interface ClientViewport {
  client: ClientId;
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
  uuid: GlobalId;
  badge: number;
}
export interface GroupLeave {
  uuid: GlobalId;
  group_id: string;
}
export interface InitiativeAdd {
  shape: GlobalId;
  initiative?: number;
  isVisible: boolean;
  isGroup: boolean;
  effects: ApiInitiativeEffect[];
}
export interface InitiativeEffectNew {
  actor: GlobalId;
  effect: ApiInitiativeEffect;
}
export interface InitiativeEffectRemove {
  shape: GlobalId;
  index: number;
}
export interface InitiativeEffectRename {
  shape: GlobalId;
  index: number;
  name: string;
}
export interface InitiativeEffectTurns {
  shape: GlobalId;
  index: number;
  turns: string;
}
export interface InitiativeOptionSet {
  shape: GlobalId;
  option: "isVisible" | "isGroup";
  value: boolean;
}
export interface InitiativeOrderChange {
  shape: GlobalId;
  oldIndex: number;
  newIndex: number;
}
export interface InitiativeValueSet {
  shape: GlobalId;
  value: number;
}
export interface LabelVisibilitySet {
  uuid: string;
  visible: boolean;
}
export interface LogicDoorRequest {
  logic: "door";
  door: GlobalId;
}
export interface LogicRequestInfo {
  requester: string;
  request: LogicDoorRequest | LogicTeleportRequest;
}
export interface LogicTeleportRequest {
  logic: "tp";
  fromZone: GlobalId;
  toZone: GlobalId;
  transfers: string[];
}
export interface NotificationShow {
  uuid: string;
  message: string;
}
export interface OptionalClientViewport {
  client: ClientId;
  viewport?: Viewport;
}
export interface Permissions {
  enabled: string[];
  request: string[];
  disabled: string[];
}
export interface PlayerInfoCore {
  id: number;
  name: string;
  location: number;
  role: number;
}
export interface PlayerOptionsSet {
  colour_history: string | null;
  default_user_options: ApiUserOptions;
  room_user_options?: ApiOptionalUserOptions;
}
export interface PlayerRoleSet {
  player: number;
  role: number;
}
export interface PlayersBring {
  x: number;
  y: number;
  floor: string;
  zoom: number;
}
export interface PlayersInfoSet {
  core: PlayerInfoCore;
  position?: ApiLocationUserOption;
  clients?: OptionalClientViewport[];
}
export interface PositionTuple {
  x: number;
  y: number;
}
export interface RoomInfoPlayersAdd {
  id: number;
  name: string;
  location: number;
}
export interface RoomInfoSet {
  name: string;
  creator: string;
  invitationCode: string;
  isLocked: boolean;
  publicName: string;
}
export interface ShapeAdd {
  temporary: boolean;
  shape:
    | ApiAssetRectShape
    | ApiRectShape
    | ApiCircleShape
    | ApiCircularTokenShape
    | ApiPolygonShape
    | ApiTextShape
    | ApiLineShape
    | ApiToggleCompositeShape;
}
export interface ShapeAssetImageSet {
  uuid: GlobalId;
  src: string;
}
export interface ShapeCircleSizeUpdate {
  uuid: GlobalId;
  r: number;
  temporary: boolean;
}
export interface ShapeFloorChange {
  uuids: GlobalId[];
  floor: string;
}
export interface ShapeInfo {
  shape:
    | ApiAssetRectShape
    | ApiRectShape
    | ApiCircleShape
    | ApiCircularTokenShape
    | ApiPolygonShape
    | ApiTextShape
    | ApiLineShape
    | ApiToggleCompositeShape;
  location: number;
}
export interface ShapeLayerChange {
  uuids: GlobalId[];
  floor: string;
  layer: LayerName;
}
export interface ShapeLocationMove {
  shapes: GlobalId[];
  target: ShapeLocationMoveTarget;
  tp_zone: boolean;
}
export interface ShapeLocationMoveTarget {
  x: number;
  y: number;
  location: number;
  floor: string;
}
export interface ShapeOption {
  uuid: GlobalId;
  option: string;
}
export interface ShapeOrder {
  uuid: GlobalId;
  index: number;
  temporary: boolean;
}
export interface ShapePosition {
  angle: number;
  points: [number, number][];
}
export interface ShapePositionUpdate {
  uuid: GlobalId;
  position: ShapePosition;
}
export interface ShapeRectSizeUpdate {
  uuid: GlobalId;
  w: number;
  h: number;
  temporary: boolean;
}
export interface ShapeSetAuraValue {
  shape: GlobalId;
  value: AuraId;
}
export interface ShapeSetBooleanValue {
  shape: GlobalId;
  value: boolean;
}
export interface ShapeSetDoorToggleModeValue {
  shape: GlobalId;
  value: "movement" | "vision" | "both";
}
export interface ShapeSetOptionalStringValue {
  shape: GlobalId;
  value: string | null;
}
export interface ShapeSetPermissionValue {
  shape: GlobalId;
  value: Permissions;
}
export interface ShapeSetStringValue {
  shape: GlobalId;
  value: string;
}
export interface ShapeSetTeleportLocationValue {
  shape: GlobalId;
  value: TeleportLocation;
}
export interface TeleportLocation {
  id: number;
  spawnUuid: GlobalId;
}
export interface ShapeTextSizeUpdate {
  uuid: GlobalId;
  font_size: number;
  temporary: boolean;
}
export interface ShapeTextValueSet {
  uuid: GlobalId;
  text: string;
  temporary: boolean;
}
export interface ShapesOptionsUpdate {
  options: ShapeOption[];
  temporary: boolean;
}
export interface ShapesPositionUpdateList {
  shapes: ShapePositionUpdate[];
  temporary: boolean;
}
export interface TempClientPosition {
  temp: boolean;
  position: ClientPosition;
}
export interface TemporaryShapes {
  uuids: GlobalId[];
  temporary: boolean;
}
export interface ToggleCompositeNewVariant {
  shape: GlobalId;
  variant: GlobalId;
  name: string;
}
export interface ToggleCompositeVariant {
  shape: GlobalId;
  variant: GlobalId;
}
export interface TypeIdModel {}
export interface ApiLocation {
  id: number;
  name: string;
  archived: boolean;
  options: ApiOptionalLocationOptions;
}
export interface ApiOptionalLocationOptions {
  unit_size?: number | null;
  unit_size_unit?: string | null;
  use_grid?: boolean | null;
  full_fow?: boolean | null;
  fow_opacity?: number | null;
  fow_los?: boolean | null;
  vision_mode?: string | null;
  vision_min_range?: number | null;
  vision_max_range?: number | null;
  spawn_locations?: string | null;
  move_player_on_token_change?: boolean | null;
  grid_type?: string | null;
  air_map_background?: string | null;
  ground_map_background?: string | null;
  underground_map_background?: string | null;
  limit_movement_during_initiative?: boolean | null;
}
export interface ApiLocationCore {
  id: number;
  name: string;
  archived: boolean;
}
export interface ApiLocationOptions {
  unit_size: number;
  unit_size_unit: string;
  use_grid: boolean;
  full_fow: boolean;
  fow_opacity: number;
  fow_los: boolean;
  vision_mode: string;
  vision_min_range: number;
  vision_max_range: number;
  spawn_locations: string;
  move_player_on_token_change: boolean;
  grid_type: string;
  air_map_background: string;
  ground_map_background: string;
  underground_map_background: string;
  limit_movement_during_initiative: boolean;
}
export interface LocationChange {
  location: number;
  users: string[];
  position?: PositionTuple;
}
export interface LocationClone {
  location: number;
  room: string;
}
export interface LocationOptionsSet {
  options: ApiOptionalLocationOptions;
  location?: number;
}
export interface LocationRename {
  location: number;
  name: string;
}
export interface LocationSettingsSet {
  default: ApiLocationOptions;
  active: number;
  locations: {
    [k: string]: ApiOptionalLocationOptions;
  };
}
export interface ApiOptionalTracker {
  uuid: TrackerId;
  shape: GlobalId;
  visible?: boolean;
  name?: string;
  value?: number;
  maxvalue?: number;
  draw?: boolean;
  primary_color?: string;
  secondary_color?: string;
}
export interface ShapeSetTrackerValue {
  shape: GlobalId;
  value: TrackerId;
}
export interface TrackerMove {
  shape: GlobalId;
  tracker: TrackerId;
  new_shape: GlobalId;
}
export interface TrackerRef {
  uuid: TrackerId;
  shape: GlobalId;
}
