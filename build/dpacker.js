var fs = require("fs");

/**
 * Pack definition and its references into one file
 */

module.exports = function(grunt) {
    grunt.registerMultiTask("dpacker", function() {
        var src = this.data.src;
        var dest = this.data.dest || src;

        var file = fs.readFileSync(src, {encoding: "utf8"});
        var buffer = "";
        var start = 0;

        file.split("\r\n").every(function(row) {
            if(row.substr(0, 3) === "///") {
                var path =  new RegExp(/path=[\'"]?([^\'" >]+)/g).exec(row);
                if(path && path[1]) {
                    buffer += fs.readFileSync("./dist/" + path[1], {encoding: "utf8"});
                    start += row.length + 2;
                    return true;
                }
            }
            return false;
        });

        if(start > 0 && buffer.length > 0) {
            buffer += file.substr(start);
            fs.writeFileSync(dest, buffer, {encoding: "utf8"});
        }
    });
};