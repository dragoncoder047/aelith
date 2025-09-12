
## TODO

* [ ] Type up lore document
* [ ] Make the loading screen more fun
* [ ] Memory boxes contain some bits of Scheme code and small comments, or are entirely text
  * [ ] Add Scheme syntax highlighter
  * [ ] User must 'open' the box to get the program if it contains one, and then 'run' it using a standalone computer terminal
    * [ ] Need to add 'computer terminals' player can interact with to get the continuation trap rather than just picking it up.
  * [ ] Add "program" item that looks like a flash drive and can't be dropped, but can be used on computer terminals
  * [ ] Add "mainframe" big things that the player must turn on via a switch and then read their memory to be able to go to the next level
* [ ] Change the continuation traps' definitions to be built using 'feature flags' `concurrent`, `global`, `radius 4`, `defer stay`, `edit`, `kill type`; `recapture`, `where invoked`, `tp catcher`, `fuzz`, `killer`, `immortal`, `die`, the player gets these flags to be able to put them in call/cc from the programs they use to get the other traps
* [ ] Make the setjmp and throw traps interfere with each other (capturing one kills the other's continuation) so the player can't use setjmp+throw together to cheese the bf1/bf2 swapping without using yield.
* [ ] Make the bugs aggro'ed at the continuation frogs and run towards them (and the player if they are holding one)
  * [ ] Make continuations auto-invoke when they are hit by a bug?
    * [ ] Need to add a new flag to continuations to determine whether they teleport the entity that captured (all others), the entity that invoked or nobody (flag on call/cc).
* [ ] Make the bugs never get angry at the player if they don't have a continuation in their inventory
* [ ] Make the portals look like a 2nd kind of door instead of rainbow, and also teleport when the player knocks on it
  * [ ] Make the normal portal type that triggers the transition shader only when colliding, invisible (for like falling down to the bottom; the bottom can be a separate room)
* [ ] Add background manager (that uses parallax scrolling) for different room types
  * [ ] Have a way for the level to designate the tileset (which tiles to use for walls, ladders, gratings, and vines/wires) and have the tiles or MParser look at this
    * [ ] perhaps use folders?
* [ ] Port all 9 of that_dos_server's songs to zzfxm
    `Co-authored-by: that_dos_server <ihatebluescreens@proton.me>`
* [ ] Make the lore popups in-game be from a floating computer AI thingy "NIC" rather than just floating text
  * [ ] The player can interact with them to show the latest text
    * [ ] Add dddddddd sound when the words come out
    * [ ] Add Inform-like random text choosing for snarky comments
  * [ ] follow the player around like a minecraft dog or something
  * [ ] Dialog system includes direction tags
    * [ ] `<anim:foo>` to cause NIC to play an animation
    * [ ] `<lookat:tag>` to make NIC go to and look at a particular thing (like note blocks to allays in Minecraft)
    * [ ] `<do:action>` to perform an action on the item (like action1, target1, etc)
      * [ ] Rework the actions system to make the actions take an actor parameter to differentiate between NIC and the player performing the action (so like for grabbing, it can give the item to NIC instead of the player)
      * [ ] Add `actor()` component to facilitate this, which manages inventory, motion, and model (bones and stuff, loaded from JSON)
    * [ ] `<drop_item>` to cause NIC to drop the item so the player can grab it
    * [ ] `<splash:n:colors>` to drop a splash of particles,
    * [ ] `<think:time>` to display a '...' thinking animation
    * (& anything else expressive)?
* [ ] remove the rainbow special control thing on items, only have NIC use them
  * [ ] make the links for all of the same class of things that would show the same manpage, use the same specials bits
  * [ ] add more random text stuff
* [ ] Fix typewriter code to use [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) to split the text (so it works with Japanese which doesn't use any spaces)
* [ ] make the player sprite have hands that come around and hold the thing that they are grabbing
* [ ] Once MF adds CCD kinematic constraints, make the arms and legs using bones instead of spritesheet animation (smaller spritesheet etc & more expressive animations defined in code vs anim).
  * [ ] would prefer to wait on cached physics too
  * [ ] Hands can be in their own layer, on top of grabbing but below wires
* [ ] Make the spaceship sprite be like a vehicle the player can get in
  * [ ] separate the player
* [ ] integrate suave's lit shaders
  * glowing lights go on lights (duh), continuation traps, continuations, continuation world markers, etc.
* [ ] Make pause menu NOT a terminal since aesthetic is changing away from that
* [ ] Make pause menu work with mouse, need text quad character detection for this
* [ ] Make flash trail that shows activation of things follow the data wires
* [ ] Fix bug where horn / tail doesn't teleport to the player and gets extremely stretched.
* [ ] Make NEW vacuum object, like a grabber
* [ ] Add more challenges that test all features of call/cc.
  * [ ] Use firewall somewhere else
* [X] Finish writing man pages for all the types of continuations
  * [ ] Do translations
* [ ] Add algorithmic choosing songs based on where you are in the game. Currently just random & uniformly weighted -- make it choose randomly but influenced based on position
  * [ ] Fix the not auto looping onEnd getting dropped for music (probably Kaplay bug)
  * [ ] Could also have the songs for each biome be the different genres. Core Aelith be my conventional meter songs, surface be tds's slower songs, and the caves be the weird odd time signature songs
* [ ] Add static level baking using the build script (MParser runs at build time and produces JSON imported using a onLoad plugin, savefiles are then deltas to transform this master state into the saved state)
  * [ ] For large collider instances, make them `{ kind: whatever, instances: [x,y,w,h][] }` in tiles from 0,0
  * [ ] Use build script to roll all of the data into one giant JSON file using dataURLs for the images in the JSON
* [ ] Make the Windows crash screen at the end use the newer QR code format and link to a secret page with the epilogue? (Using <https://www.npmjs.com/package/qr.js> to not have to create a texture for the image)
* [ ] Add autosave (last checkpoint) and option to restore when webpage is reloaded
  * [ ] How to refer to objects in-memory in serialized form?
    * [ ] Ones that don't exist, when savegame is loaded initially at start?
  * [ ] OR - Add warning about there being no autosave
* [ ] Add achievements for stuff? (Collecting continuations, creating continuations, cloning boxes, etc?)
  * [ ] Connect to Newgrounds for cloud save and medals?

## DONE

* [X] add 2.5D sprite stacking
  * [X] add pause menu control that can enable/disable the shader for lag reasons
* [X] debug menu via pause menu for magic functions
* [X] Add indication when button is being pressed in control hints (for streams and stuff...)
* [X] Change call/cc controls to not have simple radius, you click on objects to select or deselect them
  * [X] special kind of line to show what it is about to capture
* [X] add wibbly line graphics to the continuations
  * [X] worb sound effect when objects are selected and unselected
* [X] Change level cutscene transition shader to use a glitch effect rather than fuzzy fadeout
* [X] Fix bugs with the ambientSound component that is causing the lag
* [X] Change continuation objects to frog-like things instead of just spinny circles
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
