## World map

* TODO: finish puzzle to get ed tape

```text
                             [radio tower]              START
                                   |                      |
[sinkhole w/stream]--------[aelith entrance]--------[crash site]-------[solar tank]
   |    \                          |                                           \
   |     \                         |                   [executive office]       \
   |      \                        |                  /                          \
   |       [loading dock]-------[lobby]---[front desk]-----[conference room]      \
   |                               |                                               \
   |                      .----[stock room]---[psych lab]    .-----------------.    |
   |                     /         |                  \     /                   \   |
   |      [engineering lab]---[machine shop]--------[bio lab]---[supply closet]  |  |
   |      /                        |        \        /       \                  /  /
   |     /                         |         [physics lab]    [chem lab]       /  /
   |    /                          |                                          /  /
   |   /       [robotics lab]      |                    .--------------------'  /
   |  |          |           \     |                   /                       /
   |  |  [server room]--------[basement]----------[boiler room]               /
   |  |             |                                                        /
   |   \            |                                                       /
   |    \           |                                  .-----------[zug burrow]
   |     |           \                                /
   |     |            \         [voranium flower cave]
[waterfall cave]       |       /
                \      |      /
               [trash dump cave]
```

## general dependency flow of challenges

* open Aelith door (no tools)
* get into elevator (component #0 only)
* find blueprints for components #1-#3
* find projector and tape reader
* install these in NIC to read the tapes
* get components #1-#3 built using shop printer
* get component #4 using physics lab press machine (requires components #2 and #3)
* get antimatter battery fluid using chemistry (requires components #1-#4)
* make an antimatter battery using it in machine shop
* get component #5 from engineering lab (requires components #1-#4 and an antimatter
  battery)
* get components #6-#8 from psych lab (requires component #5 and partway through
  component #6)
* put nodules in tank to get warp compressor materials (requires component #7)
* use component #8 to unlock ed program to mash tapes
* mash tapes together to create tape for component #9
* open locked door to Zylox's office and obtain the hyperwave relay (requires
  component #9)
* fix spaceship & leave

### crash site

* player lands here.
* mostly flat with a few boulders, and the player's wrecked spaceship. They can poke around
  the spaceship but that's about it.

### solar tank

* large thermal generator that zugs managed to break into and swim around in.
* there is a breaker panel to enable the generator that must be turned on
* thermal fluid is being heated up by sun and zugs like the warmth so that's why they
  broke in
* the thermal fluid is needed to be flooded down into the zug burrow below and through
  into the voranium flower cave
* trying to activate a vurble spore inside of the solar tank causes it to explode and
  not work because of the heat
* however spores can still be captured in here

### sinkhole w/stream

* pit goes down to caves, rope back up

### aelith entrance

* large towering monlith with blast door locked by powered-down keypad
* landing pads nearby
* player must climb radio tower and turn mirrors to direct sunlight to the solar tank
* sequence to get in:
    1. player goes to solar tank and turns on breaker.
    2. player goes to radio tower and cranks emergency generator.
    3. using that power, the player sends movement commands to a solar satellite
    4. the radio tower will suddenly stay power on when they get the right angle (which is easy)
    5. once the Aelith is powered up they can push the entryway button and it will unlock.
* NIC will try to connect to the hypernet using the radio tower but fail, since it's
  radio not hyperweb and the hyperwave relay is broken.

### radio tower/mirrors

* large red radio mast that carries transceivers, but they are broken
* player must crank backup generator to make a little power and then send messages
  to a satelite to tilt mirrors to the solar tank, once tank receives power it will
  power up the door lock and allow the player to open the door to the Aelith

### lobby

* large atrium with holographic trees
* contains an elevator that goes down to the labs
* security cameras watching the exits (through entryway and loading dock)
* the player can only get in to the elevator using the vurbilizer found in the
  conference room
  * the elevator can be called by pressing a button, but that also
    closes the security gate in front of the elevator, and the call button is on the
    wrong side of the gate

    `[exit to loading dock]---[broken elevator call button]---[elevator]----[security gate]-----[elevator call button]-----[entry doors]----[to front desk]`
* sequence to enter elevator:
    1. player goes to conference room and gets vurbilizer.
    2. player un-calls elevator if they called it, this opens the security gate.
    3. player spores at the elevator doors on the other side of the security gate
    4. they go back to the call button and call the elevator
    5. they activate the spore & get in

### loading dock

* this is "outside" and the player can exit the Aelith here but not enter.
* large rollup doors and dock for spaceships to pick up goods

### front desk

* misc stuff, notes
* find tape for component #2 in file cabinet

### conference room

* chairs askew
* vurbilizer is sitting prominently on table
* player must steal projector and install it on NIC to read the tapes

### executive office

* contains final communications from Zylox as well as a working hyperwave relay
  installed in his computer which can be used in place for lore to verify it works
  before it can be removed
* the door lock can only be opened using component #9

### stock room

* contains 5 racks of spaceship bodywork
* scissor lift to take person up the racks
* the racks are blocked by the bodywork so you can't walk down the end through the
  wall into the psych lab
* when mineral nodules roll across the shelves they shove the bodywork off with a
  clatter
  * the player must retrieve the nodules from the shelf using the robot arm, there
    is enough friction for them to push all of the stuff off the shelf but not fall
    off themselves
  * rack contents:
    1. (after 2 nodules' overflow) nothing
    2. (after 4 nodules' overflow) component #6
    3. (after 8 nodules' overflow) component #7
    4. (after 16 nodules' overflow) component #8 (this is 2 racks' worth since there
       is no 5th bit, the 5th row is carry out)

### psych lab

* for testing the brain of the zugs
* put the 4 bit binary counter here
  * actuated by mineral nodules from the caves
  * the player can only move the nodules using component #5, they are too heavy
    otherwise.
  * the zugs can roll them around like dung beetle balls but much larger.
  * like dung beetles, the zugs are fiercely attracted to the mineral nodules.
  * the 5 levels of the binary counter are unintentionally connected to the shelves
    of the stock room
  * the zugs feed off of the energy stored in the nodules, so they seek them out
* construction of the binary counter bits, each is a pen for 1 zug:
  * oriented like long horizontal box
  * nodule comes in the top.
  * when the zug in the pen sees it it gets excited, runs towards the nodule, grabs
    it, and rolls it into the bed, then sleeps on it
  * when the 2nd nodule comes in, the zug gets distracted and runs at it, pushing
    it to the end of the cage
  * when the heavy nodule reaches the end of the cage it causes the cage to tip, and
    the one in the nest rolls out, dumping both
* sequence to get component #6, #7, and #8:
    1. go to cave and bring up mineral nodules using component #5
    2. after dropping in 4 nodules (3 total because overflowed ones can be reused),
       player gets component #6 and is able to clone them to get the 5 required to
       overflow all of them
    3. if player forgets to clone them and all 3 get backed up, there is a "clean"
       lever to tip all of the cages and release the nodules without triggering
       a ripple carry
    4. component #7 does them no good here but they can get it
    5. component #8 is needed for the last puzzle

### machine shop

* Contains the 3D printers needed to create the vurbilizer components
  * The printer requires voranium to work and has 3 charges to start
    * player can get more voranium by harvesting voranium flowers
  * easter egg: if you start a print job and then go to the printer before it
    finishes you can change the print speed to "lightspeed", "ridiculous", or
    "ludicrous", and if you put it in "ludicrous" mode it has a 50% chance
    of spaghettiing the entire print and forcing you to start again
* machine tools, electronics assembly machines
  * (check pictures of Adafruit's manufacturing floor and/or the university machine
    shop for reference)
* tools, wrench is takeable
* 1 printer works, the larger other ones don't work but can be fixed later
* large gantry rail crane on the ceiling (like in the guide hall at NCNR) that is
  rusted and broken (it does nothing)

### physics lab

* gravity manipulators that can push objects and act as invisible links (enabling
  stuff that 2D physics engines with collision layers allow but would be impossible
  in real life 3D)
* main installation is a million-pound deadweight machine (like the one at NIST) with
  a fixture to hold a zug in the crushing jaws. it extends down into a pit
* the walkway to go over to the control panel can be picked up and placed in the jaws
  of the press
* the control panel for the machine is only accessible after crossing the removable
  panels
  * the player cannot jump over it due to the catwalk above it and if they jump in,
    there is a ladder that gets them back to the entryway doors, but
    they cannot jump back up to the controls
* there is a cryocooler and helium compressor available for the player to
  jerry rig attach to the press jaws to keep the zug frozen (otherwise it would
  thaw and become uncrushable), it cannot be attached without the floor
  tiles in place
* with the press in the raised/closed position, the jaws have been raised up too far
  for the player to reach them.
* the power cable to the helium compressor broke, requiring the player to plug
  in the vurbilizer to power it
* the player must go to the bio lab and get the zug from the jar in the fume
  hood, this zug has eaten the program tape for component #4.
* activation sequence for #4:
    1. Player enters with zug in jar. gets zug out of jar and places it in the jaws
       of the press.
    2. Player must now spore into the control panel side.
    3. On the way back, they grab the floor tiles, blocking their route returning to
       the controls.
    4. They must attach the floor tiles and cryocooler to the press and power it up
       using the vurbilizer.
    5. They must return to the controls using the spore. If they do not have a spore
       they can just disassemble it and back to the step 2.
    6. With the zug frozen in the press, they can crush it, causing it to explosively
       break apart, but the tape inside gets embedded in the jaws of the press due
       to the sudden snap, and the zug fragments remain around the jaws. (The fragments
       will be important in crafting the warp compressor.)
    7. They must now go to the machine shop and get a wrench to jam in the press and
       dislodge the tape. The cryocooler must remain on at this point.
    8. If they no longer have a spore to get back to the controls (because it wasn't
       done with component #3 and died the first time), they must turn off the
       cryocooler to get their vurbilizer back, and this allows the zug fragments
       to thaw and recombine around the tape, and the player has to get the walkway
       pieces to be able to get back to the controls, and back to the step 2.
    9. If the player successfully gets the wrench in on the frozen, crushed zug, the
       tape will pop out and fall down the press pit where they can grab it

### bio lab

* no lightswitch on wall, lights are permanently on
* contains a fume hood and chemical storage cabinets
* plus a zug floating in a jar of liquid inside the fume hood
* the zug ate the tape for component #4, but the player must first freeze and then
  crack open the zug in the physics lab to get it
* the player can only get into the fume hood via the ductwork from the boiler room to
  be able to grab the jar
* cabinet contains tape for component #3
* the supply closet and chem lab doors can only be opened by powering the lock
  with the vurbilizer's battery, thus forcing the player to do without it while
  they're in there; the power injection point is too far from the doors for the
  player to be able to grab the vurbilizer while standing in the doorway
* the doors for the labs can always be opened from the inside (for safety)
* sequence for antimatter battery fluid (requires components #1-#4):
    1. Player uses the vurbilizer to power the door lock mechanism for the supply
       closet. this lets them in.
    2. Player goes in with them the remote probe (component #2) and leaves it in
       there
    3. Player disconnects power from door latch, then triggers vurbilizer, they can
       now get in anytime using the spore
    4. Repeat steps 1-3 for chemistry lab
    5. These must be done with components #3 and #4 on otherwise the player will be
       forced to enter the bio lab and if they take the chemicals they will spoil.
    6. Once the player can use spores to teleport back and forth between the supply
       closet and chemistry lab without passing through the bio lab, they can take
       the vurbilizer and no longer need to power the door latch mechanisms.
    7. In the chemistry lab, the lights are always on because of the toggle issues,
       so the player will need to use component #1 to capture one and not the other
       to be able to reset them to the same state and turn the lights off.
    8. Once the player can darken the chemistry lab, they can go back and forth
       between the closet and the lab to bring the chemicals and do the reaction,
       and at the end they have the antimatter battery fluid. (It makes enough for 8
       batteries at once)
* sequence to obtain zug in jar (requires component #2):
    1. Player goes to boiler room and turns off the fume hood blower machine.
    2. They get component #2 and put it in the blower
    3. They turn on the blower in reverse which blows the remote capture point to
       the fume hood
    4. They activate the vurbilizer, and then they can get into the fume hood
    5. They leave the fume hood by throwing component #2 out the bottom of the fume
       hood (it fits, but the zug in jar doesn't)

#### supply closet

* dark, no lights
* racks of chemical bottles and glassware
  * only reachable glassware is an absolutely gigantic volumetric flask;
    the player can only carry one at once
* chemicals are light-sensitive and taking some out while the lights are on
  will destroy it
* the chemical supply bottles have basically an infinite supply for the purposes
  of the game

#### chem lab

* lightswitch on wall to turn off lights, but one light is on and the other is off
* super complicated glassware lab setup on bench
* player can use component #1 to spore just one light, and then switch them both
  off
* to safely tansport the chemicals between the 2 darkened rooms the player must
  spore-in each of the rooms with component #3 and #4 enabled so that they can go back to
  the supply room and get all the things they need
* the chem reaction when successful will create a glowing fluid needed to synthesize
  the antimatter battery

### engineering lab

* extension of the machine shop
* blueprints for the warp compressor
* various devices used to test them
* electronics workstations
* the gantry crane in here works but the motor will overload and trip the main breaker
  when run without the antimatter battery as a separate power source, this causes all
  the doors to lock and the elevator to stop working, the player must exit through
  the trash chute, go to the caves, back up to the solar tank, and reset the breaker,
  then reenter
* once installed the antimatter battery cannot be removed (this forces the player to
  make a 2nd one for their spaceship)
* component #5 is stored on a high shelf
* player must plug in antimatter battery and control gantry crane to knock it down.

### robotics lab

* contains blueprints for the Lith Agent
  * optional: allow the player to make a copy of NIC, and install component #2 in
    it, allowing them to remote-control that Agent.
    * TODO: where would this be useful
* contains large 6DoF robot arm inside safety cage
  * surrounded by ????????????????????????             
* contains ed tape
* sequence to get ed tape (requires component #8):
    1. ???????????????????????????????                   

### hallway

* landing for elevator 2
* nothing else here

### basement

* landing for elevator 2
* nothing else here

### server room

* dimly lit, glowing blobs hanging off of racks, short ceiling
* at least three 9-track tape readers here
* player must get tools from workshop and take apart a tape reader and install
  it on NIC along with the projector to be able to read the tapes
* contains computer terminal that can be used to splice tapes
* sequence to get component #9 (requires ed tape):
    1. player goes to server room
    2. player loads ed tape onto tape reader 1
    3. player loads any other program data tape into drive 2
    4. player loads blank tape into drive 3
    5. player runs program
    6. computer starts writing, while it's writing the player must unplug
       the computer to corrupt it (the write takes 2 minutes so they have plenty of
       time)
    7. repeat a few times with traded off tapes
    8. after enough mutations and splicing the player has a tape for component #9

### boiler room

* humming furnace and blowers can be turned on and off by levers
* A duct is connected to fume hood in bio lab, is only way to get into fume hood,
  place component #2 inside, and then turn on the blower in reverse

### trash dump cave

* contains blueprints for the antimatter battery
* lots of blank tapes and spools and failed 3D prints
  * the player must get at least 2 of these to get the component #9 tape
* being munched on by zugs

### waterfall cave

* contains blueprint for component #1

### voranium flower cave

* contains a growth of glowing voranium flowers that feed off the same mineral energy
  as the zugs
* the player can harvest them and they regrow
* the player must harvest some of these for each component to be made
* sequence to obtain purified voranium (requires component #7):
    1. player captures spore inside solar tank with #7 active.
    2. comes back here and drops nodules on to spore which teleports them into the
       solar tank
    3. if the player needs more nodules they can clone more with component #6
    4. when the tank overflows the fluid rushes down into the burrow and then to
       the voranium flower cave which washes the voranium off into the trash heap
       where it crystallizes
    5. the player must collect it and take it back to the machine shop
    6. the crushed zug body from the physics lab also has to be collected in
       glassware
    7. these two components go into printer along with blueprint to make the warp
       compressor

### zug burrow

* tunnel connects back up to solar tank
* contains magnetic nodules with energy specks in them
  * too heavy for the player to lift on their own
    * requires the use of component #5
  * there are only 3 magnetic nodules and many more zugs
