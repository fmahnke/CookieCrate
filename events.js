ccEvents = {};

ccEvents.VERSION = '0.0.0';

ccEvents.GAME_DIV = document.getElementById('game');

ccEvents.COOKIE_ONSCREEN = false;
ccEvents.COOKIE_LAST_TICK_SECONDS = 0;
ccEvents.REINDEER_ONSCREEN = false;
ccEvents.NOTIFIED_COMBO = false;

ccEvents.WRATH_COOKIE_TYPE = 'wrath';
ccEvents.GOLDEN_COOKIE_TYPE = 'golden';

ccEvents.LOG_LEVELS = {
  DEBUG: {num: 0, name: "DEBUG"}
};
ccEvents.LOG_LEVEL = 1;

ccEvents.eventStack = [];

ccEvents.cookieType = function () {
  return (Game.goldenCookie.wrath === 1) ? ccEvents.WRATH_COOKIE_TYPE : ccEvents.GOLDEN_COOKIE_TYPE;
};

ccEvents.cookieSecondsRemaining = function () {
  return Math.ceil(Game.goldenCookie.life / Game.fps);
};

ccEvents.dispatch = function () {
  while (ccEvents.eventStack.length > 0) {
    var event = ccEvents.eventStack.shift();

    ccEvents.log('Dispatching event' + ' ' + event.type, ccEvents.LOG_LEVELS.DEBUG);

    ccEvents.GAME_DIV.dispatchEvent(event);

    if (event.detail.priority > 0) {
      ccEvents.log('Received event with priority' + ' ' + event.priority,
        ccEvents.LOG_LEVELS.DEBUG);
    }
  }
};

ccEvents.log = function (message, level) {
  if (level.num >= ccEvents.LOG_LEVEL) {
    console.log('ccEvents' + ' ' + level.name + ' ' + ':' + ' ' +  message);
  }
};

ccEvents.events = {};

ccEvents.events.researchComplete = function (priority, name) {
  return new CustomEvent(
    "researchComplete", {
      detail: {
        priority: priority,
        name: name
      },
      bubbles: true,
      cancelable: true
    });
};

ccEvents.events.cookieEntered = function (priority, cookieType, secondsRemaining) {
  return new CustomEvent(
    "cookieEntered", {
      detail: {
        priority: priority,
        cookieType: cookieType,
        secondsRemaining: secondsRemaining
      },
      bubbles: true,
      cancelable: true
    });
};

ccEvents.events.cookieTick = function (priority, cookieType, secondsRemaining) {
  return new CustomEvent(
    "cookieTick", {
      detail: {
        priority: priority,
        cookieType: cookieType,
        secondsRemaining: secondsRemaining
      },
      bubbles: true,
      cancelable: true
    }
  );
};

ccEvents.events.reindeerEntered = function (priority) {
  return new CustomEvent(
    "reindeerEntered", {
      detail: {
        priority: priority
      },
      bubbles: true,
      cancelable: true
    }
  );
};

ccEvents.events.comboEntered = function (priority, cookieType) {
  return new CustomEvent(
    "comboEntered", {
      detail: {
        priority: priority,
        cookieType: cookieType
      },
      bubbles: true,
      cancelable: true
    }
  );
};

ccEvents.checkResearchComplete = function () {
  if (Game.researchT === 0 && Game.nextResearch) {
    // Some research was in progress and it just finished.

    var name = Game.UpgradesById[Game.nextResearch].name;

    var researchComplete = ccEvents.events.researchComplete(0, name);

    ccEvents.eventStack.push(researchComplete);
  }
};

ccEvents.checkReindeerEntered = function () {
  if (ccEvents.REINDEER_ONSCREEN === false) {
    if (Game.season === 'christmas' && Game.seasonPopup.life > 0) {
      ccEvents.REINDEER_ONSCREEN = true;

      var reindeerEntered = ccEvents.events.reindeerEntered(0);

      ccEvents.eventStack.push(reindeerEntered);
    }
  } else {
    if (Game.seasonPopup.life <= 0) {
      ccEvents.REINDEER_ONSCREEN = false;
      ccEvents.NOTIFIED_COMBO = false;
    }
  }
};

ccEvents.checkCookieLeft = function () {
  if (ccEvents.COOKIE_ONSCREEN === true) {
    if (Game.goldenCookie.life <= 0) {
      ccEvents.COOKIE_ONSCREEN = false;
      ccEvents.NOTIFIED_COMBO = false;
    }
  }
};

ccEvents.checkCookieEntered = function () {
  if (ccEvents.COOKIE_ONSCREEN === false) {
    if (Game.goldenCookie.life > 0) {
      var secondsRemaining = ccEvents.cookieSecondsRemaining();

      ccEvents.COOKIE_LAST_TICK_SECONDS = secondsRemaining;
      ccEvents.COOKIE_ONSCREEN = true;

      var cookieEntered = ccEvents.events.cookieEntered(0, ccEvents.cookieType(), secondsRemaining);

      ccEvents.eventStack.push(cookieEntered);
    }
  }
};

ccEvents.checkCookieTick = function () {
  if (ccEvents.COOKIE_ONSCREEN === true) {
    var secondsRemaining = ccEvents.cookieSecondsRemaining();

    if (secondsRemaining < ccEvents.COOKIE_LAST_TICK_SECONDS) {
      var tick = ccEvents.events.cookieTick(0, ccEvents.cookieType(), secondsRemaining);
      ccEvents.eventStack.push(tick);

      ccEvents.COOKIE_LAST_TICK_SECONDS = secondsRemaining;
    }
  }
};

ccEvents.checkComboEntered = function () {
  var isCombo = ccEvents.COOKIE_ONSCREEN === true && ccEvents.REINDEER_ONSCREEN === true;

  if (isCombo && ccEvents.NOTIFIED_COMBO === false) {
    var comboEvent = ccEvents.events.comboEntered(1, ccEvents.cookieType());

    ccEvents.eventStack.push(comboEvent);

    ccEvents.NOTIFIED_COMBO = true;
  }
};

ccEvents.eventProcessingLoop = function () {
  ccEvents.checkResearchComplete();
  ccEvents.checkReindeerEntered();
  ccEvents.checkCookieLeft();
  ccEvents.checkCookieEntered();
  ccEvents.checkCookieTick();
  ccEvents.checkComboEntered();

  ccEvents.dispatch();
};

ccEvents.existingGameLoop = Game.Loop;

Game.Loop = function () {
  ccEvents.eventProcessingLoop();
  ccEvents.existingGameLoop();
};

