const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { transporter } = require('../server');

// Get all users (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments();

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current user's profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'phone', 'address'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'role', 'address', 'phone'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user (admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seller/Admin application endpoint
router.post('/apply-seller', protect, async (req, res) => {
  try {
    const { gstNumber, accountHolder, accountNumber, ifsc, bankName, branch } = req.body;
    if (!gstNumber || !accountHolder || !accountNumber || !ifsc || !bankName || !branch) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.gstNumber = gstNumber;
    user.bankDetails = { accountHolder, accountNumber, ifsc, bankName, branch };
    user.pendingAdmin = true;
    await user.save();
    res.json({ message: 'Application submitted! Awaiting admin approval.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Approve seller application
router.post('/:id/approve-seller', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isAdmin = true;
    user.pendingAdmin = false;
    await user.save();
    // Send approval email
    if (user.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your Seller Application is Approved!',
        text: `Congratulations, ${user.name}! Your seller application has been approved. You can now manage products as an admin on Shoppy.`
      });
    }
    res.json({ message: 'Seller application approved. User is now an admin.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Reject seller application
router.post('/:id/reject-seller', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.pendingAdmin = false;
    user.gstNumber = undefined;
    user.bankDetails = undefined;
    await user.save();
    // Send rejection email
    if (user.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your Seller Application was Rejected',
        text: `Hello, ${user.name}. Unfortunately, your seller application was rejected. Please contact support for more information.`
      });
    }
    res.json({ message: 'Seller application rejected.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 