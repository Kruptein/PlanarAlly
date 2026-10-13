import type {
  Component,
  DeepReadonly,
  DefineSetupFnComponent,
  MaybeRef,
  MaybeRefOrGetter,
  Reactive,
  Ref,
  SlotsType,
} from "vue";

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

interface TrackerState {
  id: LocalId | undefined;
  trackers: UiTracker[];
  parentId: LocalId | undefined;
  parentTrackers: UiTracker[];
}

interface TrackerSystem {
  state: DeepReadonly<Reactive<TrackerState>>;
  get(id: LocalId, trackerId: TrackerId, includeParent: boolean): Readonly<Tracker> | undefined;
  getOrCreate(
    id: LocalId,
    trackerId: TrackerId,
    sync: Sync,
    initialData?: () => Partial<Tracker>,
  ): { tracker: Readonly<Tracker>; created: boolean };
  remove(id: LocalId, trackerId: TrackerId, syncTo: Sync): void;
  update(id: LocalId, trackerId: TrackerId, delta: Partial<Tracker>, syncTo: Sync): void;
}

interface ApiCharacter {
  id: CharacterId;
  shapeId: GlobalId;
}

interface CharacterSystem {
  getAllCharacters(): IterableIterator<Readonly<ApiCharacter>>;
  getShape(characterId: CharacterId): ModShape | undefined;
  getShapeId(characterId: CharacterId): GlobalId | undefined;
}

interface CustomDataSystem {
  addElement(element: ApiShapeCustomData, sync: boolean): void;
  loadAndDropState(ids: ReadonlySet<LocalId>, source: string | symbol): void;
}

interface ReactiveState<T extends object> {
  reactive: T;
  mutableReactive: T;
}

interface NonReactiveState<U> {
  readonly: U;
  mutable: U;
}

interface SystemsState {
  characters: ReactiveState<{
    activeCharacterId: CharacterId | undefined;
    characterIds: Set<CharacterId>;
  }> &
    NonReactiveState<{ characters: Map<CharacterId, ApiCharacter> }>;
  customData: ReactiveState<{
    data: Map<LocalId, ApiShapeCustomData[]>;
  }>;
  game: ReactiveState<{
    roomName: string;
    roomCreator: string;
  }>;
  properties: NonReactiveState<{
    data: Map<number, { name: string }>;
  }>;
  selected: ReactiveState<{
    focus: LocalId | undefined;
    selected: Set<LocalId>;
  }>;
}

type DBR = Record<string, unknown> | unknown[];

export interface DataBlock<S extends DBR, D = S> {
  data: D;
  get existsOnServer(): boolean;
  get reactiveData(): Ref<D>;
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
}

export type ModRepr = DistributiveOmit<DbRepr, "source">;

export interface ModEventBus {
  on(event: string, handler: (payload: unknown) => void): () => void;
  once(event: string, handler: (payload: unknown) => void): () => void;
  emit(event: string, payload: unknown): void;
}

export interface ModHooks {
  tap(hook: string, handler: (value: unknown, context: unknown) => unknown): () => void;
  pipe(hook: string, initialValue: unknown, context: unknown): unknown;
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

export interface CompendiumRecord<T = unknown> extends CompendiumEntry<T> {
  mod: string;
  collection: string;
  ref: string;
  path: string[];
  schema: CompendiumSchema<T>;
}

export interface CompendiumApi {
  register(entries: CompendiumEntry[], options?: CompendiumRegisterOptions): () => void;
  getEntries<T>(system: string, kind: string): CompendiumRecord<T>[];
}

export type DiceSimplification =
  | { kind: "number"; value: number }
  // Dice remain after resolving variables and math, e.g. "1d20 + 3"
  | { kind: "dice"; expression: string }
  | { kind: "error"; message: string };

// The math library behind dice simplification is still loading
export type PendingDiceSimplification = { kind: "pending" };

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
}

export interface GameApi {
  systems: { characters: CharacterSystem; customData: CustomDataSystem; trackers: TrackerSystem };
  systemsState: SystemsState;

  ui: {
    shape: {
      registerContextMenuEntry: (cb: MaybeRef<(shape: LocalId) => Section[]>) => () => void;
      registerTab: (
        tab: ShapeTab,
        filter?: MaybeRef<(shape: LocalId, hasEditAccess: boolean) => boolean>,
      ) => () => void;
    };
    modals: unknown;
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
