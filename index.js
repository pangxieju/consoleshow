/*!
 *  consoleShow v1.3.0 By pangxieju
 *  Github: https://github.com/pangxieju/consoleshow
 *  MIT Licensed.
 */
var consoleshow = {
  settings: {
    hide: [],
    show: [],
    collapsed: true,
    extend: [],
    clear: false
  },
  config: function(config) {
    if (!(window.console && window.console.log)) return;

    // Default extended data.
    var defaultExtend = [
      {
        name: "test",
        color: "#ddd",
        group: true,
        code: false
      },
      {
        name: "event",
        color: "#ffffcc",
        group: true,
        code: false
      },
      {
        name: "api",
        color: "#ccffcc",
        group: true,
        code: false
      },
      {
        name: "block",
        color: "#ffcccc",
        group: true,
        code: false
      },
      {
        name: "data",
        color: "#ccccff",
        group: true,
        code: false
      },
      {
        name: "tag",
        type: "trace",
        color: "#66cccc",
        group: false,
        code: false
      },
      {
        name: "plus",
        type: "log",
        color: "#d2eafb",
        group: true,
        code: true
      }
    ];

    // Processing settings information.
    var settings = this.settings;

    for (var i in config) {
      if (config.hasOwnProperty(i)) {
        settings[i] = config[i];
      }
    }

    // Get Url parameters.
    var getUrlVal = this.methods.getUrlVal;
    var urlShow = getUrlVal("console.show");
    var urlHide = getUrlVal("console.hide");

    if (urlShow || urlHide) {
      settings.show = urlShow && urlShow.split(",") || [];
      settings.hide = urlHide && urlHide.split(",") || [];
    }

    var urlCollapsed = getUrlVal("console.collapsed");

    if (urlCollapsed || urlCollapsed === "") {
      settings.collapsed = true;
    } else {
      settings.collapsed = false;
    }

    // Processing extended information.
    if (!settings.extend && settings.extend.length === 0) {
      settings.extend = defaultExtend;
    } else {
      settings.extend = defaultExtend.concat(settings.extend);
    }

    !settings.clear || console.clear();

    // Listen for Url changes.
    window.onhashchange = function() {
      var hash = window.location.hash;
      !settings.clear || console.clear();

      if (
        hash.indexOf("console.show") !== -1 ||
        hash.indexOf("console.hide") !== -1 ||
        hash.indexOf("console.collapsed") !== -1
      ) {
        window.location.reload();
      }
    };

    // Initialization.
    this.init();
  },
  init: function () {
    var methods = this.methods;
    var settings = this.settings;
    var consoleKey = methods.getConsoleKey();

    try {
      var extend = this.settings.extend;
      var member = {};

      for (var i = 0; i < extend.length; i++) {
        var member = extend[i];

        member = {
          name: consoleKey.indexOf(member.name) !== -1 ? "test" : member.name,
          type: consoleKey.indexOf(member.type) !== -1 ? member.type : "log",
          color: member.color || "#ddd",
          group: member.group ? true : false,
          code: member.code ? true : false
        };

        (function (name, color, type, group, code) {
          console[name] = function () {
            var getConfig = methods.getConfig(arguments, member);

            // Filter name.
            if (methods.filterConsole(settings, name + getConfig.name)) return;

            if (!methods.isEmptyObject(getConfig)) {
              arguments.length = arguments.length - 1;

              if (getConfig.name) {
                name += " " + getConfig.name;
              }
            }

            type = getConfig.type || type;
            color = getConfig.color || color;
            group = getConfig.group || group;
            code = getConfig.code || code;

            var outputStyle = methods.outputStyle(color);

            if (group){
              if (settings.collapsed) {
                this.groupCollapsed("%c" + name, outputStyle);
              } else {
                this.group("%c" + name, outputStyle);
              }

              if (code) {
                for (var key in arguments) {
                  if (arguments.hasOwnProperty(key)) {
                    var codeBlock = arguments[key];

                    switch (typeof codeBlock) {
                      case "function":
                        codeBlock();
                        break;
                      case "object":
                        this[plus.type](codeBlock);
                        break;
                      case "string":
                        if (plus.type === "table") {
                          this.log(codeBlock);
                        } else {
                          this[plus.type](codeBlock);
                        }
                        break;
                      default:
                        this.log(codeBlock);
                        break;
                    }
                  }
                }
              } else {
                this[type].apply(this, arguments);
              }

              this.groupEnd();

            } else {
              var param = arguments;
              var outparam = [];

              for (var key in param) {
                if (param.hasOwnProperty(key)) {
                  outparam.push(param[key]);
                }
              }

              this[type]("%c" + name, outputStyle, outparam);
            }
          };
        })(
          member.name,
          member.color,
          member.type,
          member.group,
          member.code
        );
      }

      //////////////////////////////////////////////////////////////////////////

      console["color"] = function (content, color) {
        if (methods.filterConsole(settings, "color")) return;

        if (content === "") return;

        this.log("%c" + content, "color:" + (color || "#f60"));
      };

      //////////////////////////////////////////////////////////////////////////

      console["plus"] = function (param) {
        var plus = {
          name: param.name || "",
          type: consoleKey.indexOf(param.type) !== -1 ? param.type : "log",
          color: param.color || "#d2eafb",
          content: param.content
        };

        var name = 'plus' + ' ' + plus.name;

        if (methods.filterConsole(settings, name)) return;

        var outputStyle = methods.outputStyle(plus.color || "#d2eafb");

        if (settings.collapsed) {
          this.groupCollapsed("%c" + name, outputStyle);
        } else {
          this.group("%c" + name, outputStyle);
        }

        switch (typeof plus.content) {
          case "function":
            plus.content();
            break;
          case "object":
            this[plus.type](plus.content);
            break;
          case "string":
            if (plus.type === "table") {
              this.log(plus.content);
            } else {
              this[plus.type](plus.content);
            }
            break;
          default:
            this.log(plus.content);
            break;
        }

        this.groupEnd();
      };
    } catch (err) {
      console.warn(err);
    }
  },
  methods: {
    getConfig: function (param, config) {
      var paramLength = param.length;

      if (paramLength > 1 && param[paramLength - 1].config !== undefined) {
        var paramConfig = param[paramLength - 1].config;

        return paramConfig;
      }
      return {};
    },
    getConsoleKey: function () {
      var consoleKey = [];

      for (var key in console) {
        consoleKey.push(key);
      }

      return consoleKey || [];
    },
    isEmptyObject: function (obj) {
      for(var i in obj){
        return true;
      }
      return false;
    },
    filterConsole: function (settings, name) {
      var show = settings.show;
      var hide = settings.hide;
      var showNum = show ? show.length : 0;

      function isName(data, name) {
        if (data.indexOf(name) !== -1) return true;
        for (var i = 0; i < data.length; i++) {
          if (data[i] !== "" && name.toString().indexOf(data[i]) !== -1) return true;
        }
        return false;
      };

      if (showNum === 0) {
        if (isName(hide, name)) return true;
      } else {
        if (!isName(show, name)) return true;
      }

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
    getUrlVal: function (name, url) {
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
window.consoleshow = consoleshow;