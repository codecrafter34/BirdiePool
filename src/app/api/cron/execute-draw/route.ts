import { NextResponse } from 'next/server';
import { DrawEngine } from '@/services/draw.service';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Secure the cron endpoint with a secret
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Execute the draw (Service handles transactions and DB updates)
    await DrawEngine.executeMonthlyDraw();

    return NextResponse.json({ success: true, message: 'Monthly draw executed successfully' });
  } catch (error) {
    console.error('Draw Execution Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
