/// <reference path="./socket.io/socket.io-client.d.ts" />

import SocketIO = require("socket.io-client");
import Connection = require("./connection");
import Handler = require("./handler");
import Util = require("./util");

class Room extends Connection {
    constructor(top: Handler, host: string) {
        super(top, host);
    }
}

export = Room;