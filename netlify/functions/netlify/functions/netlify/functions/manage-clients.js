const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  if (event.httpMethod === 'POST') {
    try {
      const { name, phone } = JSON.parse(event.body || '{}');
      if (!name || !phone) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Name and Phone are required.' }) };
      }

      const { data, error } = await supabase.from('clients').insert([{ name, phone }]).select();
      if (error) {
        if (error.code === '23505') {
          return { statusCode: 409, body: JSON.stringify({ error: 'Phone number already registered.' }) };
        }
        throw error;
      }

      return { statusCode: 201, body: JSON.stringify({ message: 'Client registered', client: data[0] }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify(data) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
