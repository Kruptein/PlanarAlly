// oxlint-disable-next-line import/no-unassigned-import
import "vue-router";
import { AdminSection } from "../admin/types";

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};

declare module "vue-router" {
    interface RouteMeta {
        auth?: boolean;
        adminSection?: AdminSection;
    }
}
