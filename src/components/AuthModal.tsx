import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { localAccountService } from '../services/localAccountService';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle, Shield, Laptop, Check } from 'lucide-react';

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
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseBrowserOnly = () => {
    if (!email) {
      setErrorMsg('Please enter an email address for your browser account.');
      return;
    }
    localAccountService.saveLocalAccount({
      email,
      isCloudSynced: false
    });
    setSuccessMsg('Browser account activated! Your decks and collection are saved locally.');
    if (onAuthSuccess) onAuthSuccess();
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setUnconfirmedEmail(null);

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
        if (!isSupabaseConfigured) {
          // If Supabase is not configured, save directly as browser account
          localAccountService.saveLocalAccount({ email, isCloudSynced: false });
          setSuccessMsg('Account created and saved locally on this browser!');
          if (onAuthSuccess) onAuthSuccess();
          setTimeout(() => onClose(), 900);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: email.split('@')[0] },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        // Save local browser account immediately so user can proceed
        localAccountService.saveLocalAccount({
          id: data.user?.id,
          email,
          isCloudSynced: Boolean(data.session)
        });

        if (data.session) {
          // Email confirmation was disabled or automatically verified
          setSuccessMsg('Account created and signed in! Cloud sync active.');
          if (onAuthSuccess) onAuthSuccess();
          setTimeout(() => onClose(), 900);
        } else {
          // Email confirmation is required by Supabase project
          setUnconfirmedEmail(email);
          setSuccessMsg('Account created and saved on this browser! (Check email to enable cloud sync across devices).');
          if (onAuthSuccess) onAuthSuccess();
        }
      } else {
        if (!isSupabaseConfigured) {
          // Fallback to browser account
          localAccountService.saveLocalAccount({ email, isCloudSynced: false });
          setSuccessMsg('Signed in to browser account!');
          if (onAuthSuccess) onAuthSuccess();
          setTimeout(() => onClose(), 900);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setUnconfirmedEmail(email);
            throw new Error('Supabase email is not confirmed yet. You can still use this account locally on this browser below!');
          }
          throw error;
        }

        if (data.user) {
          localAccountService.syncWithSupabaseUser(data.user);
        }

        setSuccessMsg('Signed in successfully! Retrieving decks...');
        if (onAuthSuccess) onAuthSuccess();
        setTimeout(() => {
          onClose();
        }, 900);
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
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </h2>
            <p className="text-xs text-stone-400">
              Save your account on this browser & retrieve your decks
            </p>
          </div>
        </div>

        {/* Not Configured Alert */}
        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Local Browser Storage Active</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Supabase cloud keys are not configured. Your account and decks will be stored directly on this browser.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl flex flex-col gap-2 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            {unconfirmedEmail && (
              <button
                type="button"
                onClick={handleUseBrowserOnly}
                className="mt-1 py-1 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Continue as Browser Account ({unconfirmedEmail})</span>
              </button>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl flex flex-col gap-2 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            {unconfirmedEmail && (
              <button
                type="button"
                onClick={() => onClose()}
                className="mt-1 py-1 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Start Using App Now</span>
              </button>
            )}
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
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In & Retrieve Decks</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2.5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setSuccessMsg(null);
              setUnconfirmedEmail(null);
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition"
          >
            {isSignUp ? (
              <span>Already have an account? <strong>Sign In</strong></span>
            ) : (
              <span>Need an account? <strong>Sign Up (Free)</strong></span>
            )}
          </button>

          <button
            type="button"
            onClick={handleUseBrowserOnly}
            className="text-[11px] text-stone-400 hover:text-stone-300 transition flex items-center justify-center gap-1"
          >
            <Laptop className="w-3 h-3 text-stone-500" />
            <span>Store account in browser only (No password required)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
