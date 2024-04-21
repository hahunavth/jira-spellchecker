/**
 * Custom spell checker plugin for TinyMCE
 *
 * # Usage:
 *  tinymce.init({
 *      selector: '#mytextarea',
 *      plugins: 'wikiworksspellchecker',
 *  });
 */

/**
 * NOTE: Add loglevel verbose in chrome devtools to see debug messages
 */

(function () {
  "use strict";

  var spell_ticker = null;
  var started = false;
  var spell_delay = 500;
  var suggestionscache = [];

  // ----------------------------------------------------------------
  // Utils function (without editor object)
  // ----------------------------------------------------------------
  function _isCDATA(elem) {
    // check for some nodes that have no meaning
    var n = elem.nodeName.toLowerCase();
    if (n == "script") {
      return true;
    }
    if (n == "style") {
      return true;
    }
    if (n == "textarea") {
      return true;
    }
    return false;
  }
  function FindTextNodes(elem) {
    // recursive but asynchronous so it can not choke
    // this function find all text nodes in elem and its children

    var textNodes = [];
    FindTextNodes_r(elem);
    function FindTextNodes_r(elem) {
      for (var i = 0; i < elem.childNodes.length; i++) {
        var child = elem.childNodes[i];
        if (child.nodeType == 3) {
          textNodes.push(child);
        } else if (!_isCDATA(child) && child.childNodes) {
          FindTextNodes_r(child);
        }
      }
    }
    return textNodes;
  }
  function cleanQuotes(word) {
    return word.replace(/[\u2018\u2019]/g, "'");
  }
  function isIE() {
    /*Why can Microsoft just use a stable javascript engine like V8*/
    var au = navigator.userAgent.toLowerCase();
    var found =
      au.indexOf("msie") > -1 ||
      au.indexOf("trident") > -1 ||
      au.indexOf(".net clr") > -1;
    return found;
  }

  var global$5 = tinymce.util.Tools.resolve("tinymce.PluginManager");
  // var global$6 = tinymce.util.Tools.resolve('tinymce.ui.Menu');

  const register = (editor) => {
    var started = true; // TODO: Check if editor is started before [Register events]
    var dictionary = null;
    // var Menu = global$6;

    // ----------------------------------------------------------------
    // Define settings
    // ----------------------------------------------------------------

    // ----------------------------------------------------------------
    // Spellcheck utils (NOTE: Cache to localstorage) (pure functions)
    // ----------------------------------------------------------------
    // DONE: isCorrectWord(word)
    // TODO: suggestWords(word)
    // TODO: ignoreWord(word)

    // Load dictionary
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/typo-js@1.2.4/typo.min.js";
    script.onload = function () {
      Promise.all([
        fetch(
          "https://cdn.jsdelivr.net/npm/spoken-typo-js-ts@2.0.5/dist/commonjs/dictionaries/en_US/en_US.aff"
        ).then((response) => response.text()),
        fetch(
          "https://cdn.jsdelivr.net/npm/spoken-typo-js-ts@2.0.5/dist/commonjs/dictionaries/en_US/en_US.dic"
        ).then((response) => response.text()),
      ]).then(([affData, dicData]) => {
        dictionary = new Typo("en_US", affData, dicData);
        dictionary.alphabet = "abcdefghijklmnopqrstuvwxyz"; // NOTE: hotfix case suggest 'mismismismist' (ist -> 1st)
        console.debug("Dictionary loaded!", dictionary); // DEBUG
      });
    };
    document.head.insertBefore(script, document.head.firstChild);

    const isCorrectWord = (word) => {
      // TODO: cache
      return dictionary.check(word);
    };

    const suggestWords = (word) => {
      const isCorrect = dictionary.check(word);
      if (!isCorrect)
        return dictionary.suggest(word).map((w) => w.toLowerCase().trim());
      else return [];
    };

    const ignoreWord = (word) => {
      // TODO: cache
    };

    // ----------------------------------------------------------------
    // Editor utils (UI related)
    // ----------------------------------------------------------------
    // TODO: getWords(editor)
    // TODO: markTypo(editor, ..)
    // TODO: markAllTypos(editor, ..)
    // TODO: clearMarks(editor, ..)
    // TODO: showPopup(editor, ..)
    // TODO: hidePopup(editor, ..)
    // TODO: replaceSuggestion(editor, ..)

    var __memtok = null;
    var __memtoks = null;
    function wordTokenizer(singleton) {
      if (!singleton && !!__memtok) {
        return __memtok;
      }
      if (singleton && !!__memtoks) {
        return __memtoks;
      }
      var email = "\\b[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}\\b";
      var protocol = "\\bhttp[s]?://[a-z0-9#\\._/]{5,}\\b";
      var domain = "\\bwww.[a-z0-9#._/]{8,128}[a-z0-9/]\\b";
      var invalidchar =
        '\\s!"#$%&()*+,-.â€¦/:;<=>?@[\\]^_{|}`\u00a7\u00a9\u00ab\u00ae\u00b1\u00b6\u00b7\u00b8\u00bb\u00bc\u00bd\u00be\u00bf\u00d7\u00f7\u00a4\u201d\u201c\u201e\u201f' +
        String.fromCharCode(160);
      var validword =
        "[^" +
        invalidchar +
        "'\u2018\u2019][^" +
        invalidchar +
        "]+[^" +
        invalidchar +
        "'\u2018\u2019]";
      var result =
        editor.getParam("spellchecker_wordchar_pattern") ||
        new RegExp(
          "(" +
            email +
            ")|(" +
            protocol +
            ")|(" +
            domain +
            ")|(" +
            validword +
            ")",
          singleton ? "" : "g"
        );
      if (singleton) {
        __memtoks = result;
      } else {
        __memtok = result;
      }
      return result;
    }
    var caret_marker =
      String.fromCharCode(8) +
      String.fromCharCode(127) +
      String.fromCharCode(1);
    function putCursor() {
      // Keep position of cursor when fire event
      if (!editor.getWin().getSelection) {
        return null; /*IE <=8*/
      }
      if (!editorHasFocus) {
        return;
      }
      var sel = editor.getWin().getSelection();
      var range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(editor.getDoc().createTextNode(caret_marker));
    }
    function validWordToken(word) {
      if (!word) {
        // is empty
        return false;
      }
      if (/\s/.test(word)) {
        // is space
        return false;
      }
      if (/[\:\.\@\/\\]/.test(word)) {
        // is punctuation
        return false;
      }
      if (/^\d+$/.test(word) || word.length == 1) {
        // is number
        return false;
      }
      if (isCorrectWord(word)) {
        // is correct (spell checked)
        return false;
      }
      return true;
      // var ingnoreAllCaps = (editor.settings.nanospell_ignore_block_caps === true);
      // var ignoreNumeric = (editor.settings.nanospell_ignore_words_with_numerals !== false);
      // if (ingnoreAllCaps && word.toUpperCase() == word) {
      // 	return false;
      // }
      // if (ignoreNumeric && /\d/.test(word)) {
      // 	return false;
      // }
      // if (ignorecache[word.toLowerCase()]) {
      // 	return false;
      // }
      // if (hasPersonal(word)) {
      // 	return false
      // }
      // return true;
    }
    function MarkTypos(textNode) {
      console.debug("MarkTypos", editor, textNode); // DEBUG
      var regex = wordTokenizer();
      "".match(regex); /*the magic reset button*/
      var currentNode = textNode;
      var match;
      var caretpos = -1;
      var newNodes = [textNode];
      while ((match = regex.exec(currentNode.data)) != null) {
        var matchtext = match[0];
        if (!validWordToken(matchtext)) {
          continue;
        }
        // if (typeof(suggestionscache[cleanQuotes(matchtext)]) !== 'object') {
        //     continue;
        // }
        var pos = match.index;
        var matchlength = matchtext.length;
        var matchlength = matchtext.length;
        var newNode = currentNode.splitText(pos);
        var span = editor.getDoc().createElement("span");
        span.className = "nanospell-typo";
        span.setAttribute("data-mce-bogus", 1);
        span.addEventListener("click", function (event) {
          event.stopPropagation();
          showPopup(this);
        });

        var middle = editor.getDoc().createTextNode(matchtext);
        span.appendChild(middle);
        currentNode.parentNode.insertBefore(span, newNode);
        newNode.data = newNode.data.substr(matchlength);
        currentNode = newNode;
        newNodes.push(middle);
        newNodes.push(newNode);
        "".match(regex); /*the magic reset button*/
      }
    }
    function showPopup(element) {
      // Lấy kích thước và vị trí của phần tử span
      var rect = element.getBoundingClientRect();

      var popup = document.createElement("div");
      popup.style.position = "absolute";
      popup.style.backgroundColor = "#ffffff";
      popup.style.border = "1px solid #ccc";
      popup.style.borderRadius = "5px";
      popup.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
      popup.style.padding = "10px";
      popup.style.zIndex = "9999";

      // Tính toán vị trí của popup dựa trên vị trí của span
      popup.style.top = rect.bottom + 175 + "px";
      popup.style.left = rect.left + "px";

      // Thêm CSS inline cho các phần tử bên trong popup
      popup.innerHTML += `
		  <div class="popup-content" style="">
			<span class='close-btn' style='position: absolute; top: 5px; right: 5px;padding: 5px; cursor: pointer; font-size: 16px; color: #999;'>x</span>
			<b style="color: #333;">Did you mean:</b>
			<ul style="list-style: none; padding: 0;">
			  <li class="suggested-words" style="margin-top: 10px;"> Suggested words </li>
			</ul>
			<div class='popup-control' style="margin-top: 10px; display: flex; justify-content: space-between;align-items: center;">
			  <div class='popup--control__left'>
				
				<span class='navigation' style='cursor: pointer;
				color: #1749AD; font-weigth: bold'><</span>
				<span class='currentIndex'>1</span>
				<span class='navigation' style='cursor: pointer;color: #1749AD;'>></span>
			  </div>
			  <div class='popup--control__right' style="margin-left: 20px;">
				<button class='ignoreBtn' style="background-color: #ccc; border: none; padding: 5px 10px; cursor: pointer;border-radius: 4px;">Ignore</button>
				<button class='confirmBtn' style="background-color: #007bff; color: #fff; border: none; padding: 5px 10px; cursor: pointer;border-radius: 4px;">Confirm</button>
			  </div>
			</div>
		  </div>`;
      popup.querySelector(".close-btn").addEventListener("click", function () {
        popup.style.display = "none";
      });

      popup.style.display = "block";

      // Thêm popup vào body để hiển thị
      document.body.appendChild(popup);
    }

    const getWords = (editor) => {
      const max = 100;

      var fullTextContext = "";
      var allTextNodes = FindTextNodes(editor.getBody());
      for (var i = 0; i < allTextNodes.length; i++) {
        fullTextContext += allTextNodes[i].data;
        if (
          allTextNodes[i].parentNode &&
          allTextNodes[i].parentNode.className &&
          allTextNodes[i].parentNode.className == "nanospell-typo"
        ) {
          fullTextContext += "";
        } else {
          fullTextContext += " ";
        }
      }
      var matches = fullTextContext.match(wordTokenizer());
      var uniqueWords = [];
      var words = [];
      if (!matches) {
        return words;
      }
      for (var i = 0; i < matches.length; i++) {
        var word = cleanQuotes(matches[i]);
        if (
          !uniqueWords[word] &&
          validWordToken(word)
          // && (typeof(spellcache[word]) === 'undefined')
        ) {
          words.push(word);
          uniqueWords[word] = true;
          if (words.length >= max) {
            return words;
          }
        }
      }
      return words;
    };
    function getCaretIE() {
      if (editor.getWin().getSelection) {
        return null;
      }
      var doc = editor.getDoc();
      var clickx, clicky;
      var cursorPos = doc.selection.createRange().duplicate();
      clickx = cursorPos.boundingLeft;
      clicky = cursorPos.boundingTop;
      var pos = {
        x: clickx,
        y: clicky,
      };
      return pos;
    }
    function getCaret() {
      if (!editor.getWin().getSelection) {
        return null;
      }
      if (!editorHasFocus) {
        return;
      }
      var allTextNodes = FindTextNodes(editor.getBody());
      var caretpos = null;
      var caretnode = null;
      for (var i = 0; i < allTextNodes.length; i++) {
        if (allTextNodes[i].data.indexOf(caret_marker) > -1) {
          caretnode = allTextNodes[i];
          caretpos = allTextNodes[i].data.indexOf(caret_marker);
          allTextNodes[i].data = allTextNodes[i].data.replace(caret_marker, "");
          return {
            node: caretnode,
            offset: caretpos,
          };
        }
      }
    }
    function setCaret(bookmark) {
      if (!editor.getWin().getSelection) {
        return null;
      }
      if (!editorHasFocus) {
        return;
      }
      if (!bookmark) {
        return;
      }
      var nodeIndex = null;
      var allTextNodes = FindTextNodes(editor.getBody());
      var caretnode = bookmark.node;
      var caretpos = bookmark.offset;
      for (var i = 0; i < allTextNodes.length; i++) {
        if (allTextNodes[i] == caretnode) {
          var nodeIndex = i;
        }
      }
      if (nodeIndex === null) {
        return;
      }
      for (var i = nodeIndex; i < allTextNodes.length - 1; i++) {
        if (caretpos <= allTextNodes[i].data.length) {
          break;
        }
        caretpos -= allTextNodes[i].data.length;
        caretnode = allTextNodes[i + 1];
      }
      var textNode = caretnode;
      var sel = editor.getWin().getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        var range = sel.getRangeAt(0);
        range.collapse(true);
        range.setStart(textNode, caretpos);
        range.setEnd(textNode, caretpos);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    function unwrapbogus(node) {
      node.outerHTML = node.innerHTML;
    }
    function clearAllSpellCheckingSpans(base) {
      var i, node, nodes;
      var finished = false;
      while (!finished) {
        finished = true;
        nodes = editor.getDoc().getElementsByTagName("span");
        var i = nodes.length;
        while (i--) {
          node = nodes[i];
          if (
            node.className == "nanospell-typo" ||
            node.className == "nanospell-typo-disabled"
          ) {
            unwrapbogus(node);
            finished = false;
          }
        }
      }
    }
    function normalizeTextNodes(elem) {
      if (!isIE()) {
        elem.normalize();
        return;
      }
      /*IE normalize function is not stable, even in IE 11*/
      var child = elem.firstChild,
        nextChild;
      while (child) {
        if (child.nodeType == 3) {
          while ((nextChild = child.nextSibling) && nextChild.nodeType == 3) {
            child.appendData(nextChild.data);
            elem.removeChild(nextChild);
          }
        } else {
          normalizeTextNodes(child);
        }
        child = child.nextSibling;
      }
    }
    function setCaretIE(pos) {
      if (
        editor.getWin().getSelection ||
        pos.x === 0 ||
        pos.y === 0 /*thanks Nathan*/
      ) {
        return null;
      }
      var doc = editor.getDoc();
      var clickx, clicky;
      clickx = pos.x;
      clicky = pos.y;
      var cursorPos = doc.body.createTextRange();
      cursorPos.moveToPoint(clickx, clicky);
      cursorPos.select();

      if (
        cursorPos.getBoundingClientRect().top !== clicky &&
        cursorPos.getBoundingClientRect().clickx !== clicky
      ) {
        //IE8 selecing a br moved down 1 line
        cursorPos.move("character", -1);
        cursorPos.select();
      }
    }
    function MarkAllTypos(body) {
      var allTextNodes = FindTextNodes(body);
      for (var i = 0; i < allTextNodes.length; i++) {
        // NOTE: i here is for each line
        MarkTypos(allTextNodes[i]);
      }
    }
    function render() {
      console.debug("render"); // DEBUG
      if (!editor.selection.isCollapsed()) {
        return;
      }
      putCursor();
      var IEcaret = getCaretIE();
      clearAllSpellCheckingSpans(editor.getBody());
      normalizeTextNodes(editor.getBody());
      var caret = getCaret();
      MarkAllTypos(editor.getBody());
      setCaret(caret);
      setCaretIE(IEcaret);
      editor.fire("SpellcheckStart");
      editor.nanospellstarted = true;
    }
    function start(editor) {
      console.debug("start"); // DEBUG
      started = true;
      // appendCustomStyles()
      var words = getWords(editor); //(maxRequest);
      console.debug("start", words); // DEBUG
      // if (words.length == 0) {
      render();
      // }
      // else {
      // defaultTinyMceSpellAJAXRequest("spellcheck", words, render, words.length >= maxRequest);
      // }
    }
    function checkNow() {
      if (editor.selection.isCollapsed() && started) {
        start(editor);
      }
    }
    function triggerSpelling(immediate) {
      console.assert(editor, "triggerSpelling: editor is null");
      //only reckeck when the user pauses typing
      clearTimeout(spell_ticker);
      if (editor.selection.isCollapsed()) {
        spell_ticker = setTimeout(checkNow, immediate ? 50 : spell_delay);
      }
    }

    // ----------------------------------------------------------------
    // Event handlers (Use Spellcheck + Editor utils)
    // ----------------------------------------------------------------
    // TODO: checkWord
    // TODO: onClickMarkedWord
    // TODO: onReplacedWord
    // TODO: onIgnoreSuggestion
    // TODO: onChangeSuggestion
    // TODO: onClosePopup
    // TODO: onOpenPopup
    // TODO: onWordUpdated

    // ----------------------------------------------------------------
    // Session events
    // ----------------------------------------------------------------

    // Blur, focus events
    var editorHasFocus = false;
    editor.on("focus", function (e) {
      editorHasFocus = true;
      console.debug("Event: focus"); // DEBUG
    });
    var addEventHandler = function (elem, eventType, handler) {
      if (elem.addEventListener)
        elem.addEventListener(eventType, handler, false);
      else if (elem.attachEvent) elem.attachEvent("on" + eventType, handler);
    };
    addEventHandler(document.body, "click", handleBlur);
    var handleBlur = function () {
      editorHasFocus = false;
      // TODO: Close popup if opened
      console.debug("Event: blur"); // DEBUG
    };
    editor.on("blur", handleBlur);

    function generateMemuItem(suggestion) {
      return {
        text: suggestion,
        disabled: false,
        onclick: function () {
          placeSuggestion(suggestion);
        },
      };
    }
    function getMenuItemsArray(target, word) {
      var items = [];
      var suggestions = getSuggestions(word);
      if (!suggestions) {
        suggestions = [];
      }
      for (var i = 0; i < suggestions.length; i++) {
        var suggestion = suggestions[i] + "";
        if (suggestion.replace(/^\s+|\s+$/g, "").length < 1) {
          continue;
        }
        items.push(generateMemuItem(suggestion));
      }
      if (!items.length) {
        items.push({
          text: "(No Spelling Suggestions)",
          disabled: true,
        });
      }
      if (
        suggestions &&
        suggestions.length == 2 &&
        suggestions[0].indexOf(String.fromCharCode(160)) > -1
      ) {
        /**/
      } else {
        items.push({
          text: "-",
        });
        items.push({
          text: "Ignore",
          onclick: function () {
            ignoreWord(target, word, true);
          },
        });
        items.push({
          text: "Add to personal dictionary",
          onclick: function () {
            addPersonal(word);
            ignoreWord(target, word, true);
          },
        });
      }
      return items;
    }
    //   function showSuggestionsMenu(e, target, word) {
    // 	var items = getMenuItemsArray(target, word);
    // 	if (editor.plugins.contextmenu) {
    // 	  editor.rendercontextmenu(e, items);
    // 	  return;
    // 	}
    // 	var suggestionsMenu = new Menu({
    // 	  items: items,
    // 	  context: "contextmenu",
    // 	  onautohide: function (e) {
    // 		if (e.target.className !== "nanospell-typo") {
    // 		  e.preventDefault();
    // 		}
    // 	  },
    // 	  onhide: function () {
    // 		suggestionsMenu.remove();
    // 		suggestionsMenu = null;
    // 	  },
    // 	});
    // 	suggestionsMenu.renderTo(document.body);
    // 	var pos = DOMUtils.DOM.getPos(editor.getContentAreaContainer());
    // 	var targetPos = editor.dom.getPos(target);
    // 	var doc = editor.getDoc().documentElement;
    // 	if (editor.inline) {
    // 	  pos.x += targetPos.x;
    // 	  pos.y += targetPos.y;
    // 	} else {
    // 	  var scroll_left =
    // 		(editor.getWin().pageXOffset || doc.scrollLeft) -
    // 		(doc.clientLeft || 0);
    // 	  var scroll_top =
    // 		(editor.getWin().pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    // 	  pos.x += targetPos.x - scroll_left;
    // 	  pos.y += targetPos.y - scroll_top;
    // 	}
    // 	suggestionsMenu.moveTo(pos.x, pos.y + target.offsetHeight);
    //   }
    function getSuggestions(word) {
      word = cleanQuotes(word);
      if (suggestionscache[word] && suggestionscache[word][0]) {
        if (suggestionscache[word][0].indexOf("*") == 0) {
          return ["a"];
          // return Array("nanospell\xA0plugin\xA0developer\xA0trial ", "tinymcespellcheck.com/license\xA0")
        }
      }
      return ["a"];
      // return suggestionscache[word];
    }
    editor.on("click", function (e) {
      console.debug("Event: contextmenu", e); // DEBUG
      if (e.target.className == "nanospell-typo") {
        e.preventDefault();
        e.stopPropagation();
        var rng = editor.dom.createRng();
        rng.setStart(e.target.firstChild, 0);
        rng.setEnd(e.target.lastChild, e.target.lastChild.length);
        editor.selection.setRng(rng);
        //   showSuggestionsMenu(e, e.target, rng.toString());
      } else {
        if (editor.rendercontextmenu) {
          editor.rendercontextmenu(e, false);
        }
      }
    });

    // ----------------------------------------------------------------
    // Register events
    // ----------------------------------------------------------------

    if (started) {
      editor.on("init", function () {
        // TODO: Spell check first time
        console.debug("Editor init"); // DEBUG
        // checkNow(); 	// FIXME: dictionary is null
      });
    }

    editor.on("keydown keypress", function (e) {
      // var content = editor.getContent();
      // console.debug(content); // DEBUG
      /**
       * TODO: Handle key
       * - Set editorFocus control flag
       * - Recheck typing activity
       *      var target = editor.selection.getNode();
       * - Ignore navigation keys
       *      var ch8r = e.keyCode;
       *      ( if chBr in [16, 31], [37, 40] -> ignore )
       * - If user is typing on a typo remove its underline
       * - Trigger spellcheck if key is end word (enter, space, ...)
       */

      editorHasFocus = true;

      //recheck after typing activity
      var target = editor.selection.getNode();

      // ignore navigation keys
      var ch8r = e.keyCode;
      if (ch8r >= 16 && ch8r <= 31) {
        return;
      }
      if (ch8r >= 37 && ch8r <= 40) {
        return;
      }
      //if user is typing on a typo remove its underline
      if (target.className == "nanospell-typo") {
        target.className = "nanospell-typo-disabled";
      }

      triggerSpelling(
        editor,
        // (spell_fast_after_spacebar &&
        ch8r === 32 || ch8r === 10 || ch8r === 13
        // )
      );
    });

    editor.on("paste", function () {
      // DONE: Trigger spellcheck asynchronously
      setTimeout(triggerSpelling, 100);
    });

    editor.on("remove", function () {
      // TODO: Close popup if opened
    });
  };

  var Plugin = () => {
    // load context menu plugin
    global$5.load(
      "spellcontextmenu",
      // nanospellbase() + "/os/contextmenu.js",
      "custom_plugins/wikiworksspellchecker/os/contextmenu.js" // FIXME: hardcode path
    );
    // add plugin
    global$5.add("wikiworksspellchecker", (editor) => {
      // DONE: Setup plugin here!
      register(editor);
      console.debug("Spellcheck plugin loaded!!!!!"); // DEBUG
    });
  };

  Plugin();
})();
