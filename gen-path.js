const fs = require('fs');
const https = require('https');
const TextToSVG = require('text-to-svg');

const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/alexbrush/AlexBrush-Regular.ttf';

https.get(fontUrl, (res) => {
  const path = 'AlexBrush.ttf';
  const filePath = fs.createWriteStream(path);
  res.pipe(filePath);
  filePath.on('finish', () => {
    filePath.close();
    const textToSVG = TextToSVG.loadSync(path);
    const options = { x: 20, y: 40, fontSize: 48, anchor: 'left baseline' };
    
    const svgPath = textToSVG.getD('Guild', options);
    console.log("GENERATED PATH:");
    console.log(svgPath);
    
    // Check bounding box for animation coordinates
    const metrics = textToSVG.getMetrics('Guild', options);
    console.log("Metrics:", metrics);
  });
});
