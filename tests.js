ccNotifications.tests = {
  cookie: function () {
      Game.goldenCookie.spawn();
  },

  deer: function () {
    Game.season = 'christmas';
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
  },

  researchComplete: function () {
    Game.nextResearch = 65;
    Game.researchT = 0;
  }
};

