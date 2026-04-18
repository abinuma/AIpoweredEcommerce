// --- orderModel.js ---
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId : {type: String, required: true},
    items : {type: Array, required: true},
    amount : {type: Number, required: true},
    address : {type: Object, required: true},
    status : {type: String, required: true, default: 'Order Placed'},
    paymentMethod : {type: String, required: true},
    payment : {type: Boolean, required: true, default: false},
    date : {type: Number, required: true},
})

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);
export default orderModel;

// --- productModel.js ---
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {type: String,required: true},
    description: {type: String,required: true},
    price: {type: Number, required: true},
    image: {type: Array, required: true},
    category: {type: String, required: true},
    subCategory: {type: String, required: true},
    sizes: {type: Array, required: true},
    bestseller : {type: Boolean},
    date: {type: Number, required :true}


})

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;

// --- userModel.js ---
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    role: {type: String, enum:['client','seller','admin'],default: 'client',required},
    password: {type: String, required: true},
    cartData: {type: Object, default: {}}
}, {minimize: false});

const userModel = mongoose.models.user || mongoose.model("user" , userSchema)

export default userModel
