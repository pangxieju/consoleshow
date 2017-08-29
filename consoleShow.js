/*!
 *  consoleShow v1.0.0 By pangxieju
 *  Github: https://github.com/pangxieju/consoleShow
 *  MIT Licensed.
 */
var consoleShow = {
  settings: {
    hide: [],
    show: [],
    extend: [],
    clear: false
  },
  config: function(config) {
    if (!(window.console && window.console.log)) return;

    var defaultExtend = [
      {
        name: "test",
        color: "#ddd"
      },
      {
        name: "event",
        color: "#fff3cf"
      },
      {
        name: "api",
        type: "table",
        color: "#cfefdf"
      },
      {
        name: "block",
        color: "#fcdbd9"
      }
    ];
    var settings = this.settings;
    for (var i in config) {
      if (config.hasOwnProperty(i)) {
        settings[i] = config[i];
      }
    }

    settings.urlShow = this.methods.getParameterByName("console.show") || "";
    settings.urlHide = this.methods.getParameterByName("console.hide") || "";

    if (!settings.extend && settings.extend.length === 0) {
      settings.extend = defaultExtend;
    } else {
      settings.extend = defaultExtend.concat(settings.extend);
    }

    !settings.clear || console.clear();

    this.init();

    window.onhashchange = function() {
      window.location.reload();
    };
  },
  init: function() {
    var methods = this.methods;
    var settings = this.settings;
    var consoleKey = methods.getConsoleKey();
    try {
      console["config"] = function(config) {
        this.configs = config;
        return this;
      };

      //////////////////////////////////////////////////////////////////////////
      var extend = this.settings.extend;
      var member = {};
      var config = {};

      for (var i = 0; i < extend.length; i++) {
        member = extend[i];
        member.name = consoleKey.indexOf(member.name) !== -1 ? "test" : member.name;

        (function(name, color, type) {
          console[name] = function() {
            if (methods.filterConsole(settings, name)) {
              this.configs = {};
              return;
            }

            if (this.configs === undefined) this.configs = {};

            config = {
              name: this.configs.name || name || "test",
              type: this.configs.type || type || "log",
              color: this.configs.color || color || "#ddd"
            };

            this.group("%c" + config.name, methods.outputStyle(config.color));

            if (config.name === "api" && typeof arguments[0] === "string") {
              config.type = "log";
            };

            this[config.type].apply(this, arguments);
            this.groupEnd();

            this.configs = {};
            return this;
          };
        })(
          member.name,
          member.color,
          member.type
        );
      }

      //////////////////////////////////////////////////////////////////////////
      console["color"] = function (content, color) {
        if (content === "") return;

        color = color || "#f60";
        this.log("%c" + content, "color:" + color);
      };

      //////////////////////////////////////////////////////////////////////////
      console["plus"] = function(param) {
        var name = param.name || "test";
        if (methods.filterConsole(settings, name)) return;

        var type = consoleKey.indexOf(param.type) !== -1 ? this[param.type] : this.log;

        this.group("%c" + name, methods.outputStyle("#d2eafb"));

        switch (typeof param.content) {
          case "function":
            param.content();
            break;
          case "object":
            type(param.content);
            break;
          case "string":
            if (param.type === "table") {
              this.log(param.content);
            } else {
              type(param.content);
            }
            break;
          default:
            this.log(param.content);
            break;
        }

        this.groupEnd();
      };
    } catch (err) {
      console.warn(err);
    }
  },
  methods: {
    getConsoleKey: function () {
      var consoleKey = [];
      for (var key in console) {
        consoleKey.push(key);
      }
      return consoleKey || [];
    },
    filterConsole: function (settings, name) {
      var urlShow = settings.urlShow;
      var urlHide = settings.urlHide;

      var showData = settings.show;
      var hideData = settings.hide;

      if (urlShow || urlHide) {
        showData = urlShow && urlShow.split(",");
        hideData = urlHide && urlHide.split(",");
      }

      var showNum = showData ? showData.length : 0;
      // Match name.
      function isName(data, name) {
        if (data.indexOf(name) !== -1) return true;
        for (var i = 0; i < data.length; i++) {
          if (data[i] !== "" && name.toString().indexOf(data[i]) !== -1) return true;
        }
        return false;
      };

      // Set up hide name.
      if (showNum === 0 && isName(hideData, name)) return true;

      // Set up show name.
      if (showNum !== 0 && !isName(showData, name)) return true;

      return false;
    },
    setColorRgb: function (sColor) {
      var reg = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
      sColor = sColor.toLowerCase();
      if (sColor && reg.test(sColor)) {
        if (sColor.length === 4) {
          var sColorNew = "#";
          for (var i = 1; i < 4; i += 1) {
            sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
          }
          sColor = sColorNew;
        }
        var sColorChange = [];
        for (var ii = 1; ii < 7; ii += 2) {
          sColorChange.push(parseInt("0x" + sColor.slice(ii, ii + 2)));
        }
        return sColorChange.join(",");
      } else {
        return sColor;
      }
    },
    outputStyle: function (color) {
      return 'margin: 0 0 0 -24px;' +
      'padding: 3px 30px 1px 24px;' +
      'border: 1px solid ' + color + ';' +
      'background-color: rgba(' + this.setColorRgb(color) + ', 0.45);' +
      'border-radius: 0 10px 10px 0;' +
      'font-weight: 600;color: #666;' +
      'text-transform: capitalize';
    },
    getParameterByName: function (name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
      var results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
  }
};
window.consoleShow = consoleShow;
