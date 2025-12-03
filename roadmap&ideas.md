# to do

* add "display entities" which are not tracked in the entity system but still run hooks for e.g. rendering and stuff
    * allow these as rendering decorations in the rooms
    * make the title screen image out of this - sprite primitive + particles child, then a 3 channel animation on the sprite to match the existing waves
        * add code to allow the vector math manipulation in the functionscript
        * add code to access `getGamepadAnalogButton()` for title screen easter egg & other uses in-game
        * add code for hooks when the player is pressing *AND* releasing the action buttons (for like elevator control buttons)
    * this is how the inventory menu screen should work as well
        * true entities have a hook that gets run when they're being rendered in a display entity
* add random ticks functionality
* make cropticks slice9 for focus outline instead of just changing color
    * use it
    * do it as an entity?
        * follow cursor animation etc.
        * blinking
* change motion to be using force & velocity (would make sticky platforms better)
* finish legs
    * animate zug legs using this too
    * give the lil cuties antennae!
    * add "line from here to pos on other body" primitive
* need a way for objects to continue moving through unloaded rooms by utilizing nav mesh
    * "bully" cellular automata?
* remove "continue" action and have NIC advance text based on timer, as text that can't be repeated by interacting with an object, shouldn't be important.
    * it's now under action6 but need to put the "continue" code in a hookable method of Entity
* implement all of the settings stuff even if music manager is not fully implemented
* add way for entity to define its main hitbox as a platform effector or sensor
* remove "doors" section from room definition as I can just use entities for that
    * define check order when player presses action button
        1. try item currently holding
        2. try item looking at
        3. try item intersecting with (like door)
    * need for a way to be fallback and invoke the hook and stop if the hook exists else continue
        * something like Lisp's `(multiple-value-bind)` or similar on the startHook command
* add kiwi's depth component for entities that are set back in depth, but modified to allow it to turn off with the setting
    * use this for background
    * add a config value for the amount of depth
* implement nav mesh generation from world tiles
    * allow entities to navigate and move silently in the background when unloaded and then come to current room and be loaded
* NEED TO GET HOOK/RENDER/ANIM INHERITANCE WORKING
    * "super" command to run hook form "parent" prototype(s)
* make item pick-up be like minecraft (you get close & it automatically picks up; NIC and the player can exchange grabbable items by throwing them back and forth)
* have way to request NIC do stuff
    * lift player up out of sinkhole if they fall in and can't climb out
* add animations on discrete quantities (such as booleans and frame numbers)
* "hidden" settings entries so that options for how to interact with the items won't show up until the player has the item
* determine where to add haptic effects
* swimming
* tabbed settings menu
    * use unused spinner sfx for tab switch
    * L1/R1 buttons to switch tabs
* serialization
* lighting stuff
* get deltarune prophecy shader for hologram things <https://godotshaders.com/shader/deltarune-the-prophecy-panel-shader/>
* JUICE!! (Consult Amy on this.)
* possibly add more parkour stuff like ledge grab, wall jump, and double jump

## to draw

* separate downlight in aelith tileset into its own sprite and remove the baked glow effect (replace with an actual shader light)

* player spaceship - crashed and fixed variants
* doors to enter / exit the Aelith
* mainframe computer
* 9-track tape
* NIC's arm
* MORE

## sounds to get or make

* repeating drone noise for NIC movement
* same for spaceship movement
* 3D printer done beep
* Elevator running
* MORE
