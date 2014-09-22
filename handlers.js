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
    tag: 'combo'
  }, ccNotifications.DEFAULT_TIMEOUT_MS);
};

ccNotifications.goldenCookieExpire = function (event) {
  var cookieType = event.detail.cookieType;
  var secondsRemaining = event.detail.secondsRemaining;

  if (secondsRemaining < ccNotifications.EXPIRE_WARNING_SECONDS) {
    ccNotifications.createNotification(cookieType + ' ' + 'cookie expiring!', {
      body: secondsRemaining + ' ' + 'seconds remaining',
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
