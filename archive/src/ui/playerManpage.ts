import { GameObj, PosComp } from "kaplay";
import { UI } from ".";
import { manpage } from "../components/manpage";
import { K } from "../init";
import { player } from "../player";

const manpageContainer = UI.add([
    K.pos(K.center()),
    K.layer("manpage"),
    {
        add(this: GameObj<PosComp>) {
            K.onTabResize(() => {
                this.pos = K.center();
            });
        },
    },
]);

player.manpage = manpageContainer.add([manpage()]);
player.manpage.hidden = true;
