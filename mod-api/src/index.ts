import type {
  Component,
  ComputedRef,
  DefineSetupFnComponent,
  MaybeRef,
  MaybeRefOrGetter,
  Ref,
  SlotsType,
} from "vue";

import type { ElementId, ModSystems, ModSystemsState } from "./systems";

export * from "./systems";

export type NumberId<T extends string> = number & { __brand: T };
export type StringId<T extends string> = string & { __brand: T };
export type GlobalId = StringId<"globalId">;
export type LocalId = NumberId<"localId">;
export type CharacterId = NumberId<"characterId">;
export type TrackerId = StringId<"trackerId">;

export interface Tracker {
  uuid: TrackerId;
  visible: boolean;
  name: string;
  value: number;
  maxvalue: number;
  draw: boolean;
  primaryColor: string;
  secondaryColor: string;
}

export type UiTracker = { shape: LocalId; temporary: boolean } & Tracker;

export interface Sync {
  ui: boolean;
  server: boolean;
}

export interface ModShape {
  id: LocalId;
  character: CharacterId | undefined;
}

// A custom data element as stored by the host, the id is needed to update or remove it
export type UiShapeCustomData = ApiShapeCustomData & { id: ElementId };

// The shape DataBlock data has to have in its serialized form
export type DBR = Record<string, unknown> | unknown[];
export type DataBlockData = DBR;

// Who can read or write a DataBlock, the DM always has full access.
// - "dm": only the DM
// - "room": everyone in the campaign
// - "owner": users with edit access on the shape, including everyone if the shape grants edit access by default (shape DataBlocks only)
// Room DataBlocks default to "room" for both, shape DataBlocks default to "owner" for both.
// User DataBlocks are always private to the user and don't support access settings.
export type DataBlockAccessLevel = "dm" | "owner" | "room";

export interface DataBlockAccess {
  read: DataBlockAccessLevel;
  write: DataBlockAccessLevel;
}

export interface DataBlock<S extends DBR, D = S> {
  data: D;
  get existsOnServer(): boolean;
  get reactiveData(): Ref<D>;
  // null for user DataBlocks and for DataBlocks that will use the server defaults on creation
  get access(): DataBlockAccess | null;
  // Changing access is only allowed for users that can currently read and write the DataBlock
  setAccess(access: DataBlockAccess): Promise<boolean>;
  sync(): void;
  createOnServer(): void;
  updateData(data: D): void;
}

export interface DataBlockSerializer<S extends DBR, D = S> {
  serialize: (data: D) => S;
  deserialize: (data: S) => D;
}

export interface ApiCoreDataBlock {
  source: string;
  name: string;
  category: "room" | "shape" | "user";
  data: string;
}
export interface ApiRoomDataBlock extends ApiCoreDataBlock {
  category: "room";
}
export interface ApiShapeDataBlock extends ApiCoreDataBlock {
  category: "shape";
  shape: GlobalId;
}
export interface ApiUserDataBlock extends ApiCoreDataBlock {
  category: "user";
}
export type ApiDataBlock = ApiRoomDataBlock | ApiShapeDataBlock | ApiUserDataBlock;
export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type DbRepr = DistributiveOmit<ApiDataBlock, "data" | "source">;

export type ApiShapeCustomData =
  | ApiShapeCustomDataText
  | ApiShapeCustomDataNumber
  | ApiShapeCustomDataBoolean
  | ApiShapeCustomDataDiceExpression;
export interface ApiShapeCustomDataText extends ApiShapeCustomDataCore {
  kind: "text";
  value: string;
}
export interface ApiShapeCustomDataNumber extends ApiShapeCustomDataCore {
  kind: "number";
  value: number;
}
export interface ApiShapeCustomDataBoolean extends ApiShapeCustomDataCore {
  kind: "boolean";
  value: boolean;
}
export interface ApiShapeCustomDataDiceExpression extends ApiShapeCustomDataCore {
  kind: "dice-expression";
  value: string;
}
export interface ApiShapeCustomDataCore extends ApiShapeCustomDataIdentifier {
  // Name used in dice expressions, defaults to the name stripped of characters other than letters, digits, _, space and /.
  // Expressions refer to elements as `{[localId]source:prefix/reference}`, where only the reference is required:
  // - `[localId]` picks the shape, defaults to the shape the expression is evaluated for
  // - `source:` restricts the match to elements of that source, it can not contain `:`, `{`, `}`, `[` or `]`
  // - `prefix/` restricts the match to elements with that prefix
  // A reference must match exactly one element, references matching elements of multiple sources or prefixes
  // are an error and need to be qualified, e.g. `{srd-5.1:str}` or `{srd-5.1:/abilities/scores/str}`.
  reference: string | null;
  description: string | null;
}
export interface ApiShapeCustomDataIdentifier {
  shapeId: GlobalId;
  // Use the mod tag, the shape dialog shows a tab per source labelled with the matching mod's name.
  // "planarally" is used for elements created by users.
  source: string;
  prefix: string;
  name: string;
}

export interface ApiModMeta {
  apiSchema: string;
  tag: string;
  name: string;
  version: string;
  author: string;
  shortDescription: string;
  description: string;
  hash: string;
  hasCss: boolean;
  dev?: boolean;
  reloadToken?: string;
}

interface BaseSection {
  title: string;
  action: () => boolean | Promise<boolean>;
  disabled?: boolean;
  selected?: boolean;
}

type Length<T extends unknown[]> = T extends { length: infer L } ? L : never;
type BuildTuple<L extends number, T extends unknown[] = []> = T extends { length: L }
  ? T
  : BuildTuple<L, [...T, unknown]>;
type MinusOne<N extends number> = BuildTuple<N> extends [...infer U, unknown] ? Length<U> : never;

export type Section<Depth extends number = 3> = Depth extends 0
  ? BaseSection
  :
      | BaseSection
      | Section<MinusOne<Depth>>[]
      | { title: string; subitems: Section<MinusOne<Depth>>[] };

export interface ShapeTab {
  id: string;
  label: string;
  component: Component;
}

export interface DataBlockOptions<S extends DBR, D = S> {
  createOnServer?: boolean;
  defaultData?: () => D;
  serializer?: DataBlockSerializer<S, D>;
  // Only used when the DataBlock is created, use `DataBlock.setAccess` to change it afterwards
  access?: DataBlockAccess;
}

export type ModRepr = DistributiveOmit<DbRepr, "source">;

// Events emitted by the host, mods can add their own events through module augmentation:
// declare module "@planarally/mod-api" { interface ModEventMap { "my-mod:event": { ... } } }
export interface ModEventMap {
  "tracker:added": { id: LocalId; tracker: Tracker; syncTo: Sync };
  "tracker:updated": { id: LocalId; trackerId: TrackerId; delta: Partial<Tracker>; syncTo: Sync };
  "tracker:removed": { id: LocalId; trackerId: TrackerId; syncTo: Sync };
  "customData:added": { id: LocalId; element: UiShapeCustomData; syncTo: Sync };
  "customData:updated": {
    id: LocalId;
    elementId: ElementId;
    delta: Partial<ApiShapeCustomData>;
    syncTo: Sync;
  };
  "customData:removed": { id: LocalId; elementId: ElementId; syncTo: Sync };
}

// Hooks piped by the host, a handler receives the current value and returns the (modified) value.
// Mods can add their own hooks through module augmentation, like events.
export interface ModHookMap {
  "pre:tracker:update": {
    value: Partial<Tracker>;
    context: { id: LocalId; tracker: Tracker; syncTo: Sync };
  };
  "pre:customData:update": {
    value: Partial<ApiShapeCustomData> | ApiShapeCustomData;
    context: { id: LocalId; element: UiShapeCustomData; syncTo: Sync };
  };
}

// Unknown names fall back to `unknown`
export type ModEventPayload<K extends string> = K extends keyof ModEventMap
  ? ModEventMap[K]
  : unknown;
export type ModHookValue<K extends string> = K extends keyof ModHookMap
  ? ModHookMap[K]["value"]
  : unknown;
export type ModHookContext<K extends string> = K extends keyof ModHookMap
  ? ModHookMap[K]["context"]
  : unknown;

export interface ModEventBus {
  on<K extends string>(
    event: K,
    handler: (payload: ModEventPayload<K>) => void | Promise<void>,
  ): () => void;
  once<K extends string>(
    event: K,
    handler: (payload: ModEventPayload<K>) => void | Promise<void>,
  ): () => void;
  emit<K extends string>(event: K, payload: ModEventPayload<K>): void;
}

export interface ModHooks {
  tap<K extends string>(
    hook: K,
    handler: (value: ModHookValue<K>, context: ModHookContext<K>) => ModHookValue<K>,
  ): () => void;
  pipe<K extends string>(
    hook: K,
    initialValue: ModHookValue<K>,
    context: ModHookContext<K>,
  ): ModHookValue<K>;
}

export interface CompendiumEntry<T = unknown> {
  // Unique ID within a mod that is used to create a ref (e.g. "compendium:mod/entry")
  id: string;
  // Display name of the entry
  name: string;
  // The content of the entry - markdown aware
  body: string;
  // Structured data other mods can query.
  // `system` is the mod tag of the mod that defines the schema shape, which can differ from the mod that wrote the entry.
  // `kind` is that schema's entry type, for example "spell".
  schema?: CompendiumSchema<T>;
  // path can list one or multiple entries to put the entry in subfolders
  // when omitted the entry will be put in the root of the collection
  path?: string[];
  // groups are additional meta data that can be used to offer an alternative view of a folder
  // e.g. group entries by a particular property like magic school
  group?: Record<string, string>;
  // Purely used for search and auto complete purposes
  aliases?: string[];
}

export interface CompendiumView {
  at: string[];
  name: string;
  by: string;
  order?: string[];
}

export interface CompendiumRegisterOptions {
  name?: string;
  views?: CompendiumView[];
}

export interface CompendiumSchema<T = unknown> {
  system: string;
  kind: string;
  data?: T;
}

// A registered entry, which does not necessarily have a schema
export interface CompendiumIndexedEntry<T = unknown> extends CompendiumEntry<T> {
  mod: string;
  collection: string;
  // `<mod tag>/<entry id>`, as used in `compendium:` markdown links
  ref: string;
  path: string[];
}

export interface CompendiumRecord<T = unknown> extends CompendiumIndexedEntry<T> {
  schema: CompendiumSchema<T>;
}

export interface CompendiumApi {
  register(entries: CompendiumEntry[], options?: CompendiumRegisterOptions): () => void;
  getEntries<T>(system: string, kind: string): CompendiumRecord<T>[];
  // `ref` is `<mod tag>/<entry id>`, as in `compendium:` markdown links
  getEntry(ref: string): CompendiumIndexedEntry | undefined;
  // Opens the host's rule popover for the entry at the given screen coordinates
  openRuleAt(ref: string, x: number, y: number): void;
}

// A modal mounted by the host, while `condition` is true (or always when omitted)
export interface FullModal {
  component: Component;
  condition?: ComputedRef<boolean>;
  props?: Record<string, unknown>;
}

export interface ModModals {
  // Registers a modal, the returned function removes it again. Modals are removed when the mod is unloaded.
  add(modal: FullModal): () => void;
  confirm(
    title: string,
    text?: string,
    buttons?: { yes?: string; no?: string; focus?: "confirm" | "deny"; showNo?: boolean },
  ): Promise<boolean | undefined>;
  prompt(
    question: string,
    title: string,
    validation?: (value: string) => { valid: true } | { valid: false; reason: string },
  ): Promise<string | undefined>;
  selectionBox(
    title: string,
    choices: string[],
    options?: {
      text?: string;
      defaultButton?: string;
      customButton?: string;
      multiSelect?: boolean;
      defaultSelect?: string[];
    },
  ): Promise<string[] | undefined>;
}

export type DiceSimplification =
  | { kind: "number"; value: number }
  // Dice remain after resolving variables and math, e.g. "1d20 + 3"
  | { kind: "dice"; expression: string }
  | { kind: "error"; message: string };

// The math library behind dice simplification is still loading
export type PendingDiceSimplification = { kind: "pending" };

export type DiceShareWith = "all" | "dm" | "none";

export interface DiceRollOptions {
  // Shape that unqualified references resolve against, defaults to the focused shape like the dice tool
  shape?: LocalId;
  // Shown in the dice history and to other players instead of the expression, e.g. "Investigation check"
  label?: string;
  // Defaults to the player's current dice tool setting
  shareWith?: DiceShareWith;
  // Defaults to the player's current dice tool setting, falls back to 2D if 3D dice can't be loaded
  use3d?: boolean;
  // Don't show a toast when the roll fails, the promise still rejects
  silent?: boolean;
}

export interface DicePrefillOptions {
  // Shape that unqualified references resolve against, defaults to the focused shape
  shape?: LocalId;
}

export interface DiceRollDie {
  value: number;
  // Whether the die adds to the total, e.g. false for dice dropped by `2d20kh1`
  counted: boolean;
  // `overridden` is the original roll replaced by a min/max modifier, the replacement follows it
  status?: "kept" | "dropped" | "overridden";
}

export type DiceRollPart =
  | {
      kind: "dice";
      expression: string;
      amount: number;
      sides: number;
      total: number;
      dice: DiceRollDie[];
    }
  | { kind: "number"; value: number }
  | { kind: "operator"; operator: "+" | "-" };

export interface DiceRollOutcome {
  total: number;
  // The expression as passed to `roll`
  input: string;
  label: string | undefined;
  // The expression that was rolled, after resolving references and math, e.g. "1d20 + 5"
  expression: string;
  parts: DiceRollPart[];
  shareWith: DiceShareWith;
  used3d: boolean;
}

// `roll` and `prefill` reject with this error for problems with the expression or when dice are disabled in the room.
// Other errors are unexpected and passed on as is.
export interface DiceRollError extends Error {
  name: "DiceRollError";
  reason: "reference" | "math" | "disabled";
}

export interface DiceApi {
  // Resolves custom data variables relative to `shape` and all math that does not depend on dice results,
  // the same way a roll does, without rolling anything.
  simplify(expression: string, shape: LocalId): Promise<DiceSimplification>;
  // Reactive version of `simplify`, to be called in a component setup or another effect scope.
  // Holds custom data leases on every shape the expression reads until the scope is disposed.
  // Without a shape the result is undefined and no leases are held.
  useSimplified(
    expression: MaybeRefOrGetter<string>,
    shape: MaybeRefOrGetter<LocalId | null | undefined>,
  ): Readonly<Ref<DiceSimplification | PendingDiceSimplification | undefined>>;
  // Rolls the expression as the current player, exactly like the dice tool does, without opening it.
  // The result is shared, added to the dice history and shown to the player.
  roll(expression: string, options?: DiceRollOptions): Promise<DiceRollOutcome>;
  // Opens the dice tool with the expression filled in, references are qualified with the shape they resolve against.
  prefill(expression: string, options?: DicePrefillOptions): Promise<void>;
}

export interface GameApi {
  systems: ModSystems;
  systemsState: ModSystemsState;

  ui: {
    shape: {
      registerContextMenuEntry: (cb: MaybeRef<(shape: LocalId) => Section[]>) => () => void;
      registerTab: (
        tab: ShapeTab,
        filter?: MaybeRef<(shape: LocalId, hasEditAccess: boolean) => boolean>,
      ) => () => void;
    };
    modals: ModModals;
  };

  gameplay: {
    activateTool: (toolName: string) => void;
  };

  dice: DiceApi;

  components: {
    Modal: ModalComponent;
  };

  getShape: (shape: LocalId) => ModShape | undefined;
  getGlobalId: (id: LocalId) => GlobalId | undefined;

  eventBus: ModEventBus;
  hooks: ModHooks;
  compendium: CompendiumApi;

  getOrLoadDataBlock: <S extends DBR, D = S>(
    repr: ModRepr,
    options?: DataBlockOptions<S, D>,
  ) => Promise<DataBlock<S, D> | undefined>;
  loadDataBlock: <S extends DBR, D = S>(
    repr: ModRepr,
    options?: DataBlockOptions<S, D>,
  ) => Promise<DataBlock<S, D> | undefined>;
  createDataBlock: <S extends DBR, D = S>(
    repr: ModRepr,
    data: D,
    options?: DataBlockOptions<S, D>,
  ) => DataBlock<S, D>;
  getDataBlock: <S extends DBR, D = S>(repr: ModRepr) => DataBlock<S, D> | undefined;
  useShapeDataBlock: <S extends DBR, D = S>(
    name: string,
    options: Partial<DataBlockOptions<S, D>> & { defaultData: () => NoInfer<D> },
  ) => {
    data: Readonly<Ref<D>>;
    load: (shape: GlobalId | LocalId) => void;
    save: () => void;
    write: (data: D) => void;
  };

  // Makes `api` available to other mods under this mod's tag, replacing a previously provided api.
  // The api is removed again when the mod is unloaded.
  provideApi: (api: object) => () => void;
  // Returns the api another mod provided, if that mod is loaded and has provided one.
  // This is reactive: use it in a computed or watch to react to the other mod (re)loading or unloading.
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters
  getModApi: <T extends object = Record<string, unknown>>(tag: string) => T | undefined;
}

export function getModUrl(meta: ApiModMeta): string {
  if (meta.dev === true) return `/static/mods-dev/${meta.tag}`;
  return `/static/mods/${meta.tag}-${meta.version}-${meta.hash}`;
}

export interface ModEvents {
  init?: (meta: ApiModMeta) => Promise<void> | void;
  initGame?: (data: GameApi) => Promise<void> | void;
  loadLocation?: () => Promise<void> | void;
  dispose?: () => Promise<void> | void;
}

export interface ModalProps {
  visible: boolean;
  colour?: string;
  mask?: boolean;
  rightHanded?: boolean;
  extraClass?: string;
}

export interface ModalHeaderSlotProps {
  dragStart: (event: DragEvent) => void;
  dragEnd: (event: DragEvent) => void;
  toggleWindow: () => void;
}

export type ModalComponent = DefineSetupFnComponent<
  ModalProps,
  {
    close: () => void;
    focus: () => void;
    "window-toggle": (open: boolean) => void;
  },
  SlotsType<{
    header: ModalHeaderSlotProps;
  }>
>;

export interface ModUi {
  dmModSettings?: {
    component: Component;
    customModal?: boolean;
  };
}

export interface Mod {
  events?: ModEvents;
  ui?: ModUi;
}
