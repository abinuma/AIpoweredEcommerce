import { useContext, useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import { useLocation } from 'react-router-dom';

const SearchBar = () => {
    const {search, setSearch, showSearch, setShowSearch} = useContext(ShopContext);
    const [visible,setVisible]= useState(showSearch)
    const location = useLocation();
    const inputRef= useRef(null);

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
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }
}, [showSearch, visible]);

  return showSearch && visible ? (
    <div className='border-t border-b bg-gray-50 text-center'>
      <div className='inline-flex items-center justify-center border border-gray-400 px-5 py-2 my-5 mx-3 rounded-full w-3/4 sm:w-1/2'>
      <input ref={inputRef} value={search} onChange={(e)=>setSearch(e.target.value)} className='flex-1 outline-none bg-inherit text-sm' type="text" placeholder='Search' />
      <img className='w-4' src={assets.search_icon} alt="" />
      </div>
      <img onClick={()=>setShowSearch(false)} className='inline w-3 cursor-pointer' src={assets.cross_icon} alt="" />
    </div>
  ) : null
}

export default SearchBar
