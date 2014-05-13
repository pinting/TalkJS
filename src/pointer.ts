/// <reference path="./definitions/wildemitter.d.ts" />

import WildEmitter = require("wildemitter");

class Pointer extends WildEmitter {
    private memory  = {
        value: <any> null
    };

    constructor(value?: any) {
        super();
        this.memory.value = value || null;
    }

    get value(): any {
        return this.memory.value;
    }

    set value(value: any) {
        this.memory.value = value;
        this.emit("change", value);
    }
}

export = Pointer;