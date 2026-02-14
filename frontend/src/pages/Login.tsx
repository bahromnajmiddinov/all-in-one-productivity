import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.data.token);
      navigate('/today');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] rounded-[var(--radius-lg)] border border-border bg-bg-elevated shadow-soft-lg p-8">
        <h1 className="text-h1 text-center">Sign in</h1>
        <p className="text-body text-center mt-2">Enter your credentials to continue.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
