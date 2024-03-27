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

        // ----------------------------------------------------------------
        // Define settings
        // ----------------------------------------------------------------

        // ----------------------------------------------------------------
        // Spellcheck utils (NOTE: Cache to localstorage) (pure functions)
        // ----------------------------------------------------------------
        // TODO: isCorrectWord(word)
        // TODO: suggestWords(word)
        // TODO: ignoreWord(word)

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
