import { useEffect, useState, type FormEvent } from 'react';
import { categories, type Product } from '../data/products';

type Field = 'name' | 'price' | 'category' | 'description';
type Errors = Partial<Record<Field, string>>;

interface Props {
  onAdd: (product: Omit<Product, 'id'>) => void;
  onClose: () => void;
}

function validate(values: Record<Field, string>): Errors {
  const errors: Errors = {};
  const price = Number(values.price);
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.price.trim()) errors.price = 'Price is required';
  else if (!Number.isFinite(price) || price <= 0) errors.price = 'Price must be greater than 0';
  if (!values.category) errors.category = 'Category is required';
  return errors;
}

export default function AddProductDialog({ onAdd, onClose }: Props) {
  const [values, setValues] = useState<Record<Field, string>>({
    name: '',
    price: '',
    category: '',
    description: '',
  });
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const set = (key: Field) => (e: { target: { value: string } }) =>
    setValues({ ...values, [key]: e.target.value });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onAdd({
      name: values.name.trim(),
      price: Number(values.price),
      category: values.category,
      description: values.description.trim(),
      emoji: '📦',
    });
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="card dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-title"
        onClick={(e) => e.stopPropagation()}
        data-testid="add-product-dialog"
      >
        <form onSubmit={handleSubmit} noValidate>
          <h2 id="add-product-title">Add product</h2>

          <div className="field">
            <label htmlFor="product-name">Name</label>
            <input
              id="product-name"
              value={values.name}
              onChange={set('name')}
              aria-invalid={Boolean(errors.name)}
              autoFocus
              data-testid="product-name-input"
            />
            {errors.name && (
              <span className="field-error" data-testid="product-name-error">
                {errors.name}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="product-price">Price</label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={values.price}
              onChange={set('price')}
              aria-invalid={Boolean(errors.price)}
              data-testid="product-price-input"
            />
            {errors.price && (
              <span className="field-error" data-testid="product-price-error">
                {errors.price}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="product-category">Category</label>
            <select
              id="product-category"
              value={values.category}
              onChange={set('category')}
              aria-invalid={Boolean(errors.category)}
              data-testid="product-category-input"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="field-error" data-testid="product-category-error">
                {errors.category}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="product-description">Description (optional)</label>
            <textarea
              id="product-description"
              rows={3}
              value={values.description}
              onChange={set('description')}
              data-testid="product-description-input"
            />
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              data-testid="add-product-cancel"
            >
              Cancel
            </button>
            <button type="submit" className="btn" data-testid="add-product-submit">
              Save product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
