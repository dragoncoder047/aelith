# Aelith

![GitHub last commit](https://img.shields.io/github/last-commit/dragoncoder047/aelith)
![GitHub contributors](https://img.shields.io/github/contributors-anon/dragoncoder047/aelith)
[![Discord](https://img.shields.io/discord/1470176747822780429?logo=discord&label=Discord)](https://discord.gg/7yD8GekuDz)

So you crash-landed on a dusty barren world. It would seem as though you're stuck here forever, but it turns out that this was the site of the long-abandoned Aelith, a cutting-edge research laboratory and technology manufacturer - and the Aelith's computers somehow remember you. Armed with the Aelith's latest unreleased product, a time- and space-bending tool called a vurbilizer, you spawn vurble spores that selectively rewind parts of the world, move objects through time, and reach deeper into the Aelith's disorganized labs, closets, and backrooms. With the help of NIC, a curious floating AI bot, you’ll upgrade the vurbilizer, recover spaceship components, and piece together the Aelith’s fragmented memories to uncover why you were brought back - and who you were meant to become.

> [!NOTE]
> This game has no relation to the [Minecraft modpack of the same name](https://www.curseforge.com/minecraft/modpacks/aelith).

## Current status

**Not published because incomplete.**

## Code overview (eh)

* Aelith uses [KAPLAY.js](https://v4000.kaplayjs.com) for lower-level mechanics such as rendering, physics, asset loading, input handling, and scene management.

    Note: half the time this is actually a custom build of KAPLAY, due to the fact that KAPLAY is free software and I have a fork in which I regularly fix bugs and add new features to KAPLAY itself.

* Aelith's actual game assets and logic is contained by a giant JSON file that gets assembled by a [build script](./scripts/build_datapack.py). The idea is that one could replace this JSON file with a different one, and have a whole different game, without changing any of the Javascript.

* unfortunately I have not written any documentation for the datapack's structure and fields beyond the TypeScript types in [DataPackFormat.ts](./src/DataPackFormat.ts). The scripting function using JSON arrays as Lisp is bound to be confusing and also unfortunately the exact semantics of this is also completely undocumented. However, I would welcome documentation PRs as much as any other.

## Top-level roadmap

* [X] Finalize the game's plot and story
* [ ] Implement all of the mechanics needed for the puzzles (while creating first drafts of assets as needed)
* [ ] Implement game saves to persist gameplay progress between page reloads
* [ ] Implement mod loading
* [ ] Polish the art and sound design
* [ ] Beta test
* [ ] Release initial version on Newgrounds, itch.io, and github pages for free

### Future plans

* [ ] Integrate [syd](https://github.com/dragoncoder047/syd) for sounds and music (once syd is complete as well of course)
* [ ] Release an *Aelith Unbounded* mod or update that adds in-game world editing (i.e., make it a sandbox game)

## For developers and alpha testers

0. `git clone` this repository or your fork of it
1. make sure you have [pnpm](https://pnpm.io) installed
2. `cd` to this directory
3. `pnpm install`
4. `pnpm dev`
5. open <http://localhost:8000>
6. if you get a white screen of death check browser console for errors:
    * "xxx is only available in secure origins" &rarr; go to chrome://flags/#unsafely-treat-insecure-origin-as-secure (or the corresponding setting for your browser) and whitelist <http://localhost:8000>

## License

For the most part, Aelith uses the [GPLv3](./LICENSE-code) for the code, and [CC BY-NC-SA 4.0](./LICENSE_art_and_music) for the art, sounds, and music.

Exceptions are listed in [data/audio/readme.md](./data/audio/readme.md) and [data/fonts/readme.md](./data/fonts/readme.md)
