
function parseHash() {
    var hash = location.hash.replace(/^#/, "");
    var d = {};
    var pairs = hash.split(";");
    for (var j = 0; j < pairs.length; j++) {
        var tuple = pairs[j].split("=");
        d[tuple[0]] = tuple[1];
    }
    return d;
}

$(document).ready(function() {
    function trigger(e) {
        console.log("blah:", this.dataset.action);
        window.bus.emit({action: this.dataset.action, target:this.dataset.target});
    }
    $(window).on("hashchange", function() {
        var params = parseHash();
        if ("channel" in params) {
            localStorage.setItem("cloud_channel", params.channel);
            window.bus = new Bus(params.channel);
            window.bus.bind("join", function(args) {

                var $peer = $("<li class=\"peer " + args.source + "\">" + args.name + "</li>");
                console.info(args.capabilities);
                
                var cmds = ["reboot", "halt", "puppet"];
                for (var j = 0; j < cmds.length; j++) {
                    var cmd = cmds[j];
                    if (args.capabilities.indexOf(cmd) >= 0) {                
                        $peer.append("<span data-target=\"" + args.source + "\" data-action=\"" + cmd + "\">" + cmd + "</span>");
                    }
                }

                $("span", $peer).on("click", trigger);
                $("#peers").append($peer);
            });
            window.bus.bind("leave", function(args) {
                $("#peers .peer." + args.source).remove();
            });
        }
    });
    
    $("#login_submit").on("click", function() {
        var token = $("#login_name").val() + "|" + $("#login_password").val();
        var channel = CryptoJS.SHA1(token);
        window.location.hash = "#channel=" + channel;
    });
    
    $(window).trigger("hashchange");
})
