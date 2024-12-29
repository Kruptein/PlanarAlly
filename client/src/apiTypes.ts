import type { AssetId } from "./assets/models";
import type { GlobalId } from "./core/id";
import type { LayerName } from "./game/models/floor";
import type { Role } from "./game/models/role";
import type { AuraId } from "./game/systems/auras/models";
import type { CharacterId } from "./game/systems/characters/models";
import type { ClientId } from "./game/systems/client/models";
import type { PlayerId } from "./game/systems/players/models";
import type { VisionBlock } from "./game/systems/properties/types";
import type { GridModeLabelFormat } from "./game/systems/settings/players/models";
import type { TrackerId } from "./game/systems/trackers/models";

export type ApiShape = ApiAssetRectShape | ApiRectShape | ApiCircleShape | ApiCircularTokenShape | ApiPolygonShape | ApiTextShape | ApiLineShape | ApiToggleCompositeShape
export type ApiDataBlock = ApiRoomDataBlock | ApiShapeDataBlock | ApiUserDataBlock

/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface ApiAsset {
  id: AssetId;
  name: string;
  owner: string;
  fileHash: string | null;
  children: ApiAsset[] | null;
  shares: ApiAssetShare[];
}
export interface ApiAssetShare {
  user: string;
  right: "view" | "edit";
}
export interface ApiAssetAdd {
  asset: ApiAsset;
  parent: AssetId;
}
export interface ApiAssetCreateFolder {
  name: string;
  parent: AssetId;
}
export interface ApiAssetCreateShare {
  right: "view" | "edit";
  user: string;
  asset: AssetId;
}
export interface ApiAssetFolder {
  folder: ApiAsset;
  path: AssetId[] | null;
  sharedParent: ApiAsset | null;
  sharedRight: "view" | "edit" | null;
}
export interface ApiAssetInodeMove {
  inode: AssetId;
  target: AssetId;
}
export interface ApiAssetRectShape extends ApiCoreShape {
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
export interface ApiAssetRemoveShare {
  asset: AssetId;
  user: string;
}
export interface ApiAssetRename {
  asset: AssetId;
  name: string;
}
export interface ApiAssetUpload {
  uuid: string;
  name: string;
  directory: AssetId;
  newDirectories: string[];
  slice: number;
  totalSlices: number;
  data: string;
}
export interface ApiBaseRectShape extends ApiCoreShape {
  width: number;
  height: number;
}
export interface ApiCharacter {
  id: CharacterId;
  name: string;
  shapeId: GlobalId;
  assetId: number;
  assetHash: string;
}
export interface ApiChatMessage {
  id: string;
  author: string;
  data: string[];
}
export interface ApiChatMessageUpdate {
  id: string;
  message: string;
}
export interface ApiCircleShape extends ApiCoreShape {
  radius: number;
  viewing_angle: number | null;
}
export interface ApiCircularTokenShape extends ApiCoreShape {
  radius: number;
  viewing_angle: number | null;
  text: string;
  font: string;
}
export interface ApiCoreDataBlock {
  source: string;
  name: string;
  category: "room" | "shape" | "user";
  data: string;
}
export interface ApiCoreShape {
  uuid: GlobalId;
  type_: string;
  x: number;
  y: number;
  name: string;
  name_visible: boolean;
  fill_colour: string;
  stroke_colour: string;
  vision_obstruction: VisionBlock;
  movement_obstruction: boolean;
  is_token: boolean;
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
  ignore_zoom_size: boolean;
  is_door: boolean;
  is_teleport_zone: boolean;
  owners: ApiShapeOwner[];
  trackers: ApiTracker[];
  auras: ApiAura[];
  character: CharacterId | null;
  odd_hex_orientation: boolean;
  size: number;
  show_cells: boolean;
  cell_fill_colour: string | null;
  cell_stroke_colour: string | null;
  cell_stroke_width: number | null;
}
export interface ApiDefaultShapeOwner {
  edit_access: boolean;
  movement_access: boolean;
  vision_access: boolean;
  shape: GlobalId;
}
export interface ApiDeleteShapeOwner {
  shape: GlobalId;
  user: string;
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
  name: LayerName;
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
export interface ApiRectShape extends ApiCoreShape {
  width: number;
  height: number;
}
export interface ApiPolygonShape extends ApiCoreShape {
  vertices: string;
  line_width: number;
  open_polygon: boolean;
}
export interface ApiTextShape extends ApiCoreShape {
  text: string;
  font_size: number;
}
export interface ApiLineShape extends ApiCoreShape {
  x2: number;
  y2: number;
  line_width: number;
}
export interface ApiToggleCompositeShape extends ApiCoreShape {
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
  creator: string;
  title: string;
  text: string;
  tags: string[];
  showOnHover: boolean;
  showIconOnShape: boolean;
  isRoomNote: boolean;
  location: number | null;
  access: ApiNoteAccess[];
  shapes: GlobalId[];
}
export interface ApiNoteAccess {
  name: string;
  can_edit: boolean;
  can_view: boolean;
}
export interface ApiNoteAccessEdit extends ApiNoteAccess {
  note: string;
}
export interface ApiNoteSetBoolean {
  uuid: string;
  value: boolean;
}
export interface ApiNoteSetString {
  uuid: string;
  value: string;
}
export interface ApiNoteShape {
  note_id: string;
  shape_id: GlobalId;
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
  grid_mode_label_format?: GridModeLabelFormat | null;
  default_wall_colour?: string | null;
  default_window_colour?: string | null;
  default_closed_door_colour?: string | null;
  default_open_door_colour?: string | null;
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
export interface ApiRoomDataBlock extends ApiCoreDataBlock {
  category: "room";
  data: string;
}
export interface ApiShapeDataBlock extends ApiCoreDataBlock {
  category: "shape";
  data: string;
  shape: GlobalId;
}
export interface ApiShapeWithLayerInfo {
  shape:
    | ApiAssetRectShape
    | ApiRectShape
    | ApiCircleShape
    | ApiCircularTokenShape
    | ApiPolygonShape
    | ApiTextShape
    | ApiLineShape
    | ApiToggleCompositeShape;
  floor: string;
  layer: LayerName;
}
export interface ApiUserDataBlock extends ApiCoreDataBlock {
  category: "user";
  data: string;
}
export interface ApiUserOptions {
  fow_colour: string;
  grid_colour: string;
  ruler_colour: string;
  use_tool_icons: boolean;
  show_token_directions: boolean;
  grid_mode_label_format: GridModeLabelFormat;
  default_wall_colour?: string | null;
  default_window_colour?: string | null;
  default_closed_door_colour?: string | null;
  default_open_door_colour?: string | null;
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
export interface CharacterCreate {
  shape: GlobalId;
  name: string;
}
export interface ClientActiveLayerSet {
  floor: string;
  layer: string;
}
export interface ClientConnected {
  client: ClientId;
  player: PlayerId;
}
export interface ClientDisconnected {
  client: ClientId;
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
  shareWith: "all" | "dm" | "none";
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
export interface LogicDoorRequest {
  logic: "door";
  door: GlobalId;
}
export interface LogicRequestInfo {
  requester: PlayerId;
  request: LogicDoorRequest | LogicTeleportRequest;
}
export interface LogicTeleportRequest {
  logic: "tp";
  fromZone: GlobalId;
  toZone: GlobalId;
  transfers: GlobalId[];
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
  id: PlayerId;
  name: string;
  location: number;
  role: Role;
}
export interface PlayerOptionsSet {
  colour_history: string | null;
  default_user_options: ApiUserOptions;
  room_user_options: ApiOptionalUserOptions | null;
}
export interface PlayerPosition {
  x: number;
  y: number;
  floor: string;
}
export interface PlayerRoleSet {
  player: PlayerId;
  role: number;
}
export interface PlayersInfoSet {
  core: PlayerInfoCore;
  position?: ApiLocationUserOption;
  clients?: OptionalClientViewport[];
}
export interface PlayersPositionSet {
  x: number;
  y: number;
  floor: string;
  players: string[];
}
export interface PositionTuple {
  x: number;
  y: number;
}
export interface RoomFeatures {
  chat: boolean;
  dice: boolean;
}
export interface RoomInfoPlayersAdd {
  id: PlayerId;
  name: string;
  location: number;
}
export interface RoomInfoSet {
  name: string;
  creator: string;
  invitationCode: string;
  isLocked: boolean;
  publicName: string;
  features: RoomFeatures;
}
export interface ShapeAdd {
  shape:
    | ApiAssetRectShape
    | ApiRectShape
    | ApiCircleShape
    | ApiCircularTokenShape
    | ApiPolygonShape
    | ApiTextShape
    | ApiLineShape
    | ApiToggleCompositeShape;
  floor: string;
  layer: LayerName;
  temporary: boolean;
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
  position: PositionTuple;
  floor: string;
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
}
export interface ShapeLocationMoveTarget {
  x: number;
  y: number;
  location: number;
  floor: string;
  layer?: string;
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
export interface ShapeSetIntegerValue {
  shape: GlobalId;
  value: number;
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
  drop_ratio?: number | null;
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
  drop_ratio: number;
}
export interface ApiSpawnInfo {
  position: PositionTuple;
  floor: string;
  name: string;
  uuid: GlobalId;
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
