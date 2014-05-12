import Connection = require("./connection");
import Handler = require("./handler");
import Room = require("./room");
import Peer = require("./peer");
import Util = require("./util");

class Main extends Handler {
    static Connection = Connection;
    static Handler = Handler;
    static Room = Room;
    static Peer = Peer;
    static Util = Util;

    constructor(options?: Object) {
        super(null, options);
    }
}

export = Main;