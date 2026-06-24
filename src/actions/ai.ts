import { createClient } from '@/lib/supabase/server';
import { AIService } from '@/services/ai.service';
import crypto from 'crypto';
import { cache } from 'react';

import { withTimeout } from '@/lib/utils';

export const getPerformanceInsights = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Get user's scores
    const { data: scores, error: scoresError } = await withTimeout(
      supabase
        .from('scores')
        .select('score')
        .eq('user_id', user.id)
        .order('play_date', { ascending: false })
        .limit(5)
    );

    if (scoresError) return { error: scoresError.message };

    if (!scores || scores.length === 0) {
      return { insights: "Submit your first score to receive AI-powered performance insights!" };
    }

    const scoreValues = scores.map(s => s.score);
    const scoresHash = crypto.createHash('md5').update(scoreValues.join(',')).digest('hex');

    // Check if we already have insights for this exact hash
    const { data: existingInsight } = await withTimeout(
      supabase
        .from('ai_insights')
        .select('insights_data')
        .eq('user_id', user.id)
        .eq('scores_hash', scoresHash)
        .single()
    );

    if (existingInsight) {
      return { insights: existingInsight.insights_data.text };
    }

    // Check if user has an active subscription (requirement for AI insights)
    const { data: sub } = await withTimeout(
      supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
    );

    if (!sub) {
      return { insights: "Upgrade to a premium plan to unlock personalized AI performance insights." };
    }

    const generatedText = await AIService.getPerformanceInsights(user.id, scoreValues);

    // Cache the new insight, upserting for the user
    await withTimeout(
      supabase
        .from('ai_insights')
        .upsert({
          user_id: user.id,
          scores_hash: scoresHash,
          insights_data: { text: generatedText }
        }, { onConflict: 'user_id' })
    );

    return { insights: generatedText };
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch insights' };
  }
});
