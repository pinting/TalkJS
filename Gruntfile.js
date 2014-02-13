module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
            all: [
                "Gruntfile.js",
                "lib/**/*.js"
            ],
            options: {
                ignores: [
                    "lib/simplewebrtc/*.js",
                    "lib/utils/crypto.js",
                    "lib/utils/sha256.js"
                ],
                force: true
            }
        },
        browserify: {
            dist: {
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
            dist: {
                src: ["build/talk.js", "lib/utils/**/*.js"],
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
        }
    });
    grunt.loadNpmTasks("grunt-bump");
    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.registerTask("default", function(type) {
        grunt.task.run("jshint");
        grunt.task.run("browserify");
        grunt.task.run("concat");
        grunt.task.run("uglify");
        grunt.task.run("bump:" + (type || "build"));
    });
};