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

    var defaultExtend = [
      {
        name: "test",
        color: "#ddd",
        group: true
      },
      {
        name: "event",
        color: "#ffffcc",
        group: true
      },
      {
        name: "api",
        color: "#ccffcc",
        group: true
      },
      {
        name: "block",
        color: "#ffcccc",
        group: true
      },
      {
        name: "data",
        color: "#ccccff",
        group: true
      },
      {
        name: "tag",
        type: "trace",
        color: "#66cccc",
        group: false
      }
    ];

    var settings = this.settings;

    for (var i in config) {
      if (config.hasOwnProperty(i)) {
        settings[i] = config[i];
      }
    }

    var getParamVal = this.methods.getParamVal;
    settings.urlShow = getParamVal("console.show") || "";
    settings.urlHide = getParamVal("console.hide") || "";

    if (!settings.extend && settings.extend.length === 0) {
      settings.extend = defaultExtend;
    } else {
      settings.extend = defaultExtend.concat(settings.extend);
    }

    !settings.clear || console.clear();

    window.onhashchange = function() {
      var hash = window.location.hash;
      !settings.clear || console.clear();

      if (hash.indexOf("console.show") !== -1 || hash.indexOf("console.hide") !== -1) {
        window.location.reload();
      }
    };

    this.init();
  },
  init: function() {
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
          type: member.type || "log",
          color: member.color || "#ddd",
          group: member.group ? true : false
        };

        (function(name, color, type, group) {
          console[name] = function() {
            var getConfig = methods.getConfig(arguments, member);

            if (methods.filterConsole(settings, name + getConfig.name)) return;

            if (getConfig) {
              arguments.length = arguments.length - 1;

              if (getConfig.name) {
                name += " " + getConfig.name
              }
            } 

            type = getConfig.type || type;
            color = getConfig.color || color;
            group = getConfig.group || group;

            var outputStyle = methods.outputStyle(color);

            if (group){
              if (settings.collapsed) {
                this.groupCollapsed("%c" + name, outputStyle);
              } else {
                this.group("%c" + name, outputStyle);
              }

              this[type].apply(this, arguments);

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
          member.group
        );
      }

      //////////////////////////////////////////////////////////////////////////

      console["color"] = function (content, color) {
        if (methods.filterConsole(settings, "color")) return;

        if (content === "") return;

        this.log("%c" + content, "color:" + (color || "#f60"));
      };

      //////////////////////////////////////////////////////////////////////////

      // console["tag"] = function (content, color) {
      //   if (methods.filterConsole(settings, "color")) return;

      //   if (content === "") return;
      //   this.trace(
      //     "%c" + "tag",
      //     methods.outputStyle(color || "#66cccc"), 
      //     (function (){
      //       return content;
      //     })()
      //   );
      //   // this.trace(content);
      // };

      //////////////////////////////////////////////////////////////////////////

      console["plus"] = function(param) {
        var plus = {
          name: param.name || "",
          type: consoleKey.indexOf(param.type) !== -1 ? param.type : "log",
          color: param.color || "#d2eafb",
          content: param.content
        };

        var name = 'plus' + ' ' + plus.name;

        if (methods.filterConsole(settings, name)) return;

        var outputStyle = methods.outputStyle(plus.color || "#d2eafb")
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
    getConfig: function(param, config) {
      var paramLength = param.length;

      if (paramLength > 1 && param[paramLength - 1].config !== undefined) {
        var paramConfig = param[paramLength - 1].config;

        return paramConfig;
      }
      return '';
    },
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

      function isName(data, name) {
        if (data.indexOf(name) !== -1) return true;
        for (var i = 0; i < data.length; i++) {
          if (data[i] !== "" && name.toString().indexOf(data[i]) !== -1) return true;
        }
        return false;
      };

      if (showNum === 0) {
        if (isName(hideData, name)) return true;
      } else {
        if (!isName(showData, name)) return true;
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
    getParamVal: function (name, url) {
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