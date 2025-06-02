import { NextResponse } from 'next/server';

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  return NextResponse.json({
    hasAccountSid: !!accountSid,
    hasAuthToken: !!authToken,
    hasFromNumber: !!fromNumber,
    accountSidPrefix: accountSid ? accountSid.substring(0, 6) + '...' : 'missing',
    authTokenPrefix: authToken ? authToken.substring(0, 6) + '...' : 'missing',
    fromNumberPrefix: fromNumber ? fromNumber.substring(0, 6) + '...' : 'missing',
    environment: process.env.NODE_ENV
  });
}