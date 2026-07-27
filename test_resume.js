const fs = require('fs');

// Test with the existing sample.pdf
(async () => {
    try {
        const fileBuffer = fs.readFileSync('sample.pdf');
        console.log('[Test] PDF file size:', fileBuffer.length, 'bytes');

        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        formData.append('file', blob, 'sample.pdf');

        console.log('[Test] Sending to http://localhost:3000/api/parse-resume ...');
        const response = await fetch('http://localhost:3000/api/parse-resume', {
            method: 'POST',
            body: formData
        });
        
        console.log('[Test] Response status:', response.status);
        const text = await response.text();
        
        try {
            const data = JSON.parse(text);
            console.log('\n=== RAW TEXT ===');
            console.log(data.rawText ? data.rawText.slice(0, 800) : '(no rawText field)');
            console.log('\n=== PARSED RESUME ===');
            console.log(JSON.stringify(data.resume, null, 2));
        } catch (e) {
            console.log('[Test] Response is not JSON:');
            console.log(text.slice(0, 500));
        }
    } catch (e) {
        console.error('[Test] Failed:', e.message);
    }
})();
