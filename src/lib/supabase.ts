import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Fetch polls from Supabase if configured, or fall back to Express / Firebase API
 */
export async function getPollsUnified(params?: { category?: string; isSponsored?: boolean; search?: string; page?: number; limit?: number }) {
  if (supabase) {
    let query = supabase.from('polls').select('*, poll_options(*)');
    if (params?.category && params.category !== 'All') {
      query = query.eq('category', params.category);
    }
    if (params?.isSponsored) {
      query = query.eq('is_sponsored', true);
    }
    if (params?.search) {
      query = query.ilike('title', `%${params.search}%`);
    }
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error } = await query.order('created_at', { ascending: false }).range(from, to);
    if (!error && data) {
      return data.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        status: p.status,
        lockAt: p.lock_at,
        matchTime: p.match_time,
        isSponsored: p.is_sponsored,
        sponsorName: p.sponsor_name,
        sponsorLogo: p.sponsor_logo,
        sponsorUrl: p.sponsor_url,
        sponsorReward: p.sponsor_reward,
        councilVerdict: p.council_verdict,
        options: p.poll_options || []
      }));
    }
  }

  // Fallback to Express backend (Firebase)
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.isSponsored) searchParams.set('isSponsored', 'true');
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(`/api/polls?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch polls');
  return res.json();
}
