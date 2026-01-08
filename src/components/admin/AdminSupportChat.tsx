import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, ChevronLeft, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  user_id: string;
  message: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
  image_url?: string | null;
}

interface UserConversation {
  user_id: string;
  email: string;
  full_name: string | null;
  unread_count: number;
  last_message: string;
  last_message_time: string;
}

export function AdminSupportChat() {
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('admin-support-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        () => {
          fetchConversations();
          if (selectedUserId) {
            fetchMessages(selectedUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    // Get all unique users with support messages
    const { data: messagesData, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      return;
    }

    if (!messagesData || messagesData.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Group by user_id
    const userMessages = new Map<string, Message[]>();
    messagesData.forEach(msg => {
      const existing = userMessages.get(msg.user_id) || [];
      existing.push(msg);
      userMessages.set(msg.user_id, existing);
    });

    // Fetch profiles for all users
    const userIds = Array.from(userMessages.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Build conversations list
    const convos: UserConversation[] = userIds.map(userId => {
      const userMsgs = userMessages.get(userId) || [];
      const profile = profileMap.get(userId);
      const unreadCount = userMsgs.filter(m => !m.is_from_admin && !m.is_read).length;
      const lastMsg = userMsgs[0];

      return {
        user_id: userId,
        email: profile?.email || 'Unknown',
        full_name: profile?.full_name || null,
        unread_count: unreadCount,
        last_message: lastMsg?.image_url ? '📷 Image' : (lastMsg?.message || ''),
        last_message_time: lastMsg?.created_at || ''
      };
    });

    // Sort by last message time
    convos.sort((a, b) => 
      new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    );

    setConversations(convos);
    setLoading(false);
  };

  const fetchMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
      
      // Mark messages as read
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_from_admin', false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    fetchMessages(userId);
  };

  const handleSendMessage = async (imageUrl?: string) => {
    if ((!newMessage.trim() && !imageUrl) || !selectedUserId) return;

    setSending(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: selectedUserId,
        message: newMessage.trim() || (imageUrl ? '📷 Image' : ''),
        is_from_admin: true,
        image_url: imageUrl || null
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } else {
      setNewMessage('');
      fetchMessages(selectedUserId);
      fetchConversations();
    }
    setSending(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUserId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `admin/${selectedUserId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('support-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('support-images')
      .getPublicUrl(fileName);

    await handleSendMessage(urlData.publicUrl);
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const selectedConversation = conversations.find(c => c.user_id === selectedUserId);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Messages
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchConversations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex overflow-hidden p-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No support conversations yet
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Conversations List */}
            <div className={cn(
              "w-full sm:w-80 border-r flex flex-col",
              selectedUserId && "hidden sm:flex"
            )}>
              <ScrollArea className="flex-1">
                {conversations.map((convo) => (
                  <button
                    key={convo.user_id}
                    onClick={() => handleSelectUser(convo.user_id)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted/50 border-b transition-colors",
                      selectedUserId === convo.user_id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {convo.full_name || convo.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {convo.last_message}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(convo.last_message_time)}
                        </span>
                        {convo.unread_count > 0 && (
                          <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center text-xs">
                            {convo.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={cn(
              "flex-1 flex flex-col",
              !selectedUserId && "hidden sm:flex"
            )}>
              {selectedUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-b flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="sm:hidden"
                      onClick={() => setSelectedUserId(null)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {selectedConversation?.full_name || selectedConversation?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation?.email}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.is_from_admin ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2",
                              msg.is_from_admin
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {msg.image_url && (
                              <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                <img 
                                  src={msg.image_url} 
                                  alt="Shared image" 
                                  className="rounded-md max-w-full max-h-40 object-cover mb-2 cursor-pointer hover:opacity-90"
                                />
                              </a>
                            )}
                            {msg.message && msg.message !== '📷 Image' && (
                              <p className="text-sm">{msg.message}</p>
                            )}
                            <p className={cn(
                              "text-xs mt-1",
                              msg.is_from_admin ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || sending}
                        className="flex-shrink-0"
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      </Button>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={sending || uploading}
                      />
                      <Button onClick={() => handleSendMessage()} disabled={sending || uploading || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}