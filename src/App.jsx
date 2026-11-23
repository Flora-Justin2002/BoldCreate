import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useStore } from './store.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Categories from './pages/Categories.jsx';
import Customers from './pages/Customers.jsx';
import CustomerProfile from './pages/CustomerProfile.jsx';
import Orders from './pages/Orders.jsx';
import Analytics from './pages/Analytics.jsx';
import Announcements from './pages/Announcements.jsx';
import Shop from './pages/Shop.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Confirmation from './pages/Confirmation.jsx';

export default function App() {
  const { roleInfo } = useStore();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to={roleInfo.home} replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerProfile />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/my-orders" element={<Orders mine />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="*" element={<Navigate to={roleInfo.home} replace />} />
      </Route>
    </Routes>
  );
}
