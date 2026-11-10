const sharp = require('sharp');

sharp('public/images/chalkboard.jpg')
  .resize({ width: 2560, withoutEnlargement: true })
  .jpeg({ quality: 78, mozjpeg: true })
  .toFile('public/images/chalkboard.min.jpg')
  .then(i => console.log(`${(i.size / 1024).toFixed(0)} KB · ${i.width}x${i.height}`))
  .catch(e => console.error(e));