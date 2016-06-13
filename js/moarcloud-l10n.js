window.l10n = {
    language: null,
    translations: {},
    
    merge: function(translations) {
        for (var language_code in translations) {
            if (!(language_code in this.translations)) {
                this.translations[language_code] = {};
            }
            for (var source_string in translations[language_code]) {
                this.translations[language_code][source_string] = translations[language_code][source_string];
            }
        }
    },
    
    get: function(source_string) {
        var translated_string = source_string;
        var append_colon = source_string.lastIndexOf(":") == source_string.length-1;
        if (append_colon) {
            source_string = source_string.substring(0, source_string.length-1);
        }
        
        if (window.l10n.language && window.l10n.language != "en" && window.l10n.translations[window.l10n.language] && window.l10n.translations[window.l10n.language][source_string]) {
            translated_string = window.l10n.translations[window.l10n.language][source_string];
        }
        if (append_colon) {
            translated_string += ":";
        }

        return translated_string;
    }
};

window._ = window.l10n.get

$(document).ready(function() {
    var language_code = navigator.language;
    if (language_code.indexOf("-") >= 0) {
        language_code = language_code.substring(0, language_code.indexOf("-"));

    }

    window.l10n.language = language_code;
    console.info("Locale language:", window.l10n.language);
    $(".i18n").each(function() {
        var innerHTML = $(this).html();
        $(this).attr("data-msgid-html", innerHTML);
        $(this).html(_(innerHTML));
        
        var tooltip = $(this).attr("title");
        if (tooltip) {
            $(this).attr("data-msgid-title", tooltip);
            $(this).attr("title", _(tooltip));
        }
    });
});

