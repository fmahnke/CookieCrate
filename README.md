CookieCrate
===========

*Disclaimer*: This add-on is provided with no warranty. As with any new add-on, make a backup copy
of your game before using it. This is done in game with the Menu: Export Save function.

CookieCrate is a browser add-on for [Cookie Clicker](http://orteil.dashnet.org/cookieclicker/).

CookieCrate uses browser notifications to display interesting game events. Browser notifications are
displayed as popups on top of all active desktop windows, so important information will not be
missed if the game is played with the window in the background!

CookieCrate shows notifications for the following events:

* New golden/wrath cookie appeared.
* New reindeer appeared.
* Golden/wrath cookie and reindeer are both on screen (very useful for attempting the reindeer/elder frenzy combo).
* Golden/wrath cookie is about to disappear. A timer will count down when 10 seconds are remaining.

![Firefox notification image](http://fmahnke.github.io/CookieCrate/images/firefox_wrath_cookie_entered.png)

How To Use
----------

* Paste the following code into a new bookmark in your browser:

```javascript
javascript: (function () {
    Game.LoadMod('http://fmahnke.github.io/CookieCrate/index.js');
}());
```

* Load up [Cookie Clicker](http://orteil.dashnet.org/cookieclicker/).
* Click on your recently created bookmark.

* *IMPORTANT*: The first time CookieCrate is loaded, the browser will request permissions to display
notifications on behalf of orteil.dashnet.org. Notifications will only be shown if permission is
granted.

Supported Browsers
------------------

Tested and working with the latest versions of the following browsers at the time of writing:

* Chrome
* Firefox

