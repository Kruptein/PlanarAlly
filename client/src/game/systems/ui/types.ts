import type { Component } from "vue";

export interface PanelTab {
    id: string;
    label: string;
    component: Component;
}
