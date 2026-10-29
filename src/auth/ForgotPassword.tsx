import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { sendResetEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await sendResetEmail(email.trim());
    } catch {
      // Intentionally suppress error to prevent account enumeration
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <AuthLayout
      heading="Reset password"
      subheading="We will send instructions to reset your account password"
    >
      <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/90 rounded-[16px]">
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="font-heading font-semibold text-slate-900 text-base mb-2">
              Check your inbox
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              If an account exists for that email, a reset link is on its way.
            </p>
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Return to log in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Send reset link
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};
