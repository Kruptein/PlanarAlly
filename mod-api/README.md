# @planarally/mod-api

This package exposes two different endpoints:
- Public types for a PA mod
- Vite config for a PA mod

## Public types / API

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

## Vite config

This is a special separate export that can be used to configure a mod's Vite config out of the box.
It's main benefit is that it will setup a bunch of things if you're interested in HMR and running your mods in dev mode.
For regular production builds/uses this is not necessary.

A `modOptions` function is exported that can be used in a vite config.

When you run your mod in dev mode, this package will write a `vite-dev.json` file beside `mod.toml` while the server is running.
This is not to be checked into source control, it contains metadata that is only relevant to the PA dev server.

PA ensures mods can interact with the main Vue instance, by sideloading Vue as a global. It's essential that all mods use the same Vue instance.