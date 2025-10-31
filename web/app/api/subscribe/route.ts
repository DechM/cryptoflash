import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, agreeToEmails } = body;

    if (!email || !agreeToEmails) {
      return NextResponse.json({ error: 'Email and agreement are required' }, { status: 400 });
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      // Fallback: return success but note that backend isn't configured
      return NextResponse.json(
        { message: 'Subscription service not configured' },
        { status: 503 }
      );
    }

    // Add contact to Brevo list
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: name || '',
          SUBSCRIBED: true,
        },
        listIds: [parseInt(process.env.BREVO_LIST_ID || '1', 10)],
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Brevo API error: ${response.status}`);
    }

    return NextResponse.json({ message: 'Successfully subscribed' });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}
