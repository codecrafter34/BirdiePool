import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // 1. Get or create a user
  let { data: users } = await supabase.from('users').select('*').limit(3);
  if (!users || users.length === 0) {
     return NextResponse.json({ error: "No users exist in the database. Please sign up at least 1 user in the app first!" });
  }

  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const drawDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  // 2. Create a Draw
  let drawId;
  const { data: existingDraw } = await supabase.from('draws').select('id').eq('day', day).eq('month', month).eq('year', year).maybeSingle();
  if (existingDraw) {
    drawId = existingDraw.id;
  } else {
    const { data: newDraw, error } = await supabase.from('draws').insert({ day, month, year, draw_date: drawDateStr, status: 'completed' }).select('id').single();
    if (error) {
        const { data: newDraw2 } = await supabase.from('draws').insert({ draw_date: drawDateStr, status: 'completed' }).select('id').single();
        drawId = newDraw2?.id;
    } else {
        drawId = newDraw.id;
    }
  }

  let results = [];
  // 3. Force create a winner for each user
  for (const user of users) {
     const entryNumbers = [1, 2, 3, 4, 5];
     const { data: entry } = await supabase.from('draw_entries').insert({
       user_id: user.id,
       draw_id: drawId,
       entry_numbers: entryNumbers
     }).select('id').single();

     // Create the winner record
     const { data: winner, error: winnerError } = await supabase.from('winners').insert({
       draw_id: drawId,
       user_id: user.id,
       draw_entry_id: entry?.id,
       match_type: 5,  
       prize_amount: 50000,
       status: 'pending'
     }).select('id').single();

     if (winnerError) {
         // Try fallback to match_count if match_type fails
         const { data: winner2, error: winnerError2 } = await supabase.from('winners').insert({
           draw_id: drawId,
           user_id: user.id,
           match_count: 5,
           prize_amount: 50000,
           verification_status: 'pending'
         }).select('id').single();
         
         if (!winnerError2) {
             await supabase.from('proof_uploads').insert({ winner_id: winner2.id, file_url: 'https://placehold.co/600x400', status: 'pending_review' });
             results.push(`Created fallback winner for ${user.id}`);
         }
     } else {
         await supabase.from('proof_uploads').insert({
             winner_id: winner.id,
             file_url: 'https://placehold.co/600x400?text=Fake+Winner+Proof',
             status: 'pending_review'
         });
         results.push(`Created normal winner for ${user.id}`);
     }
  }

  return NextResponse.json({ success: true, results });
}
