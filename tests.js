ccNotifications.tests = {
  cookie: function () {
      Game.goldenCookie.spawn();
  },

  deer: function () {
    Game.seasonPopup.type = 'reindeer';
    Game.seasonPopup.spawn();
  },

  deerThenCookie: function (delay) {
    Game.seasonPopup.type = 'reindeer';
    Game.seasonPopup.spawn();
    setTimeout(function() {
      Game.goldenCookie.spawn();
    }, delay);
  },

  cookieThenDeer: function (delay) {
    Game.goldenCookie.spawn();
    setTimeout(function() {
      Game.seasonPopup.type = 'reindeer';
      Game.seasonPopup.spawn();
    }, delay);
  }
};

