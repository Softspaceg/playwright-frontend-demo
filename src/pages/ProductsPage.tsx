import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { categories, products } from '../data/products';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
    );
  }, [search, category]);

  return (
    <>
      <Navbar />
      <main className="container">
        <div className="toolbar">
          <h1>Products</h1>
          <div className="filters">
            <input
              type="search"
              placeholder="Search products…"
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="product-search"
            />
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="category-filter"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="muted" data-testid="product-count">
          Showing {visible.length} of {products.length} products
        </p>

        {visible.length === 0 ? (
          <p className="empty" data-testid="no-products">
            No products found
          </p>
        ) : (
          <ul className="grid" data-testid="product-list">
            {visible.map((p) => (
              <li key={p.id} className="card product-card" data-testid="product-card">
                <div className="product-image" aria-hidden="true">
                  {p.emoji}
                </div>
                <span className="badge" data-testid="product-category">
                  {p.category}
                </span>
                <h2 data-testid="product-name">{p.name}</h2>
                <p className="muted small">{p.description}</p>
                <p className="price" data-testid="product-price">
                  ${p.price.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
