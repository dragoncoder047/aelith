# world state format

If savegames are going to be implemented then there needs to be some way to store state in a serialized format. This document is the planning for the schema for that format.

I'm going to be basing this all off of a Y.js document concept, since if I implement it using a `Y.Doc`, then multiplayer is trivial, since Y.js is designed for realtime collaborative editing.

Y.js only has three basic data types: lists, maps, and text strings. There's also XML but there isn't anything in XML that can't also be done with plain lists, maps, and strings. The container types can also store arbitrary JSON but updates to them must be all at once (since Y.js can't install mutation observers on bare JS objects, even with an ES6 `Proxy`).

A lot of this is based on the stuff I've already made in [src/DataPackFormat.ts](./src/DataPackFormat.ts) but kind of twisted to make it simpler to serialize I guess.

## Entire World State

```js
Map {
    main datapack URL
    list of mods
    players --> Map { Y.js peer ID --> Entity ID }
    list of rooms
    list of entities
}
```

* What the main datapack is. (This is to prevent someone playing vanilla Aelith from trying to connect to a friend who has an alternative game datapack installed.)
* What mods are installed. (The mods will each declare in their manifests whether they're required to be installed on both sides or not.)
* What the player entity/ies IDs are for each client. (there will of course only be one in singleplayer mode and it will only be able to load one to begin with)

### A room

```js
Map {
    room theme // statically defined by the datapack and also mods
    tilemap data // this is to allow potential world-editing tools
    current gravity // is this even necessary
}
```

### Tilemap data

Not sure how to do this. The datapack's initial state will certainly be very different to facilitate easy hand-editing of it. It will have to handle:

* Tiles that contain nothing
* Tiles that contain a tile from the room theme
* Tiles that contain a display entity
* Tiles that contain multiple things

### An entity

```js
Map {
    ID
    species/kind
    behavior-defined state (as a map)
    position
    animation data
    inventory data
    state of hook threads
}
```

The entity objects also manage loading and unloading their KAPLAY game objects, and pulling in position and collision events from KAPLAY's physics. The entity has a loaded flag stored in the Y.Map that is always false in the serialized state and whenever it gets loaded it sets the flag to true, to tell other clients that the entity is loaded and they should pull changes rather than push to them.

#### Entity animation data

Even less sure about this. Since entities can be made of many objects and can continue animating in the background when the actual KAPLAY objects don't exist, the animation state will have to be stored externally.

### Hook thread state

Serializing the state will be super easy once I change the execution to a stack-based VM and scheduler. In general the first client to load an entity gets to run that entity's hook code, the only downside is if in the weird chance that 2 clients load the same entity at the same time and the load status packets get crossed then there'll be a race condition. I don't know how to detect this, but there will then be some way for the conflict to be resolved and all but one to determine they should "back off" simulating that entity and only watch the Y.Map for updates and push them to KAPLAY.

## Loading process

Naturally the Y.Doc won't have pointers to the data-pack-defined things. This is why things use strings as identifiers using the same sort of `namespace:path/name` format that Minecraft uses. The actual scoping and stuff is arbitrary and only for consistency and clarity -- if there's no namespace specified, no default namespace is added. Random UUIDs would work just as well.

### Data flow process

#### Game boot

1. gather game candidates
2. download mods
3. register globals stuff like configs
4. determine last used mod set and set up UI theme and title screen banner object

#### World entry

1. load savefiles available from yjs's persistence provider
2. if none are available, immediately prompt for a save name and a modset to use
3. resolve dependencies and paths that each mod touches, if any missing deps then complain, then load mods and report any errors
4. for a new world, create it from the datapack's template generation and optional world seed
5. for an existing world, just load it
