
SVG_EXTENSIONS = [".svg", ".svg.gz", ".svgz" ];
AUDIO_EXTENSIONS = [ ".mp3", ".wav", ".ogg", ".ape", ".flac", ".m4a", ".xm", ".s3m", ".mod", ".it", ".j2b", ".ac3", ".wma" ];
VIDEO_EXTENSIONS = [ ".avi", ".mkv", ".mp4", ".ogv", ".mpg", ".flv", ".mov", ".wmv", ".webm", ".m4v", ".m2ts", ".rmvb" ];
JPEG_EXTENSIONS  = [".jpeg", ".jpg" ];
IMAGE_EXTENSIONS = [ ".png", ".gif", ".tiff", ".tif" ];

// Stuff to ignore by default
CHECKSUM_EXTENSIONS = [".md5", ".sfv" ];
PLAYLIST_EXTENSIONS = [".m3u", ".m3u8", ".pls", ".xspf", ".cue" ];
SUBTITLE_EXTENSIONS = [".sub", ".srt" ];
BYTECODE_EXTENSIONS = [".pyc", ".pyo" ];

IGNORE_FILENAMES = [ "robots.txt", "index.xspf", "index.m3u", "index.m3u8", "index.html", "index.htm", "Picasa.ini", "Thumbs.db", "desktop.ini", "AlbumArtSmall.jpg", "__MACOSX/"];

function createBreadcrumbs(path) {
    // Decode punycoded hostnames
    var hostname = window.location.host.split(".").map(function(c) {return c.indexOf("xn--") == 0 ? punycode.decode(c.substring(4)) : c}).join(".");
    
    window.PATH = decodeURIComponent(path || window.location.pathname);
    window.PATH_COMPONENTS = window.location.pathname == "/" ? [] : window.PATH.replace(/^\/+|\/+$/g, '').split("/");
    
    //$("#location").empty();
    //$("#location").qrcode({ render: 'canvas', color: "#888", text: window.location.href});


    /* Generate navigation bar on the fly */
    var $nav = $("#breadcrumbs");
    $nav.empty();
    $nav.prepend("<a class=\"root\" href=\"" + window.location.origin + "\">" + hostname + "</a>");

    var title = null;
    var hadHome = false; // Whether we already included home folder in the breadcrumbs
    for (var j = 0; j < window.PATH_COMPONENTS.length; j++) {
        title = window.PATH_COMPONENTS[j];
        var url = encodeURI("/" + window.PATH_COMPONENTS.slice(0, j+1).join("/") + "/");
        
        if (!hadHome && title[0] == '~') {
            $nav.append("<a class=\"directory item home\" href=\"" + url + "\">" + title.substring(1) + "</a>");
            hadHome = true;
        } else {
            $nav.append("<a class=\"directory item\" href=\"" + url + "\">" + title + "</a>");
        }
        
    }
    if (title) {
        $("head").append("<title>" + title + " at " + window.location.hostname + "</title>");
    }

}

function enhance(path) {
    createBreadcrumbs(path);
    
    // Get the original list DOM element
    var $items = $("#list tbody tr");

    var $directories = $("#directories .items");
    var $gallery = $("#gallery .items");
    var $videos = $("#videos .items");
    var $tracks = $("#tracks .items");
    var $otherFiles = $("#otherFiles .items");

    // Empty item containers    
    $directories.empty();
    $gallery.empty();
    $videos.empty();
    $tracks.empty();
    $otherFiles.empty();
    
    // Initially hide all sections  
    $("#actions .section").hide();
    $("#actions .directory.section").show();
    $("#actions .action.watch.video").hide();
    $("#actions .directory .action.audio.xspf").hide();
    $("#actions .directory .action.video.xspf").hide();

    
    var totalSize = 0;   
    var directoryCount = 0;
    var fileCount = 0;
    
    console.log("Original table contained", $items.length, "items");

    for (var j = 1; j < $items.length; j++) {
        var url = $items[j].firstChild.firstChild.getAttribute("href");
        var filename = decodeURIComponent(url);
        var size = $items[j].childNodes[1].innerHTML.trim();
        var date = new Date($items[j].lastChild.innerHTML);
        
        if (size != "-") {
            totalSize += parseInt(size);
        }
        
        var dot = filename.lastIndexOf(".");
        var basename = (dot == -1) ? filename : filename.substring(0, dot)
        var title = basename;


        var extension = filename.substring(basename.length).toLowerCase();
        var mimetype = MIMETYPES[extension];
        var icon = "/even-fancier-index/themes/Humanity/mimes/48/" + (mimetype ? mimetype.replace("/", "-") : "application-octet-stream") + ".svg";
        var RE_DELIMITERS = /[ \.\-\_]/;
        var sort_key = filename.toLowerCase().replace(RE_DELIMITERS, " ").trim();
        if (sort_key.indexOf("the") == 0) {
            sort_key = sort_key.substring(4);
        }

        if (filename[0] == ".") { // Skip hidden files if any
            continue
        }
        
        
        if (IGNORE_FILENAMES.indexOf(filename) >= 0) {
            // This is index.html, index.php, index.xspf or whatever
            continue
        }
        
        if (filename[filename.length-1] == "/") {
            // Directories
            directoryCount++;
            title = filename.substring(0, filename.length - 1);
            $directories.append("<a class=\"directory item\" href=\"" + url + "\">" + title + "</a>");
            
        } else if (filename[filename.length-1] == "~") {
            // Skip backup files
            continue
            
        } else if (AUDIO_EXTENSIONS.indexOf(extension) >= 0) {
            // Audio files
            title = title.replace("_", " ");
            console.log("Audio file:", basename, "mimetype:", mimetype);
            $tracks.append("<a class=\"track\" data-title=\"" + title + "\" data-mimetype=\"" +mimetype + "\" data-filename=\"" + filename.replace("\"", "\\\"") + "\" title=\"" + basename + "\" rel=\"g\" href=\"" + url +"\" style=\"background-image: url('" + icon + "');\">" + title + "</a>");

        } else if (VIDEO_EXTENSIONS.indexOf(extension) >= 0) {
            // Video files
            var year = null;
            var bits = null;

            var resolution = null;
            var RE_1080P = /[ \.\-\_](\[1080p\]|1080p)/i;
            var RE_720P = /[ \.\-\_](\[720p\]|720p)/i;
            var RE_480P = /[ \.\-\_](\[480p\]|480p)/i;
            if (filename.search(RE_1080P) >= 0) {
                resolution = 1080;
            } else if (filename.search(RE_720P) >= 0) {
                resolution = 720;
            } else if (filename.search(RE_480P) >= 0) {
                resolution = 480;
            }
            
            var RE_YEAR = /(\.\-)?([ \.\_](19|20)\d\d|[ \.\_\-]?\[(19|20)\d\d\]|[ \.\_]\((19|20)\d\d\))/;
            var year_offset = title.search(RE_YEAR)
            
            // If filename contains something that looks like a year and 480/720/1080p then try to extract other stuff
            if (year_offset > 2 && resolution) {
                
                bits = title.substring(year_offset+5);
                var head = title.substring(0, year_offset).replace(/[ _\.]+/g, " ");

                year_offset += title.substring(year_offset).search(/\d\d\d\d/);
                year = title.substring(year_offset, year_offset + 4);
                
                title = head + " (" + year + ")";;


                var video_codec = null;
                var RE_H264 = /[ \.\-\_](\[[xh]\.?264\]|[xh]\.?264)/i;
                var RE_DIVX = /[ \.\-\_]?(\(divx\)|\(xvid\)|\[divx\]|\[xvid\]|xvid|divx)/i;
                if (title.search(RE_H264) >= 0) {
                    video_codec = "h264";
                } else if (title.search(RE_DIVX) >= 0) {
                    video_codec = "divx";
                }

                var audio_codec = null;
                var RE_AAC = /[ \.\-\_](\[aac\]|aac)/i;
                var RE_DTS = /[ \.\-\_](\[dts\]|dts)/i;
                var RE_AC3 = /[ \.\-\_](\[ac3\]|ac3)/i;
                if (bits.search(RE_AAC) >= 0) {
                    audio_codec = "aac";
                }
                if (bits.search(RE_AC3) >= 0) {
                    audio_codec = "ac3";
                }
                if (bits.search(RE_DTS) >= 0) {
                    audio_codec = "dts";
                }

                var audio_channels = null;
                var RE_6CH = /[ \.\-\_](\(5\.1\)|\[5\.1\]|5\.1|6)(ch)?/i;
                if (bits.search(RE_6CH) >= 0) {
                    audio_channels = 6;
                } else {
                    audio_channels = 2;
                }

                var medium = null;            
                var RE_BLURAY = /[ \.\-\_]\[?(bd|bluray|bray|brrip)\]?/i;
                var RE_DVD = /[ \.\-\_]?(\[dvd(rip)?\]|dvd(rip)?|dvdscr(eener)?)/i;
                var RE_HDDVD = /[ \.\-\_]\[?hddvd(rip)?\]?/i;
                var RE_HDTV = /[ \.\-\_](\[hdtv\]|hdtv)([ \.\-\_]?rip)?/i;
                if (title.search(RE_BLURAY) >= 0) {
                    medium = "bluray"
                } else if (title.search(RE_HDDVD) >= 0) {
                    medium = "hddvd";
                } else if (title.search(RE_DVD) >= 0) {
                    medium = "dvd";
                } else if (title.search(RE_HDTV) >= 0) {
                    medium = "hdtv";
                }
            } else {
                title = filename; // Non-standard filename
            }
            
            console.log("Video file:", basename);

            var  $video = $("<a class=\"thumbnail jpeg fancybox\" data-mimetype=\"" + mimetype + "\" data-size=\"" + size + "\" data-filename=\"" + filename + "\" title=\"" + basename + "\" rel=\"g\" href=\"" + filename + "\"><img src=\".moar/screenshots/" + basename + ".jpg\"/><p>" + title + "</p></a>");
            if (resolution) {
                $video.attr("data-resolution", resolution);
            }
            $videos.append($video);

        } else if (SVG_EXTENSIONS.indexOf(extension) >= 0) {
            // SVG files
            $gallery.append("<a class=\"thumbnail fancybox svg\" title=\"" + basename + "\" rel=\"g\" href=\"" + url +"\"><object type=\"image/svg+xml\" data=\"" + filename + "\">Bam! No SVG support!</object><p>" + filename + "</p></a>");            
            
        } else if (JPEG_EXTENSIONS.indexOf(extension) >= 0) {
            // Photos
            basename = basename.toLowerCase();
            if (basename.substring(0,3) == "img") {
                basename = basename.replace("_", "");
            }
            $gallery.append("<a class=\"thumbnail fancybox jpeg\" title=\"" + basename + "\" rel=\"g\" href=\".moar/scaled/" + url +"\"><img src=\".moar/thumbs/" + filename + "\"/><p>" + filename + "</p></a>");
            
        } else if (IMAGE_EXTENSIONS.indexOf(extension) >= 0) {
            // Other images
            basename = basename.toLowerCase();
            if (basename.substring(0,3) == "img")
                basename = basename.replace("_", "");
            $gallery.append("<a class=\"thumbnail fancybox\" title=\"" + basename + "\" rel=\"g\" href=\"" + url +"\"><img src=\"" + filename + "\"/><p>" + filename + "</p></a>");
            
        } else if (SUBTITLE_EXTENSIONS.indexOf(extension) >= 0) {
            console.log("Ignoring subtitle:", filename);
            
        } else if (PLAYLIST_EXTENSIONS.indexOf(extension) >= 0) {
            console.log("Ignoring playlist:", filename);
            
        } else if (CHECKSUM_EXTENSIONS.indexOf(extension) >= 0) {
            console.log("Ignoring checksum file:", filename);

        } else if (BYTECODE_EXTENSIONS.indexOf(extension) >= 0) {
            console.log("Ignoring bytecode file:", filename);


        } else {
            $otherFiles.append("<a class=\"otherFile\" title=\"" + basename + "\" rel=\"g\" href=\"" + url +"\" style=\"background-image: url('" + icon + "');\">" + filename + "</a>");
            console.log("Uncategorized:", filename, size, date);
        }

    }

    
    if ($directories.children().size() > 0) {
        $("#directories").show();
    } else {
        $("#directories").hide();
        console.info("No directories listed");
    }
    
    if ($gallery.children().size() > 0) {
        // Insert gallery
        $("#gallery").show();
        $(".fancybox").fancybox({openEffect:'none', closeEffect:'none', nextEffect:'none', prevEffect:'none'});
        $(".lazy").unveil();
        $(".gallery .thumbnail img").error(function(e) {
            var $img = $(e.target);
            console.log("Failed to load thumbnail:", $img.attr("src"));
            $img.attr("src", $img.attr("src").replace(".moar/thumbs/", ""));
            $img.parent().attr("href", $img.attr("src").replace(".moar/thumbs/", ""));
        });
        
    } else {
        $("#gallery").hide();
        console.info("No images listed");
    }
    

    var fileCount = $items.length - directoryCount;

    
    $("#actions .directory .directory_count").html("<p>" + (directoryCount ? sprintf(_("%d directories"), directoryCount) : _("No directories")) + "</p>");
    console.log("Total size:", totalSize, "becomes", humanize(totalSize));
    $("#actions .directory .file_count").html("<p>" + sprintf(_("%s in %d files"), humanize(totalSize), fileCount) + "</p>");


    $("#actions .directory .action.wget.recurse").hide();
    $("#actions .directory .action.wget.recurse").click(function(e) {
        var level = window.PATH_COMPONENTS.length;
        var cmd = "wget --no-check-certificate --cut-dirs=" + level + " -c -r -nH -np -R \"index.html*\" ";
        if (window.PATH_COMPONENTS[1] != "Public") {
            cmd += "--ask-password ";
        }
        alert(cmd + window.location);
    }).show();

    if ($videos.children().size() == 0) {
        $("#videos").hide();
        console.info("No videos listed");
    } else {
        $("#videos").show();
        console.info("Default video file action is now: watch in browser");
        $("#actions .action.watch.video").show();
        $("#actions .action.watch.video").click(function(e) {
            playVideoFile($(".videos .thumbnail").first());
        });

        // Clicking on video
        $("#videos .thumbnail").click(function(e) {
        
            playVideoFile($(this));

            $("#actions .section.video").show();
            $("#actions .section.file").show();
            $("#actions .section.file .action.download a").attr("href", encodeURIComponent(this.dataset.filename));
            $("#actions .section.file .size").html("File size: " + humanize(this.dataset.size));
            $("#actions .section.file .mimetype").html("Mimetype: " + this.dataset.mimetype);
            
            console.log("Going to show video metadata");
            e.preventDefault();
            
            var metadata = window.VIDEO_METADATAS[this.dataset.filename];
            
            if (metadata) {
                var resolution = metadata.video.width + "x" + metadata.video.height
                if (metadata.video.width == 1920 && metadata.video.height <= 1080 || metadata.video.width < 1920 && metadata.video.height == 1080) {
                    resolution = "1080p (" + resolution + ")";
                } else if (metadata.video.width == 1280 && metadata.video.height <= 720 || metadata.video.width < 1280 && metadata.video.height == 720) {
                    resolution = "720p (" + resolution + ")";
                }
                
                var duration = humanize_duration(metadata.duration);
                var audio_codec = metadata.audio.codec;
                
                if (audio_codec == "dca") {
                    audio_codec = "DTS";
                } else if (audio_codec == "ac3") {
                    audio_codec = "AC3";
                }
                
                var video_codec = metadata.video.codec;
                
                
            } else {
                var resolution = e.target.dataset.resolution;
                var audio_codec = e.target.dataset.audio_codec;
                var video_codec = e.target.dataset.video_codec + "p";
                var duration = null;
            }
            


            if (duration) {
                $("#actions .video.section .duration").html("Duration: " + duration);
                $("#actions .video.section .duration").show();
            } else {
                $("#actions .video.section .duration").hide();
            }


            if (resolution) {
                $("#actions .video.section .resolution").html("Resolution: " + resolution);
                $("#actions .video.section .resolution").show();
            } else {
                $("#actions .video.section .resolution").hide();
            }
                
            if (video_codec && audio_codec) {
                $("#actions .video.section .codec").html("Codecs: " + video_codec + "/" + audio_codec);
                $("#actions .video.section .codec").show();
            } else {
                $("#actions .video.section .codec").hide();
            }

        });
        


        var video_xspf = ".moar/" + encodeURIComponent(window.PATH_COMPONENTS[window.PATH_COMPONENTS.length-1]) + ".xspf";   

        $.ajax(video_xspf).done(function(data) {
            console.info("Watch vides in VLC link provided via", video_xspf);
            $("#actions .directory .action.video.xspf").show();
            $("#actions .directory .action.video.xspf a").attr("href", video_xspf).show();
        }).error(function(data) {
            console.info("Failed to pull video playlist", video_xspf, " this means watch videos in VLC link is disabled");
        });
        
        // Pull .moar/video.json which contains video metadata
        window.VIDEO_METADATAS = {};
        $.ajax(".moar/video.json").done(function(data) {
            window.VIDEO_METADATAS = data;
        });
    }
    
    if ($tracks.children().size() == 0) {
        $("#tracks").hide();
        console.info("No audio tracks listed");
    } else {
        $("#tracks").show();
        
        console.info("Default audio track action is now: play in browser");
        $(".track").click(function(e) {
            e.preventDefault();
            playAudioTrack($(this), true);
        });
        $("#actions .action.play.audio").show();
        

        // Play audio tracks in browser -> show audio details
        $("#actions .action.play.audio").click(function(e) {
            playAudioTrack($("trackList .track").first(), true);
        });

        // Fetch audio XSPF playlist
        $.ajax("index.xspf").done(function(data) {

            var $trackMetadatas = $("playlist trackList track", data);

            for (var j = 0; j < $trackMetadatas.size(); j++) {

                var location = $trackMetadatas[j].getElementsByTagName("location")[0];
                var filename = location.innerHTML;

                // Decode escaped XML
                var filename = decodeURIComponent(location.innerHTML);
                if (filename.indexOf("/") >= 0) {
                    filename = filename.substring(filename.lastIndexOf("/") + 1);
                }
                
                // Escape quotes for jQuery
                filename = filename.replace("\"", "\\\"");
                
                var $track = $("trackList .track[data-filename=\"" + filename + "\"]");
                
                var $trackCreator = $("creator", $trackMetadatas[j]);
                var $trackTitle = $("title", $trackMetadatas[j]);
                var $trackAlbum = $("album", $trackMetadatas[j]);
                var $trackDuration = $("duration", $trackMetadatas[j]);
                var duration = parseInt($trackDuration.html()) / 1000;
                
                if ($trackCreator.html() && $trackTitle.html()) {
                    $track.empty();
                    var $trackNumber = $("trackNum", $trackMetadatas[j]);
                    if ($trackNumber.html() && $trackMetadatas.size() > 5) {
                        $track.append($trackNumber.clone());                
                        $track.append(". ");
                    }
                    $track.append($trackCreator.clone());
                    $track.append(" - ");
                    $track.append($trackTitle.clone());
                    
                    $track.attr("data-duration", duration);
                    $track.attr("data-title", $trackCreator.html() + " - " + $trackTitle.html());
                    
                    // Tooltip for audio tracks
                    $track.attr("title",
                        $trackTitle.html() + " (" +
                        humanize_duration(duration) + ") by " +
                        $trackCreator.html() + " on " +
                        $trackAlbum.html());

                }
            }


            $("#actions .directory .action.xspf.audio").show();
            $("#actions .directory .action.xspf.audio a").attr("href", "index.xspf");
        });
    }
    
    if ($otherFiles.children().size() == 0) {
        $("#otherFiles").hide();
        console.info("No other files listed");
    } else {
        $("#otherFiles").show();
    }

    /* Ajaxize directory links */    
    $(".directory.item").click(function(e) {
        e.preventDefault();
        
        $("html").addClass("busy");
        
        var path = $(this).attr("href");
        if (path.substring(0,1) != "/") {
            path = window.location.pathname + path;
        }

        console.info("Going to:", path);
        history.pushState(path, "", path);

        $("#list").load("//" + window.location.hostname + path + " #list", null, function() {
            enhance(path);
            $("html").removeClass("busy");
        });
    });


    setTimeout(function() {
        console.log("My body is ready");
        $("#loader").hide();
    }, 100);
}

function fallback() {
    $("#list").show();
    $("#loader").hide();
    return;
}

$(document).ready(function() {
    
    if (!window.localStorage) {
        console.info("Browser does not support localStorage!");
        fallback(); return;
    }
    
    if (window.location.pathname.indexOf(".moar") >= 0) {
        fallback(); return;
    }

    window.CURRENT_THEME = window.THEMES[window.THEMES.length-1];

    
    probeCodecs();
    
    window.onpopstate = function(event) {
        var path = event.state;
        if (path) {
            $("#list").load("//" + window.location.hostname + path + " #list", null, function() {
                enhance(path);
            });
        } else {
            console.info("History stack empty!");
        }

    };
    
    history.pushState(window.location.pathname, "", window.location.pathname);
    
    setTimeout(enhance, 150);

});



