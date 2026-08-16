import { notifyAdmins } from '../services/adminNotifier.js';

async function test() {
  console.log('Testing notifyAdmins system...');
  await notifyAdmins({
    title: 'Тестовая система аудита',
    venueName: 'Papa Syrnyk',
    details: 'Проверка работы сервиса уведомлений системным администраторам',
    source: 'GiftX UI',
    author: 'Автотест'
  });
  console.log('✅ notifyAdmins executed successfully!');
}

test().then(() => process.exit(0)).catch(e => { console.error('Notify Error:', e); process.exit(1); });
