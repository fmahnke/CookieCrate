ccEvents = {};

ccEvents.VERSION = '0.0.0';

ccEvents.GAME_DIV = document.getElementById('game');

ccEvents.GOLDEN_COOKIE_ONSCREEN = false;
ccEvents.GOLDEN_COOKIE_LAST_TICK = 0;
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

ccEvents.goldenCookieSecondsRemaining = function () {
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

ccEvents.events.goldenCookieEntered = function (priority, cookieType, secondsRemaining) {
  return new CustomEvent(
  "goldenCookieEntered", {
		detail: {
      priority: priority,
      cookieType: cookieType,
      secondsRemaining: secondsRemaining
		},
		bubbles: true,
		cancelable: true
	});
};

ccEvents.events.goldenCookieTick = function (priority, cookieType, secondsRemaining) {
  return new CustomEvent(
    "goldenCookieTick", {
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

ccEvents.events.comboPresent = function (priority, cookieType) {
  return new CustomEvent(
    "comboPresent", {
      detail: {
        priority: priority,
        cookieType: cookieType
      },
      bubbles: true,
      cancelable: true
    }
  );
};

ccEvents.checkReindeer = function () {
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

ccEvents.checkGoldenCookie = function () {
  if (ccEvents.GOLDEN_COOKIE_ONSCREEN === false) {
    if (Game.goldenCookie.life > 0) {
      ccEvents.GOLDEN_COOKIE_ONSCREEN = true;

      var secondsRemaining = ccEvents.goldenCookieSecondsRemaining();
      var goldenCookieEntered =
          ccEvents.events.goldenCookieEntered(0, ccEvents.cookieType(), secondsRemaining);

      ccEvents.eventStack.push(goldenCookieEntered);
    }
  } else {
    if (Game.goldenCookie.life <= 0) {
      ccEvents.GOLDEN_COOKIE_ONSCREEN = false;
      ccEvents.NOTIFIED_COMBO = false;
    }
  }
};

ccEvents.checkGoldenCookieTick = function () {
  var secondsRemaining = ccEvents.goldenCookieSecondsRemaining();

  if (ccEvents.GOLDEN_COOKIE_LAST_TICK === 0) {
    // First tick event for this golden cookie.
    ccEvents.GOLDEN_COOKIE_LAST_TICK = secondsRemaining;
  } else if (secondsRemaining < ccEvents.GOLDEN_COOKIE_LAST_TICK) {
    var tick = ccEvents.events.goldenCookieTick(0, ccEvents.cookieType(), secondsRemaining);
    ccEvents.eventStack.push(tick);

    ccEvents.GOLDEN_COOKIE_LAST_TICK = secondsRemaining;
  }
};

ccEvents.checkCombo = function () {
  var isCombo = ccEvents.GOLDEN_COOKIE_ONSCREEN === true && ccEvents.REINDEER_ONSCREEN === true;

  if (isCombo && ccEvents.NOTIFIED_COMBO === false) {
    var comboEvent = ccEvents.events.comboPresent(1, ccEvents.cookieType());

    ccEvents.eventStack.push(comboEvent);

    ccEvents.NOTIFIED_COMBO = true;
  }
};

ccEvents.loop = function () {
  ccEvents.checkReindeer();
  ccEvents.checkGoldenCookie();
  ccEvents.checkGoldenCookieTick();
  ccEvents.checkCombo();

  ccEvents.dispatch();
};

ccEvents.cookieClickerGameLoop = Game.Loop;

Game.Loop = function () {
  ccEvents.cookieClickerGameLoop();
  ccEvents.loop();
};

