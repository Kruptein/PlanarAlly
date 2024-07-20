# PlanarAlly Systems

_note: Component here does not refer to a Vue Component_

The systems in this folder are loosely based on the ECS (Entity Component System) paradigm.
A complete switch to ECS would be too drastic, so we're doing it in smaller steps.

Just like in ECS, PA has the notion of a unique idea similar to an `Entity`.
In PA there is a unique local and global id. The former being a number, the latter being a uuid.
These ids are hardtyped with a brand to prevent wrong use.
For more info on id stuff check `src/game/id`.

Furthermore in an ECS not all data pertaining to a certain entity is stored in one location.
Rather it is stored in separate components that have a certain common functionality. (e.g. a Position component would contain data related to the position of an object, but not which colour it has)
These components are then used by systems which contain behaviour and act on a certain set of components and are called on a loop.

In PA this concept is a bit more vague.

A PA system stores data for all entities that have the particular data, this is very similar to a Component in ECS (1).
It does however also have some functions, mostly to set the state for certain entities as well as updating UI and network related to that state.
For example: A network request arrives to make Entity X a door, this is passed to the door system, who adds Entity X to its set of entities and checks if the UI (2) currently has door info open for entity X and updates that if that is the case.

The ECS system logic is the primary concept that is not well defined in PA at this moment.
Instead the actual behaviour is placed there where it is needed.
For example: when you click on a door in select mode, the select tool who handles all mouse input at that moment, will call the door system for information and then run the behaviour that should happen when a door is clicked.

(1) The name `system` is possibly confusing here, but `component` has a naming conflict with vue components. Another name might be used in the future.
(2) This is handled with vue reactivity, so it doesn't really actively check the UI, but just updates a reactive object

## State

Most systems have their own state in a `state.ts` file.

Two types of state are commonly provided:

-   reactive state
-   non-reactive state

Non-reactive state usually contains all the data for all the entities the system manages, it can be accessed in two ways:

-   `state.readonly`: A readonly view on the data
-   `state.mutable`: A direct reference to the data allowing you to mutate it

Generally only the system itself should mutate the state, whereas other files may freely access the readonly state.
This is currently not hard enforced, but a best practice.

Reactive state on the other hand is almost exlusively used to handle UI updates.
As there are often a lot of shapes in a game, PA does not want to keep reactive info for all shapes loaded all the time.
Changes to shapes that don't have their UI open are not interesting to track reactively,
nor is the overhead of reactive references for shapes that are not interacted with after creation (e.g. walls).

This means that a common thing systems do is to load reactive data from the non-reactive state temporarily while a shape is selected.
Reactive state can be interacted with on 3 levels:

-   `state.reactive`: A readonly view on the reactive data
-   `state.mutableReactive`: mutable access
-   `state.raw`: This skips the reactive proxy and gives immediate mutable access to the data directly

The last access level is used for small performance tweaks were we know that just the last data is all we need,
this is common in render code, but can also be encountered in other places.

A common system update will look something like this:

```typescript
setSomeProperty(id: LocalId, property: boolean, sync: boolean): void {
    const data = mutable.data.get(id);
    if (data === undefined) return;

    // Update non-reactive data
    data.property = property;

    if (sync) {
        // update server
    }

    // Update reactive data if the shape is currently loaded
    if ($.id === id) $.property = property;
}
```

If in the above example `property` was a more complex shape and the reactive state is set to just have a reference to the non-reactive state,
we would miss a reactive update in our UI components, as by the time the reactive update happens, vue will see that property is already set to that value (by the earlier non-reactive update) and thus not bother with triggering watchers.

So the lesson here is either ensure that the reactive data is a copy of the non-reactive data or that you make sure you update reactive state first!
