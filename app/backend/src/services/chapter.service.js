import { supabase } from '../config/database.js';
import { generateMongoId } from '../utils/mongoId.js';

export const chapterService = {
  async getAll(bookId = null) {
    let query = supabase
      .from('chapters')
      .select('*, books(id, name, display_name)')
      .order('position', { ascending: true });

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('chapters')
      .select('*, books(id, name, display_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByBookId(bookId) {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data;
  },

  async create(chapterData) {
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        name: chapterData.name,
        display_name: chapterData.display_name,
        book_id: chapterData.book_id,
        chapter_number: chapterData.chapter_number,
        position: chapterData.position,
        source_id: chapterData.source_id,
        ref_id: chapterData.ref_id || generateMongoId(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, chapterData) {
    const { data, error } = await supabase
      .from('chapters')
      .update({
        name: chapterData.name,
        display_name: chapterData.display_name,
        chapter_number: chapterData.chapter_number,
        position: chapterData.position,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

export default chapterService;
