ccNotifications = {};

ccNotifications.VERSION = '0.0.0';

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

ccNotifications.incomingEvents = [];

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

ccNotifications.cookieEntered = function (event) {
  var cookieType = event.detail.cookieType;
  var secondsRemaining = event.detail.secondsRemaining;
  var iconUrl = ccNotifications.cookieIconUrl(cookieType);
      
  ccNotifications.createNotification(cookieType + ' ' + 'cookie spawned', {
    body: secondsRemaining + ' ' + 'seconds remaining',
    icon: iconUrl,
    tag: 'cookie'
  }, ccNotifications.DEFAULT_TIMEOUT_MS);
};

ccNotifications.comboEntered = function (event) {
  var cookieType = event.detail.cookieType;

  ccNotifications.createNotification(cookieType + ' ' + 'and reindeer combo!', {
    icon: ccNotifications.ELDEER_ICON_URL,
    tag: 'combo'
  }, ccNotifications.DEFAULT_TIMEOUT_MS);
};

ccNotifications.cookieExpire = function (event) {
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
  cookieEntered: {name: 'cookieEntered', handler: ccNotifications.cookieEntered},
  comboEntered: {name: 'comboEntered', handler: ccNotifications.comboEntered},
  cookieTick: {name: 'cookieTick', handler: ccNotifications.cookieExpire}
};

ccNotifications.eventHandler = function (event) {
  ccNotifications.incomingEvents.push(event);
};

ccNotifications.removeRedundantEvents = function (incomingEvents) {
  var hasCombo = function () {
    var filtered = incomingEvents.filter(function (evt) {
      return (evt.type === 'comboEntered') ? true : false;
    });
    return (filtered.length >= 1) ? true : false;
  };

  if (hasCombo()) {
    return incomingEvents.filter(function (evt) {
      return (evt.type !== 'reindeerEntered' && evt.type !== 'cookieEntered');
    });
  }
  return incomingEvents;
};

ccNotifications.sortByPriority = function (a, b) {
  return b.priority > a.priority;
};

ccNotifications.processEvents = function () {
  if (ccNotifications.incomingEvents.length > 0) {
    // Process events in order of priority.
    ccNotifications.incomingEvents.sort(ccNotifications.sortByPriority);

    var eventsToProcess = ccNotifications.removeRedundantEvents(ccNotifications.incomingEvents);

    while (eventsToProcess.length > 0) {
      var nextEvent = eventsToProcess.shift();
      var handler = ccNotifications.listeners[nextEvent.type].handler;

      handler(nextEvent);
    }
  }
  ccNotifications.incomingEvents = [];
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
      ccNotifications.addListener(ccNotifications.listeners.cookieEntered);
      ccNotifications.addListener(ccNotifications.listeners.comboEntered);
      ccNotifications.addListener(ccNotifications.listeners.cookieTick);
    });
  }
};

ccNotifications.notify();

ccNotifications.previousLoop = Game.Loop;

Game.Loop = function () {
  ccNotifications.previousLoop();
  ccNotifications.processEvents();
};

Game.Notify('CookieCrate' + ' ' + ccNotifications.VERSION + ' ' + 'loaded.', '', '', 1);
