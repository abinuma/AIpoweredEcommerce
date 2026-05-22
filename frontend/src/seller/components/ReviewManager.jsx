import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../../context/ShopContext';

const ReviewManager = ({ productId, token }) => {
    const { backendUrl } = useContext(ShopContext);
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [showAll, setShowAll] = useState(false);

    const fetchSummary = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/review/seller/${productId}/summary`, { headers: { Authorization: token } });
            if (res.data.success) {
                setSummaryData(res.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/review/${productId}`);
            if (res.data.success) {
                setReviews(res.data.reviews || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchSummary();
            fetchReviews();
        }
    }, [productId]);

    const handleSummarize = async () => {
        setGenerating(true);
        try {
            const res = await axios.post(`${backendUrl}/api/review/${productId}/summarize`, {}, { headers: { Authorization: token } });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchSummary();
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
        setGenerating(false);
    };

    const handleShare = async () => {
        try {
            const res = await axios.post(`${backendUrl}/api/review/${productId}/share-summary`, {}, { headers: { Authorization: token } });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchSummary();
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="mt-2 p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Review Summary Management</h4>
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={handleSummarize} 
                    disabled={generating}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {generating ? "Summarizing..." : "Summarize Reviews"}
                </button>
                <button 
                    onClick={handleShare}
                    disabled={!summaryData?.draft_summary || summaryData?.is_shared}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {summaryData?.is_shared ? "Currently Shared" : "Share Summary"}
                </button>
            </div>
            {summaryData?.draft_summary && (
                <div className="text-sm border p-3 rounded bg-white">
                    <p className="font-medium text-gray-700 mb-1">Current Draft:</p>
                    <p className="text-gray-600 mb-2">{summaryData.draft_summary}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-medium text-green-700 text-xs">Pros</p>
                            <ul className="list-disc list-inside text-xs text-gray-600">
                                {summaryData.draft_pros?.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-red-700 text-xs">Cons</p>
                            <ul className="list-disc list-inside text-xs text-gray-600">
                                {summaryData.draft_cons?.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            {!summaryData?.draft_summary && (
                <p className="text-xs text-gray-500 mb-4">No summary generated yet.</p>
            )}
            
            <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-sm mb-3">All Customer Reviews</h4>
                {reviews.length === 0 ? (
                    <p className="text-xs text-gray-500">No reviews yet.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {(showAll ? reviews : reviews.slice(0, 3)).map((rev) => (
                            <div key={rev._id} className="p-3 bg-white border rounded text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex text-amber-500 text-xs">
                                        {Array(5).fill(0).map((_, i) => (
                                            <span key={i} className={i < rev.rating ? "" : "text-gray-300"}>★</span>
                                        ))}
                                    </div>
                                    <span className="text-gray-800 font-medium">{rev.user_name}</span>
                                    <span className="text-gray-400 text-xs">
                                        {new Date(Number(rev.date)).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-600 mt-1">{rev.comment}</p>
                            </div>
                        ))}
                        {reviews.length > 3 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 self-start"
                            >
                                {showAll ? "Show Less" : "Show More"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewManager;
