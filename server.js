
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Import JWT library
const MyCart = require('./MyCart');
const bcrypt = require('bcrypt');
const DeliveryAddress = require('./DeliveryAddress');
const Feedback = require('./Feedback');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://admin123:musicart123@cluster0.b3ei3qo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define Schema and Model
const productSchema = new mongoose.Schema({
    product_name: String,
    customer_reviews: Number,
    price: Number,
    color: String,
    type: String,
    description: String,
    brand: String,
    about: String,
    image_links: [String] // Array of image URLs
});

const Product = mongoose.model('Product', productSchema);

// Define Schema and Model for User
const userSchema = new mongoose.Schema({
    name: String,
    mobileNumber: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);
const CheckoutSchema = new mongoose.Schema({
    deliveryAddress: Object,
    paymentMethod: String,
    cartItems: Array,
  });
  
  // Create a model based on the schema
  const Checkout = mongoose.model('Checkout', CheckoutSchema);
  app.post('/feedback', async (req, res) => {
    try {
        // Extract data from the request body
        const { username, type, text } = req.body;

        // Create a new Feedback document
        const feedback = new Feedback({
            username,
            type,
            text
        });

        // Save the feedback to the database
        await feedback.save();

        // Respond with a success message
        res.status(201).json({ message: 'Feedback submitted successfully!' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        // Respond with an error message
        res.status(500).json({ message: 'Server Error' });
    }
});


  app.post('/placeOrder', async (req, res) => {
    try {
      const { deliveryAddress, paymentMethod, cartItems } = req.body;
  
      // Validate that required fields are present
      if (!deliveryAddress || !paymentMethod || !cartItems) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      // Create a new checkout document based on the received data
      const newCheckout = new Checkout({
        deliveryAddress: deliveryAddress,
        paymentMethod: paymentMethod,
        cartItems: cartItems,
      });
  
      // Save the new document to the database
      await newCheckout.save();
      res.status(201).json({ message: 'Order placed successfully' });
    } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
// Secret key for JWT
const JWT_SECRET_KEY = 'qwerty';

// Route for user registration
app.post('/register', async (req, res) => {
    try {
        const { name, mobileNumber, email, password } = req.body;

        // Check if user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with hashed password
        const newUser = new User({ name, mobileNumber, email, password: hashedPassword });

        // Save the user to the database
        await newUser.save();

        // Respond with success message
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
app.get('/deliveryAddress', async (req, res) => {
    try {
      // Retrieve the delivery address data from the database
      const deliveryAddress = await DeliveryAddress.findOne();
  
      if (!deliveryAddress) {
        return res.status(404).json({ message: 'Delivery address not found' });
      }
  
      res.json(deliveryAddress);
    } catch (error) {
      console.error('Error fetching delivery address:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  app.get('/invoices', async (req, res) => {
    try {
      const orders = await Checkout.find(); // Fetch all orders from the checkouts collection
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  app.get('/invoice/:id', async (req, res) => {
    try {
      // Retrieve the invoice details from the checkouts collection by ID
      const invoice = await Checkout.findById(req.params.id);
    
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
    
      res.json(invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  });

// Route for user login
// Route for user login
// Route for user login
app.post('/login', async (req, res) => {
    try {
        const { emailOrNum, password } = req.body;

        // Check if a user with the provided email or mobile number exists
        const user = await User.findOne({ $or: [{ email: emailOrNum }, { mobileNumber: emailOrNum }] });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Compare hashed password with the provided password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT token with 2-hour expiration time
        const token = jwt.sign({ userId: user._id }, JWT_SECRET_KEY, { expiresIn: '2h' });

        // Return the token and user's name
        res.status(200).json({ token, name: user.name });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    console.log('Authorization Token:', token); // Log the token received in the request headers
    if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
    }

    // Verify token
    jwt.verify(token.split(' ')[1], JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('Error verifying token:', err); // Log any errors during token verification
            return res.status(401).json({ message: 'Invalid token' });
        }
        console.log('Decoded User ID:', decoded.userId); // Log the decoded user ID
        req.userId = decoded.userId; // Attach user ID to request object
        next(); // Proceed to the next middleware
    });
};

app.post('/verifyToken', verifyToken, (req, res) => {
    // If token verification is successful, send success response
    res.status(200).json({ success: true, message: 'Token verified successfully' });
});

// Example of a protected route
app.get('/protected', verifyToken, (req, res) => {
    // Access userId from request object
    const userId = req.userId;
    // Your protected route logic here...
});


// Middleware to verify JWT token
// Your existing routes...
// Route to search products by name
app.get('/products/search', async (req, res) => {
    try {
        const searchQuery = req.query.q; // Get the search query from the request query parameters
        const products = await Product.find({ product_name: { $regex: searchQuery, $options: 'i' } }); // Perform a case-insensitive search using regex
        res.json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// Route to fetch products with optional filters
// Route to fetch products with filters
app.get('/products', async (req, res) => {
    try {
        const filters = req.query; // Get filters from query parameters
        const products = await Product.find(filters); // Apply filters to the product query
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Route to filter products by headphone type
app.get('/products/type/:type', async (req, res) => {
    try {
        const type = req.params.type;
        const products = await Product.find({ type });
        res.json(products);
    } catch (error) {
        console.error('Error filtering products by type:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// Route to filter products by company
// Route to filter products by company
app.get('/products/brand/:brand', async (req, res) => {
    try {
        const brand = req.params.brand;
        const products = await Product.find({ brand });
        res.json(products);
    } catch (error) {
        console.error('Error filtering products by brand:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Route to filter products by color
app.get('/products/color/:color', async (req, res) => {
    try {
        const color = req.params.color;
        const products = await Product.find({ color });
        res.json(products);
    } catch (error) {
        console.error('Error filtering products by color:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.get('/products/price/:minPrice/:maxPrice', async (req, res) => {
    try {
        // Extract minPrice and maxPrice from request parameters
        const minPrice = parseFloat(req.params.minPrice.replace('₹', '').replace('-', '').trim());
        const maxPrice = parseFloat(req.params.maxPrice.replace('₹', '').replace('-', '').trim());
        
        // Then use the parsed values to query the database
        const products = await Product.find({ price: { $gte: minPrice, $lte: maxPrice } });
        
        // Send the response with the filtered products
        res.json(products);
    } catch (error) {
        console.error('Error filtering products by price range:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Route to fetch products with sorting
// Route to fetch products with sorting
app.get('/products/sort/:sortBy', async (req, res) => {
    try {
        const { sortBy } = req.params;
        let sortQuery = {};

        // Determine the sorting order based on the provided sortBy parameter
        switch (sortBy) {
            case 'priceLowToHigh':
                sortQuery = { price: 1 };
                break;
            case 'priceHighToLow':
                sortQuery = { price: -1 };
                break;
            case 'nameAZ':
                sortQuery = { product_name: 1 };
                break;
            case 'nameZA':
                sortQuery = { product_name: -1 };
                break;
            default:
                break;
        }

        // Apply collation to make name sorting case-insensitive
        const collationOptions = { locale: 'en', strength: 2 }; // Strength 2 for case-insensitive
        const products = await Product.find().collation(collationOptions).sort(sortQuery);
        res.json(products);
    } catch (error) {
        console.error('Error fetching sorted products:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Route to fetch a single product by ID
app.get('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// Add this route to your backend server
// Route to add a product to the cart
// Route to add a product to the cart
// Route to add a product to the cart
app.post('/cart', async (req, res) => {
    try {
        const { productId, name, price, color, image } = req.body;

        // Check if the product already exists in the cart
        const existingCartItem = await MyCart.findOne({ 'products.productId': productId });

        if (existingCartItem) {
            // If the product exists, increment its quantity by 1
            await MyCart.updateOne(
                { 'products.productId': productId },
                { $inc: { 'products.$.quantity': 1 } }
            );
        } else {
            // If the product doesn't exist, add it to the cart with quantity 1
            await MyCart.updateOne(
                {},
                { $push: { products: { productId, name, price, color, image, quantity: 1 } } },
                { upsert: true }
            );
        }

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Route to fetch cart items
app.get('/cart', async (req, res) => {
    try {
      // Fetch the cart items from the database
      const cart = await MyCart.findOne(); // Assuming there's only one cart document for now
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
      res.json(cart);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      res.status(500).json({ message: 'Server Error' });
    }
});
app.get('/cart/quantity', async (req, res) => {
    try {
        // Fetch the cart items from the database
        const cart = await MyCart.findOne(); // Assuming there's only one cart document for now
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Calculate the total number of items in the cart
        let totalItems = 0;
        cart.products.forEach(product => {
            totalItems += product.quantity;
        });

        // Send the cart data along with the total number of items
        res.json({ cart, totalItems });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/cart/updateQuantity', async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Update the quantity of the specified product in the cart
        await MyCart.updateOne(
            { 'products.productId': productId },
            { $set: { 'products.$.quantity': quantity } }
        );

        res.status(200).json({ message: 'Quantity updated successfully' });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
