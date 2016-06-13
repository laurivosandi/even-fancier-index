
function Bus(channel) {
    var self = this;

    self.uuid = uuid4();
    self.handlers = {
        join: function() {},
        leave: function() {},
        ping: function() {},
        pong: function() {},
    };
    self.channel = channel || "tere";
    self.url = "wss://" + window.location.hostname + "/event/subscribe/" + channel;
    self.ws = new WebSocket(self.url);    
    
    console.debug("Instantiating node", self.uuid, "on bus at", self.url);
    
    self.ws.onopen = function(e) {
        self.advertise("ping");
    };
    
    self.bind = function(action, handler) {
        self.handlers[action] = handler;
    };
    
    self.emit = function(args) {
        args.source = self.uuid;
        args.created = new Date();
        self.ws.send(JSON.stringify(args));
    }
    
    self.bind("ping", function() {
        console.info("Node joined bus:", args);
        self.advertise("pong");
        self.handlers.join(args);
    });
    
    self.bind("pong", function() {
        console.info("Acknowledged node on bus:", args);
        self.handlers.join(args);
    });
    
    self.bind("leave", function() {
        console.info("Node disconnected bus:", args);
    });

    self.ws.onmessage = function(e) {
        // Parse JSON
        args = JSON.parse(e.data).text;
        
        var patt = /^[0-9a-f]{32}$/;
        
        if (!patt.test(args.source)) {
            console.info("Malformed message source:", args);
            return;
        }
        
        
        // Ignore messages from myself
        if (args.source == self.uuid) {
            return;
        }

        var handler = self.handlers[args.action];
        if (handler) {
            handler(args);
        } else {
            console.debug("No handler for:", args);
        }
    }
    
    
    // Set up advertise function
    self.advertise = function(via) {
        var features = {
            action: via,
            name: $("#setting_peer_name").val() || "unnamed",
            capabilities: []
        };

        if ($("#enable_advertise_location").prop("checked")) {
            features.path = window.PATH;
        }

        if ($("#enable_advertise_audio_playback").prop("checked")) {
            features.audio_playback_codecs = window.AUDIO_CODECS_SUPPORTED;
            features.capabilities.push("audio_playback");
        }
        
        if ($("#enable_advertise_video_playback").prop("checked")) {
            features.video_playback_codecs = window.VIDEO_CODECS_SUPPORTED;
            features.capabilities.push("video_playback");
            features.screens = [{ width: screen.width, height: screen.height}];
        }
        
        self.emit(features);
    };



    $(window).unload(function() {
        self.emit({ action: "leave" });
    });
}


