ccEvents = {};

ccEvents.VERSION = '0.2.0';

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

ccEvents.nextPopupTime = function (popup) {
  var elapsed = popup.time / Game.fps;

  var maxSec = popup.maxTime / Game.fps - elapsed;
  var minSec = popup.minTime / Game.fps - elapsed;

  return {
    maxSec: maxSec,
    minSec: minSec
  };
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

ccEvents.events.cookieEntered = function (priority, cookieType, secondsRemaining, reindeerTime) {
  return new CustomEvent(
    "cookieEntered", {
      detail: {
        priority: priority,
        cookieType: cookieType,
        secondsRemaining: secondsRemaining,
        reindeerTime: reindeerTime
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

ccEvents.events.reindeerEntered = function (priority, cookieTime) {
  return new CustomEvent(
    "reindeerEntered", {
      detail: {
        priority: priority,
        cookieTime: cookieTime
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

      var cookieTime = ccEvents.nextPopupTime(Game.goldenCookie);

      var reindeerEntered = ccEvents.events.reindeerEntered(0, cookieTime);

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

      var reindeerTime;

      if (Game.season === 'christmas') {
        reindeerTime = ccEvents.nextPopupTime(Game.seasonPopup);
      }

      var cookieEntered = ccEvents.events.cookieEntered(0, ccEvents.cookieType(), secondsRemaining, reindeerTime);

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

ccNotifications = {};

ccNotifications.VERSION = '0.2.0';

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
ccNotifications.LINE_SEP = '\n';

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

ccNotifications.researchComplete = function (event) {
  var name = event.detail.name;

  ccNotifications.createNotification('Research complete', {
    body: 'You have discovered' + ' ' + name,
    tag: 'researchComplete'
  });
};

ccNotifications.reindeerEntered = function (event) {
  var cookieTime = event.detail.cookieTime;
  var body;

  body = 'Cookie in' + ' ' + parseInt(cookieTime.minSec, 10) + ' ' + 'to' + ' ' +
    parseInt(cookieTime.maxSec, 10) + ' ' + 'seconds';

  ccNotifications.createNotification('Reindeer spawned', {
    body: body,
    icon: ccNotifications.REINDEER_ICON_URL,
    tag: 'reindeer'
  }, ccNotifications.DEFAULT_TIMEOUT_MS);
};

ccNotifications.cookieEntered = function (event) {
  var cookieType = event.detail.cookieType;
  var secondsRemaining = event.detail.secondsRemaining;
  var iconUrl = ccNotifications.cookieIconUrl(cookieType);
  var reindeerTime  = event.detail.reindeerTime;
      
  var body = secondsRemaining + ' ' + 'seconds remaining';

  if (reindeerTime) {
    body += ccNotifications.LINE_SEP + 'Reindeer in' + ' ' + parseInt(reindeerTime.minSec, 10) +
      ' ' + 'to' + ' ' + parseInt(reindeerTime.maxSec, 10) + ' ' + 'seconds';
  }

  ccNotifications.createNotification(cookieType + ' ' + 'cookie spawned', {
    body: body,
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
  researchComplete: {
    myname: 'researchComplete',
    name: 'researchComplete',
    handler: ccNotifications.researchComplete,
    label: 'Research complete'
  },
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
  researchComplete: [],
  reindeerEntered: [],
  cookieEntered: [],
  comboEntered: [],
  cookieTick: []
};

ccNotifications.eventHandler = function (event) {
  ccNotifications.incomingEvents.push(event);
};

ccNotifications.sortByPriority = function (a, b) {
  return b.priority > a.priority;
};

ccNotifications.processEvents = function () {
  if (ccNotifications.incomingEvents.length > 0) {
    // Process events in order of priority.
    ccNotifications.incomingEvents.sort(ccNotifications.sortByPriority);

    var eventsToProcess = ccNotifications.incomingEvents;

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
      document.addEventListener('researchComplete', ccNotifications.eventHandler, false);
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

ccNotifications.config = {};

ccNotifications.config.save = function (key, value) {
  localStorage.setItem('ccNotifications_' + key, JSON.stringify(value));
};

ccNotifications.config.load = function (key) {
  return JSON.parse(localStorage.getItem('ccNotifications_' + key));
};

ccNotifications.menu = {};

ccNotifications.menu.add = function () {
  var heading = function () {
    var div = document.createElement('div');
    div.className = 'title';
    div.textContent = 'Cookie Crate Notifications';

    return div;
  };

  var check = function (name, labelText, listener, toggleFunction) {
    var div = document.createElement('div');

    var input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;

    var label = document.createElement('label');
    label.textContent = labelText;

    div.appendChild(input);
    div.appendChild(label);

    input.checked = ccNotifications.config.load(name);
    input.listener = listener;

    input.onclick = function () {
      var state = input.checked;
      ccNotifications.config.save(name, state);
      toggleFunction(input.listener, state);
    };

    return div;
  };

	var frag = document.createDocumentFragment();
		
	frag.appendChild(heading());

  for (var key in ccNotifications.listeners) {
    if (ccNotifications.listeners.hasOwnProperty(key)) {
      var listener = ccNotifications.listeners[key];

      var checkBox = check(listener.myname, listener.label, listener, function (listener, state) {
        if (state === true) {
          ccNotifications.addListener(listener);
        } else {
          ccNotifications.removeListener(listener);
        }
      });

      frag.appendChild(checkBox);
    }
  }

  var subSection = l('menu').childNodes[2];
  var lastMenuIndex = subSection.childNodes.length;
  var lastMenu = subSection.childNodes[lastMenuIndex - 1];

  subSection.insertBefore(frag, lastMenu);
};

ccNotifications.initialize = function () {
  for (var key in ccNotifications.listeners) {
    if (ccNotifications.listeners.hasOwnProperty(key)) {
      var listener = ccNotifications.listeners[key];
      var name = listener.myname;

      var configValue = ccNotifications.config.load(name);

      if (configValue === null) {
        ccNotifications.config.save(name, true);
        configValue = true;
      }
      if (configValue === true) {
        ccNotifications.addListener(listener);
      }
    }
  }
};

ccNotifications.updateMenu = function () {
  if (Game.onMenu === 'prefs') {
    ccNotifications.menu.add();
  }
};

ccNotifications.existingUpdateMenu = Game.UpdateMenu;

ccNotifications.initialize();

Game.UpdateMenu = function () {
  ccNotifications.existingUpdateMenu();
  ccNotifications.updateMenu();
};

