const mongoose = require('mongoose');

const myCartSchema = new mongoose.Schema({
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        price: Number,
        color: String,
        image: String,
        quantity: { type: Number, default: 1 },
    }]
});

const MyCart = mongoose.model('MyCart', myCartSchema);

module.exports = MyCart;
