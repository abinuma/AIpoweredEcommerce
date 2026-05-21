import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../../context/ShopContext';

const ReviewManager = ({ productId, token }) => {
    const { backendUrl } = useContext(ShopContext);
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

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

    useEffect(() => {
        fetchSummary();
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
                <p className="text-xs text-gray-500">No summary generated yet.</p>
            )}
        </div>
    );
};

export default ReviewManager;
