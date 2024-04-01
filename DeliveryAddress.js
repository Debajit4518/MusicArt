const mongoose = require('mongoose');

// Define schema for delivery address
const deliveryAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: {
    type: String
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  }
});

// Create model for delivery address using the schema
const DeliveryAddress = mongoose.model('DeliveryAddress', deliveryAddressSchema);

module.exports = DeliveryAddress;
