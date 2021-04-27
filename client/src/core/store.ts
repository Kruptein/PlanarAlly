import { DeepReadonly, reactive, readonly } from "vue";

// eslint-disable-next-line @typescript-eslint/ban-types
export abstract class Store<T extends object> {
    protected _state: T;
    state: DeepReadonly<T>;

    constructor() {
        this._state = reactive(this.data()) as T;
        this.state = readonly(this._state) as DeepReadonly<T>;
    }

    protected abstract data(): T;
}
