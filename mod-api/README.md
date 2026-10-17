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

### Dice

`api.dice` works with the same expressions the dice tool accepts, including custom data references like `{str}` or `{srd-5.1:/skills/investigation}`.
References without a `[localId]` resolve against `options.shape`, or the focused shape when no shape is given.

- `simplify(expression, shape)` / `useSimplified(expression, shape)` resolve references and math without rolling, e.g. to show "+5" next to a skill.
- `roll(expression, options?)` rolls as the current player, exactly like the dice tool, without opening or activating it.
  The roll is shared, added to the dice history and shown to the player in a toast that opens the full result when clicked.
- `prefill(expression, options?)` opens the dice tool with the expression filled in, so the player can adjust it before rolling.

```ts
async function rollInvestigation(api: GameApi, shape: LocalId): Promise<void> {
    try {
        const outcome = await api.dice.roll("1d20 + {investigation}", { shape, label: "Investigation check" });
        console.log(outcome.total, outcome.expression, outcome.parts);
    } catch (error) {
        // The player already saw a toast with the problem, pass `silent: true` to handle it yourself
    }
}
```

`roll` options:

| Option      | Default                       | Description                                                            |
| ----------- | ----------------------------- | ---------------------------------------------------------------------- |
| `shape`     | focused shape                 | Shape that unqualified references resolve against                      |
| `label`     | the expression                | Shown in the dice history and to other players instead of the input    |
| `shareWith` | player's dice tool setting    | `"all"`, `"dm"` or `"none"`                                            |
| `use3d`     | player's dice tool setting    | Rolls 2D dice if the 3D environment can't be loaded                    |
| `silent`    | `false`                       | Don't show a toast when the roll fails                                 |

The returned `DiceRollOutcome` is plain data: the `total`, the `expression` that was rolled after resolving references and math, and the individual `parts` including every die result.
The re-roll button in the dice history uses the original expression, not the label.

`roll` and `prefill` reject with a `DiceRollError` (`error.name === "DiceRollError"`) when a reference can't be resolved, the expression is invalid or dice are disabled in the room; `error.reason` tells these apart and `error.message` is meant for the player.

## Vite config

This is a special separate export that can be used to configure a mod's Vite config out of the box.
It's main benefit is that it will setup a bunch of things if you're interested in HMR and running your mods in dev mode.
For regular production builds/uses this is not necessary.

A `modOptions` function is exported that can be used in a vite config.

When you run your mod in dev mode, this package will write a `vite-dev.json` file beside `mod.toml` while the server is running.
This is not to be checked into source control, it contains metadata that is only relevant to the PA dev server.

PA ensures mods can interact with the main Vue instance, by sideloading Vue as a global. It's essential that all mods use the same Vue instance.