var fs = require("fs");

/**
 * Pack definition and its references into one file
 */

function DPacker(src) {
    var self = this;
    var path = src.split("/").slice(0, -1).join("/") + "/";
    this.buffer = fs.readFileSync(src, {encoding: "utf8"});
    this.buffer = this.buffer.split(this._newLineChar());
    this.search(function(src, i) {
        var packer = new DPacker(path + src);
        self.inject(i, packer.buffer);
    });
}

DPacker.prototype._newLineChar = function() {
    if(this.buffer.search("\r\n") >= 0) {
        return "\r\n";
    }
    if(this.buffer.search("\r") >= 0) {
        return "\r";
    }
    if(this.buffer.search("\n") >= 0) {
        return "\n";
    }
    return "";
};

DPacker.prototype.search = function(cb) {
    for(var i = 0; i < this.buffer.length; i++) {
        var line = this.buffer[i];
        if(line.substr(0, 3) === "///") {
            var path =  new RegExp(/path=[\'"]?([^\'" >]+)/g).exec(line);
            if(path && path[1]) {
                cb(path[1], i);
            }
        }
    }
};

DPacker.prototype.inject = function(i, array) {
    this.buffer.splice.apply(this.buffer, [i, 1].concat(array));
};

DPacker.prototype.out = function(dest, char) {
    fs.writeFileSync(dest, this.buffer.join(char || "\r\n"), {encoding: "utf8"});
};

module.exports = DPacker;