// Deprecated compatibility shim.
//
// The original `scripts/messages/messageList.js` has been split into smaller files under:
//   `scripts/messages/messageList/`
//
// Entry point `pages/messageManager.html` now loads the split files directly.
// If you are seeing this warning, update your HTML to load the new files instead of this one.

(function () {
    if (typeof console !== 'undefined' && console.warn) {
        console.warn('[DEPRECATED] scripts/messages/messageList.js has been split. Load scripts/messages/messageList/*.js instead.');
    }
})();


