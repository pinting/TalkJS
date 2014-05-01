module.exports = function(grunt) {
    grunt.initConfig({
        ts: {
            compile: {
                src: ["lib/**/*.ts"],
                options: {
                    module: "commonjs",
                    sourceMap: false,
                    target: "es5"
                }
            }
        },
        browserify: {
            bundle: {
                files: {
                    "build/talk.js": ["lib/talk.js"]
                },
                options: {
                    standalone: "Talk",
                    debug: false
                }
            }
        },
        concat: {
            crypto: {
                src: ["build/talk.js", "lib/crypto/*.js"],
                dest: "build/talk.js"
            }
        },
        uglify: {
            build: {
                src: "build/talk.js",
                dest: "build/talk.min.js"
            }
        },
        bump: {
            files: ["package.json"],
            options: {
                createTag: false,
                commit: false,
                push: false
            }
        },
        clean: {
            build: {
                src: ["build/*.js"]
            },
            js: {
                src: ["lib/**/*.js", "!lib/crypto/*.js"]
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