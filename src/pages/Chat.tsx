import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Plus, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

const Chat = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversation(conversationId);
  }, [user, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user!.id)
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setMessages(data.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
    } else {
      setMessages([{ role: 'assistant', content: t('welcomeMessage') }]);
    }
  };

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    setMessages([{ role: 'assistant', content: t('welcomeMessage') }]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Save user message
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: conversationId,
      role: 'user',
      content: userMessage.content,
    });

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: newMessages.filter(m => m.content !== t('welcomeMessage')).map(m => ({
            role: m.role,
            content: m.content,
          })),
          language,
        },
      });

      const aiContent = error ? (language === 'en' ? 'Sorry, I had trouble responding. Please try again!' : 'Maaf, saya menghadapi masalah untuk menjawab. Sila cuba lagi!') : data.reply;

      const aiMessage: Message = { role: 'assistant', content: aiContent };
      setMessages(prev => [...prev, aiMessage]);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: 'assistant',
        content: aiContent,
      });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: language === 'en' ? 'Sorry, something went wrong!' : 'Maaf, ada masalah!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">💬 {t('chat')}</h1>
        <Button variant="outline" size="sm" onClick={handleNewChat} className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" />
          {t('newChat')}
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-2 border-primary/10">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3 rounded-bl-md flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('thinking')}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatPlaceholder')}
              disabled={loading}
              className="rounded-full"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-full shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
