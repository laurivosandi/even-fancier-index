# Even fancier index
Some HTML/CSS/JS for building nice looking nginx fancyindex.
[See it in action](http://lauri.vosandi.com/8bp/)

##Features

* Dynamic breadcrumb generator
* Image preview with [fancybox](http://fancybox.net/)
* Preliminary SVG support in thumbnail view
* XSPF playlist generator for playing audio and video using VLC
* Preliminary in-browser playback for browser-supported formats

##Install

Clone the repository:

```bash
git clone \
  https://github.com/laurivosandi/even-fancier-index \
  /var/www/even-fancier-index/
```

Reconfigure site in /etc/nginx/sites-enabled/blah:

```nginx
fancyindex on;
fancyindex_exact_size off;
fancyindex_header /even-fancier-index/html/header.html;
fancyindex_footer /even-fancier-index/html/footer.html;

location /even-fancier-index/ {
    alias /var/www/even-fancier-index/;
}
```

