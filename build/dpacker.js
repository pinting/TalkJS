var fs = require("fs");

/**
 * Pack definition and its references into one file
 * @param src {string}
 * @param found {Array}
 * @constructor
 */

function DPacker(src, found) {
    var self = this;
    var path = src.split("/").slice(0, -1).join("/") + "/";

    // Objects are referenced so every parent,
    // and child will have the same array
    found = found || [];

    this.buffer = fs.readFileSync(src, {encoding: "utf8"});
    this.buffer = this.buffer.split(this._newLineChar());
    this.i = 0;

    this.search(function(src) {
        if(found.indexOf(path + src) === -1) {
            found.push(path + src);
            var packer = new DPacker(path + src, found);
            self.inject(packer.buffer);
        }
        else {
            self.inject([]);
        }
    });
}

/**
 * Get the new line character from the the UNSPLITTED buffer
 * @returns {string}
 * @private
 */

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

/**
 * Search the buffer for references
 * @param cb {function}
 */

DPacker.prototype.search = function(cb) {
    while(this.i < this.buffer.length) {
        var line = this.buffer[this.i];
        if(line.substr(0, 3) === "///") {
            var path =  new RegExp(/path=[\'"]?([^\'" >]+)/g).exec(line);
            if(path && path[1]) {
                cb(path[1]);
            }
        }
        this.i++;
    }
};

/**
 * Inject an array into the buffer
 * @param array {Array}
 */

DPacker.prototype.inject = function(array) {
    this.buffer.splice.apply(this.buffer, [this.i, 1].concat(array));
    this.i += array.length - 1;
};

/**
 * Write the buffer to a file with the given new line character
 * @param dest {string}
 * @param char {char}
 */

DPacker.prototype.out = function(dest, char) {
    fs.writeFileSync(dest, this.buffer.join(char || "\r\n"), {encoding: "utf8"});
};

module.exports = DPacker;