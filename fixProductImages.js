const mongoose = require('mongoose');
const Product = require('./models/Product');

async function fixImages() {
  await mongoose.connect('mongodb://localhost:27017/shoppy', { useNewUrlParser: true, useUnifiedTopology: true });

  const products = await Product.find({});
  for (const product of products) {
    if (Array.isArray(product.images) && product.images.length > 0) {
      // Keep only the first image
      product.image = product.images[0];
      product.images = undefined; // Remove the images array
      await product.save();
    }
  }
  console.log('All products updated: only the first image is kept.');
  process.exit();
}

fixImages(); 