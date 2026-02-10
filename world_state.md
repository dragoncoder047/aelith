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

#### Entity animation data

Even less sure about this. Since entities can be made of many objects and can continue animating in the background when the actual KAPLAY objects don't exist, the animation state will have to be stored externally.

### Hook thread state

Serializing the state will be super easy once I change the execution to a stack-based VM and scheduler. Resolving the conflicts over who runs which thread in a multiplayer setting I'm going to put off for later...
