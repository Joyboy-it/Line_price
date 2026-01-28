// ทดสอบส่งรูปจาก URL ภายนอก
const BOT_TOKEN = '8006649381:AAHNuR5yJxCgDEyPVp7cA8t_QLRkQoDdabs';
const CHAT_ID = '-5071142419';

// 1. ทดสอบส่งรูปจาก picsum (ควรได้)
fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: CHAT_ID,
    photo: 'https://picsum.photos/400/300',
    caption: 'Test from Picsum - Should work'
  })
})
  .then(res => res.json())
  .then(data => {
    console.log('1. Picsum URL:', data.ok ? '✅ Success' : '❌ Failed:', data.description);
  });

// 2. ทดสอบส่งรูปจาก Supabase URL (ตอนนี้)
setTimeout(() => {
  const supabaseUrl = 'https://tynkjxrddqxjsgxuphsw.supabase.co/storage/v1/object/public/price-images/price-groups/e7db58fd-7890-414c-a598-224b4e9ab426/1769588449384-4q5x8j.jpg';
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      photo: supabaseUrl,
      caption: 'Test from Supabase - Testing...'
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log('2. Supabase URL:', data.ok ? '✅ Success' : '❌ Failed:', data.description);
      console.log('Full response:', data);
    });
}, 1000);
