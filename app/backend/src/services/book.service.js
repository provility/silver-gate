import { supabase } from '../config/database.js';

export const bookService = {
  async getAll() {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(bookData) {
    const { data, error } = await supabase
      .from('books')
      .insert({
        name: bookData.name,
        display_name: bookData.display_name,
        description: bookData.description,
        source_id: bookData.source_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, bookData) {
    const { data, error } = await supabase
      .from('books')
      .update({
        name: bookData.name,
        display_name: bookData.display_name,
        description: bookData.description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

export default bookService;
