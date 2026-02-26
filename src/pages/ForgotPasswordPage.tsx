import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast({ title: 'OTP Sent', description: `A verification code has been sent to ${email}` });
      setStep('otp');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to send OTP', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast({ title: 'OTP Verified', description: 'Please set your new password.' });
      setStep('reset');
    } catch (err) {
      toast({ title: 'Invalid Code', description: err instanceof Error ? err.message : 'Please check the code and try again.', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please ensure both passwords match.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast({ title: 'Password Reset', description: 'Your password has been updated successfully.' });
      setStep('done');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to reset password', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast({ title: 'Code Resent', description: `A new code has been sent to ${email}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to resend code', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md text-center">
          <Droplets className="w-16 h-16 text-primary-foreground/80 mx-auto mb-6" />
          <h1 className="text-4xl font-display text-primary-foreground mb-4">Reset Password</h1>
          <p className="text-primary-foreground/60">We'll help you get back into your account.</p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>

          {step === 'done' ? (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-fit p-4 rounded-full bg-success/10">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
              <h2 className="text-2xl font-display text-foreground">All Set!</h2>
              <p className="text-muted-foreground">Your password has been reset. You can now sign in.</p>
              <Button onClick={() => navigate('/login')} className="w-full">Go to Sign In</Button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-display text-foreground">
                  {step === 'email' && 'Forgot Password'}
                  {step === 'otp' && 'Verify Code'}
                  {step === 'reset' && 'New Password'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {step === 'email' && 'Enter your email to receive a verification code.'}
                  {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
                  {step === 'reset' && 'Choose a strong new password.'}
                </p>
              </div>

              {step === 'email' && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Verification Code'}</Button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <Input placeholder="123456" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required className="text-center text-lg tracking-widest" />
                  </div>
                  <Button type="submit" className="w-full" disabled={otp.length < 4 || loading}>{loading ? 'Verifying...' : 'Verify Code'}</Button>
                  <button type="button" onClick={handleResend} className="text-sm text-primary hover:underline w-full text-center">
                    Resend Code
                  </button>
                </form>
              )}

              {step === 'reset' && (
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
                </form>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}