const http = require('http');

http.get('http://localhost:3000/api/standings?league=liga-mx', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Error parsing JSON:', data);
        }
    });
}).on('error', err => console.log('Request Error:', err.message));
