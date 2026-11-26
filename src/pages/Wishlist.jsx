import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { Empty, PageHeader } from '../components/Ui.jsx';
import { useStore } from '../store.jsx';

export default function Wishlist() {
  const { products, wishlist } = useStore();
  const list = products.filter((p) => wishlist.includes(p.id));
  return (
    <>
      <PageHeader title="My Wishlist" subtitle={`${list.length} saved items`} />
      {list.length === 0 ? <Empty icon="🤍" title="Your wishlist is empty"><Link to="/shop">Discover products</Link></Empty> : (
        <div className="product-grid">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </>
  );
}
