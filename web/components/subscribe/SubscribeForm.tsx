'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function SubscribeForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agreeToEmails, setAgreeToEmails] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      // Use API route which handles Brevo or fallback
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, agreeToEmails }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Successfully subscribed! Check your inbox.');
        setName('');
        setEmail('');
        setAgreeToEmails(false);
      } else {
        setStatus('error');
        setMessage(data.error || 'Subscription failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name (Optional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === 'loading'}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="agree"
          checked={agreeToEmails}
          onCheckedChange={(checked) => setAgreeToEmails(!!checked)}
          disabled={status === 'loading'}
          required
        />
        <Label htmlFor="agree" className="text-sm font-normal cursor-pointer">
          I agree to receive emails about CryptoFlash updates and insights.
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={status === 'loading' || !agreeToEmails}>
        {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Subscribe
      </Button>

      {message && (
        <Alert variant={status === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>{status === 'success' ? 'Success!' : 'Error'}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
