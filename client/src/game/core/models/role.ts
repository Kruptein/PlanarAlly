export enum Role {
    Player,
    DM,
    Spectator,
}

export function getRoles(): string[] {
    return ["Player", "DM"];
}
