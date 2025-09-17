import { RoomData } from "../DataPackFormat";
import { Serializable } from "../Serializable";

export class Room implements Serializable {
    constructor(
        public id: string,
    ) {
    }
    toJSON(): RoomData {

    }
}
