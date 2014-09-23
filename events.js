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

ccEvents.goldenCookieSecondsRemaining = function () {
  return Math.ceil(Game.goldenCookie.life / Game.fps);
};

ccEvents.dispatch = function () {
  while (ccEvents.eventStack.length > 0) {
    var event = ccEvents.eventStack.shift();

    event.event.detail.priority = event.priority;
    ccEvents.log('Dispatching event' + ' ' + event.event.type, ccEvents.LOG_LEVELS.DEBUG);

    ccEvents.GAME_DIV.dispatchEvent(event.event);

    if (event.priority > 0) {
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

ccEvents.events.goldenCookieEntered = function (cookieType, secondsRemaining) {
  return new CustomEvent(
  "goldenCookieEntered",
	{
		detail: {
      cookieType: cookieType,
      secondsRemaining: secondsRemaining
		},
		bubbles: true,
		cancelable: true
	});
};

ccEvents.events.goldenCookieTick = function (cookieType, secondsRemaining) {
  return new CustomEvent(
    "goldenCookieTick",
    {
      detail: {
        cookieType: cookieType,
        secondsRemaining: secondsRemaining
      },
      bubbles: true,
      cancelable: true
    }
  );
};

ccEvents.events.reindeerEntered = new CustomEvent(
  "reindeerEntered",
	{
    detail: {},
		bubbles: true,
		cancelable: true
	}
);

ccEvents.events.comboPresent = function (cookieType) {
  return new CustomEvent(
    "comboPresent",
    {
      detail: {
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
      ccEvents.eventStack.push({event: ccEvents.events.reindeerEntered, priority: 0});
    }
  } else {
    if (Game.seasonPopup.life <= 0) {
      ccEvents.REINDEER_ONSCREEN = false;
      ccEvents.NOTIFIED_COMBO = false;
    }
  }
};

ccEvents.cookieType = function () {
  return (Game.goldenCookie.wrath === 1) ? ccEvents.WRATH_COOKIE_TYPE : ccEvents.GOLDEN_COOKIE_TYPE;
};

ccEvents.checkGoldenCookie = function () {
  if (ccEvents.GOLDEN_COOKIE_ONSCREEN === false) {
    if (Game.goldenCookie.life > 0) {
      ccEvents.GOLDEN_COOKIE_ONSCREEN = true;

      var secondsRemaining = ccEvents.goldenCookieSecondsRemaining();
      var goldenCookieEnteredEvent =
          ccEvents.events.goldenCookieEntered(ccEvents.cookieType(), secondsRemaining);
      ccEvents.eventStack.push({event: goldenCookieEnteredEvent, priority: 0});
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
    var tickEvent = ccEvents.events.goldenCookieTick(ccEvents.cookieType(), secondsRemaining);
    ccEvents.eventStack.push({event: tickEvent, priority: 0});
    ccEvents.GOLDEN_COOKIE_LAST_TICK = secondsRemaining;
  }
};

ccEvents.checkCombo = function () {
  var isCombo = ccEvents.GOLDEN_COOKIE_ONSCREEN === true && ccEvents.REINDEER_ONSCREEN === true;

  if (isCombo && ccEvents.NOTIFIED_COMBO === false) {
    var comboEvent = ccEvents.events.comboPresent(ccEvents.cookieType());

    ccEvents.eventStack.push({event: comboEvent, priority: 1});

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

