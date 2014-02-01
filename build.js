var browserify = require("browserify");
var uglify = require("uglify-js");
var fs = require("fs");

browserify(["./lib/talk"]).bundle({standalone: "Talk"}, function(error, source) {
    if(error) {
        console.error(error);
    }
    fs.readdirSync("./lib/utils").forEach(function(file) {
        source += fs.readFileSync("./lib/utils/" + file, "utf8") || "";
    });
    fs.writeFile("./talk.min.js", uglify.minify(source, {fromString: true}).code || "");
    fs.writeFile("./talk.js", source);
});