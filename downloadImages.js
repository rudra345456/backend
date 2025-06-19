const https = require('https');
const fs = require('fs');
const path = require('path');

// Sample image URLs (using placeholder images)
const imageUrls = {
  'headphones-1.jpg': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
  'headphones-2.jpg': 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b',
  'headphones-3.jpg': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
  'watch-1.jpg': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
  'watch-2.jpg': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
  'tshirt-1.jpg': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
  'tshirt-2.jpg': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a',
  'camera-1.jpg': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
  'camera-2.jpg': 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39',
  'camera-3.jpg': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
  'bag-1.jpg': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
  'bag-2.jpg': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa'
};

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Download function
const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filepath = path.join(imagesDir, filename);
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file if there's an error
      reject(err);
    });
  });
};

// Download all images
const downloadAllImages = async () => {
  try {
    const downloads = Object.entries(imageUrls).map(([filename, url]) => 
      downloadImage(url, filename)
    );
    await Promise.all(downloads);
    console.log('All images downloaded successfully!');
  } catch (error) {
    console.error('Error downloading images:', error);
  }
};

// Run the download
downloadAllImages(); 