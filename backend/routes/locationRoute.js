import express from 'express';
import { getNearByShop, getNearbyProducts, updateSellerLocation, getAllShops } from '../controllers/locationController.js';
import sellerAuth from '../middleware/sellerAuth.js';

const locationRoute = express.Router();

locationRoute.get('/nearby-shops', getNearByShop);
locationRoute.get('/nearby-products', getNearbyProducts);
locationRoute.get('/all-shops', getAllShops);
locationRoute.patch('/update', sellerAuth, updateSellerLocation);

export default locationRoute;