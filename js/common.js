
function _(s) {
    return s;
}

function uuid4() {
    var text = "";
    var possible = "0123456789abcdef";

    for( var i=0; i < 32; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function humanize(size) {
    if (size > 1073741824) {
        return Math.round(size / 107374182.4) / 10.0 + " GB";
    } else if (size > 1048576) {
        return Math.round(size / 104857.6) / 10.0 + " MB"
    } else if (size > 1024) {
        return Math.round(size / 102.4) / 10.0 + " kB"
    } else {
        return size + _(" bytes")
    }
    
}

function humanize_duration(seconds) {
    var minutes = seconds / 60;
    var hours = seconds / 3600;
    return sprintf("%02d:%02d:%02d", hours, minutes % 60, seconds % 60);
}
