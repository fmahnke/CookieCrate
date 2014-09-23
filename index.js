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

ccNotifications = {};

ccNotifications.VERSION = '0.0.0';

ccNotifications.EVENT_PROCESSING_INTERVAL_MS = 100;
ccNotifications.EXPIRE_WARNING_SECONDS = 10;

ccNotifications.GOLDEN_COOKIE_ICON_URL =
    'http://orteil.dashnet.org/cookieclicker/img/goldCookie.png';
ccNotifications.WRATH_COOKIE_ICON_URL =
    'http://orteil.dashnet.org/cookieclicker/img/wrathCookie.png';
ccNotifications.REINDEER_ICON_URL =
    'http://orteil.dashnet.org/cookieclicker/img/frostedReindeer.png';
ccNotifications.ELDEER_ICON_URL =
    'http://orteil.dashnet.org/cookieclicker/img/imperfectCookie.png';

ccNotifications.DEFAULT_TIMEOUT_MS = 2000;

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

ccNotifications.createNotification = function (title, properties, duration) {
  var notification = new Notification(title, properties);
  setTimeout(function () { notification.close(); }, duration);
};

ccNotifications.reindeerEntered = function () {
  ccNotifications.createNotification('Reindeer spawned', {
    icon: ccNotifications.REINDEER_ICON_URL,
    tag: 'reindeer'
  }, ccNotifications.DEFAULT_TIMEOUT_MS);
};

ccNotifications.goldenCookieEntered = function (event) {
  var cookieType = event.detail.cookieType;
  var secondsRemaining = event.detail.secondsRemaining;
  var iconUrl = ccNotifications.cookieIconUrl(cookieType);
      
  ccNotifications.createNotification(cookieType + ' ' + 'cookie spawned', {
    body: secondsRemaining + ' ' + 'seconds remaining',
    icon: iconUrl,
    tag: 'cookie'
  }, ccNotifications.DEFAULT_TIMEOUT_MS);
};

ccNotifications.comboPresent = function (event) {
  var cookieType = event.detail.cookieType;

  ccNotifications.createNotification(cookieType + ' ' + 'and reindeer combo!', {
    icon: ccNotifications.ELDEER_ICON_URL,
    tag: 'combo'
  }, ccNotifications.DEFAULT_TIMEOUT_MS);
};

ccNotifications.goldenCookieExpire = function (event) {
  var cookieType = event.detail.cookieType;
  var secondsRemaining = event.detail.secondsRemaining;
  var iconUrl = ccNotifications.cookieIconUrl(cookieType);

  if (secondsRemaining < ccNotifications.EXPIRE_WARNING_SECONDS) {
    ccNotifications.createNotification(cookieType + ' ' + 'cookie expiring!', {
      body: secondsRemaining + ' ' + 'seconds remaining',
      icon: iconUrl,
      tag: 'expire'
    }, ccNotifications.DEFAULT_TIMEOUT_MS);
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
