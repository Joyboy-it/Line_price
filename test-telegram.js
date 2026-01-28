// ทดสอบ Telegram Bot Token
// แทนที่ YOUR_BOT_TOKEN และ YOUR_CHAT_ID ด้วยค่าจริง

const BOT_TOKEN = '8006649381:AAHNuR5yJxCgDEyPVp7cA8t_QLRkQoDdabs';
const CHAT_ID = '-5071142419';

// 1. ทดสอบ Bot Token
fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`)
  .then(res => res.json())
  .then(data => {
    console.log('1. Bot Info:', data);
    if (!data.ok) {
      console.error('❌ Bot Token ไม่ถูกต้อง');
    } else {
      console.log('✅ Bot Token ถูกต้อง:', data.result.username);
    }
  });

// 2. ทดสอบส่งข้อความ
setTimeout(() => {
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: 'Test message from Line Price AI'
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log('2. Send Message:', data);
      if (!data.ok) {
        console.error('❌ ส่งข้อความไม่สำเร็จ:', data.description);
      } else {
        console.log('✅ ส่งข้อความสำเร็จ');
      }
    });
}, 1000);

// 3. ทดสอบส่งรูป (ใช้ URL ตัวอย่าง)
setTimeout(() => {
  const testImageUrl = 'https://picsum.photos/400/300';
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      photo: testImageUrl,
      caption: 'Test image from Line Price AI'
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log('3. Send Photo:', data);
      if (!data.ok) {
        console.error('❌ ส่งรูปไม่สำเร็จ:', data.description);
      } else {
        console.log('✅ ส่งรูปสำเร็จ');
      }
    });
}, 2000);
