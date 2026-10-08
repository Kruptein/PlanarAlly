import type { Component, DeepReadonly, MaybeRef, Reactive, Ref } from "vue";

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

export interface CompendiumEntry {
  id: string;
  name: string;
  kind: string;
  path?: string[];
  group?: Record<string, string>;
  aliases?: string[];
  body: string;
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

export interface CompendiumApi {
  register(entries: CompendiumEntry[], options?: CompendiumRegisterOptions): () => void;
}

export interface GameApi {
  systems: { characters: CharacterSystem; trackers: TrackerSystem };
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

export interface Mod {
  events?: ModEvents;
}
