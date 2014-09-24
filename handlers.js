ccNotifications = {};

ccNotifications.VERSION = '0.0.1';

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
  reindeerEntered: {
    myname: 'reindeerEntered',
    name: 'reindeerEntered',
    handler: ccNotifications.reindeerEntered,
    label: 'Reindeer appeared'
  },
  cookieEntered: {
    myname: 'cookieEntered',
    name: 'cookieEntered',
    handler: ccNotifications.cookieEntered,
    label: 'Golden/wrath cookie appeared'
  },
  comboEntered: {
    myname: 'comboEntered',
    name: 'comboEntered',
    handler: ccNotifications.comboEntered,
    label: 'Golden/wrath cookie and reindeer combo!!'
  },
  cookieExpiring: {
    myname: 'cookieExpiring',
    name: 'cookieTick',
    handler: ccNotifications.cookieExpire,
    label: 'Golden/wrath cookie expiring soon'
  }
};

ccNotifications.activeListeners = {
  reindeerEntered: [],
  cookieEntered: [],
  comboEntered: [],
  cookieTick: []
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

      if (ccNotifications.activeListeners.hasOwnProperty(nextEvent.type)) {
        var listeners = ccNotifications.activeListeners[nextEvent.type];

        listeners.forEach(function (listener) {
          listener.handler(nextEvent);
        });
      }
    }
  }
  ccNotifications.incomingEvents = [];
};

ccNotifications.addListener = function (listener) {
  var eventType = listener.name;
  var eventName = listener.myname;
  var list = ccNotifications.activeListeners;

  if (list.hasOwnProperty(eventType)) {
    var events = list[eventType];

    var filtered = events.filter(function (event) {
      return (event.myname === eventName);
    });
    if (filtered.length <= 0) {
      ccNotifications.activeListeners[eventType].push(listener);
    }
  }

};

ccNotifications.removeListener = function (listener) {
  var eventType = listener.name;
  var eventName = listener.myname;
  var list = ccNotifications.activeListeners;

  for (var key in list) {
    if (list.hasOwnProperty(key)) {
      var events = list[key];

      var filtered = events.filter(function (event) {
        return (event.myname !== eventName);
      });
      ccNotifications.activeListeners[key] = filtered;
    }
  }

};

ccNotifications.notify = function () {
  if (!window.Notification) {
    alert('Notifications are not supported in this browser.');
    return;
  }

  if (Notification.permission !== 'denied') {
    Notification.requestPermission(function () {
      document.addEventListener('reindeerEntered', ccNotifications.eventHandler, false);
      document.addEventListener('cookieEntered', ccNotifications.eventHandler, false);
      document.addEventListener('comboEntered', ccNotifications.eventHandler, false);
      document.addEventListener('cookieTick', ccNotifications.eventHandler, false);
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
