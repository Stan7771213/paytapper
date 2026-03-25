import { NextRequest, NextResponse } from 'next/server';

import { getAvailabilityProvider } from '@/lib/tours/availability';
import { getTourProductById } from '@/lib/tours/config';
import { isValidDateString } from '@/lib/tours/validation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId') ?? '';
    const date = searchParams.get('date') ?? '';

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing required parameter: productId' },
        { status: 400 },
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 },
      );
    }

    if (!isValidDateString(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 },
      );
    }

    const product = getTourProductById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Unknown productId' }, { status: 404 });
    }

    const provider = getAvailabilityProvider();
    const result = await provider.getAvailability({ productId, date });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get tour availability', error);
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 },
    );
  }
}
