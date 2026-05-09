import express from 'express';
import { getNearByShop, getNearbyProducts, updateSellerLocation } from '../controllers/locationController.js';
import sellerAuth from '../middleware/sellerAuth.js';

const locationRoute = express.Router();

locationRoute.get('/nearby-shops', getNearByShop);
locationRoute.get('/nearby-products', getNearbyProducts);
locationRoute.patch('/update', sellerAuth, updateSellerLocation);

export default locationRoute;