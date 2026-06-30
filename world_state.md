# world state format

If savegames are going to be implemented then there needs to be some way to store state in a serialized format. This document is the planning for the schema for that format.

I'm going to be basing this all off of basic JSON, since if I base this off of mutative.js, i can just send JSON packets back and forth too.

A lot of this is based on the stuff I've already made in [src/DataPackFormat.ts](./src/DataPackFormat.ts) but kind of twisted to make it simpler to serialize I guess.

## Entire World State

```text
game ID: url to datapack for game
mods: [list of mod URLs]
players: map of { peer ID to Entity ID }
chunks: list of chunks (containing tile and entity state) - synced
```

* What the main datapack is. (This is to prevent someone playing vanilla Aelith from trying to connect to a friend who has an alternative game datapack installed.)
* What mods are installed. (The mods will each declare in their manifests whether they're required to be installed on both sides or not.)
* What the player entity/ies IDs are for each client. (there will of course only be one in singleplayer mode and it will only be able to load one to begin with)

### A chunk

```js
- entity list and locations
- tile table
- biome table
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
}
```

The entity objects also manage loading and unloading their Nova game objects, and pulling in position and collision events from Nova's physics. The entity has a loaded flag stored in the map that is always false in the serialized state and whenever it gets loaded it sets the flag to true, to tell other clients that the entity is loaded and they should pull changes rather than push to them.

#### Entity animation data

Even less sure about this. Since entities can be made of many objects and can continue animating in the background when the actual KAPLAY objects don't exist, the animation state will have to be stored externally.

### Hook threads

In general the first client to load an entity gets to run that entity's hook code, the only downside is if in the weird chance that 2 clients load the same entity at the same time and the load status packets get crossed then there'll be a race condition. I don't know how to detect this, but there will then be some way for the conflict to be resolved and all but one to determine they should "back off" simulating that entity and only watch the data for updates and push them to KAPLAY.

Need to investigate how Minecraft handles simulating entities on both the client and the server and mimic that.

## Loading process

Naturally the Y.Doc won't have pointers to the data-pack-defined things. This is why things use strings as identifiers using the same sort of `namespace:path/name` format that Minecraft uses. The actual scoping and stuff is arbitrary and only for consistency and clarity -- if there's no namespace specified, no default namespace is added. Random UUIDs would work just as well.

### Data flow process

#### Game boot

1. download mods or load from localstorage/disk
2. determine current mod set from localstorage
3. register globals stuff like configs
4. set up UI theme and title screen banner object

#### open select world screen

1. load savefiles available from disk, indexeddb, localstorage, etc.
2. if none are available, immediately prompt for a save name

### mod loading

1. resolve dependencies and paths that each mod touches, if any missing deps then complain, then load mods and report any errors
    1. if missing mod is known for its download location, auto-download it after confirmation
