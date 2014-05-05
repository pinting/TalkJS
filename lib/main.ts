import Connection = require("./connection");
import Handler = require("./handler");
import Peer = require("./peer");
import Util = require("./util");

class Main extends Handler {
    static Connection = Connection;
    static Handler = Handler;
    static Peer = Peer;
    static Util = Util;
}

export = Main;