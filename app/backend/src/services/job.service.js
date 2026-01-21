import { supabase } from '../config/database.js';

export const jobService = {
  // Get the active job (there should only be one)
  async getActiveJob() {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        active_book:books!jobs_active_book_id_fkey(id, name, display_name),
        active_chapter:chapters!jobs_active_chapter_id_fkey(id, name, display_name, chapter_number)
      `)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create or update the active job
  async setActiveJob(bookId, chapterId, itemType = 'question') {
    // First, deactivate any existing active jobs
    await supabase
      .from('jobs')
      .update({ is_active: false })
      .eq('is_active', true);

    // Check if a job record exists
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .limit(1)
      .single();

    if (existingJob) {
      // Update existing job
      const { data, error } = await supabase
        .from('jobs')
        .update({
          active_book_id: bookId,
          active_chapter_id: chapterId,
          active_item_type: itemType,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingJob.id)
        .select(`
          *,
          active_book:books!jobs_active_book_id_fkey(id, name, display_name),
          active_chapter:chapters!jobs_active_chapter_id_fkey(id, name, display_name, chapter_number)
        `)
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new job
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          active_book_id: bookId,
          active_chapter_id: chapterId,
          active_item_type: itemType,
          is_active: true,
        })
        .select(`
          *,
          active_book:books!jobs_active_book_id_fkey(id, name, display_name),
          active_chapter:chapters!jobs_active_chapter_id_fkey(id, name, display_name, chapter_number)
        `)
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Get all jobs
  async getAll() {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        active_book:books!jobs_active_book_id_fkey(id, name, display_name),
        active_chapter:chapters!jobs_active_chapter_id_fkey(id, name, display_name, chapter_number)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

export default jobService;
