import { createClient } from "@supabase/supabase-js";

export class DrawEngine {
  static generateWinningNumbers(): number[] {
    const numbers = new Set<number>();
    while (numbers.size < 5) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  static async simulateDraw(adminId: string, month: number, year: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Ensure draw exists for the month
    let { data: existingDraw } = await supabase
      .from('draws')
      .select('id')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    let drawId = existingDraw?.id;
    if (!drawId) {
      const { data: newDraw, error } = await supabase
        .from('draws')
        .insert({ month, year, status: 'pending' })
        .select('id')
        .single();
      if (error) throw new Error("Failed to create draw record");
      drawId = newDraw.id;
    }

    const winningNumbers = this.generateWinningNumbers();
    
    // Fetch all scores and group by user_id
    const { data: allScores } = await supabase.from('scores').select('user_id, score');
    const userScoresMap = new Map<string, number[]>();
    if (allScores) {
      for (const s of allScores) {
        if (!userScoresMap.has(s.user_id)) {
          userScoresMap.set(s.user_id, []);
        }
        userScoresMap.get(s.user_id)!.push(s.score);
      }
    }

    let match5 = 0;
    let match4 = 0;
    let match3 = 0;

    for (const [userId, scores] of userScoresMap.entries()) {
      if (scores.length === 5) {
        const matches = scores.filter(s => winningNumbers.includes(s)).length;
        if (matches === 5) match5++;
        if (matches === 4) match4++;
        if (matches === 3) match3++;
      }
    }

    await supabase.from('draw_simulations').insert({
      admin_id: adminId,
      draw_id: drawId,
      generated_numbers: winningNumbers,
      match_5_count: match5,
      match_4_count: match4,
      match_3_count: match3,
    });

    return { winningNumbers, match5, match4, match3 };
  }

  static async executeMonthlyDraw() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: existingDraw } = await supabase
      .from('draws')
      .select('id, status')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (existingDraw && existingDraw.status === 'completed') {
      return { success: false, message: "Draw already completed" };
    }

    let drawId = existingDraw?.id;
    if (!drawId) {
      const { data: newDraw, error } = await supabase
        .from('draws')
        .insert({ month, year, status: 'processing' })
        .select('id')
        .single();
      if (error) throw new Error("Failed to create draw record");
      drawId = newDraw.id;
    } else {
      await supabase.from('draws').update({ status: 'processing' }).eq('id', drawId);
    }

    // Load System Settings for Logic
    const { data: settingsData } = await supabase.from('system_settings').select('value').eq('key', 'draw_logic').maybeSingle();
    const pct5 = settingsData?.value?.match_5_pct ? settingsData.value.match_5_pct / 100 : 0.40;
    const pct4 = settingsData?.value?.match_4_pct ? settingsData.value.match_4_pct / 100 : 0.35;
    const pct3 = settingsData?.value?.match_3_pct ? settingsData.value.match_3_pct / 100 : 0.25;

    // Calculate Pool
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    const { data: payments } = await supabase
      .from('subscription_payments')
      .select('prize_pool_allocation')
      .eq('status', 'succeeded')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    let currentMonthPool = payments ? payments.reduce((sum, p) => sum + Number(p.prize_pool_allocation || 0), 0) : 0;

    let rolloverAmount = 0;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const { data: prevDraw } = await supabase.from('draws').select('id').eq('month', prevMonth).eq('year', prevYear).maybeSingle();

    if (prevDraw && prevDraw.id) {
      const { data: prevPool } = await supabase.from('prize_pools').select('match_5_amount').eq('draw_id', prevDraw.id).maybeSingle();
      const { count } = await supabase.from('winners').select('id', { count: 'exact', head: true }).eq('draw_id', prevDraw.id).eq('match_tier', 5);
      if (count === 0 && prevPool) {
        rolloverAmount = Number(prevPool.match_5_amount || 0);
      }
    }

    const totalPool = currentMonthPool + rolloverAmount;
    const match5Pool = totalPool * pct5;
    const match4Pool = totalPool * pct4;
    const match3Pool = totalPool * pct3;

    const winningNumbers = this.generateWinningNumbers();
    
    // Find Winners
    const { data: allScores } = await supabase.from('scores').select('user_id, score');
    const userScoresMap = new Map<string, number[]>();
    if (allScores) {
      for (const s of allScores) {
        if (!userScoresMap.has(s.user_id)) userScoresMap.set(s.user_id, []);
        userScoresMap.get(s.user_id)!.push(s.score);
      }
    }

    const winnersToInsert: any[] = [];
    let match5Count = 0; let match4Count = 0; let match3Count = 0;

    for (const [userId, scores] of userScoresMap.entries()) {
      if (scores.length === 5) {
        const matches = scores.filter(s => winningNumbers.includes(s)).length;
        if (matches >= 3) {
          winnersToInsert.push({ draw_id: drawId, user_id: userId, match_tier: matches, status: 'pending' });
          if (matches === 5) match5Count++;
          if (matches === 4) match4Count++;
          if (matches === 3) match3Count++;
        }
      }
    }

    const m5Prize = match5Count > 0 ? match5Pool / match5Count : 0;
    const m4Prize = match4Count > 0 ? match4Pool / match4Count : 0;
    const m3Prize = match3Count > 0 ? match3Pool / match3Count : 0;

    for (const w of winnersToInsert) {
      if (w.match_tier === 5) w.prize_amount = m5Prize;
      if (w.match_tier === 4) w.prize_amount = m4Prize;
      if (w.match_tier === 3) w.prize_amount = m3Prize;
    }

    if (winnersToInsert.length > 0) {
      await supabase.from('winners').insert(winnersToInsert);
    }

    // Insert Prize Pool
    await supabase.from('prize_pools').upsert({
      draw_id: drawId,
      total_amount: totalPool,
      match_5_amount: match5Pool,
      match_4_amount: match4Pool,
      match_3_amount: match3Pool
    }, { onConflict: 'draw_id' });

    // Update Draw Status
    await supabase.from('draws').update({
      winning_numbers: winningNumbers,
      status: 'completed',
      executed_at: new Date().toISOString()
    }).eq('id', drawId);

    return { success: true, winningNumbers, totalPool, match5Count, match4Count, match3Count };
  }
}
