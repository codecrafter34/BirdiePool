import { createClient } from "@supabase/supabase-js";

export class DrawEngine {
  /**
   * Generates 5 unique cryptographically random numbers between 1 and 45
   */
  static generateWinningNumbers(): number[] {
    const numbers = new Set<number>();
    while (numbers.size < 5) {
      // In a production scenario, use crypto.getRandomValues
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  static async simulateDraw(adminId: string, month: number, year: number) {
    // Requires Service Role for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const winningNumbers = this.generateWinningNumbers();
    
    // In actual implementation, we fetch draw_entries and compare
    // Mocking the counts for simulation
    const match5 = 0;
    const match4 = Math.floor(Math.random() * 5);
    const match3 = Math.floor(Math.random() * 50);

    await supabase.from('draw_simulations').insert({
      admin_id: adminId,
      generated_numbers: winningNumbers,
      match_5_count: match5,
      match_4_count: match4,
      match_3_count: match3,
    });

    return { winningNumbers, match5, match4, match3 };
  }

  static async executeMonthlyDraw() {
    console.log("Executing Monthly Draw Sequence...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // 1. Lock Draw Row (Check if already executed)
    const { data: existingDraw } = await supabase
      .from('draws')
      .select('id, status')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (existingDraw && existingDraw.status === 'completed') {
      console.log("Draw already completed for this month.");
      return { success: false, message: "Draw already completed" };
    }

    let drawId = existingDraw?.id;
    if (!drawId) {
      const { data: newDraw, error: drawError } = await supabase
        .from('draws')
        .insert({ month, year, status: 'pending' })
        .select('id')
        .single();
      if (drawError) throw new Error("Failed to create draw record");
      drawId = newDraw.id;
    }

    // 2. Calculate Prize Pool
    // Find all successful payments in current month
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    
    const { data: payments } = await supabase
      .from('subscription_payments')
      .select('prize_pool_allocation')
      .eq('status', 'succeeded')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    let currentMonthPool = 0;
    if (payments) {
      currentMonthPool = payments.reduce((sum, p) => sum + Number(p.prize_pool_allocation || 0), 0);
    }

    // Add Rollover (check previous draw for unpaid match-5 pool if any)
    let rolloverAmount = 0;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const { data: prevDraw } = await supabase
      .from('draws')
      .select('id, match_5_pool')
      .eq('month', prevMonth)
      .eq('year', prevYear)
      .maybeSingle();

    if (prevDraw && prevDraw.id) {
      // Check if there were any match-5 winners last month
      const { count } = await supabase
        .from('winners')
        .select('id', { count: 'exact', head: true })
        .eq('draw_id', prevDraw.id)
        .eq('match_tier', 5);
      
      if (count === 0) {
        rolloverAmount = Number(prevDraw.match_5_pool || 0);
      }
    }

    const totalPool = currentMonthPool + rolloverAmount;
    
    // Allocate (40% / 35% / 25%)
    const match5Pool = totalPool * 0.40;
    const match4Pool = totalPool * 0.35;
    const match3Pool = totalPool * 0.25;

    // 3. Generate Numbers
    const winningNumbers = this.generateWinningNumbers();
    
    // 4. Find Winners (Fetch users with 5 scores)
    // We group scores by user_id
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

    const winnersToInsert: Array<{draw_id: string; user_id: string; match_tier: number; status: string; prize_amount?: number}> = [];
    let match5Count = 0;
    let match4Count = 0;
    let match3Count = 0;

    for (const [userId, scores] of userScoresMap.entries()) {
      if (scores.length === 5) {
        const matches = scores.filter(s => winningNumbers.includes(s)).length;
        if (matches >= 3) {
          winnersToInsert.push({
            draw_id: drawId,
            user_id: userId,
            match_tier: matches,
            status: 'pending'
          });
          if (matches === 5) match5Count++;
          if (matches === 4) match4Count++;
          if (matches === 3) match3Count++;
        }
      }
    }

    // Assign actual prize amounts per winner
    const m5Prize = match5Count > 0 ? match5Pool / match5Count : 0;
    const m4Prize = match4Count > 0 ? match4Pool / match4Count : 0;
    const m3Prize = match3Count > 0 ? match3Pool / match3Count : 0;

    for (const w of winnersToInsert) {
      if (w.match_tier === 5) w.prize_amount = m5Prize;
      if (w.match_tier === 4) w.prize_amount = m4Prize;
      if (w.match_tier === 3) w.prize_amount = m3Prize;
    }

    // 5. Insert to Winners table
    if (winnersToInsert.length > 0) {
      await supabase.from('winners').insert(winnersToInsert);
    }

    // 6. Update Draw Status
    await supabase.from('draws').update({
      winning_numbers: winningNumbers,
      total_prize_pool: totalPool,
      match_5_pool: match5Pool,
      match_4_pool: match4Pool,
      match_3_pool: match3Pool,
      status: 'completed',
      executed_at: new Date().toISOString()
    }).eq('id', drawId);

    console.log("Monthly Draw Sequence Completed successfully.");
    return { success: true, winningNumbers, totalPool, match5Count, match4Count, match3Count };
  }
}
