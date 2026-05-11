import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Collection from './pages/Collection'
import PlaceOrder from './pages/PlaceOrder'
import About from './pages/About'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Orders from './pages/Orders'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Verify from './pages/Verify'
import SellerRequest from './pages/SellerRequest'
import ChatBot from './components/ChatBot'
import Shops from './pages/Shops'
import ShopProducts from './pages/ShopProducts'
import AdminApp from './admin/App'
import SellerApp from './seller/SellerApp'

const App = () => {
  const location = useLocation();
  const isPanelPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller');

  return (
    <div className={isPanelPath ? '' : 'px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'}>
      <ToastContainer />
      {!isPanelPath && <Navbar />}
      {!isPanelPath && <SearchBar />}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/shops' element={<Shops/>}/>
        <Route path='/shops/:shopId' element={<ShopProducts/>}/>
        <Route path="/collection" element={<Collection/>}/>
        <Route path='/about' element={<About/>}/>
        <Route path='/contact' element={<Contact/>}/>
        <Route path='/product/:productId' element={<Product/>}/>
        <Route path='/cart' element={<Cart/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/place-order' element={<PlaceOrder/>}/>
        <Route path='/orders' element={<Orders/>}/>
        <Route path='/verify' element={<Verify/>}/>
        <Route path='/seller-request' element={<SellerRequest/>}/>
        <Route path='/admin/*' element={<AdminApp />} />
        <Route path='/seller/*' element={<SellerApp />} />
      </Routes>
      {!isPanelPath && <Footer />}
      {!isPanelPath && <ChatBot />}
    </div>
  )
}

export default App
