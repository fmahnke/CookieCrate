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
  var subSectionTitle = subSection.childNodes[0];

  subSection.insertBefore(frag, subSectionTitle);

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

// This is not quite ready yet.

/*
Game.UpdateMenu = function () {
  ccNotifications.existingUpdateMenu();
  ccNotifications.updateMenu();
};
*/

