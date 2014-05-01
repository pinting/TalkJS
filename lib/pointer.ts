import Util = require("./util");

class Pointer {
    private storage = {
        value: null
    };

    constructor(value?: any) {
        if(!Util.isNone(value)) {
            this.storage.value = value;
        }
    }

    public set(value: any): any {
        this.storage.value = value;
        return value;
    }

    public get(): any {
        return this.storage.value;
    }
}

export = Pointer;