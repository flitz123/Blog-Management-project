import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Post from './src/models/Post.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Post.deleteMany({});

    const hashedPassword = await bcrypt.hash('123456', 10);

    const user = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: hashedPassword
    });

    const posts = await Post.insertMany([
      {
        title: 'Welcome to My Blog!',
        content:
          'This is the first sample blog post. You can edit or delete it as you like!',
        tags: ['intro', 'welcome'],
        author: user._id
      },
      {
        title: 'Building with MERN Stack',
        content:
          'Learn how to build a full-stack blog system using MongoDB, Express, React, and Node.js.',
        tags: ['mern', 'development'],
        author: user._id
      }
    ]);

    console.log('✅ Seeded Users and Posts Successfully!');
    console.log('👤 User Login: admin@example.com / 123456');
    console.log(`📝 Created ${posts.length} sample posts`);
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
};

seedDatabase();
