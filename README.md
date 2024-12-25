# debugger

A puzzle platformer game.

-----------DEVELOPING STARTUP---------

1. make sure you have pnpm installed
2. `cd` to this directory
3. `pnpm install`
4. `pnpm dev`
5. open <http://localhost:8000>
6. if you get a white screen of death check browser console for errors:
    * "assignment to readonly property" from kaplay.ts &rarr; use Chrome not Safari (see kaplayjs/kaplay#289)
    * "xxx is only available in secure origins" &rarr; go to chrome://flags/#unsafely-treat-insecure-origin-as-secure and add <http://localhost:8000>

## Game premise

Something went wrong in the computer system, and a debugger has been sent in to fix the horribly convoluted and illogical program that runs it. Fighting bugs along the way, and finally defeating the final bug in the program

## Mechanics

* Player can only grab items, throw items, and "use" items
* Player can interact with machines when they are close enough to them.
* Throughout the gameplay, the player finds items that work as continuation traps
  * These items when "used" give the player a "continuation"
    * When the continuation is invoked, it teleports the player back to where they were when they captured the continuation, and resets the state of machines nearby
      * The player can use these to teleport
      * The resetting mechanic can be use to get machines in "glitched" states that is the only way to beat the level

### Types of continuation traps

* `throw` -- basic type; small radius, can only be invoked once; only saves player's position
* `setjmp` -- saves position and machine state in small radius, can only be used once
* `async` -- continuation trap can be thrown (down a pipe or some other place); then be captured remotely
* `yield` -- back-and-forth type; when invoked gives the player a continuation for where they invoked it from so they can go back
* `switch` -- reverse teleport type: teleports stuff to near you instead of teleporting you
* `call/cc` -- most powerful continuation trap; can be used infinite number of times and has a controllable radius of effect
* `assert` -- not an obtainable continuation trap, functions as a checkpoint that the player can use if they die (TODO: When do they die??) or mess up

#### Machine types

* Controls
  * [X] Lever
  * [X] Button
  * [X] Laser / laser sensor "firewall"
* Effectors
  * [X] Doors
  * [X] Conveyor belts
  * [ ] Moving ladders
  * [ ] mirrors ??
  * [X] Lights (decorations)
* Block art
  * [ ] Generic box
  * [ ] Tower computer
  * [ ] Battery

## Other ideas

* [ ] Add pause menu option to reflect left stick left or right (Xbox controller seems to be reflected, PS5 isn't)
* [ ] Fix dynamic text so that it changes to gamepad first if only the stick is used first (possibly bug in Kaplay)
* [ ] Fix control hints overlapping with health bar
* [ ] Make gamepad type persistent in localStorage
* [ ] Add controls on call/cc to pop up a menu for editing the radius, changing the mode (throw or not), turn on or off autorecapture, etc.
* [X] Finish writing man pages for all the types of continuations
  * [ ] Do translations
* [X] Fix the async continuation to arm and capture separately, so you can use the same control to throw it while it is armed
  * [X] New sprite for trigger token `Promise`
* [ ] Revise gamepad controls for interacting
  * [ ] More like Minecraft controls?
* [X] New sprite for "target" and "holding" ends of continuation
* [ ] Use firewall somewhere else
* [ ] Add player head can turn to look at whatever is being looked at
* [X] Add algorithmic choosing songs based on where you are in the game
  * [ ] Currently just random 33%/33%/33% -- make it choose randomly but influenced based on position
  * [ ] Fix the not auto looping onEnd getting dropped (probably Kaplay bug)
* [X] Add enemy "bugs" that can hurt you?
  * [ ] ~~Final enemy boss?~~
  * [X] What happens when player dies?
    * They can respawn from a checkpoint
* [X] Add new continuation trap type: that instead of teleporting player back, teleports stuff to be near the player
* [X] Add settings menu for stuff like switching the type of controller button names, enabling/disabling rumble, etc
  * [ ] add rumble effects for game controller users?
* [ ] Add autosave (last checkpoint) and option to restore when webpage is reloaded
  * [ ] How to refer to objects in-memory in serialized form?
    * [ ] Ones that don't exist, when savegame is loaded initially at start?
* [ ] Add scores for stuff? (Collecting continuations, creating continuations, cloning boxes, etc?)
  * [ ] Connect to Newgrounds for cloud save and medals?
