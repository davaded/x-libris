import 'dotenv/config';

async function main() {
    const url = 'http://localhost:3000/api/import';
    const token = process.env.EXTENSION_TOKEN;

    if (!token) {
        console.error('Error: EXTENSION_TOKEN is not set in .env');
        process.exit(1);
    }

    const payload = {
        id: 'test-tweet-' + Date.now(),
        content: 'This is a test tweet imported via API.',
        authorName: 'Test User',
        authorHandle: 'testuser',
        tweetedAt: new Date().toISOString(),
        source: 'api-test'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-extension-token': token
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Success:', data);
        } else {
            console.error('Error:', response.status, await response.text());
        }
    } catch (error) {
        console.error('Request failed:', error);
    }
}

main();
