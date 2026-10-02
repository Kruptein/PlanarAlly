# @planarally/mod-api

Public types for a PlanarAlly mod. The host passes a `GameApi` into `events.initGame` and calls `events.dispose` before unloading a mod.

A mod module exports `events`:

```ts
import type { ModEvents } from "@planarally/mod-api";

export const events: ModEvents = {
    async initGame(api) {},
    async dispose() {},
};
```

`dispose` should drop watches, timers, and other resources the mod created. Registrations made through `registerTab`, `registerContextMenuEntry`, `eventBus.on` / `once`, and `hooks.tap` are also removed by the host after `dispose` returns.

`getModUrl(meta)` is the base path for files shipped inside the mod. In dev mode that path is `/static/mods-dev/<tag>` and the server sends `Cache-Control: no-store`.
