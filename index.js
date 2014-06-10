module.exports = require("./dist/talk.js");

var a = {"iceServers":
    [
        {"urls":"stun:stun.l.google.com:19302"},
        {"urls":
            [
                "turn:23.251.138.129:3478?transport=udp",
                "turn:23.251.138.129:3478?transport=tcp",
                "turn:23.251.138.129:3479?transport=udp",
                "turn:23.251.138.129:3479?transport=tcp"
            ],
            "credential": "rh2ebh51XTEgmrW9t8GIMPM/CjU=",
            "username":"1402513025:04621828"
        }
    ]
};

var b = {"iceServers":
    [
        {"url":"stun:stun.l.google.com:19302"},
        {
            "url":"turn:23.251.138.23:3478?transport=udp",
            "credential":"gvTgFAxBlGWoekO1W09GSSuqOA8=",
            "username":"1402514719:60245854"},
        {
            "url":"turn:23.251.138.23:3478?transport=tcp",
            "credential":"gvTgFAxBlGWoekO1W09GSSuqOA8=",
            "username":"1402514719:60245854"
        },
        {
            "url":"turn:23.251.138.23:3479?transport=udp",
            "credential":"gvTgFAxBlGWoekO1W09GSSuqOA8=",
            "username":"1402514719:60245854"
        },
        {
            "url":"turn:23.251.138.23:3479?transport=tcp",
            "credential":"gvTgFAxBlGWoekO1W09GSSuqOA8=",
            "username":"1402514719:60245854"
        }
    ]
};
