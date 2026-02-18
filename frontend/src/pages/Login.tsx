import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Zap, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.data.token);
      navigate('/today');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px]">
        {/* Card */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated shadow-elevated-lg p-8">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius)] bg-foreground text-background mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h1 className="text-h1">Welcome back</h1>
            <p className="text-body mt-2">Sign in to your productivity dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-[var(--radius-sm)] bg-destructive-subtle border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
            />

            {/* Password Field */}
            <Input
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-caption text-fg-muted">
              Don't have an account?{' '}
              <button 
                type="button"
                className="text-foreground hover:underline font-medium"
                onClick={() => {/* TODO: Navigate to register */}}
              >
                Create one
              </button>
            </p>
          </div>
        </div>

        {/* Branding */}
        <p className="text-center text-caption text-fg-subtle mt-6">
          Productivity App — All-in-one personal dashboard
        </p>
      </div>
    </div>
  );
}
