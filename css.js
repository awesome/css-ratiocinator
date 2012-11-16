/*jslint browser: true, indent: 2, nomen: true, plusplus: true */
/*global _: true */
/*global $: true */
/*global jQuery: true */
/*global console: true */

(function () {
  "use strict";

  var script;

  function computedCssProperties(elt, pseudoclass) {
    var style = window.getComputedStyle ? window.getComputedStyle(elt, pseudoclass || null) : elt.currentStyle;
    return _.reduce(_.keys(style),
      function (memo, prop) {
        var styleValue = style.getPropertyValue(prop);
        if (styleValue) {
          memo[prop] = styleValue;
        }
        return memo;
      }, {}) || {};
  }

  function filterKeys(obj, valid_keys) {
    return _.intersection(_.keys(obj), valid_keys).reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
  }

  function objectIntersection(array) {
    function simpleIntersection(a, b) {
      if (typeof a !== 'object' || typeof b !== 'object') {
        return {};
      }
      return filterKeys(a, _.intersection(_.keys(a), _.keys(b)).filter(function (key) {
        return _.isEqual(a[key], b[key]);
      }));
    }
    function repeatedly(f) {
      return function (args) {
        if (args.length === 0) { return {}; }
        var seed = args.pop();
        return _.reduce(args, function (memo, obj) { return f(memo, obj); }, seed);
      };
    }

    return repeatedly(simpleIntersection)(array);
  }

  function objectDifference(a, b) {
    if (typeof a !== 'object' || typeof b !== 'object') {
      return a;
    }
    return filterKeys(a, _.difference(_.keys(a), _.keys(b)));
  }

  function commonStyle(nodes) {
    return objectIntersection(_.map(nodes, function (k) { return $(k).data('style') || {}; }));
  }

  function liftHeritable(node) {
    node.children().each(function () { liftHeritable($(this)); });

    var heritable = [
      'cursor', 'font-family', 'font-weight', 'font-stretch', 'font-style',
      'font-size', 'font-size-adjust', 'font', 'font-synthesis', 'font-kerning',
      'font-variant-ligatures', 'font-variant-position', 'font-variant-caps',
      'font-variant-numeric', 'font-variant-alternatives', 'font-variant-east-asian',
      'font-variant', 'font-feature-settings', 'font-language-override', 'text-transform',
      'white-space', 'tab-size', 'line-break', 'word-break', 'hyphens', 'word-wrap',
      'overflow-wrap', 'text-align', 'text-align-last', 'text-justify', 'word-spacing',
      'letter-spacing', 'text-indent', 'hanging-punctuation', 'text-decoration-skip',
      'text-underline-skip', 'text-emphasis-style', 'text-emphasis-color', 'text-emphasis',
      'text-emphasis-position', 'text-shadow', 'color', 'border-collapse', 'border-spacing',
      'caption-side', 'direction', 'elevation', 'empty-cells', 'line-height', 'list-style-image',
      'list-style-position', 'list-style-type', 'list-style', 'orphans', 'pitch-range',
      'pitch', 'quotes', 'richness', 'speak-header', 'speak-numeral', 'speak-punctuation',
      'speak', 'speech-rate', 'stress', 'visibility', 'voice-family', 'volume', 'widows'],
      common = filterKeys(commonStyle(node.children()), heritable);

    node.children().each(function () {
      $(this).data('style', objectDifference($(this).data('style'), common));
    });
    node.data('style', $.extend(node.data('style'), common));
  }

  function defaultDisplayForTag(tag) {
    return {
      A: 'inline', ABBR: 'inline', ADDRESS: 'block', AREA: 'none',
      ARTICLE: 'block', ASIDE: 'block', AUDIO: 'inline', B: 'inline',
      BASE: 'inline', BB: 'inline', BDI: 'inline', BDO: 'inline', BLOCKQUOTE:
      'block', BODY: 'block', BR: 'inline', BUTTON: 'inline-block', CANVAS:
      'inline', CAPTION: 'table-caption', CITE: 'inline', CODE: 'inline',
      COMMAND: 'inline', DATA: 'inline', DATAGRID: 'inline', DATALIST:
      'none', DD: 'block', DEL: 'inline', DETAILS: 'block', DFN: 'inline',
      DIV: 'block', DL: 'block', DT: 'block', EM: 'inline', EMBED: 'inline',
      EVENTSOURCE: 'inline', FIELDSET: 'block', FIGCAPTION: 'block',
      FIGURE: 'block', FOOTER: 'block', FORM: 'block', H1: 'block', H2:
      'block', H3: 'block', H4: 'block', H5: 'block', H6: 'block', HEADER:
      'block', HGROUP: 'block', HR: 'block', I: 'inline', IFRAME: 'inline',
      IMG: 'inline-block', INPUT: 'inline-block', INS: 'inline', KBD:
      'inline', KEYGEN: 'inline-block', LABEL: 'inline', LEGEND: 'block',
      LI: 'list-item', LINK: 'none', MAP: 'inline', MARK: 'inline', MENU:
      'block', META: 'none', METER: 'inline-block', NAV: 'block', NOSCRIPT:
      'inline', OBJECT: 'inline', OL: 'block', OPTGROUP: 'inline', OPTION:
      'inline', OUTPUT: 'inline', P: 'block', PARAM: 'none', PRE: 'block',
      PROGRESS: 'inline-block', Q: 'inline', RP: 'inline', RT: 'inline',
      RUBY: 'inline', S: 'inline', SAMP: 'inline', SCRIPT: 'none', SECTION:
      'block', SELECT: 'inline-block', SMALL: 'inline', SOURCE: 'inline',
      SPAN: 'inline', STRONG: 'inline', STYLE: 'none', SUB: 'inline',
      SUMMARY: 'block', SUP: 'inline', TABLE: 'table', TBODY: 'table-row-group',
      TD: 'table-cell', TEXTAREA: 'inline-block', TFOOT: 'table-footer-group',
      TH: 'table-cell', THEAD: 'table-header-group', TIME: 'inline', TR:
      'table-row', TRACK: 'inline', U: 'inline', UL: 'block', VAR: 'inline',
      VIDEO: 'inline'}[tag];
  }

  function stripDefaultStyles(node) {
    var defaults = { background: 'rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box',
      border: 'none', bottom: 'auto', clear: 'none', clip: 'auto', cursor: 'auto',
      direction: 'ltr', fill: '#000000', filter: 'none', float: 'none', kerning: '0', left: 'auto',
      mask: 'none', opacity: "1", outline: 'none', overflow: 'visible', position: 'static',
      resize: 'none', right: 'auto', stroke: 'none', top: 'auto', zoom: '1', height: 'auto', width: 'auto'};

    if (node.data('style')) {
      if (defaultDisplayForTag(node.prop("tagName")) === node.data('style')['display']) {
        delete node.data('style')['display'];
      }
      _.each(_.keys(defaults), function (def) {
        var prop = node.data('style')[def];
        if (prop && prop.indexOf(defaults[def]) > -1) {
          delete node.data('style')[def];
        }
      });
    }
    node.children().each(function () {
      stripDefaultStyles($(this));
    });
  }

  function selectorsUsed(node) {
    function tagDict(node) {
      var dict = {};
      dict[node.prop("tagName")] = true;
      if (node.attr('class')) {
        _.each(node.attr('class').split(/\s+/), function (klass) {
          if (klass) {
            dict['.' + klass] = true;
          }
        });
      }
      node.children().each(function () { $.extend(dict, tagDict($(this))); });
      return dict;
    }
    return _.keys(tagDict(node));
  }

  function renderStyle(selector, properties) {
    if (!_.isEmpty(properties)) {
      console.log(selector + ' {');
      _.each(properties, function (val, key) {
        console.log("\t" + key + ': ' + val + ';');
      });
      console.log('}');
    }
  }

  function onScriptsLoaded() {
    var root = $('body'), selectors, common, best;

    console.log("Computing styles...");
    $('*').each(function () {
      $(this).data('style', computedCssProperties(this));
    });

    console.log("Lifting heritable styles...");
    liftHeritable(root);

    console.log("Stripping default styles...");
    stripDefaultStyles(root);

    console.log("Consolidating styles...");
    selectors = selectorsUsed(root);
    while(selectors.length > 0) {
      common = _.map(selectors, function (sel) {
        return { selector: sel, style: commonStyle(root.find(sel)) };
      });
      best   = _.sortBy(common, function (choice) {
        return -(_.keys(choice.style).length * root.find(choice.selector).length);
      })[0];
      renderStyle(best.selector, best.style);
      $(best.selector).each(function () {
        $(this).data('style', objectDifference($(this).data('style'), best.style));
      });
      selectors = _.without(selectors, best.selector);
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // Load jQuery and underscore then begin the fun.
  console.log("Loading required external scripts...");
  script        = document.createElement("script");
  script.src    = "https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js";
  script.onload = function () {
    jQuery.getScript(
      'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.3.3/underscore-min.js',
      onScriptsLoaded
    );
  };
  document.getElementsByTagName("head")[0].appendChild(script);
}());
