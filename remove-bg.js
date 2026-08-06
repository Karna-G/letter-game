const Jimp = require('jimp');

async function removeWhite() {
  const image = await Jimp.read('frontend/public/fountain-pen.png');
  // Add an alpha channel if it doesn't have one
  image.rgba(true);
  
  // Make a softer threshold to anti-alias edges
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // Calculate brightness
    const brightness = (r + g + b) / 3;
    
    // If it's very bright (white background), make it transparent
    if (brightness > 230) {
      // Soft alpha based on how close to pure white it is
      // 255 -> 0 alpha, 230 -> 255 alpha (mapped)
      const alpha = Math.max(0, 255 - ((brightness - 230) * 10));
      this.bitmap.data[idx + 3] = alpha;
    }
  });
  await image.writeAsync('frontend/public/fountain-pen.png');
  console.log("Background removed successfully!");
}

removeWhite().catch(console.error);
