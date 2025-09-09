# AELITH

A puzzle platformer game.

> **continuation**: (noun) a small, parasitic animal, *functionus schemus*, that lives in the circuit boards of computers. Infected devices show the curious symptom of being able to run the programming language Scheme. Despite being extremely easy to catch using the right trap (the two leading models are called *setjmp* and *call/cc*), few people thoroughly understand how continuations work inside. What is known is that they display a very interesting and useful property once caught: when they are fed, they instantly teleport back to the exact place where they were initially caught and then barf up what they were fed. This process can be repeated indefinitely with mature continuations. With the juvenile continuations (called "continulets") this process can only be repeated once. The reader should be cautioned that feeding a continulet caught using a *setjmp* trap twice will usually cause irreversible tears in spacetime.

> [!NOTE]
> This game has no relation to the [Minecraft modpack of the same name](https://www.curseforge.com/minecraft/modpacks/aelith).

## DEVELOPING STARTUP---------

1. make sure you have pnpm installed
2. `cd` to this directory
3. `pnpm install`
4. `pnpm dev`
5. open <http://localhost:8000>
6. if you get a white screen of death check browser console for errors:
    * "xxx is only available in secure origins" &rarr; go to chrome://flags/#unsafely-treat-insecure-origin-as-secure and add <http://localhost:8000>
