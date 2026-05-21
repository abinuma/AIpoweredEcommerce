import express from 'express';
import { addReview, getProductReview, deleteReview, getReviewSummary, generateSummary, shareSummary, getSellerReviewSummary } from '../controllers/reviewController.js';
import authUser, { isSuspended } from '../middleware/auth.js';

const reviewRouter = express.Router();

reviewRouter.post('/', authUser,isSuspended, addReview);
reviewRouter.get('/:productId', getProductReview);
reviewRouter.delete('/:reviewId', authUser,isSuspended, deleteReview);
reviewRouter.get('/:productId/summary', getReviewSummary);

reviewRouter.get('/seller/:productId/summary', authUser, isSuspended, getSellerReviewSummary);
reviewRouter.post('/:productId/summarize', authUser, isSuspended, generateSummary);
reviewRouter.post('/:productId/share-summary', authUser, isSuspended, shareSummary);

export default reviewRouter;