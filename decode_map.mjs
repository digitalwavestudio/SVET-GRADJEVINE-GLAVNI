import { SourceMapConsumer } from 'source-map';
import fetch from 'node-fetch';

(async () => {
    try {
        const response = await fetch('https://www.svetgradjevine.com/assets/index-WPde-ebX.js.map');
        const rawSourceMap = await response.json();
        
        await SourceMapConsumer.with(rawSourceMap, null, consumer => {
            const pos = consumer.originalPositionFor({
                line: 10,
                column: 231162
            });
            console.log('--- ORIGINAL SOURCE CODE LOCATION ---');
            console.log('Source:', pos.source);
            console.log('Line:', pos.line);
            console.log('Column:', pos.column);
            console.log('Name:', pos.name);
        });
    } catch (e) {
        console.error('Failed to decode:', e.message);
    }
})();
