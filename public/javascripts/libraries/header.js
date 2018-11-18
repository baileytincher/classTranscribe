
//<!-- Piwik -->
//<script type="text/javascript">
  var _paq = _paq || [];

  // tracker methods like "setCustomDimension" should be called before "trackPageView"

  _paq.push(['enableHeartBeatTimer', '2']);


   _paq.push(['trackPageView']);

  (function() {
	/* Change this to the Piwik server*/
    var u;

    if (typeof(piwikServer) == "undefined") {
        console.log("Warning: piwikServer was not provided");
        u="//192.17.96.13:7002/";
    }
     else {
         u = "//" +  piwikServer + "/";
    }
//     var u="//192.17.96.13:7002/";

    _paq.push(['setSiteId', '1']);
    _paq.push(['setTrackerUrl', u+'piwik.php']);

    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
  })();
//</script>
//<!-- End Piwik Code -->

