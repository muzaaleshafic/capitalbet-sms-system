const { createClient } = require('@supabase/supabase-js');
const AfricasTalking = require('africastalking');

const REMINDER_MESSAGE = 
  "Good morning from CapitalBet Mukono! Visit us today at Wantoni, Nasuti, or our Main Branch at 77 Plaza for the best odds and instant payouts. Have a lucky day!";

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const at = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
  });

  try {
    const { data: clients, error } = await supabase.from('clients').select('phone');
    if (error) throw error;

    if (!clients || clients.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No registered clients.' }) };
    }

    const recipientNumbers = clients.map(client => client.phone);
    const response = await at.SMS.send({
      to: recipientNumbers,
      message: REMINDER_MESSAGE,
      from: process.env.AT_SENDER_ID || undefined
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Manual broadcast complete', count: recipientNumbers.length, response })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
