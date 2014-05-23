var fs = require("fs");

/**
 * Pack definition and its references into one file
 * @param {string} src - Source of the definition file
 * @param {Array} [found] - Excepted references
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
 * @param {Function} cb
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
 * @param {Array} array
 */

DPacker.prototype.inject = function(array) {
    this.buffer.splice.apply(this.buffer, [this.i, 1].concat(array));
    this.i += array.length - 1;
};

/**
 * Write the buffer to a file with the given new line character
 * @param {string} dest
 * @param {string} [char]
 */

DPacker.prototype.out = function(dest, char) {
    fs.writeFileSync(dest, this.buffer.join(char || "\r\n"), {encoding: "utf8"});
};

module.exports = DPacker;