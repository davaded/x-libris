(function () {
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function (method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            if (this._url && (this._url.includes('Bookmarks') || this._url.includes('UserTweets')) && this._url.includes('graphql')) {
                if (!this.responseType || this.responseType === 'text') {
                    try {
                        const response = JSON.parse(this.responseText);
                        window.postMessage({ type: 'X_BOOKMARKS_DATA', data: response }, '*');
                    } catch (e) {
                        console.error('Error parsing X bookmarks:', e);
                    }
                }
            }
        });
        return send.apply(this, arguments);
    };
})();
