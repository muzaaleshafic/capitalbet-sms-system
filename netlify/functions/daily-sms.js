const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');
const AfricasTalking = require('africastalking');

const REMINDER_MESSAGE = 
  "Good morning from CapitalBet Mukono! Visit us today at Wantoni, Nasuti, or our Main Branch at 77 Plaza for the best odds and instant payouts. Have a lucky day!";

const handler = async function (event, context) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const at = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
  });

  try {
    const now = new Date();
    const kampalaTimeString = now.toLocaleTimeString('en-GB', { 
      timeZone: 'Africa/Kampala', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });

    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'sms_schedule_time')
      .single();

    const targetTime = setting ? setting.value : '08:00';

    if (kampalaTimeString !== targetTime) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ message: `Current time (${kampalaTimeString}) does not match scheduled target (${targetTime}).` }) 
      };
    }

    const { data: clients, error } = await supabase.from('clients').select('phone');
    if (error) throw error;

    if (!clients || clients.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No registered clients found.' }) };
    }

    const recipientNumbers = clients.map(client => client.phone);

    const response = await at.SMS.send({
      to: recipientNumbers,
      message: REMINDER_MESSAGE,
      from: process.env.AT_SENDER_ID || undefined
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, count: recipientNumbers.length, response })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

exports.handler = schedule('*/15 * * * *', handler);
