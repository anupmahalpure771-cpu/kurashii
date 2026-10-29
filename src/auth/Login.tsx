import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { mapAuthError, mapAuthErrorField } from './authErrors';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { loginWithEmail, loginWithGoogle, loginWithDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setFieldErrors({});

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
      return;
    }
    if (!password) {
      setFieldErrors((prev) => ({ ...prev, password: 'Please enter your password.' }));
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      const friendlyMsg = mapAuthError(err);
      const targetField = mapAuthErrorField(err);

      setErrorBanner(friendlyMsg);
      if (targetField === 'email') {
        setFieldErrors({ email: friendlyMsg });
      } else if (targetField === 'password') {
        setFieldErrors({ password: friendlyMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorBanner(null);
    setFieldErrors({});
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setErrorBanner(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const isPending = loading || googleLoading;

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to your Personal and Professional workspace"
    >
      <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/90 rounded-[16px]">
        {errorBanner && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-[10px] bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
          >
            {errorBanner}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="you@example.com"
            error={fieldErrors.email}
            disabled={isPending}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              error={fieldErrors.password}
              disabled={isPending}
              rightElement={
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={loading}
            disabled={isPending}
          >
            Log in
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">or</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2.5 font-medium"
              onClick={handleGoogleSignIn}
              isLoading={googleLoading}
              disabled={isPending}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80"
              onClick={() => {
                loginWithDemo();
                navigate('/app', { replace: true });
              }}
              disabled={isPending}
            >
              <span>⚡ Try Interactive Demo (Instant Access)</span>
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-slate-900 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
