import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.forgotPassword(email);
      toast.success(data.message || 'OTP sent successfully!');
      setStep(2);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to request reset OTP. Please check the email.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (otp.length !== 6) {
      toast.error('OTP must be exactly 6 digits');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.resetPassword({ email, otp, newPassword });
      toast.success(data.message || 'Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-xl bg-card rounded-lg overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center items-center gap-2 text-primary">
          <span className="text-3xl" role="img" aria-label="fire">🔥</span>
          <span className="text-3xl font-extrabold tracking-tight text-foreground">TZW LTD</span>
        </div>
        <CardTitle className="text-xl font-semibold text-foreground">Forgot Password</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {step === 1 
            ? "Enter your email to receive a reset OTP" 
            : `OTP sent to ${email}. Check your inbox.`}
        </CardDescription>
      </CardHeader>

      {step === 1 ? (
        <form onSubmit={handleSendOTP}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@tzw.rw"
                  className="pl-10 bg-background border-border text-foreground rounded-md focus-visible:ring-ring"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-md hover:opacity-90 transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
            <Link to="/login" className="text-xs text-primary font-medium hover:underline text-center">
              Back to Sign In
            </Link>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block text-center" htmlFor="otp">
                6-Digit OTP
              </label>
              <div className="relative flex justify-center">
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  className="bg-background border-border text-foreground rounded-md text-center text-2xl font-bold tracking-[0.5em] pl-[0.25em] h-12 focus-visible:ring-ring max-w-[180px]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block" htmlFor="newPassword">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-background border-border text-foreground rounded-md focus-visible:ring-ring"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 bg-background border-border text-foreground rounded-md focus-visible:ring-ring"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-md hover:opacity-90 transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-primary font-medium hover:underline text-center w-full"
              disabled={isLoading}
            >
              Change Email
            </button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
