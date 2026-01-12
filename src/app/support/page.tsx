"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, MessageSquare, Star, Search, ArrowRight, X, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import Link from "next/link";
import { detectPriority, priorityToDb } from "@/lib/priority";
import { useTickets, useRules, useArticles } from "@/lib/data";
import { DbArticle } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  ticketId?: string; // Optional ticket ID for badge rendering
};

type ViewMode = 'home' | 'faq' | 'status';

export default function SupportPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isChatMaximized, setIsChatMaximized] = useState(false);

  // -- Chat State (Shared between Inline and Modal) --
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Welcome to Starbucks Support! I can help you create a support ticket. Please briefly describe your issue.' }
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0); 
  const [formData, setFormData] = useState({ description: "", email: "" });
  const [loading, setLoading] = useState(false);
  // Active chat session ID for saving messages
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Refs for auto-scroll
  const bottomRefInline = useRef<HTMLDivElement>(null);
  const bottomRefModal = useRef<HTMLDivElement>(null);

  // -- Status Check State --
  const [ticketIdQuery, setTicketIdQuery] = useState("");
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  // New: Chat History for Status
  const [ticketChatSession, setTicketChatSession] = useState<Message[] | null>(null);
  // Agent takeover flag - when true, bot stops auto-responding
  const [agentTakeover, setAgentTakeover] = useState(false);
  // Track session found during status check
  const [foundSessionId, setFoundSessionId] = useState<string | null>(null);
  
  // Fetch tickets and rules for SLA display
  const { tickets, refreshTickets } = useTickets();
  const { rules } = useRules();
  const { articles, submitFeedback } = useArticles();
  
  // Track current ticket for SLA display
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  
  // Self-service portal state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<DbArticle | null>(null);

  useEffect(() => {
    bottomRefInline.current?.scrollIntoView({ behavior: 'smooth' });
    if (isChatMaximized) {
        bottomRefModal.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatMaximized]);
  
  // Get SLA status for current ticket
  const getSlaStatus = () => {
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('SLA Debug:', {
        currentTicketId,
        ticketsCount: tickets.length,
        rulesCount: rules.length,
        tickets: tickets.map(t => ({ id: t.id, priority: t.priority, status: t.status })),
        rules: rules.map(r => ({ name: r.name, conditionField: r.conditionField, conditionValue: r.conditionValue }))
      });
    }
    
    if (!currentTicketId) {
      if (process.env.NODE_ENV === 'development') console.log('SLA: No currentTicketId');
      return null;
    }
    
    if (tickets.length === 0) {
      if (process.env.NODE_ENV === 'development') console.log('SLA: No tickets loaded yet');
      return null;
    }
    
    if (rules.length === 0) {
      if (process.env.NODE_ENV === 'development') console.log('SLA: No rules loaded yet');
      return null;
    }
    
    const ticket = tickets.find(t => t.id === currentTicketId);
    if (!ticket) {
      if (process.env.NODE_ENV === 'development') console.log('SLA: Ticket not found in tickets array', currentTicketId);
      return null;
    }
    
    if (ticket.status !== 'Open' && ticket.status !== 'In Progress') {
      if (process.env.NODE_ENV === 'development') console.log('SLA: Ticket is closed/resolved', ticket.status);
      return null;
    }
    
    // Find matching rule
    const rule = rules.find(r => {
      if (r.conditionField === 'priority' && r.conditionValue) {
        return r.conditionValue.toLowerCase() === ticket.priority.toLowerCase();
      }
      return r.name.toLowerCase().includes(ticket.priority.toLowerCase());
    }) || rules.find(r => !r.conditionField) || rules[0];
    
    if (!rule) {
      if (process.env.NODE_ENV === 'development') console.log('SLA: No matching rule found for priority', ticket.priority);
      return null;
    }
    
    const created = new Date(ticket.createdAt).getTime();
    const targetTime = created + (rule.resolutionMins * 60000);
    const now = Date.now();
    const timeLeftMs = targetTime - now;
    
    const isBreached = timeLeftMs < 0;
    const hoursLeft = Math.floor(Math.abs(timeLeftMs) / 3600000);
    const minsLeft = Math.floor((Math.abs(timeLeftMs) % 3600000) / 60000);
    const timeString = `${hoursLeft}h ${minsLeft}m`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('SLA Status Calculated:', {
        ticketPriority: ticket.priority,
        ruleName: rule.name,
        resolutionMins: rule.resolutionMins,
        timeLeft: timeString,
        isBreached
      });
    }
    
    return {
      isBreached,
      timeString,
      priority: ticket.priority,
      ruleName: rule.name
    };
  };
  
  const slaStatus = getSlaStatus();
  
  // Update currentTicketId when ticket is created and refresh tickets
  useEffect(() => {
    if (currentTicketId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('SLA: currentTicketId set to', currentTicketId);
      }
      // Force refresh tickets to ensure new ticket is loaded
      refreshTickets();
      
      // Also refresh after a delay to ensure it's fully loaded
      const timer1 = setTimeout(() => refreshTickets(), 1000);
      const timer2 = setTimeout(() => refreshTickets(), 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [currentTicketId, refreshTickets]);
  
  // Debug: Log when tickets or rules change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && currentTicketId) {
      console.log('SLA: Tickets or rules updated', {
        ticketsCount: tickets.length,
        rulesCount: rules.length,
        currentTicketId,
        ticketFound: tickets.find(t => t.id === currentTicketId) ? 'YES' : 'NO',
        slaStatus
      });
    }
  }, [tickets, rules, currentTicketId, slaStatus]);

  // -- Handlers --

  // Helper to save a message to the database
  const saveMessageToDb = async (sessionId: string, senderType: 'bot' | 'user', content: string) => {
      if (!supabase) return;
      try {
          await supabase.from('chat_messages').insert({
              session_id: sessionId,
              sender_type: senderType,
              content: content,
              created_at: new Date().toISOString()
          });
      } catch (err) {
          console.error('Failed to save message:', err);
      }
  };

  // Helper to create or get session
  const ensureSession = async (): Promise<string | null> => {
      if (activeSessionId) return activeSessionId;
      if (!supabase) return null;
      
      try {
          const sessionId = uuidv4();
          await supabase.from('chat_sessions').insert({
              id: sessionId,
              status: 'Active',
              started_at: new Date().toISOString(),
              metadata: {}
          });
          setActiveSessionId(sessionId);
          // Save the welcome message
          await saveMessageToDb(sessionId, 'bot', 'Welcome to Starbucks Support! I can help you create a support ticket. Please briefly describe your issue.');
          return sessionId;
      } catch (err) {
          console.error('Failed to create session:', err);
          return null;
      }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    
    // Ensure we have a session and save the user message immediately
    const sessionId = await ensureSession();
    if (sessionId) {
        saveMessageToDb(sessionId, 'user', userText);
    }
    
    setMessages(prev => [...prev, { id: uuidv4(), sender: 'user', text: userText }]);
    setInput("");

    if (step === 0) {
        setFormData(prev => ({ ...prev, description: userText }));
        setStep(1);
        if (!agentTakeover) {
            setTimeout(() => {
                const botText = 'I understand. What is the best email address to reach you at?';
                setMessages(prev => [...prev, { id: uuidv4(), sender: 'bot', text: botText }]);
                if (sessionId) saveMessageToDb(sessionId, 'bot', botText);
            }, 3000);
        }
    } else if (step === 1) {
        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userText)) {
             if (!agentTakeover) {
                 const botText = "That doesn't look like a valid email. Please try again (e.g., name@example.com).";
                 setMessages(prev => [...prev, { id: uuidv4(), sender: 'bot', text: botText }]);
                 if (sessionId) saveMessageToDb(sessionId, 'bot', botText);
             }
             return;
        }

        setFormData(prev => ({ ...prev, email: userText }));
        setStep(2);
        setLoading(true);
        setTimeout(async () => {
            await createTicket(formData.description, userText, sessionId);
        }, 800);
    } else if (step === 3 && !agentTakeover) {
        // Post-ticket conversation - respond with variety (only if no agent takeover)
        const responses = [
            "I've noted that! Is there anything specific you'd like to add to your ticket?",
            "Got it! Feel free to share more details if needed.",
            "Thanks for letting me know! Anything else on your mind?",
            "Noted! Our team will review this along with your ticket.",
            "I hear you! Is there anything else I can help clarify?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                id: uuidv4(), 
                sender: 'bot', 
                text: randomResponse 
            }]);
            if (sessionId) saveMessageToDb(sessionId, 'bot', randomResponse);
        }, 3000);
    }
  };

  const createTicket = async (desc: string, email: string, existingSessionId: string | null) => {
      if (!supabase) {
          setLoading(false);
          setMessages(prev => [...prev, { 
              id: uuidv4(), 
              sender: 'bot', 
              text: "⚠️ Database connection error. Please check that Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are configured in .env.local file." 
          }]);
          console.error('Supabase not initialized. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.');
          return;
      }
      try {
          // 1. Identify or Create User & Customer
          let customerId = "";
          let userId = "";

          // Check _users first
          const { data: existingUser } = await supabase.from('_users').select('id').eq('email', email).single();
          
          if (existingUser) {
              userId = existingUser.id;
          } else {
              // Create new user
              const { data: newUser, error: uErr } = await supabase.from('_users').insert({
                  email: email,
                  role: 'CUSTOMER',
                  password: 'password', // Default
                  first_name: 'Guest',
                  last_name: 'User'
              }).select().single();
              
              if (uErr || !newUser) {
                 console.error("User creation failed:", uErr);
                 throw new Error("Failed to create user account.");
              }
              userId = newUser.id;
          }

          // Check customers profile and get loyalty data
          const { data: existingProfile } = await supabase
            .from('customers')
            .select('id, total_spent, total_orders')
            .eq('user_id', userId)
            .single();
          
          let customerLoyaltyLevel: string | undefined;
          let customerTotalSpent: number | undefined;
          let customerTotalOrders: number | undefined;
          
          if (existingProfile) {
              customerId = existingProfile.id;
              customerTotalSpent = existingProfile.total_spent;
              customerTotalOrders = existingProfile.total_orders;
              
              // Try to get loyalty level from customer table (if exists)
              const { data: customerData } = await supabase
                .from('customer')
                .select('loyalty_level')
                .eq('id', customerId)
                .single();
              customerLoyaltyLevel = customerData?.loyalty_level;
          } else {
              // Create profile
              const { data: newProfile, error: pErr } = await supabase.from('customers').insert({
                  user_id: userId,
                  city: 'Unknown',
                  country: 'Unknown'
              }).select().single();
              
              if (pErr || !newProfile) {
                  console.error("Profile creation failed:", pErr);
                  throw new Error("Failed to create customer profile.");
              }
              customerId = newProfile.id;
          }

          // Detect priority based on description and customer data
          const detectedPriority = detectPriority({
              description: desc,
              customerLoyaltyLevel,
              customerTotalSpent,
              customerTotalOrders
          });

          // 2. Ticket (support_cases) with detected priority
          const { data: ticket, error: tErr } = await supabase.from('support_cases').insert({
              title: desc,
              description: desc,
              customer_id: customerId,
              priority: priorityToDb(detectedPriority), // Use detected priority
              status: 'open',
              case_number: `CASE-${Date.now()}` .slice(0, 20), // Ensure fit
              created_at: new Date().toISOString()
          }).select().single();

          if (tErr || !ticket) {
              console.error("Ticket creation failed:", JSON.stringify(tErr, null, 2));
              throw new Error(`Failed to create ticket record: ${tErr?.message || 'Unknown error'}`);
          }

          // 3. Update existing chat session with ticket reference
          if (existingSessionId) {
              await supabase.from('chat_sessions').update({
                  customer_id: customerId, // Using the profile ID as customer_id in chat seems correct if chat links to customer profile
                  status: 'Active', 
                  metadata: { ticketId: ticket.id }
              }).eq('id', existingSessionId);
          }

          const successText = `Success! Your ticket has been created with ${detectedPriority} priority. Ticket ID:`;
          setCurrentTicketId(ticket.id); // Track ticket for SLA display
          setMessages(prev => [...prev, { 
              id: uuidv4(), 
              sender: 'bot', 
              text: successText,
              ticketId: ticket.id
          }]);
          if (existingSessionId) saveMessageToDb(existingSessionId, 'bot', successText);
          
          // Force refresh tickets to get the newly created one
          setTimeout(() => {
            refreshTickets();
          }, 1000);
          
          // Also refresh again after a bit to ensure it's loaded
          setTimeout(() => {
            refreshTickets();
          }, 3000);
          
          // Allow continued conversation
          setTimeout(() => {
              setMessages(prev => [...prev, { 
                  id: uuidv4(), 
                  sender: 'bot', 
                  text: `Is there anything else I can help you with?`
              }]);
              setStep(3); // New step: post-ticket conversation
              setFormData({ description: "", email: "" });
          }, 1500);
      } catch (e: unknown) {
          console.error(e);
          const errMsg = e instanceof Error ? e.message : "Unknown error";
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'bot', text: `Sorry, something went wrong: ${errMsg}.` }]);
          setStep(1); 
      } finally {
          setLoading(false);
      }
  };

  const checkStatus = async () => {
      setStatusLoading(true);
      setStatusError("");
      setTicketResult(null);
      setTicketChatSession(null);
      
      if (!supabase) {
        setStatusError("System offline");
        setStatusLoading(false);
        return;
      }

      try {
        const { data: ticket, error } = await supabase
            .from('support_cases')
            .select('*')
            .eq('id', ticketIdQuery.trim())
            .single();
        
        if (error) throw error;
        setTicketResult(ticket);

        // Fetch associated chat history
        // Find session with metadata->ticketId = ticket.id
        // Valid PostgreSQL JSONB query: metadata @> '{"ticketId": "..."}'
        const { data: sessions } = await supabase
            .from('chat_sessions')
            .select('id')
            .contains('metadata', { ticketId: ticket.id })
            .limit(1);
        
        if (sessions && sessions.length > 0) {
             const sessId = sessions[0].id;
             setFoundSessionId(sessId); // Store for resumption
             const { data: msgs } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessId)
                .order('created_at', { ascending: true });
             
             if (msgs) {
                 const formatted: Message[] = msgs.map(m => ({
                     id: m.id,
                     sender: m.sender_type === 'bot' ? 'bot' : 'user', 
                     text: m.content
                 }));
                 setTicketChatSession(formatted);
             }
        }

      } catch (e) {
          console.error(e);
          setStatusError("Ticket not found. Please check the ID and try again.");
      } finally {
          setStatusLoading(false);
      }
  };

  const loadChatHistory = () => {
      if (ticketChatSession) {
          setMessages(ticketChatSession);
          if (foundSessionId) {
              setActiveSessionId(foundSessionId); // Resume session
          }
          setIsChatMaximized(true);
          setViewMode('home'); 
          setStep(3); // Enable chat input
      }
  };

  // Shared Chat Component Render Function
  const renderChatContent = (isModal: boolean) => (
      <>
         {/* Messages Area */}
         <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-white scrollbar-thin ${isModal ? 'min-h-0' : ''}`}>
            {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex items-end gap-2 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border ${m.sender === 'user' ? 'bg-gray-100 border-gray-200' : 'bg-[var(--sb-green)] text-white border-transparent'}`}>
                            {m.sender === 'user' ? <User size={12} className="text-gray-500" /> : <Bot size={12} />}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            m.sender === 'user' 
                            ? 'bg-[var(--sb-green)] text-white rounded-br-none' 
                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}>
                            {m.text}
                            {m.ticketId && (
                                <div className="mt-2">
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(m.ticketId!);
                                        }}
                                        className="inline-flex items-center gap-1.5 bg-[var(--sb-green)] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:brightness-110 transition cursor-pointer"
                                        title="Click to copy"
                                    >
                                        🎫 {m.ticketId}
                                    </button>
                                    <p className="text-[10px] text-gray-500 mt-1">Click to copy ticket ID</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start animate-in fade-in">
                   <div className="flex items-end gap-2">
                       <div className="w-6 h-6 rounded-full bg-[var(--sb-green)] text-white flex items-center justify-center">
                           <Bot size={12} />
                       </div>
                       <div className="px-4 py-2 rounded-2xl bg-gray-50 text-gray-500 rounded-bl-none flex items-center gap-2">
                           <Loader2 size={14} className="animate-spin" />
                           <span className="text-xs">Typing...</span>
                       </div>
                   </div>
                </div>
            )}
            <div ref={isModal ? bottomRefModal : bottomRefInline} />
         </div>

         {/* Input Area */}
         <div className="p-4 bg-white border-t">
            <div className="relative">
                <input 
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--sb-green)] focus:border-transparent text-sm" 
                    placeholder={step === 2 ? "Creating your ticket..." : "Type your message..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    disabled={loading}
                />
                <button 
                     className="absolute right-1 top-1 p-2 bg-[var(--sb-green)] text-white rounded-full hover:brightness-110 disabled:opacity-50 transition-all" 
                     onClick={handleSend}
                     disabled={loading || !input.trim()}
                >
                     <Send size={14} />
                </button>
            </div>
            {step === 3 && !loading && (
                <button 
                   onClick={() => {
                        setStep(0);
                        setMessages([{ id: uuidv4(), sender: 'bot', text: 'Welcome back! How can I help you create another ticket?' }]);
                        setFormData({ description: "", email: "" });
                        setActiveSessionId(null); // Clear session on reset
                   }}
                   className="mt-3 w-full text-center text-xs font-bold text-[var(--sb-green)] uppercase tracking-wide hover:underline"
                >
                    Start New Ticket
                </button>
            )}
         </div>
      </>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      
      {/* ... (Header Omitted for brevity, matching existing) ... */}
      <header className="bg-white border-b fixed top-0 left-0 right-0 z-40 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/support" className="relative w-12 h-12 flex-shrink-0">
                   <Image src="/starbucks_logo.svg" alt="Starbucks" fill className="object-contain" />
                </Link>
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                <span className="font-bold text-lg tracking-tight text-gray-900">Support Center</span>
            </div>
            
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setViewMode('status')}
                    className="text-sm font-semibold text-gray-600 hover:text-[var(--sb-green)] transition"
                 >
                    Check Ticket Status
                 </button>
                 <Link href="/login" className="hidden md:flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-xs font-bold hover:bg-gray-50 transition">
                    Agent Login <ArrowRight size={14} />
                 </Link>
            </div>
        </div>
      </header>

      {/* ... (Main Omitted) ... */}
      <main className="flex-1 bg-[var(--sb-dark)] text-white relative pt-20">
         <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--sb-green)] rounded-full blur-[120px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
         </div>

         <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            
            {/* LEFT */}
            <div className="flex-1 space-y-8 md:pr-10">
                 <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
                    Uniquely<br/>
                    <span className="text-[var(--sb-green)]">Yours</span>
                 </h1>
                 <p className="text-lg md:text-xl font-light text-gray-300 max-w-lg leading-relaxed">
                    We're here to help make every moment of your Starbucks experience perfect. Use the chat on the right or browse our resources.
                 </p>
                 
                 <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                        onClick={() => setViewMode('faq')}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 px-6 py-4 rounded-lg flex items-center gap-3 transition"
                    >
                        <Search className="text-[var(--sb-green)]" />
                        <div className="text-left">
                            <h3 className="font-bold text-sm">Browse FAQs</h3>
                            <p className="text-xs text-gray-400">Find answers quickly</p>
                        </div>
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2 text-sm text-gray-400 font-medium pt-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Support Agents Online • Wait Time: &lt; 2m
                 </div>
            </div>

            {/* RIGHT */}
            <div className="w-full md:w-[450px] bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-white/10 relative transition-transform">
                 <div className="bg-gray-50 p-4 border-b flex items-center justify-between cursor-pointer" onClick={() => setIsChatMaximized(true)} title="Maximize Chat">
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-[var(--sb-green)] flex items-center justify-center text-white">
                             <Bot size={18} />
                         </div>
                         <div className="flex-1">
                             <h3 className="font-bold text-sm">Starbucks Assistant</h3>
                             <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Fast Response</p>
                         </div>
                         {slaStatus && (
                             <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border ${
                                 slaStatus.isBreached ? 'bg-red-100 text-red-700 border-red-200' :
                                 'bg-emerald-50 text-emerald-600 border-emerald-100'
                             }`}>
                                 {slaStatus.isBreached ? <AlertCircle size={12} /> : <Clock size={12} />}
                                 <span>{slaStatus.isBreached ? `Breached: ${slaStatus.timeString}` : `${slaStatus.timeString} left`}</span>
                             </div>
                         )}
                     </div>
                     <button className="text-gray-400 hover:text-[var(--sb-green)] transition">
                         <Maximize2 size={18} />
                     </button>
                 </div>
                 
                 {renderChatContent(false)}
            </div>
         </div>
      </main>

      {/* ... (Footer Omitted) ... */}
      <footer className="bg-gray-50 border-t py-12">
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center space-y-6">
                <div className="opacity-50 filter grayscale hover:grayscale-0 transition duration-500">
                    <Image src="/starbucks_logo.svg" alt="Starbucks" width={40} height={40} />
                </div>
                <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 font-medium">
                    <Link href="#" className="hover:text-[var(--sb-green)]">Contact Us</Link>
                    <Link href="#" className="hover:text-[var(--sb-green)]">SLA Policy</Link>
                    <Link href="#" className="hover:text-[var(--sb-green)]">Submit Feedback</Link>
                    <Link href="#" className="hover:text-[var(--sb-green)]">Privacy Policy</Link>
                </div>
                <p className="text-xs text-gray-400">© 2025 Starbucks Coffee Company. All rights reserved.</p>
           </div>
      </footer>

      {/* MAXIMIZED MODAL */}
      {isChatMaximized && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsChatMaximized(false)}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                 <div className="bg-[var(--sb-green)] p-4 flex items-center justify-between text-white">
                     <div className="flex items-center gap-3 flex-1">
                         <div className="bg-white/20 p-2 rounded-full"><Bot size={24} /></div>
                         <div className="flex-1">
                             <h3 className="font-bold text-lg">Starbucks Assistant</h3>
                             <p className="text-sm text-green-100">Live Support</p>
                         </div>
                         {slaStatus && (
                             <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${
                                 slaStatus.isBreached ? 'bg-red-100 text-red-700 border-red-200' :
                                 'bg-white/20 text-white border-white/30'
                             }`}>
                                 {slaStatus.isBreached ? <AlertCircle size={14} /> : <Clock size={14} />}
                                 <span>{slaStatus.isBreached ? `Breached: ${slaStatus.timeString}` : `${slaStatus.timeString} left`}</span>
                             </div>
                         )}
                     </div>
                     <button onClick={() => setIsChatMaximized(false)} className="hover:bg-white/20 p-2 rounded-full transition text-white">
                         <Minimize2 size={24} />
                     </button>
                 </div>
                 {renderChatContent(true)}
            </div>
        </div>
      )}

      {/* SELF-SERVICE PORTAL MODAL */}
      {viewMode === 'faq' && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => {
              setViewMode('home');
              setSelectedArticle(null);
              setSearchQuery("");
              setSelectedCategory(null);
            }}
          >
             <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
             >
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--sb-green)] to-green-600 p-6 text-white">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Self-Service Portal</h2>
                      <p className="text-green-100 text-sm">Find answers quickly • Reduce wait time</p>
                    </div>
                    <button 
                      onClick={() => {
                        setViewMode('home');
                        setSelectedArticle(null);
                        setSearchQuery("");
                        setSelectedCategory(null);
                      }} 
                      className="p-2 hover:bg-white/20 rounded-full transition"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      className="w-full bg-white/95 text-gray-900 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Search for solutions, articles, or help topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Categories Filter */}
                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                      selectedCategory === null
                        ? 'bg-[var(--sb-green)] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    All Topics
                  </button>
                  {Array.from(new Set(articles.map(a => a.category))).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                        selectedCategory === category
                          ? 'bg-[var(--sb-green)] text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex">
                  {/* Articles List */}
                  <div className={`w-full ${selectedArticle ? 'md:w-1/2' : ''} border-r border-gray-200 overflow-y-auto`}>
                    {(() => {
                      const filtered = articles.filter(a => {
                        const matchesSearch = !searchQuery || 
                          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.tags && a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
                        const matchesCategory = !selectedCategory || a.category === selectedCategory;
                        return matchesSearch && matchesCategory;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-12 text-center">
                            <Search size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No articles found</h3>
                            <p className="text-gray-500 text-sm">Try adjusting your search or category filter</p>
                            <button
                              onClick={() => {
                                setViewMode('home');
                                setStep(0);
                              }}
                              className="mt-6 bg-[var(--sb-green)] text-white px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition"
                            >
                              Create Support Ticket Instead
                            </button>
                          </div>
                        );
                      }

                      // Group articles by category for better organization
                      const articlesByCategory = filtered.reduce((acc: Record<string, typeof filtered>, article) => {
                        const cat = article.category || 'General';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(article);
                        return acc;
                      }, {});

                      const categories = Object.keys(articlesByCategory).sort();

                      return (
                        <div className="p-4 space-y-6">
                          <div className="text-sm text-gray-500 mb-4">
                            Found {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
                          </div>
                          
                          {categories.map(category => (
                            <div key={category} className="space-y-3">
                              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-2">
                                {category}
                              </h3>
                              {articlesByCategory[category].map(article => (
                                <div
                                  key={article.id}
                                  onClick={() => setSelectedArticle(article)}
                                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                    selectedArticle?.id === article.id
                                      ? 'border-[var(--sb-green)] bg-green-50 shadow-md'
                                      : 'border-gray-200 hover:border-[var(--sb-green)]/50 hover:shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-gray-900 flex-1">{article.title}</h3>
                                    <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                                      {article.category}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                    {article.content.replace(/[#*\[\]]/g, '').substring(0, 150)}...
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-4">
                                      <span className="flex items-center gap-1">
                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                        {article.helpfulness_score || 0} helpful
                                      </span>
                                    </div>
                                    <span>Read more →</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Article Detail View */}
                  {selectedArticle && (
                    <div className="hidden md:block w-1/2 overflow-y-auto bg-gray-50">
                      <div className="p-6">
                        <button
                          onClick={() => setSelectedArticle(null)}
                          className="mb-4 text-sm text-gray-600 hover:text-[var(--sb-green)] flex items-center gap-2"
                        >
                          ← Back to articles
                        </button>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-2">
                                {selectedArticle.category}
                              </span>
                              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedArticle.title}</h2>
                            </div>
                          </div>
                          <div className="prose prose-sm max-w-none mb-6 text-gray-700 prose-p:my-4 prose-headings:my-6 prose-ul:my-4 prose-ol:my-4 prose-li:my-2">
                            <ReactMarkdown 
                              remarkPlugins={[remarkBreaks]}
                              components={{
                                p: ({node, ...props}) => <p className="mb-4" {...props} />,
                                h1: ({node, ...props}) => <h1 className="mb-6 mt-8 text-2xl font-bold" {...props} />,
                                h2: ({node, ...props}) => <h2 className="mb-4 mt-6 text-xl font-bold" {...props} />,
                                h3: ({node, ...props}) => <h3 className="mb-3 mt-5 text-lg font-semibold" {...props} />,
                                ul: ({node, ...props}) => <ul className="mb-4 ml-6 space-y-2 list-disc" {...props} />,
                                ol: ({node, ...props}) => <ol className="mb-4 ml-6 space-y-2 list-decimal" {...props} />,
                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="my-4 pl-4 border-l-4 border-gray-300 italic" {...props} />,
                              }}
                            >
                              {selectedArticle.content}
                            </ReactMarkdown>
                          </div>
                          
                          {/* Helpfulness Feedback */}
                          <div className="border-t border-gray-200 pt-4 mt-6">
                            {(selectedArticle as any).userFeedback ? (
                              <div className="text-center py-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm font-semibold text-green-700 mb-1">✓ Thank you for your feedback!</p>
                                <p className="text-xs text-green-600">
                                  Your feedback helps us improve our articles.
                                </p>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-gray-700 mb-3">Was this article helpful?</p>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => submitFeedback(selectedArticle.id, true)}
                                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                  >
                                    ✓ Yes, helpful
                                  </button>
                                  <button
                                    onClick={() => submitFeedback(selectedArticle.id, false)}
                                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                  >
                                    ✗ Not helpful
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Call to Action */}
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-gray-700 mb-3">
                              Still need help? Our support team is ready to assist you.
                            </p>
                            <button
                              onClick={() => {
                                setViewMode('home');
                                setSelectedArticle(null);
                                setStep(0);
                              }}
                              className="w-full bg-[var(--sb-green)] text-white px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition"
                            >
                              Create Support Ticket
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
      )}

      {/* STATUS MODAL */}
      {viewMode === 'status' && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setViewMode('home')}
          >
              <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden p-6 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Check Ticket Status</h2>
                    <button onClick={() => setViewMode('home')} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>
                
                {!ticketResult ? (
                    <div className="space-y-4">
                        <p className="text-gray-600">Enter your Ticket ID to see the latest updates.</p>
                        <input 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[var(--sb-green)] outline-none"
                            placeholder="e.g. 123e4567-e89b..."
                            value={ticketIdQuery}
                            onChange={(e) => setTicketIdQuery(e.target.value)}
                        />
                        {statusError && <p className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={14}/> {statusError}</p>}
                        <button 
                            onClick={checkStatus}
                            disabled={statusLoading || !ticketIdQuery}
                            className="w-full bg-[var(--sb-green)] text-white font-bold py-3 rounded-lg hover:brightness-110 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {statusLoading ? <Loader2 size={18} className="animate-spin" /> : "Track Ticket"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                             <div className="flex justify-between items-start mb-2">
                                 {/* FULL ID DISPLAYED */}
                                 <span className="text-xs font-bold text-gray-500 uppercase">Ticket ID: {ticketResult.id}</span>
                                 <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ticketResult.status === 'Open' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                     {ticketResult.status}
                                 </span>
                             </div>
                             <h3 className="font-bold text-lg text-gray-900 mb-1">{ticketResult.title}</h3>
                             <p className="text-sm text-gray-600">{ticketResult.description}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-bold text-sm text-gray-900">Latest Updates</h4>
                            <div className="flex gap-3">
                                <div className="mt-1"><CheckCircle size={16} className="text-[var(--sb-green)]" /></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Ticket Created</p>
                                    <p className="text-xs text-gray-500">{new Date(ticketResult.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {ticketChatSession && (
                            <button 
                                onClick={loadChatHistory}
                                className="w-full bg-[var(--sb-green)] text-white font-bold py-3 rounded-lg hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
                            >
                                <MessageSquare size={18} /> View Conversation
                            </button>
                        )}
                        {!ticketChatSession && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg">
                                Chat history unavailable (session not found).
                            </div>
                        )}

                        <button onClick={() => setTicketResult(null)} className="w-full border border-gray-200 text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-50">
                            Check Another
                        </button>
                    </div>
                )}
              </div>
          </div>
      )}

    </div>
  );
}

function FaqItem({ q, a }: { q: string, a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border rounded-lg overflow-hidden">
            <button 
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 transition"
            >
                <span className="font-medium text-gray-900">{q}</span>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {open && (
                <div className="p-4 bg-white border-t text-gray-600 text-sm">
                    {a}
                </div>
            )}
        </div>
    )
}
