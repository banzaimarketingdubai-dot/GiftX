import { B2BAgentEngine } from '../services/b2bAgentEngine.js';

async function runDiagnostics() {
  console.log('=== 🚀 Running B2B AI Onboarding Agent Diagnostics ===\n');

  const testCases = [
    {
      chatId: 'test_partner_1',
      senderName: 'Алексей (Владелец Ресторана)',
      userMessage: 'Привет! Расскажи, сколько стоит подключение заведения к GiftX?',
      label: '1. Стоимость и тарифы'
    },
    {
      chatId: 'test_partner_1',
      senderName: 'Алексей (Владелец Ресторана)',
      userMessage: 'А как работает защита от двойного сканирования? Клиенты не смогут дважды использовать QR-код?',
      label: '2. Защита от абуза и фрода'
    },
    {
      chatId: 'test_partner_1',
      senderName: 'Алексей (Владелец Ресторана)',
      userMessage: 'Супер, выглядит здорово. Я хочу зарегистрировать свой ресторан Sunset Bar!',
      label: '3. Высокий интент / регистрация заведения'
    }
  ];

  for (const tc of testCases) {
    console.log(`--------------------------------------------------`);
    console.log(`📌 Тест: ${tc.label}`);
    console.log(`💬 Сообщение от [${tc.senderName}]: "${tc.userMessage}"`);
    
    const response = await B2BAgentEngine.processMessage(tc.chatId, tc.userMessage, tc.senderName);
    
    console.log(`🤖 Ответ ИИ-Агента:\n\n${response.text}\n`);
    console.log(`🔘 Инлайн кнопки (${response.buttons?.length || 0} рядов):`);
    response.buttons?.forEach((row, i) => {
      console.log(`   Ряд ${i + 1}: ${row.map((b) => `[${b.text}]`).join(' ')}`);
    });
    console.log(`🔥 High Intent Flag: ${response.isHighIntent}`);
    console.log(`--------------------------------------------------\n`);
  }

  console.log('=== ✅ Diagnostics Completed Successfully ===');
}

runDiagnostics().catch((err) => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
