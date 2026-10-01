import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase API key is not configured in Vercel or .env yet.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setSuccessMsg('Account created! Please check your email for a confirmation link (or sign in if email confirmation is disabled).');
        if (onAuthSuccess) onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setSuccessMsg('Signed in successfully!');
        if (onAuthSuccess) onAuthSuccess();
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0f1420] border border-[#c5a059]/40 rounded-2xl shadow-2xl p-6 text-stone-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40">
            <Shield className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h2 className="text-lg font-fantasy font-black tracking-wide text-white">
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN TO CLOUD'}
            </h2>
            <p className="text-xs text-stone-400">
              Sync your Brawl decks and Arena collection across devices
            </p>
          </div>
        </div>

        {/* Not Configured Alert */}
        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Supabase Anon Key Required</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Paste your Supabase API key in Vercel's Environment Variables (<code className="bg-black/40 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>) to enable cloud accounts.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="planeswalker@mtg.com"
                required
                className="w-full bg-[#161d2d] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#161d2d] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Cloud Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Cloud</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition"
          >
            {isSignUp ? (
              <span>Already have an account? <strong>Sign In</strong></span>
            ) : (
              <span>Need an account? <strong>Sign Up (Free)</strong></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
