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
    'use strict';

    var global$5 = tinymce.util.Tools.resolve('tinymce.PluginManager');

    const register = editor => {

        var started = true; // TODO: Check if editor is started before [Register events]
        var dictionary = null;

        // ----------------------------------------------------------------
        // Define settings
        // ----------------------------------------------------------------

        // ----------------------------------------------------------------
        // Spellcheck utils (NOTE: Cache to localstorage) (pure functions)
        // ----------------------------------------------------------------
        // TODO: isCorrectWord(word)
        // TODO: suggestWords(word)
        // TODO: ignoreWord(word)

        // Load dictionary
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/typo-js@1.2.4/typo.min.js';
        script.onload = function() {
            Promise.all([
                fetch('https://cdn.jsdelivr.net/npm/spoken-typo-js-ts@2.0.5/dist/commonjs/dictionaries/en_US/en_US.aff').then(response => response.text()),
                fetch('https://cdn.jsdelivr.net/npm/spoken-typo-js-ts@2.0.5/dist/commonjs/dictionaries/en_US/en_US.dic').then(response => response.text())
            ]).then(([affData, dicData]) => {
                dictionary = new Typo("en_US", affData, dicData);
                dictionary.alphabet = "abcdefghijklmnopqrstuvwxyz"; // NOTE: hotfix case suggest 'mismismismist' (ist -> 1st)
                console.debug('Dictionary loaded!', dictionary); // DEBUG
            });
        };
        document.head.insertBefore(script, document.head.firstChild);

        const isCorrectWord = (word) => {
            // TODO: cache
            return dictionary.check(word);
        }

        const suggestWords = (word) => {
            const isCorrect = dictionary.check(word);
            if (!isCorrect) return dictionary.suggest(word).map((w) => w.toLowerCase().trim());
            else return [];
        }

        const ignoreWord = (word) => {
            // TODO: cache
        }

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

        const getWords = (editor) => {
            const text = editor.getContent();
            // TODO: handle html tags
            return text.split(' ');
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
		editor.on('focus', function(e) {
			editorHasFocus = true;
            console.debug('Event: focus'); // DEBUG
		})
		var addEventHandler = function(elem, eventType, handler) {
			if (elem.addEventListener) elem.addEventListener(eventType, handler, false);
			else if (elem.attachEvent) elem.attachEvent('on' + eventType, handler);
		}
        addEventHandler(document.body, 'click', handleBlur)
		var handleBlur = function() {
			editorHasFocus = false;
            // TODO: Close popup if opened
            console.debug('Event: blur'); // DEBUG
		}
        editor.on('blur', handleBlur);

        // editor.on('contextmenu', );

        // ----------------------------------------------------------------
        // Register events
        // ----------------------------------------------------------------
        
        if (started) {
            editor.on('init', function() {
                // TODO: Spell check first time
            });
        }

        editor.on('keydown keypress', function() {
            var content = editor.getContent();
            console.debug(content); // DEBUG
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
        });

		editor.on('paste', function() {
            // TODO: Trigger spellcheck asynchronously
		})

		editor.on('remove', function() {
            // TODO: Close popup if opened
		});
    }

    var Plugin = () => {
        global$5.add('wikiworksspellchecker', editor => {
            // TODO: Setup plugin here!
            register(editor);
            console.debug( 'Spellcheck plugin loaded!!!!!'); // DEBUG
        });
      };
  
      Plugin();

})();
