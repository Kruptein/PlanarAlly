import { initiativeState } from "./state";

const { mutableReactive: $ } = initiativeState;

export function openInitiativeDialog(manuallyOpened: boolean): void {
    $.showInitiative = true;
    $.manuallyOpened = manuallyOpened;
}

export function closeInitiativeDialog(): void {
    $.showInitiative = false;
    $.manuallyOpened = false;
}
