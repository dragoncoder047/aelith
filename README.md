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

The AI system crashed, and a debugger is sent in to figure out why the AI crashed and fix it.

### Machine types

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

## TODO

* [ ] Fix bugs where horn disappears when invoking continuation
* [ ] Add final "CPU" for player to sacrifice all their continuation traps and get call/cc.
* [ ] Add more challenges that test all features of call/cc.
  * [ ] Use firewall somewhere else
* [X] Finish writing man pages for all the types of continuations
  * [ ] Do translations
* [X] Add algorithmic choosing songs based on where you are in the game
  * [ ] Currently just random 33%/33%/33% -- make it choose randomly but influenced based on position
  * [ ] Fix the not auto looping onEnd getting dropped (probably Kaplay bug)
* [ ] Add autosave (last checkpoint) and option to restore when webpage is reloaded
  * [ ] How to refer to objects in-memory in serialized form?
    * [ ] Ones that don't exist, when savegame is loaded initially at start?
  * [ ] OR - Add warning about there being no autosave
* [ ] Add scores for stuff? (Collecting continuations, creating continuations, cloning boxes, etc?)
  * [ ] Connect to Newgrounds for cloud save and medals?

## DONE

* [X] Fix bug where pause menu gets stuck behind other dialogs and can be opened while the other dialogs are active
  * Probably just a simple forEventGroup addition to fix
* [X] Make sounds different when walking on / falling on grating.
* [X] Add controls on call/cc to pop up a menu for editing the radius, changing the mode (throw or not), turn on or off autorecapture, etc.
* [X] Add warning if browser is Firefox and gamepad, or single Joy-Con
* [X] Fix player head lagging behind player body when moving
* [X] Add player head can turn to look at whatever is being looked at
  * [X] Add springy for the head hair/horn
* [X] Add settings menu for stuff like switching the type of controller button names, enabling/disabling rumble, etc
  * [X] add rumble effects for game controller users?
* [X] Add enemy "bugs" that can hurt you?
  * [ ] ~~Final enemy boss?~~
  * [X] What happens when player dies?
    * They can respawn from a checkpoint
* [X] Add new continuation trap type: that instead of teleporting player back, teleports stuff to be near the player
* [X] New sprite for "target" and "holding" ends of continuation
* [X] Fix the async continuation to arm and capture separately, so you can use the same control to throw it while it is armed
  * [X] New sprite for trigger token `Promise`
* [X] Revise gamepad controls for interacting
  * [X] More like Minecraft controls?
* [X] Fix control hints overlapping with health bar
* [X] Make gamepad type persistent in localStorage -- OR -- autodetect gamepad type
* [X] Fix the bug with stuff falling when player opens pause menu
