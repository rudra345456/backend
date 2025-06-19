require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const categories = [
  'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports',
  'Books', 'Kids', 'Jewellery', 'Toys', 'Men', 'Women'
];

// Example local images for demo (repeat or randomize for more uniqueness)
const localImages = [
  '/images/products/bag-1.jpg', '/images/products/bag-2.jpg',
  '/images/products/camera-1.jpg', '/images/products/camera-2.jpg', '/images/products/camera-3.jpg',
  '/images/products/headphones-1.jpg', '/images/products/headphones-2.jpg', '/images/products/headphones-3.jpg',
  '/images/products/tshirt-1.jpg', '/images/products/tshirt-2.jpg',
  '/images/products/watch-1.jpg', '/images/products/watch-2.jpg'
];

function getRandomImage(idx) {
  // Use a different image for each product, cycle if needed
  return localImages[idx % localImages.length];
}

const generateProducts = () => {
  const products = [];
  categories.forEach((cat, catIdx) => {
    for (let i = 1; i <= 100; i++) {
      const name = `${cat} Product ${i}`;
      products.push({
        name,
        description: `High quality ${cat.toLowerCase()} product number ${i}.`,
        price: (Math.random() * 1000 + 100).toFixed(2),
        category: cat,
        countInStock: Math.floor(Math.random() * 100) + 1,
        image: getRandomImage(catIdx * 100 + i),
        brand: `${cat} Brand`,
        rating: (Math.random() * 5).toFixed(1),
        numReviews: Math.floor(Math.random() * 1000),
        offer: i % 10 === 0 ? '10% OFF' : '',
      });
    }
  });
  return products;
};

const seed = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppy', { useNewUrlParser: true, useUnifiedTopology: true });
    await Product.deleteMany({});
    const products = generateProducts();
    await Product.insertMany(products);
    console.log('Database seeded with 100 unique products per main category!');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed(); 