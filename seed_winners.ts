import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting forced generation of winners...");
  
  // 1. Get or create a user
  let { data: users } = await supabase.from('users').select('*').limit(3);
  if (!users || users.length === 0) {
     console.log("No users found. Creating fake user...");
     return console.log("ERROR: No users exist in the database. Please sign up at least 1 user in the app first!");
  }

  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const drawDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  // 2. Create a Draw
  console.log("Creating/Fetching Draw...");
  let drawId;
  const { data: existingDraw } = await supabase.from('draws').select('id').eq('day', day).eq('month', month).eq('year', year).maybeSingle();
  if (existingDraw) {
    drawId = existingDraw.id;
  } else {
    const { data: newDraw, error } = await supabase.from('draws').insert({ day, month, year, draw_date: drawDateStr, status: 'completed' }).select('id').single();
    if (error) {
        console.log("Fallback draw creation...", error.message);
        const { data: newDraw2 } = await supabase.from('draws').insert({ draw_date: drawDateStr, status: 'completed' }).select('id').single();
        drawId = newDraw2?.id;
    } else {
        drawId = newDraw.id;
    }
  }

  // 3. Force create a winner for each user
  console.log("Force generating winners for existing users...");
  for (const user of users) {
     // Create a dummy draw entry
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
       status: 'pending' // pending verification
     }).select('id').single();

     if (winnerError) {
         console.log("Error inserting winner:", winnerError.message);
         // Try fallback to match_count if match_type fails
         const { data: winner2, error: winnerError2 } = await supabase.from('winners').insert({
           draw_id: drawId,
           user_id: user.id,
           match_count: 5,
           prize_amount: 50000,
           verification_status: 'pending' // draws_schema uses verification_status
         }).select('id').single();
         if (winnerError2) console.log("Fallback failed:", winnerError2.message);
         else {
             console.log(`Created winner using fallback schema for ${user.id}`);
             await supabase.from('proof_uploads').insert({ winner_id: winner2.id, file_url: 'https://placehold.co/600x400', status: 'pending_review' });
         }
     } else {
         console.log(`Created winner for ${user.id} (${winner.id})`);
         
         // Create a proof upload
         await supabase.from('proof_uploads').insert({
             winner_id: winner.id,
             file_url: 'https://placehold.co/600x400?text=Fake+Winner+Proof',
             status: 'pending_review'
         });
         console.log(`Created fake proof upload for winner ${winner.id}`);
     }
  }

  console.log("✅ Force generation complete! Please check the Admin Verification page.");
}

seed().catch(console.error);
