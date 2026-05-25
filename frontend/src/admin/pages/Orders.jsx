import React, { useState, useEffect, useMemo } from "react";
import { backendUrl, currency } from "../App";
import axios from "axios";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";

const STATUS_COLORS = {
  "Order Placed": { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  "Packing":      { bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-400" },
  "Shipped":      { bg: "bg-blue-50",   text: "text-blue-700",  dot: "bg-blue-400" },
  "Out for delivery": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-400" },
  "Delivered":    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Cancelled":    { bg: "bg-red-50",     text: "text-red-700",   dot: "bg-red-400" },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, sub, icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-lg">{icon}</span>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [revenueMin, setRevenueMin] = useState("");
  const [revenueMax, setRevenueMax] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  const fetchAllOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(backendUrl + "/api/order/list", {
        headers: { Authorization: token },
      });
      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  // Unique shops
  const shops = useMemo(() => {
    const s = new Set();
    orders.forEach(o => { if (o.shopName) s.add(o.shopName); });
    return [...s].sort();
  }, [orders]);

  // Unique statuses
  const statuses = useMemo(() => {
    const s = new Set();
    orders.forEach(o => s.add(o.status));
    return [...s];
  }, [orders]);

  const shopOrderCounts = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      const shop = o.shopName || "Unknown";
      counts[shop] = (counts[shop] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filtered + sorted
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter) result = result.filter(o => o.status === statusFilter);
    if (shopFilter) result = result.filter(o => o.shopName === shopFilter);
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter(o => o.date >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).setHours(23, 59, 59, 999);
      result = result.filter(o => o.date <= to);
    }
    if (revenueMin) result = result.filter(o => o.amount >= Number(revenueMin));
    if (revenueMax) result = result.filter(o => o.amount <= Number(revenueMax));

    switch (sortBy) {
      case "recent": result.sort((a, b) => b.date - a.date); break;
      case "oldest": result.sort((a, b) => a.date - b.date); break;
      case "highest": result.sort((a, b) => b.amount - a.amount); break;
      case "lowest": result.sort((a, b) => a.amount - b.amount); break;
      case "shopOrders":
        result.sort((a, b) => {
          const diff =
            (shopOrderCounts[b.shopName] || 0) - (shopOrderCounts[a.shopName] || 0);
          return diff !== 0 ? diff : b.date - a.date;
        });
        break;
      default: break;
    }
    return result;
  }, [orders, statusFilter, shopFilter, dateFrom, dateTo, revenueMin, revenueMax, sortBy, shopOrderCounts]);

  // Analytics
  const analytics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + (o.amount || 0), 0);

    // Status counts
    const statusCounts = {};
    orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    // Per shop
    const shopStats = {};
    orders.forEach(o => {
      const shop = o.shopName || "Unknown";
      if (!shopStats[shop]) shopStats[shop] = { orders: 0, revenue: 0 };
      shopStats[shop].orders++;
      shopStats[shop].revenue += o.amount || 0;
    });

    const shopArray = Object.entries(shopStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    return { totalOrders, totalRevenue, statusCounts, shopArray };
  }, [orders]);

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const clearFilters = () => {
    setStatusFilter(""); setShopFilter(""); setDateFrom(""); setDateTo("");
    setRevenueMin(""); setRevenueMax(""); setSortBy("recent"); setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter || shopFilter || dateFrom || dateTo || revenueMin || revenueMax;

  return (
    <div className="max-w-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-5">Orders Dashboard</h2>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading orders...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Orders" value={analytics.totalOrders} icon="📦" />
            <StatCard label="Total Revenue" value={`${currency}${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon="💰" />
            <StatCard label="Active Shops" value={analytics.shopArray.length} icon="🏪" />
            <StatCard label="Delivered" value={analytics.statusCounts["Delivered"] || 0} sub={`of ${analytics.totalOrders} orders`} icon="✅" />
          </div>

          {/* Status summary row */}
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(analytics.statusCounts).map(([status, count]) => (
              <button key={status} onClick={() => { setStatusFilter(statusFilter === status ? "" : status); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                  statusFilter === status ? "bg-gray-800 text-white border-gray-800" : `${(STATUS_COLORS[status] || {}).bg || 'bg-gray-100'} ${(STATUS_COLORS[status] || {}).text || 'text-gray-700'} border-gray-200 hover:border-gray-300`
                }`}>
                {status} <span className="font-bold">{count}</span>
              </button>
            ))}
          </div>

          {/* Shop breakdown */}
          {analytics.shopArray.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Revenue by Shop</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {analytics.shopArray.map(shop => (
                  <div key={shop.name} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      <span className="font-medium text-gray-800">{shop.name}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">{shop.orders} order{shop.orders !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{currency}{shop.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowFilters(!showFilters)}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                </button>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline cursor-pointer">Clear all</button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Sort:</span>
                <select value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="text-sm border border-gray-200 rounded px-2 py-1 text-gray-700 outline-none">
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest Revenue</option>
                  <option value="lowest">Lowest Revenue</option>
                  <option value="shopOrders">Most Orders per Shop</option>
                </select>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Status</label>
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none">
                    <option value="">All</option>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Shop</label>
                  <select value={shopFilter} onChange={e => { setShopFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none">
                    <option value="">All Shops</option>
                    {shops.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">From</label>
                  <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">To</label>
                  <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Min Revenue</label>
                  <input type="number" value={revenueMin} onChange={e => { setRevenueMin(e.target.value); setCurrentPage(1); }}
                    placeholder="0" className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Max Revenue</label>
                  <input type="number" value={revenueMax} onChange={e => { setRevenueMax(e.target.value); setCurrentPage(1); }}
                    placeholder="∞" className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none" />
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-gray-400 mb-2">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found</p>

          {/* Orders table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center py-2.5 px-4 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Customer & Items</span>
              <span>Shop</span>
              <span>Amount</span>
              <span>Payment</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p className="text-base">No orders match your filters</p>
              </div>
            ) : (
              currentItems.map((order) => (
                <div key={order._id}
                  className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-start gap-2 lg:gap-3 py-3 px-4 border-b border-gray-100 text-sm hover:bg-gray-50/50 transition-colors">
                  {/* Customer & Items */}
                  <div>
                    <p className="font-medium text-gray-800 mb-0.5">
                      {order.address?.firstName} {order.address?.lastName}
                    </p>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {order.items?.map((item, i) => (
                        <span key={i} className="block">
                          {item.name} × {item.quantity} {item.size && <span className="text-gray-400">({item.size})</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {order.address?.city}, {order.address?.state}
                    </p>
                    {/* Mobile-only extra info */}
                    <div className="lg:hidden flex flex-wrap gap-2 mt-2 items-center">
                      <span className="text-xs text-gray-500">{order.shopName || '—'}</span>
                      <span className="font-semibold text-gray-800">{currency}{order.amount}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Shop */}
                  <p className="hidden lg:block text-gray-600 text-sm truncate">{order.shopName || '—'}</p>

                  {/* Amount */}
                  <p className="hidden lg:block font-semibold text-gray-800">{currency}{order.amount}</p>

                  {/* Payment */}
                  <div className="hidden lg:block">
                    <p className="text-xs text-gray-600">{order.paymentMethod}</p>
                    <span className={`text-xs font-medium ${order.payment ? "text-emerald-600" : "text-amber-600"}`}>
                      {order.payment ? "Paid" : "Pending"}
                    </span>
                  </div>

                  {/* Date */}
                  <p className="hidden lg:block text-xs text-gray-500">
                    {new Date(order.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>

                  {/* Status - read only for admin */}
                  <div className="hidden lg:block">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="py-3 border-t border-gray-100"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
