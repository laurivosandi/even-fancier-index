
function playVideoFile(dom, autoplay) {
    window.CURRENT_VIDEO = dom;
    console.info("Now watching:", window.CURRENT_VIDEO.attr("title"));
    var player = $("#video_player");
    player.unbind("ended").bind("ended", function () { playVideoFile(window.CURRENT_VIDEO.next(), true); });
    player.html("<source src=\"" + window.CURRENT_VIDEO.attr("href") + "\" type=\"" + window.CURRENT_VIDEO.attr("data-mimetype") + "\"/>");
    player.show();
    if (autoplay) {
        player.trigger("stop");
        player.trigger("play");
    }
}

function playNextAudioTrack() {
    var $nextTrack = $(window.CURRENT_TRACK).next();
    if ($nextTrack) {
        playAudioTrack($nextTrack, true);
    }
}

function playAudioTrack(dom, autoplay) {
    // Reset controls
    $("#audio_player_controls .seek input").val(0);
    $("#audio_player_controls .offset").html("00:00:00");
        
    window.CURRENT_TRACK = dom;
    console.info("Now playing:", window.CURRENT_TRACK.attr("title"));
    window.status = window.CURRENT_TRACK.attr("title");
    var player = $("#audio_player");
    player.unbind("ended").bind("ended", function () {
        playNextAudioTrack();
    });
    player.empty();

    var mimetype = window.CURRENT_TRACK.attr("data-mimetype");
    var url = window.location.href + window.CURRENT_TRACK.attr("href");
    var duration = parseFloat(dom.attr("data-duration") || 0);

    $("#audio_player_controls").show();
    $("#audio_player_controls .duration").html(humanize_duration(duration));
    $("#audio_player_controls .title").html(dom.attr("data-title"));
    
    $("#audio_player_controls .seek input").attr("max", duration);

    if (window.AUDIO_CODECS_SUPPORTED.indexOf(mimetype) >= 0) {
        player.append("<source src=\"" + url + "\" type=\"" + mimetype + "\"/>");
    }
    
    
    for (var j = 0; j < window.AUDIO_CODECS_SUPPORTED.length; j++) {
        var alternative = window.AUDIO_CODECS_SUPPORTED[j];
        if (mimetype != alternative) {
            player.append("<source src=\"/transcode/?mimetype=" + alternative + "&url=" + url.replace("&", "%26") + "\" type=\"" + alternative + "\"/>");
        }
    }

    
    player.show();
    
    if (autoplay) {
        // Firefox won't reload without this
        player.trigger("load");
        player.trigger("play");
        $("#audio_player_controls .play").hide();
        $("#audio_player_controls .pause").show();

    }
}

function probeCodecs() {
    // Probe for supported codecs
    window.AUDIO_CODECS = [
        'audio/ogg',
        'audio/mpeg',
//        'audio/webm',
        'audio/flac',
//        'audio/wav'
    ];
    
    window.VIDEO_CODECS = [
        'video/ogg; codecs="theora, vorbis"',
        'video/mp4; codecs="avc1.4D401E, mp4a.40.2"',
        'video/webm; codecs="vp8.0, vorbis"',
        'audio/ogg; codecs="vorbis"',
        'audio/mp4; codecs="mp4a.40.5"'
    ];

    window.AUDIO_CODECS_SUPPORTED = [];    
    window.VIDEO_CODECS_SUPPORTED = [];
    
    var audioPlayer = document.getElementById("audio_player");

    for (var j = 0; j < window.AUDIO_CODECS.length; j++) {
        if (audioPlayer.canPlayType(window.AUDIO_CODECS[j])) {
            window.AUDIO_CODECS_SUPPORTED.push(AUDIO_CODECS[j]);
        }
    }
    
    var videoPlayer = document.getElementById("video_player");
    window.window.VIDEO_CODECS_SUPPORTED = [];
    for (var j = 0; j < window.VIDEO_CODECS.length; j++) {
        if (videoPlayer.canPlayType(window.VIDEO_CODECS[j])) {
            window.VIDEO_CODECS_SUPPORTED.push(VIDEO_CODECS[j]);
        }
    }
    
    console.info("This browser supports following audio codecs:", window.AUDIO_CODECS_SUPPORTED);
    console.info("This browser supports following video codecs:", window.VIDEO_CODECS_SUPPORTED);
    
    
    var $offset = $("#audio_player_controls .offset");
    var $seek = $("#audio_player_controls .seek input");
    
    $("#audio_player_controls .stop").click(function(e) {
        console.info("Stopping playback");
        $("#audio_player_controls .pause").hide();
        $("#audio_player_controls .play").show();
        $("#audio_player").trigger("pause");
        $("#audio_player").get(0).currentTime = 0;
        $("#audio_player_controls .seek input").val(0);
        $("#audio_player_controls .offset").html("00:00:00");        
    });

    $("#audio_player_controls .pause").click(function(e) {
        console.info("Pausing playback");
        $("#audio_player_controls .pause").hide();
        $("#audio_player_controls .play").show();
        $("#audio_player").trigger("pause");
    });

    $("#audio_player_controls .play").click(function(e) {
        console.info("Starting playback");
        $("#audio_player_controls .play").hide();
        $("#audio_player_controls .pause").show();
        $("#audio_player").trigger("play");
    });


    $("#audio_player_controls .next").click(function(e) {
        playNextAudioTrack();
    });
    
    $("#audio_player").on("timeupdate", function(e) {

        $offset.html(humanize_duration(e.target.currentTime));
        $seek.val(e.target.currentTime);
    });

}

