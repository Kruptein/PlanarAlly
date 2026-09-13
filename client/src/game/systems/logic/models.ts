export const DEFAULT_PERMISSIONS: () => Permissions = () => ({
    enabled: [],
    request: [],
    disabled: ["default"],
});
export type LOGIC_TYPES = "door" | "tp";

export enum Access {
    Enabled,
    Request,
    Disabled,
}

export interface Permissions {
    enabled: string[];
    request: string[];
    disabled: string[];
}
