import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authApi.register({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
      });
      localStorage.setItem('pending_verification', email);
      toast.success(data.message || 'OTP sent to your email. Please verify.');
      navigate('/verify-email');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
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
        <CardTitle className="text-xl font-semibold text-foreground">Create an Account</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Sign up to access the Fire Extinguisher Management System
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="firstName">
                First Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="John"
                  className="pl-10 bg-background border-border text-foreground rounded-md focus-visible:ring-ring"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="lastName">
                Last Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className="pl-10 bg-background border-border text-foreground rounded-md focus-visible:ring-ring"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="email">
              Email Address *
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

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="phone">
              Phone Number (Optional)
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="0781000000"
              className="bg-background border-border text-foreground rounded-md focus-visible:ring-ring"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>



          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="password">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10 bg-background border-border text-foreground rounded-md focus-visible:ring-ring"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="confirmPassword">
              Confirm Password *
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
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
