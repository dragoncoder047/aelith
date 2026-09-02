# stuff

## world layout

* Player is 64x128px
* NIC is 32x32
* World tiles are 8x8
* organized into 32x32 tile chunks

## idk what

* the vurbilizer has these options when using it:
    1. trigger / "fire" it (capture the vurble spore)
    2. configure it (like opening a chest in minecraft) to change radius, enable/disable/install new components
    3. (if component #8 installed) select/deselect objects to capture

* things like the elevator or keypad for something open up a submenu (like talking to npc's or hacking in warframe)
    * for elevator, select floor
    * for keypads/lift robots - up/down or stuff

* simple things have a single action which is automatically selected when triggered (levers, elevator call buttons, placing/picking up items, opening/closing doors, activating remote vurbilizer trigger)

* when the player tries to pull a lever or something that the player can't reach but NIC can, NIC will try to go and activate it themselves, but some switches are security locked and can only be switched by the player directly

## controls

sorta be a mix between Minecraft and Warframe?

| gamepad control | action in Minecraft (Controlify) | minecraft keybind for action | action in Warframe | warframe keybind for action |
| --- | --- | --- | --- | --- |
| left stick move | move around | wasd | move around | wasd |
| left stick press | toggle sprint | ww/control | toggle sprint | shift |
| right stick move | move camera | mouse | move camera | mouse |
| right stick press | sneak | shift | ~~alternate melee attack~~ | v/ctrl |
| south | jump | space | jump | space |
| east | | | ~~melee attack~~ | e |
| west | swap offhand | f | ~~reload~~ / interact | r / x |
| north | open inventory | e | ~~switch weapon~~ | f |
| lshoulder | switch inventory slot | scroll/number keys | crouch/roll/slide | scroll |
| rshoulder | switch inventory slot | scroll/number keys | ability menu (hold) | scroll |
| ltrigger | place block / use item | right click | ~~aim zoom~~ | right click |
| rtrigger | ~~attack~~ | left click | ~~fire weapon~~ | left click |
| dpad down | drop item | q | open gear wheel | q |
| dpad up | open chat | t | place/remove waypoint | g |
| dpad left | pick-block | 0 | ~~select ability~~ | scroll/1/2/3/4 |
| dpad right | radial menu (hold) | n/a | ~~select ability~~ | scroll/1/2/3/4 |
| back/share | switch perspective | F5 | ~~open map~~ | m |
| select/options | pause menu | esc | pause menu | esc |

* needed actions:
    * TODO

## vurble stuff

* the vurble spores are small biological blobs of energy that squish around if the player is not holding them
* use a softbody from kaplay once that is added

* vurbilizer must be near slime mold on the walls or floor to spawn a vurble spore
* vurble spore must be near slime mold to be able to activate

* the slime on the walls can be rendered with blurred circles follwing a cellular automata rule done with lifeweb
* when a spore is captured, the vurbilizer chooses a number of random slime cells around it and deletes them from the CA sim and visually pulls them in to create the spore
* when the spore is activated, it splatters cells out that add to the sim
