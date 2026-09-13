const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  if (event.httpMethod === 'GET') {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'sms_schedule_time')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        statusCode: 200,
        body: JSON.stringify({ schedule_time: data ? data.value : '08:00' })
      };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { schedule_time } = JSON.parse(event.body || '{}');
      if (!schedule_time) {
        return { statusCode: 400, body: JSON.stringify({ error: 'schedule_time is required.' }) };
      }

      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'sms_schedule_time', value: schedule_time });

      if (error) throw error;

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Schedule updated', schedule_time })
      };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
