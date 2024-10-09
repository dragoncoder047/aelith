# KONT

-----------DEVELOPING STARTUP---------

1. make sure you have pnpm installed
2. `cd` to this directory
3. `pnpm install`
4. `pnpm dev`
5. open <http://localhost:8000>
6. if you get a white screen of death check browser console for errors:
    * "assignment to readonly property" from kaplay.ts &rarr; use Chrome not Safari (see kaplayjs/kaplay#289)
    * "xxx is only available in secure origins" &rarr; go to chrome://flags/#unsafely-treat-insecure-origin-as-secure and add <http://localhost:8000>

## Dev notes follow

Game premise: you are a bug in a computer system, and a rogue AI program is messing with the computer's jobs. Using the power of continuations, you have to work your way up and down the programming language stack, beating increasingly hard challenges, until finally resetting the AI's memory into a stable state and averting total corruption.

* It is a platformer game
* Uses pixel art
* Use [kaplayjs](https://github.com/kaplayjs/kaplay) library
* Resources:
    * [map editor](https://stmn.github.io/ascii-map-editor/)
    * [ZzFX](https://killedbyapixel.github.io/ZzFX/)
    * [ZzFXM](https://keithclark.github.io/ZzFXM/)

## Mechanics

* Player can only grab items, throw items, and "use" items
  * --- HOW TO IMPLEMENT THIS IN KAPLAY?
* Player can interact with machines when they are close enough to them.
* Throughout the gameplay, the player finds items that work as continuation traps
  * These items when "used" give the player a "continuation"
    * When the continuation is invoked, it teleports the player back to where they were when they captured the continuation, and resets the state of machines nearby
      * The player can use these to teleport
      * The resetting mechanic can be use to get machines in "glitched" states that is the only way to beat the level

### Types of items generally

| Done? | Item type | Can be put in inventory / carried | Can be physically interacted with (click action) | Makes ambient sounds | Linked to form machine groups |
|:-----:|:---------:|:---------------------------------:|:------------------------------------------------:|:--------------------:|:-----------------------------:|
| | Continuation trap | Yes | | | |
| | Continuation | Yes | | Yes | |
| Yes | Lever | | Yes | Yes | Yes |
| Yes | Button | | Yes | Yes | Yes |
| | Laser break-beam | | | | Yes |
| | Door | | | Yes | Yes |
| Yes | Conveyor | | | Yes | Yes |
| | Moving ladder | | | | Yes |
| Yes | Fan | | | Yes | Yes |
| Yes | Light | | | | Yes |
| Yes | Box | Yes | Yes | | |
| | Decorations | | | | |

### Types of continuation traps

* `throw` -- basic type; small radius, can only be invoked once; only saves player's position
* `setjmp` -- saves position and machine state in small radius, can only be used once
* `async` -- continuation trap can be thrown (down a pipe or some other place); then be captured remotely
* `yield` -- back-and-forth type; when invoked gives the player a continuation for where they invoked it from so they can go back
* `call/cc` -- most powerful continuation trap; can be used infinite number of times and has a controllable radius of effect
* `assert` -- not an obtainable continuation trap, functions as a checkpoint that the player can use if they die

### Levels Mechanics Ideas

3 basic mechanics of continuations: used of teleporting yourself, glitching machines, and cloning objects

#### Machine types

* Controls
  * Lever
  * Button
  * Pressure plate
  * Laser / laser sensor
  * Proximity sensor
* Effectors
  * Doors (normal, trapdoors)
  * Conveyor belts
  * Moving ladders, mirrors
  * Lights (decorations)
* Block art
  * Generic box
  * Tower computer
  * Battery
  * Mirror

## TODO

* [ ] Implement grabbing and interaction controls
* [ ] Implement inventory UI - `fixed` component
  * [ ] More UI controls
* [ ] Get sounds
    * [ ] Jump: `zzfx(...[,,440,,,.2,,.5,5])`
    * [ ] Footsteps: `zzfx(...[,.5,120,,,.01,2])`
    * [ ] Climbing: `zzfx(...[,.5,1e3,,,.01,1,,,,,,,,,.1])`
    * [ ] Teleport: `zzfx(...[,0,440,,,.6,1,,,2e3,,,.05,,,,.005])`
    * [ ] Assert(true) / checkpoint: `zzfx(...[,0,1e3,,,.2,1,,,,290,.07,,,,,,,.1])`
    * [ ] Pick up: `zzfx(...[,,100,,,,4,2])`
    * [ ] Throw object: `zzfx(...[,,440,.05,,,,,,,,,,3])`
      * [X] Implement this
    * [ ] Switch on: `zzfx(...[,,630,,,.01,2,,,,,,,,,.1])`
    * [ ] Switch off: de-tuned down by 400 cents: `zzfx(...[,,500,,,.01,2,,,,,,,,,.1])`
* [ ] Make sprites and machines
  * [X] Finish climbing animation
  * [X] Wall and ladder tiles
  * [X] Button
  * [X] Switch
  * [X] Conveyor
  * [ ] Door
  * [ ] Laser
  * [ ] Decoration tiles
  * [ ] Machine tiles
  * [ ] Continuations
  * [ ] Checkpoints
  * [X] Cursor
* [ ] Design world
  * [X] Method for notating which things are linked
* [ ] Add continuation mechanics
  * [ ] `player.query` function is powerful here!
* [ ] Add machines to be glitched/interacted with

<!-- cSpell: ignore kaplay kaplayjs kont setjmp zzfx -->
