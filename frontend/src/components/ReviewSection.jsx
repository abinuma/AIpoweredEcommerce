import { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const ReviewSection = ({ productId }) => {
  const { backendUrl, token } = useContext(ShopContext);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total_reviews:0, average_rating:0, five_star:0, four_star:0, three_star:0, two_star:0, one_star:0 });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(backendUrl + `/api/review/${productId}`);
      if (res.data.success) { setReviews(res.data.reviews); setStats(res.data.stats); }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  useEffect(() => { if (productId) fetchReviews(); }, [productId]);

  const submitReview = async () => {
    if (!token) { toast.error("Please login to write a review"); return; }
    if (rating === 0) { toast.error("Please select a star rating"); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(backendUrl + "/api/review/", { productId, rating, comment }, { headers: { Authorization: token } });
      if (res.data.success) { toast.success("Review submitted!"); setRating(0); setComment(""); fetchReviews(); }
      else toast.error(res.data.message);
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete your review?")) return;
    try {
      const res = await axios.delete(backendUrl + `/api/review/${reviewId}`, { headers: { Authorization: token } });
      if (res.data.success) { toast.success("Review deleted"); fetchReviews(); }
    } catch (e) { toast.error(e.message); }
  };

  const stars = (n, sz=16) => Array(5).fill(0).map((_,i) => <span key={i} style={{color:i<n?"#f59e0b":"#d1d5db",fontSize:`${sz}px`}}>★</span>);
  const sortedReviews = [...reviews].sort((a, b) => b.rating - a.rating);
  const displayed = showAll ? sortedReviews : sortedReviews.slice(0,3);
  const loggedInUserId = (() => {
    try { return token ? JSON.parse(atob(token.split('.')[1])).id : null; }
    catch { return null; }
  })();
  const levels = [{l:"5",c:stats.five_star},{l:"4",c:stats.four_star},{l:"3",c:stats.three_star},{l:"2",c:stats.two_star},{l:"1",c:stats.one_star}];

  if (loading) return <div className="mt-8 animate-pulse space-y-4"><div className="h-6 bg-gray-200 rounded w-1/3"/><div className="h-20 bg-gray-200 rounded"/></div>;

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row gap-8 py-6 border-b">
        <div className="flex flex-col items-center justify-center min-w-[120px]">
          <p className="text-5xl font-bold text-gray-800">{stats.average_rating.toFixed(1)}</p>
          <div className="flex mt-1">{stars(Math.round(stats.average_rating),18)}</div>
          <p className="text-sm text-gray-500 mt-1">{stats.total_reviews} {stats.total_reviews===1?"review":"reviews"}</p>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          {levels.map(lv => (
            <div key={lv.l} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-gray-600">{lv.l}</span>
              <span className="text-yellow-500 text-xs">★</span>
              <div className="w-40 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{width:stats.total_reviews>0?`${(lv.c/stats.total_reviews)*100}%`:"0%"}}/>
              </div>
              <span className="w-6 text-xs text-gray-500 text-right">{lv.c}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="py-4">
        {reviews.length===0 ? <p className="text-center text-gray-400 py-8">No reviews yet. Be the first to review this product!</p> : <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map(r => (
              <div key={r.id} className="p-4 border rounded-xl bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">{r.reviewer_name?.[0]?.toUpperCase()||"U"}</div>
                      <div>
                        <p className="font-medium text-sm">{r.reviewer_name||"User"}</p>
                        <span className="text-xs text-gray-400">{new Date(parseInt(r.date)).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}</span>
                      </div>
                    </div>
                    {token && r.user_id === loggedInUserId && <button onClick={()=>deleteReview(r.id)} className="text-xs text-gray-400 hover:text-red-500">Delete</button>}
                  </div>
                  <div className="flex mb-2">{stars(r.rating,13)}</div>
                  {r.comment && <p className="text-sm text-gray-600 line-clamp-4">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
          {reviews.length>3 && <button onClick={()=>setShowAll(!showAll)} className="mt-4 text-sm font-medium text-gray-700 hover:text-black">{showAll?"Show Less":`Show All ${reviews.length} Reviews`}</button>}
        </>}
      </div>
      <div className="border-t pt-6 mt-2">
        <p className="font-medium text-base mb-4">Write a Review</p>
        {!token ? <p className="text-sm text-gray-500"><a href="/login" className="text-black underline">Log in</a> to write a review</p> : (
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => <button key={s} onClick={()=>setRating(s)} onMouseEnter={()=>setHoverRating(s)} onMouseLeave={()=>setHoverRating(0)} className="text-3xl cursor-pointer" style={{color:s<=(hoverRating||rating)?"#f59e0b":"#d1d5db",background:"none",border:"none",padding:"2px 4px"}}>★</button>)}
              {rating>0 && <span className="text-sm text-gray-500 ml-2">{rating}/5</span>}
            </div>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Share your experience... (optional)" className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-gray-500 resize-none" rows={3}/>
            <button onClick={submitReview} disabled={submitting||rating===0} className="bg-black text-white px-6 py-2.5 text-sm rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800">{submitting?"Submitting...":"Submit Review"}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
