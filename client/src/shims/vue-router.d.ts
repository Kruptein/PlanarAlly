import "vue-router";
import { AdminSection } from "../admin/types";

export {};

declare module "vue-router" {
    interface RouteMeta {
        auth?: boolean;
        adminSection?: AdminSection;
    }
}
