module.exports = function(grunt) {
    grunt.initConfig({
        ts: {
            compile: {
                src: ["./src/**/*.ts"],
                options: {
                    module: "commonjs",
                    sourceMap: false,
                    target: "es5"
                }
            }
        },
        browserify: {
            bundle: {
                src: ["./src/main.js"],
                dest: "./dist/talk.js",
                options: {
                    standalone: "Talk",
                    debug: false
                }
            }
        },
        concat: {
            crypto: {
                src: ["./dist/talk.js", "./src/crypto/*.js"],
                dest: "./dist/talk.js"
            }
        },
        uglify: {
            build: {
                src: "./dist/talk.js",
                dest: "./dist/talk.min.js"
            }
        },
        bump: {
            files: ["./package.json"],
            options: {
                createTag: false,
                commit: false,
                push: false
            }
        },
        clean: {
            build: {
                src: ["./dist/*.js"]
            },
            js: {
                src: ["./src/**/*.js", "!./src/crypto/*.js"]
            }
        }
    });
    [
        "grunt-contrib-uglify",
        "grunt-contrib-concat",
        "grunt-contrib-clean",
        "grunt-browserify",
        "grunt-bump",
        "grunt-ts"
    ].forEach(function(task) {
        grunt.loadNpmTasks(task);
    });
    grunt.registerTask("default", [
        "clean:build",
        "ts:compile",
        "browserify:bundle",
        "concat:crypto",
        "uglify:build",
        "clean:js",
        "bump:build"
    ]);
};