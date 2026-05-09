import express from 'express';
import { addReview, getProductReview, deleteReview, getReviewSummary } from '../controllers/reviewController.js';
import authUser, { isSuspended } from '../middleware/auth.js';

const reviewRouter = express.Router();

reviewRouter.post('/', authUser,isSuspended, addReview);
reviewRouter.get('/:productId', getProductReview);
reviewRouter.delete('/:reviewId', authUser,isSuspended, deleteReview);
reviewRouter.get('/:productId/summary', getReviewSummary);

export default reviewRouter;