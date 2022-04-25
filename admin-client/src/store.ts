import { reactive, readonly } from "vue";

interface store {
    access_token: string | undefined;
}

const _state = reactive<store>({
    access_token: undefined,
});

export const state = readonly(_state);

export function set_access_token(token: string): void {
    _state.access_token = token;
}
