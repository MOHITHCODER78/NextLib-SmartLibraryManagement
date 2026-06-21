import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hi! I am NxtBot, your advanced AI librarian. How can I help you discover something new today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: input });
            const botMsg = { role: 'bot', text: res.data.message };
            setMessages(prev => [...prev, botMsg]);
        } catch {
            setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting right now.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {/* Chat Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-primary text-white p-4 rounded-2xl shadow-2xl shadow-indigo-200 hover:scale-110 transition-all flex items-center gap-2"
                >
                    <MessageSquare className="w-6 h-6" />
                    <span className="font-bold pr-2">Ask NxtBot AI</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-96 h-[500px] rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">NxtBot AI Assistant</h3>
                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Powered by Gemini 2.5 Flash</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                            />
                            <button 
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatBot;
