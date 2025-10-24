import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId } = await req.json();
    console.log('Chat bot request:', { message, sessionId });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get or create session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();
      session = data;
    }

    if (!session) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          status: 'active',
        })
        .select()
        .single();
      
      if (error) throw error;
      session = data;
    }

    // Get message history
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    const conversationHistory = messages || [];

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: session.id,
      user_id: user.id,
      role: 'user',
      content: message,
    });

    // System prompt for FAQ bot
    const systemPrompt = `Вы - помощник для интернет-магазина электроники. Отвечайте кратко и по делу на русском языке.

Популярные темы FAQ:
1. Доставка: Доставка по России 3-7 дней. Бесплатная доставка от 5000 руб. Курьером или в пункт выдачи.
2. Возврат: 14 дней на возврат товара без объяснения причин. Деньги возвращаются в течение 10 дней.
3. Оплата: Банковской картой онлайн, наличными курьеру, в пункте выдачи.
4. Гарантия: Официальная гарантия производителя 1-2 года. Гарантийный ремонт в сервисных центрах.
5. Отслеживание заказа: Трек-номер придет на email после отправки. Отслеживается в личном кабинете.
6. Проблемы с оплатой: Проверьте баланс карты, включен ли онлайн-платеж. Попробуйте другую карту или способ оплаты.
7. Наличие товара: Если товар "Под заказ", срок поставки 7-14 дней. Если "Нет в наличии", уточните у оператора.

Если вопрос выходит за рамки этих тем или требует индивидуального подхода, предложите связаться с сотрудником.`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Превышен лимит запросов. Попробуйте позже.',
            needEscalation: true,
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Требуется пополнение баланса. Обратитесь к администратору.',
            needEscalation: true,
          }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Извините, не могу ответить.';

    // Save assistant message
    await supabase.from('chat_messages').insert({
      session_id: session.id,
      user_id: user.id,
      role: 'assistant',
      content: assistantMessage,
    });

    // Check if need escalation (simple keyword detection)
    const needEscalation = 
      assistantMessage.toLowerCase().includes('связаться с сотрудником') ||
      assistantMessage.toLowerCase().includes('обратитесь к оператору');

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        sessionId: session.id,
        needEscalation,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat bot error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        needEscalation: true,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
