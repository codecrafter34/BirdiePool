import { NextResponse } from 'next/server';
import { DrawEngine } from '@/services/draw.service';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Secure the cron endpoint with a secret
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false }
      }
    );

    // Execute the draw (Service handles transactions and DB updates)
    await DrawEngine.executeDailyDraw(supabaseAdmin);

    return NextResponse.json({ success: true, message: 'Daily draw executed successfully' });
  } catch (error) {
    console.error('Draw Execution Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
