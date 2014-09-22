ccEvents = {};

ccEvents.GAME_DIV = document.getElementById('game');

ccEvents.GOLDEN_COOKIE_ONSCREEN = false;
ccEvents.GOLDEN_COOKIE_LAST_TICK = 0;
ccEvents.REINDEER_ONSCREEN = false;
ccEvents.NOTIFIED_COMBO = false;

ccEvents.WRATH_COOKIE_TYPE = 'wrath';
ccEvents.GOLDEN_COOKIE_TYPE = 'golden';

ccEvents.LOOP_INTERVAL_MS = 100;  // Delay between loop execution
ccEvents.NEXT_LOOP_TIME = Game.time;

ccEvents.LOG_LEVELS = {
  DEBUG: {num: 0, name: "DEBUG"}
};
ccEvents.LOG_LEVEL = 0;

ccEvents.eventStack = [];

ccEvents.goldenCookieSecondsRemaining = function () {
  return Math.ceil(Game.goldenCookie.life / Game.fps);
};

ccEvents.updateNextLoopTime = function () {
  return Game.time + ccEvents.LOOP_INTERVAL_MS;
};

ccEvents.dispatch = function () {
  ccEvents.eventStack.sort(function (a, b) {
    return b.priority > a.priority;
  });

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
  if (Game.time >= ccEvents.NEXT_LOOP_TIME) {
    ccEvents.checkReindeer();
    ccEvents.checkGoldenCookie();
    ccEvents.checkGoldenCookieTick();
    ccEvents.checkCombo();
    ccEvents.dispatch();

    ccEvents.NEXT_LOOP_TIME = ccEvents.updateNextLoopTime();
  }
};

ccEvents.cookieClickerGameLoop = Game.Loop;

Game.Loop = function () {
  ccEvents.cookieClickerGameLoop();
  ccEvents.loop();
};

ccNotifications = {};

ccNotifications.EVENT_PROCESSING_INTERVAL_MS = 100;
ccNotifications.EXPIRE_WARNING_SECONDS = 10;

ccNotifications.GOLDEN_COOKIE_ICON_URL =
    'http://orteil.dashnet.org/cookieclicker/img/goldCookie.png';
ccNotifications.WRATH_COOKIE_ICON_URL =
    'http://orteil.dashnet.org/cookieclicker/img/wrathCookie.png';
ccNotifications.REINDEER_ICON_URL =
    'http://orteil.dashnet.org/cookieclicker/img/frostedReindeer.png';

ccNotifications.nextEventProcessingTime = 0;

ccNotifications.incomingEvents = [];

ccNotifications.updateNextEventProcessingTime = function () {
  ccNotifications.nextEventProcessingTime = Game.time +
      ccNotifications.EVENT_PROCESSING_INTERVAL_MS;
};

ccNotifications.cookieIconUrl = function (cookieType) {
  if (cookieType === 'golden') {
    return ccNotifications.GOLDEN_COOKIE_ICON_URL;
  } else if (cookieType === 'wrath') {
    return ccNotifications.WRATH_COOKIE_ICON_URL;
  } else {
    return null;
  }
};

ccNotifications.reindeerEntered = function () {
  var notification = new Notification('Reindeer spawned', {
    icon: ccNotifications.REINDEER_ICON_URL,
    tag: 'reindeer'
  });
};

ccNotifications.goldenCookieEntered = function (event) {
  var cookieType = event.detail.cookieType;
  var secondsRemaining = event.detail.secondsRemaining;
  var iconUrl = ccNotifications.cookieIconUrl(cookieType);
      
  var notification = new Notification(cookieType + ' ' + 'cookie spawned', {
    body: secondsRemaining + ' ' + 'seconds remaining',
    icon: iconUrl,
    tag: 'cookie'
  });
};

ccNotifications.comboPresent = function (event) {
  console.log('combo134234');
  var cookieType = event.detail.cookieType;

  var notification = new Notification(cookieType + ' ' + 'and reindeer combo!', {
    tag: 'combo'
  });
};

ccNotifications.goldenCookieExpire = function (event) {
  var cookieType = event.detail.cookieType;
  var secondsRemaining = event.detail.secondsRemaining;

  if (secondsRemaining < ccNotifications.EXPIRE_WARNING_SECONDS) {
    var notification = new Notification(cookieType + ' ' + 'cookie expiring!', {
      body: secondsRemaining + ' ' + 'seconds remaining',
      tag: 'expire'
    });
  }
};

ccNotifications.listeners = {
  reindeerEntered: {name: 'reindeerEntered', handler: ccNotifications.reindeerEntered},
  goldenCookieEntered: {name: 'goldenCookieEntered', handler: ccNotifications.goldenCookieEntered},
  comboPresent: {name: 'comboPresent', handler: ccNotifications.comboPresent},
  goldenCookieTick: {name: 'goldenCookieTick', handler: ccNotifications.goldenCookieExpire}
};

ccNotifications.eventHandler = function (event) {
  ccNotifications.incomingEvents.push(event);
};

ccNotifications.processEvents = function () {
  if (Game.time >= ccNotifications.nextEventProcessingTime) {
    if (ccNotifications.incomingEvents.length > 0) {
      ccNotifications.incomingEvents.sort(function (a, b) {
        return b.priority > a.priority;
      });

      var nextEvent = ccNotifications.incomingEvents.shift();
      var handler = ccNotifications.listeners[nextEvent.type].handler;

      handler(nextEvent);
    }

    ccNotifications.updateNextEventProcessingTime();
  }
};

ccNotifications.addListener = function (listener) {
  document.addEventListener(listener.name, ccNotifications.eventHandler, false);
};

ccNotifications.removeListener = function (listener) {
  document.removeEventListener(listener.name, ccNotifications.eventHandler, false);
};

ccNotifications.notify = function () {
  if (!window.Notification) {
    alert('Notifications are not supported in this browser.');
    return;
  }

  if (Notification.permission !== 'denied') {
    Notification.requestPermission(function () {
      ccNotifications.addListener(ccNotifications.listeners.reindeerEntered);
      ccNotifications.addListener(ccNotifications.listeners.goldenCookieEntered);
      ccNotifications.addListener(ccNotifications.listeners.comboPresent);
      ccNotifications.addListener(ccNotifications.listeners.goldenCookieTick);
    });
  }
};

ccNotifications.notify();

ccNotifications.previousLoop = Game.Loop;

Game.Loop = function () {
  ccNotifications.previousLoop();
  ccNotifications.processEvents();
};
