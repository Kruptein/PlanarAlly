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
