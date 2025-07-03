var __wxsModules={};

__wxsModules["49b63d90"] = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // <stdin>
  var require_stdin = __commonJS({
    "<stdin>"(exports, module) {
      var inlineTags = {
        abbr: true,
        b: true,
        big: true,
        code: true,
        del: true,
        em: true,
        i: true,
        ins: true,
        label: true,
        q: true,
        small: true,
        span: true,
        strong: true,
        sub: true,
        sup: true
      };
      module.exports = {
        use: function(item) {
          if (inlineTags[item.name] || (item.attrs.style || "").indexOf("display:inline") != -1)
            return false;
          return !item.c;
        }
      };
    }
  });
  return require_stdin();
})();
