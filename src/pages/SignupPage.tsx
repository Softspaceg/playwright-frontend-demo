import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type Field = 'name' | 'email' | 'password' | 'confirmPassword';
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email';
  if (!values.password) errors.password = 'Password is required';
  else if (values.password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

const FIELDS: { key: Field; label: string; type: string; autoComplete: string }[] = [
  { key: 'name', label: 'Full name', type: 'text', autoComplete: 'name' },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { key: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<Field, string>>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await signup(values.name, values.email, values.password);
      navigate('/products');
    } catch (err) {
      setFormError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate data-testid="signup-form">
        <h1>Create account</h1>
        <p className="muted">Sign up to browse our products.</p>

        {formError && (
          <div className="alert" role="alert" data-testid="form-error">
            {formError}
          </div>
        )}

        {FIELDS.map(({ key, label, type, autoComplete }) => {
          const testId = `signup-${key.replace('confirmPassword', 'confirm-password')}`;
          return (
            <div key={key} className="field">
              <label htmlFor={testId}>{label}</label>
              <input
                id={testId}
                type={type}
                autoComplete={autoComplete}
                value={values[key]}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                aria-invalid={Boolean(errors[key])}
                data-testid={testId}
              />
              {errors[key] && (
                <span className="field-error" data-testid={`${testId}-error`}>
                  {errors[key]}
                </span>
              )}
            </div>
          );
        })}

        <button type="submit" className="btn" disabled={loading} data-testid="signup-submit">
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="muted center">
          Already have an account?{' '}
          <Link to="/login" data-testid="go-to-login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
