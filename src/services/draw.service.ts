import { createClient } from "@supabase/supabase-js";

class PRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  nextInt(max: number) {
    return Math.floor(this.next() * max);
  }
}

export class DrawEngine {
  /**
   * Generates winning numbers deterministically and fairly.
   * Guarantees at least a Match-3 if there are entries.
   * Uses weighted probabilities based on number frequencies.
   */
  static generateWinningNumbers(entries: number[][], day: number, month: number, year: number): number[] {
    if (entries.length === 0) {
      const rng = new PRNG(year * 10000 + month * 100 + day);
      const nums = new Set<number>();
      while (nums.size < 5) nums.add(rng.nextInt(45) + 1);
      return Array.from(nums).sort((a, b) => a - b);
    }

    const seed = year * 1000000 + month * 10000 + day * 100 + entries.length;
    const rng = new PRNG(seed);

    // 1. Calculate frequency
    const frequency = new Map<number, number>();
    for (let i = 1; i <= 45; i++) frequency.set(i, 0);

    const sortedEntries = [...entries].map(e => [...e].sort((a,b)=>a-b));
    sortedEntries.sort((a, b) => a.join(',').localeCompare(b.join(',')));

    for (const entry of sortedEntries) {
      for (const num of entry) {
        frequency.set(num, frequency.get(num)! + 1);
      }
    }

    // 2. Select seed entry to guarantee Match-3
    const seedEntryIndex = rng.nextInt(sortedEntries.length);
    const seedEntry = sortedEntries[seedEntryIndex];

    // 3. Pick 3 numbers deterministically
    const shuffledSeed = [...seedEntry];
    for (let i = shuffledSeed.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      [shuffledSeed[i], shuffledSeed[j]] = [shuffledSeed[j], shuffledSeed[i]];
    }
    const winningNumbers = new Set<number>(shuffledSeed.slice(0, 3));

    // 4. Select remaining 2 using weighted probability
    while (winningNumbers.size < 5) {
      let totalWeight = 0;
      const candidates: { num: number, weight: number }[] = [];
      for (let i = 1; i <= 45; i++) {
        if (!winningNumbers.has(i)) {
          const weight = frequency.get(i)! + 1; 
          candidates.push({ num: i, weight });
          totalWeight += weight;
        }
      }

      let r = rng.next() * totalWeight;
      for (const candidate of candidates) {
        r -= candidate.weight;
        if (r <= 0) {
          winningNumbers.add(candidate.num);
          break;
        }
      }
    }

    return Array.from(winningNumbers).sort((a, b) => a - b);
  }

  static async simulateDraw(supabase: any, adminId: string, day: number, month: number, year: number) {
    
    // Ensure draw exists for the day
    let { data: existingDraw } = await supabase
      .from('draws')
      .select('id')
      .eq('day', day)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    let drawId = existingDraw?.id;
    if (!drawId) {
      const drawDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const { data: newDraw, error } = await supabase
        .from('draws')
        .insert({ day, month, year, draw_date: drawDateStr, status: 'pending' })
        .select('id')
        .single();
      if (error) throw new Error("Database error creating draw: " + error.message);
      drawId = newDraw.id;
    }

    // Fetch all scores and group by user_id
    const { data: allScores } = await supabase.from('scores').select('user_id, score, play_date');
    const userScoresMap = new Map<string, any[]>();
    if (allScores) {
      for (const s of allScores) {
        if (!userScoresMap.has(s.user_id)) {
          userScoresMap.set(s.user_id, []);
        }
        userScoresMap.get(s.user_id)!.push(s);
      }
    }

    let match5 = 0;
    let match4 = 0;
    let match3 = 0;

    const entriesArray: number[][] = [];
    for (const [userId, scoresObj] of userScoresMap.entries()) {
      scoresObj.sort((a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime());
      if (scoresObj.length > 0) {
        const prng = new PRNG(year * 10000 + month * 100 + day + userId.charCodeAt(0));
        const latestScores = scoresObj.slice(0, 5).map(s => s.score);
        
        while(latestScores.length < 5) {
          const randNum = Math.floor(prng.next() * 45) + 1;
          if (!latestScores.includes(randNum)) {
            latestScores.push(randNum);
          }
        }
        entriesArray.push(latestScores);
      }
    }

    const winningNumbers = this.generateWinningNumbers(entriesArray, day, month, year);

    for (const latest5 of entriesArray) {
      const matches = latest5.filter((s: number) => winningNumbers.includes(s)).length;
      if (matches === 5) match5++;
      if (matches === 4) match4++;
      if (matches === 3) match3++;
    }

    try {
      // Delete previous simulation for this draw to prevent clutter
      await supabase.from('draw_simulations').delete().eq('draw_id', drawId);

      const { error: simError } = await supabase.from('draw_simulations').insert({
        admin_id: adminId,
        draw_id: drawId,
        generated_numbers: winningNumbers,
        match_5_count: match5,
        match_4_count: match4,
        match_3_count: match3
      });
      if (simError) console.error("Database error saving simulation (ignored): ", simError.message);
    } catch (e) {
      console.error("Simulation table might not exist, ignoring...", e);
    }

    return { winningNumbers, match5, match4, match3 };
  }

  static async executeDailyDraw(supabase: any) {

    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: existingDraw } = await supabase
      .from('draws')
      .select('id, status')
      .eq('day', day)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (existingDraw && existingDraw.status === 'completed') {
      return { success: false, message: "Draw already completed for today" };
    }

    let drawId = existingDraw?.id;
    if (!drawId) {
      const drawDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const { data: newDraw, error } = await supabase
        .from('draws')
        .insert({ day, month, year, draw_date: drawDateStr, status: 'processing' })
        .select('id')
        .single();
      if (error) throw new Error("Database error creating draw: " + error.message);
      drawId = newDraw.id;
    } else {
      await supabase.from('draws').update({ status: 'processing' }).eq('id', drawId);
    }

    // Load System Settings for Logic
    const { data: settingsData } = await supabase.from('system_settings').select('value').eq('key', 'draw_logic').maybeSingle();
    const pct5 = settingsData?.value?.match_5_pct ? settingsData.value.match_5_pct / 100 : 0.40;
    const pct4 = settingsData?.value?.match_4_pct ? settingsData.value.match_4_pct / 100 : 0.35;
    const pct3 = settingsData?.value?.match_3_pct ? settingsData.value.match_3_pct / 100 : 0.25;

    // Calculate Pool based on Daily Revenue
    const startOfDay = new Date(year, month - 1, day).toISOString();
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
    const { data: payments } = await supabase
      .from('subscription_payments')
      .select('prize_pool_allocation')
      .eq('status', 'succeeded')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    let currentDailyPool = payments ? payments.reduce((sum: number, p: any) => sum + Number(p.prize_pool_allocation || 0), 0) : 0;

    // Apply a 20% platform cut as requested
    const platformCut = currentDailyPool * 0.20;
    currentDailyPool = currentDailyPool - platformCut;

    let rolloverAmount = 0;
    // For daily rollover, we need the *previous* draw's rollover
    const yesterday = new Date(year, month - 1, day - 1);
    const prevDay = yesterday.getDate();
    const prevMonth = yesterday.getMonth() + 1;
    const prevYear = yesterday.getFullYear();
    const { data: prevDraw } = await supabase.from('draws').select('id').eq('day', prevDay).eq('month', prevMonth).eq('year', prevYear).maybeSingle();

    if (prevDraw && prevDraw.id) {
      const { data: prevPool } = await supabase.from('prize_pools').select('match_5_amount').eq('draw_id', prevDraw.id).maybeSingle();
      const { count } = await supabase.from('winners').select('id', { count: 'exact', head: true }).eq('draw_id', prevDraw.id).eq('match_type', 5);
      if (count === 0 && prevPool) {
        rolloverAmount = Number(prevPool.match_5_amount || 0);
      }
    }

    const totalPool = currentDailyPool + rolloverAmount;
    const match5Pool = totalPool * pct5;
    const match4Pool = totalPool * pct4;
    const match3Pool = totalPool * pct3;

    // Clear existing entries/winners in case of rerun
    await supabase.from('winners').delete().eq('draw_id', drawId);
    await supabase.from('draw_entries').delete().eq('draw_id', drawId);

    // Find Eligible Users and Insert Draw Entries
    const { data: allScores } = await supabase.from('scores').select('user_id, score, play_date');
    const userScoresMap = new Map<string, any[]>();
    if (allScores) {
      for (const s of allScores) {
        if (!userScoresMap.has(s.user_id)) userScoresMap.set(s.user_id, []);
        userScoresMap.get(s.user_id)!.push(s);
      }
    }

    const entriesToInsert: any[] = [];
    for (const [userId, scoresObj] of userScoresMap.entries()) {
      scoresObj.sort((a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime());
      if (scoresObj.length > 0) {
        const prng = new PRNG(year * 10000 + month * 100 + day + userId.charCodeAt(0));
        const latestScores = scoresObj.slice(0, 5).map(s => s.score);
        
        // If they have less than 5 scores, pad the rest with random unique numbers between 1 and 45
        while(latestScores.length < 5) {
          const randNum = Math.floor(prng.next() * 45) + 1;
          if (!latestScores.includes(randNum)) {
            latestScores.push(randNum);
          }
        }

        entriesToInsert.push({
          draw_id: drawId,
          user_id: userId,
          entry_type: 'score_derived',
          entry_numbers: latestScores
        });
      }
    }

    const winningNumbers = this.generateWinningNumbers(entriesToInsert.map(e => e.entry_numbers), day, month, year);

    let insertedEntries: any[] = [];
    if (entriesToInsert.length > 0) {
      const { data } = await supabase.from('draw_entries').insert(entriesToInsert).select('id, user_id, entry_numbers');
      if (data) insertedEntries = data;
    }

    // Determine Winners
    const winnersToInsert: any[] = [];
    let match5Count = 0; let match4Count = 0; let match3Count = 0;

    for (const entry of insertedEntries) {
      const matches = entry.entry_numbers.filter((s: number) => winningNumbers.includes(s)).length;
      if (matches >= 3) {
        winnersToInsert.push({ 
          draw_id: drawId, 
          user_id: entry.user_id, 
          draw_entry_id: entry.id,
          match_type: matches, 
          status: 'pending' 
        });
        if (matches === 5) match5Count++;
        if (matches === 4) match4Count++;
        if (matches === 3) match3Count++;
      }
    }

    const m5Prize = match5Count > 0 ? match5Pool / match5Count : 0;
    const m4Prize = match4Count > 0 ? match4Pool / match4Count : 0;
    const m3Prize = match3Count > 0 ? match3Pool / match3Count : 0;

    for (const w of winnersToInsert) {
      if (w.match_type === 5) w.prize_amount = m5Prize;
      if (w.match_type === 4) w.prize_amount = m4Prize;
      if (w.match_type === 3) w.prize_amount = m3Prize;
    }

    if (winnersToInsert.length > 0) {
      const { error: wError } = await supabase.from('winners').insert(winnersToInsert);
      if (wError) {
        // Fallback to legacy schema
        console.log("Winner insert failed, trying legacy schema...", wError.message);
        const fallbackWinners = winnersToInsert.map(w => ({
          draw_id: w.draw_id,
          user_id: w.user_id,
          match_count: w.match_type,
          prize_amount: w.prize_amount,
          verification_status: 'pending'
        }));
        await supabase.from('winners').insert(fallbackWinners);
      }
    }

    // Clear existing prize pool in case of rerun to avoid duplicate entries
    await supabase.from('prize_pools').delete().eq('draw_id', drawId);

    // Insert Prize Pool
    const { error: poolError } = await supabase.from('prize_pools').insert({
      draw_id: drawId,
      total_amount: totalPool,
      match_5_amount: match5Pool,
      match_4_amount: match4Pool,
      match_3_amount: match3Pool,
      total_winners: winnersToInsert.length,
      match_5_winners: match5Count,
      match_4_winners: match4Count,
      match_3_winners: match3Count
    });
    
    if (poolError) {
      console.log("Prize pool full insert failed, trying legacy schema...", poolError.message);
      // Fallback: only insert columns that are guaranteed to exist in legacy
      await supabase.from('prize_pools').insert({
        draw_id: drawId,
        total_amount: totalPool,
        match_5_amount: match5Pool,
        match_4_amount: match4Pool,
        match_3_amount: match3Pool
      });
    }

    // Update Draw Status
    const { error: drawError } = await supabase.from('draws').update({
      winning_numbers: winningNumbers,
      status: 'completed',
      executed_at: new Date().toISOString()
    }).eq('id', drawId);
    
    if (drawError) {
      // Fallback: if executed_at doesn't exist, just update status
      await supabase.from('draws').update({ status: 'completed' }).eq('id', drawId);
    }

    return { success: true, winningNumbers, totalPool, match5Count, match4Count, match3Count };
  }
}
