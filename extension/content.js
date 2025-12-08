// Inject script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages
window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (event.data.type && event.data.type === 'X_BOOKMARKS_DATA') {
        const data = event.data.data;
        console.log('Intercepted X data, sending to X Manager...');

        // Send to backend
        fetch('http://localhost:3000/api/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'secret-api-key-123'
            },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(res => console.log('Imported tweets:', res.count))
            .catch(err => console.error('Import error:', err));
    }
});
