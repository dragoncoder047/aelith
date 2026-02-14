import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { Prefixes } from "../config/prefixes";

export abstract class Store {
    readonly doc: Y.Doc;
    readonly offlineDB: IndexeddbPersistence;
    constructor(public readonly storeName: string) {
        this.offlineDB = new IndexeddbPersistence(Prefixes.ROOT_PREFIX + storeName, this.doc = new Y.Doc);
    }
    async initialize() {
        await this.offlineDB.whenSynced;
        if (!this.isInitialized()) await this.initToDefaults();
    }
    protected abstract isInitialized(): boolean;
    protected abstract initToDefaults(): Promise<void>;
}
