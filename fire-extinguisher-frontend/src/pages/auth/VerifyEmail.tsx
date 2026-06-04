import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

export default function VerifyEmail() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pending_verification');
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      toast.warning('No verification process in progress. Redirecting to register.');
      navigate('/register');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      toast.error('OTP must be exactly 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.verifyEmail(email, otp);
      localStorage.removeItem('pending_verification');
      login(data.token, data.user);
      toast.success(`Email verified successfully! Welcome back, ${data.user.firstName}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Verification failed. Please try again.';
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
        <CardTitle className="text-xl font-semibold text-foreground">Verify Your Email</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Enter the 6-digit OTP sent to <strong className="text-foreground">{email}</strong>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block text-center" htmlFor="otp">
              One-Time Password (OTP)
            </label>
            <div className="relative flex justify-center">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground hidden" />
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                className="bg-background border-border text-foreground rounded-md text-center text-3xl font-bold tracking-[0.5em] pl-[0.25em] h-14 focus-visible:ring-ring max-w-[200px]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                disabled={isLoading}
                autoFocus
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
            {isLoading ? 'Verifying Account...' : 'Verify Account'}
          </Button>
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>If you didn't receive it, register again.</p>
            <Link to="/register" className="text-primary font-medium hover:underline block">
              Back to Register
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
