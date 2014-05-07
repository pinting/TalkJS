/// <reference path="./definitions/wildemitter.d.ts" />

import WildEmitter = require("wildemitter");

class Pointer extends WildEmitter {
    private memory  = {
        value: null
    };

    constructor(value?: any) {
        super();

        if(value) {
            this.memory.value = value;
        }
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