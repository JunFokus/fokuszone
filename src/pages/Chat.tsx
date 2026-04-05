import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Plus, Loader2, Search, MessageCircle, Trash2, Sparkles, PanelLeftOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: string;
}

const SUGGESTED_PROMPTS_EN = [
  'Summarize my textbook chapter',
  'Generate flashcards for Science',
  'Create a quiz on Sejarah',
  'Help me write a BM karangan',
  'Explain quadratic equations',
  'Mock exam questions for Biology',
];

const SUGGESTED_PROMPTS_MS = [
  'Ringkaskan bab buku teks saya',
  'Cipta kad imbas untuk Sains',
  'Buat kuiz tentang Sejarah',
  'Bantu saya tulis karangan BM',
  'Terangkan persamaan kuadratik',
  'Soalan peperiksaan percubaan Biologi',
];

const ChatSidebarContent = ({
  conversations,
  conversationId,
  searchQuery,
  setSearchQuery,
  setConversationId,
  handleNewChat,
  handleDeleteConversation,
  language,
  onSelect,
}: {
  conversations: Conversation[];
  conversationId: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setConversationId: (id: string) => void;
  handleNewChat: () => void;
  handleDeleteConversation: (id: string) => void;
  language: string;
  onSelect?: () => void;
}) => {
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-3 space-y-3">
      <Button onClick={() => { handleNewChat(); onSelect?.(); }} className="w-full rounded-xl h-11 font-medium gap-2 glow-border">
        <Plus className="h-4 w-4" />
        {language === 'en' ? 'New Chat' : 'Perbualan Baru'}
      </Button>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={language === 'en' ? 'Search chats...' : 'Cari perbualan...'}
          className="pl-10 h-10 rounded-xl bg-muted/50 text-sm"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {filtered.map(conv => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                conv.id === conversationId
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => { setConversationId(conv.id); onSelect?.(); }}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1 text-sm font-medium">{conv.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const Chat = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadConversation(conversationId);
  }, [user, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('conversation_id, content, created_at, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!data) return;

    const convMap = new Map<string, Conversation>();
    const convFirstUser = new Map<string, string>();

    for (const msg of data) {
      // Track first user message per conversation for title
      if (msg.role === 'user' && !convFirstUser.has(msg.conversation_id)) {
        convFirstUser.set(msg.conversation_id, msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content);
      }
    }

    // Build conversations from last message (for ordering)
    for (const msg of [...data].reverse()) {
      if (!convMap.has(msg.conversation_id)) {
        convMap.set(msg.conversation_id, {
          id: msg.conversation_id,
          title: convFirstUser.get(msg.conversation_id) || 'New Chat',
          lastMessage: msg.content.slice(0, 50),
          createdAt: msg.created_at,
        });
      }
    }

    setConversations(Array.from(convMap.values()));
  };

  const loadConversation = async (convId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setMessages(data.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
    } else {
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    setMessages([]);
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!user) return;
    await supabase.from('chat_messages').delete().eq('user_id', user.id).eq('conversation_id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (convId === conversationId) handleNewChat();
  };

  const handleSend = async (content?: string) => {
    const msg = content || input.trim();
    if (!msg || loading || !user) return;

    const userMessage: Message = { role: 'user', content: msg };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: conversationId,
      role: 'user',
      content: msg,
    });

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          language,
        },
      });

      const aiContent = error
        ? (language === 'en' ? 'Sorry, I had trouble responding. Please try again!' : 'Maaf, saya menghadapi masalah untuk menjawab. Sila cuba lagi!')
        : data.reply;

      const aiMessage: Message = { role: 'assistant', content: aiContent };
      setMessages(prev => [...prev, aiMessage]);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: 'assistant',
        content: aiContent,
      });

      loadConversations();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: language === 'en' ? 'Sorry, something went wrong!' : 'Maaf, ada masalah!' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = language === 'en' ? SUGGESTED_PROMPTS_EN : SUGGESTED_PROMPTS_MS;
  const isNewChat = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="w-72 hidden md:block border-r border-border/50 bg-card/50 shrink-0 overflow-hidden">
        <ChatSidebarContent
          conversations={conversations}
          conversationId={conversationId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setConversationId={setConversationId}
          handleNewChat={handleNewChat}
          handleDeleteConversation={handleDeleteConversation}
          language={language}
        />
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile sidebar trigger */}
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full shrink-0">
                  <PanelLeftOpen className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <ChatSidebarContent
                  conversations={conversations}
                  conversationId={conversationId}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setConversationId={setConversationId}
                  handleNewChat={handleNewChat}
                  handleDeleteConversation={handleDeleteConversation}
                  language={language}
                  onSelect={() => setMobileSheetOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">
              {isNewChat
                ? (language === 'en' ? 'New Conversation' : 'Perbualan Baru')
                : conversations.find(c => c.id === conversationId)?.title || 'Chat'
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile new chat button */}
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full" onClick={handleNewChat}>
              <Plus className="h-5 w-5" />
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {language === 'en' ? 'Auto-saved' : 'Disimpan automatik'}
            </span>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isNewChat ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <div className="text-center space-y-4 max-w-lg px-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {language === 'en' ? 'How can I help you study?' : 'Bagaimana saya boleh membantu anda belajar?'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Ask FokusZone AI anything about your studies' : 'Tanya FokusZone AI apa sahaja tentang pelajaran anda'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 max-w-lg w-full px-4">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="p-4 rounded-xl bg-muted/50 text-sm text-left font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'glass rounded-bl-md'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl px-4 py-3 rounded-bl-md flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('thinking')}
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-border/50 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'en' ? 'Ask FokusZone AI anything...' : 'Tanya FokusZone AI apa sahaja...'}
              disabled={loading}
              className="rounded-full h-12 bg-muted/50 text-sm px-5"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-full h-12 w-12 shrink-0">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
