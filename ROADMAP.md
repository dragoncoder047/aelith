
## TODO

* [ ] Type up lore document
* [ ] Change continuation objects to frog-like things instead of just spinny circles
* [ ] Change level cutscene transition shader to use a glitch effect rather than fuzzy fadeout (or maybe combination of both)
* [ ] Change call/cc controls to not have simple radius, you click on objects to select or deselect them
  * [ ] Need to choose controls for this
    * [ ] something like Minecraft generalized controls?
      * when empty: pick up item
      * when have item: use item or throw item
    * [ ] special kind of line to show what it is about to capture
      * zoop circle will start at the middle radius
      * [ ] maybe have all the other cont trap types do this too (lines graphics)
* [ ] integrate suave's lit shaders
  * glowing lights go on lights (duh), continuation traps, continuations, continuation world markers, etc.
* [ ] add 2.5D sprite stacking
  * [ ] this might need the drawon component, will need to figure out how to use that
* [ ] debug menu via pause menu for magic functions
* [ ] make pause menu work with mouse, need text quad character detection for this
* [ ] Add indication when button is being pressed in control hints (for streams and stuff...)
* [ ] Make flash trail that shows activation of things follow the data wires
* [ ] Fix bug where horn / tail doesn't teleport to the player and gets extremely stretched.
* [ ] Make NEW vacuum object, like a grabber
* [ ] Add more challenges that test all features of call/cc.
  * [ ] Use firewall somewhere else
* [X] Finish writing man pages for all the types of continuations
  * [ ] Do translations
* [ ] Add algorithmic choosing songs based on where you are in the game. Currently just random & uniformly weighted -- make it choose randomly but influenced based on position
  * [ ] Fix the not auto looping onEnd getting dropped for music (probably Kaplay bug)
* [ ] Add autosave (last checkpoint) and option to restore when webpage is reloaded
  * [ ] How to refer to objects in-memory in serialized form?
    * [ ] Ones that don't exist, when savegame is loaded initially at start?
  * [ ] OR - Add warning about there being no autosave
* [ ] Add achievements for stuff? (Collecting continuations, creating continuations, cloning boxes, etc?)
  * [ ] Connect to Newgrounds for cloud save and medals?

## DONE

* [X] Split into levels to reduce lag
  * [X] Make MParser not depend on the world pointer object
  * [X] Create a WorldManager singleton.
  * [X] Use build script to pull in text maps to JSON file.
  * [X] When player picks up object, make it a child of the player.
  * [X] When player drops object, make it a child of the active level.
    * [X] Need setParent for this, if it is working
* [X] Fix bugs where horn disappears when invoking continuation
* [X] Add a sprite for the crossover component.
* [X] Add a preference to only show the lore cutscene every time or the first time.
* [X] Add a stats counter in pause menu (boxes cloned, continuations invoked, bugs stomped, levers switched, lightbulbs illuminated)
* [X] Make call/cc be able to be remotely driven when holding promise
* [X] Add background pipes block art
* [X] Make fans calculate the wind automatically rather than just fixed wind tunnel object
* [X] Add lines of particles between linked objects when they change state
  * Like what happens when you hit a creaking in minecraft and the particles show which tree has its creaking heart.
* [X] Add splashes of particles for stuff
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

## Other ideas

* Make an animation toolkit where the players' movement is disconnected from the input, and can be animated for like cutscenes and stuff
* add lasers, mirrors, and laser detectors
  * need a computer analogy name for it
* add a sandbox mode at the end called the "assembler"
  * need a way for player to edit the world and change links
  * using a special continuation gun thing?
