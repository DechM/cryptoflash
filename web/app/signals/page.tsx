import type { Metadata } from 'next';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'Market Signals — CryptoFlash',
  description: 'Real-time AI-driven market signals.',
};

export default function SignalsPage() {
  return (
    <div className="container-grid">
      <h1 className="text-2xl font-semibold">Market Signals</h1>
      <Table>
        <TableCaption>Signals update every few minutes.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>BTC</TableCell>
            <TableCell>—</TableCell>
            <TableCell>—</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

