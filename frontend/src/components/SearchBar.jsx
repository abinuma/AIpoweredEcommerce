import { useContext, useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchBar = () => {
    const {search, setSearch, showSearch, setShowSearch, backendUrl} = useContext(ShopContext);
    const [visible,setVisible]= useState(showSearch)
    const location = useLocation();
    const navigate = useNavigate();
    const inputRef= useRef(null);
    const [suggestions, setSuggestions] = useState({ productNames: [], categories: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(()=>{
        if( location.pathname === '/' || location.pathname.includes("collection") || location.pathname.includes("cart") ){
            setVisible(true);
        }
        else{
            setVisible(false);
        }
    },[location])

    useEffect(() => {
      if (showSearch && visible) {
        setTimeout(() => { inputRef.current?.focus(); }, 100);
      }
    }, [showSearch, visible]);

    // Click outside to close suggestions
    useEffect(() => {
      const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced suggestions fetch
    useEffect(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!search || search.length < 2) { setSuggestions({ productNames: [], categories: [] }); setShowSuggestions(false); return; }
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await axios.get(backendUrl + `/api/search/suggestions?q=${encodeURIComponent(search)}`);
          if (res.data.success) {
            setSuggestions({ productNames: res.data.productNames || [], categories: res.data.categories || [] });
            setShowSuggestions(true);
          }
        } catch (e) { console.log(e); }
      }, 300);
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    const selectSuggestion = (text) => {
      setSearch(text);
      setShowSuggestions(false);
    };

  return showSearch && visible ? (
    <div className='border-t border-b bg-gray-50 text-center relative'>
      <div ref={wrapperRef} className='relative inline-block w-3/4 sm:w-1/2 my-5 mx-3'>
        <div className='flex items-center justify-center border border-gray-400 px-5 py-2 rounded-full w-full'>
          <input ref={inputRef} value={search} onChange={(e)=>setSearch(e.target.value)} onFocus={() => { if (suggestions.productNames.length > 0 || suggestions.categories.length > 0) setShowSuggestions(true); }} className='flex-1 outline-none bg-inherit text-sm' type="text" placeholder='Search products...' />
          <img className='w-4' src={assets.search_icon} alt="" />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (suggestions.productNames.length > 0 || suggestions.categories.length > 0) && (
          <div className='absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-[300px] overflow-y-auto z-50 text-left'>
            {suggestions.productNames.length > 0 && (
              <div className='p-2'>
                <p className='text-xs text-gray-400 px-3 py-1 font-medium'>PRODUCTS</p>
                {suggestions.productNames.map((name, i) => (
                  <div key={i} onClick={() => selectSuggestion(name)} className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded'>
                    🔍 {name}
                  </div>
                ))}
              </div>
            )}
            {suggestions.categories.length > 0 && (
              <div className='p-2 border-t'>
                <p className='text-xs text-gray-400 px-3 py-1 font-medium'>CATEGORIES</p>
                {suggestions.categories.map((cat, i) => (
                  <div key={i} onClick={() => { selectSuggestion(cat); navigate('/collection'); }} className='px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded'>
                    📂 {cat}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <img onClick={()=>{setShowSearch(false); setShowSuggestions(false);}} className='inline w-3 cursor-pointer' src={assets.cross_icon} alt="" />
    </div>
  ) : null
}

export default SearchBar
