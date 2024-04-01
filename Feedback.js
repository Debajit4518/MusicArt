// Import necessary modules
const mongoose = require('mongoose');

// Define the schema for the Feedback model
const feedbackSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    }
});

// Create the Feedback model
const Feedback = mongoose.model('Feedback', feedbackSchema);

// Export the model
module.exports = Feedback;
