require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/postsRoutes');
const commentRoutes = require('./models/Comment');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' })); // allow rich text / images inlined if needed

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req,res)=> res.send('Blog API running'));

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
