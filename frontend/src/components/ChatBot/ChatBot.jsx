import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../../utils/api';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi there! I am your AI Assistant. You can ask me to help you place an order. Try: 'buy [book title]'", sender: "bot" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    const newMessages = [...messages, { text: userMsg, sender: 'user' }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const history = newMessages.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.post(`${API_BASE}/chat`,
        { message: userMsg, history },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessages(prev => [...prev, { text: response.data.reply || "No response.", sender: 'bot' }]);
    } catch (error) {
      console.error("Chat error:", error);
      let errorMsg = "Oops, something went wrong communicating with the server.";
      if (error.response && error.response.status === 401) {
        errorMsg = "Please log in first to use the Chatbot for placing orders!";
      } else if (error.response && error.response.data && error.response.data.reply) {
        errorMsg = error.response.data.reply;
      }
      setMessages(prev => [...prev, { text: errorMsg, sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="chatbot-container">
      {isOpen ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>AI Order Assistant</h3>
            <button className="close-btn" onClick={toggleChat}>×</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, idx) => {
              const parseMarkdown = (text) => {
                if (!text) return { __html: '' };
                let html = text
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n- (.*?)(?=\n|$)/g, '<br/>• $1');
                return { __html: html };
              };

              return (
                <div key={idx} className={`message ${msg.sender}`} dangerouslySetInnerHTML={parseMarkdown(msg.text)} />
              );
            })}
            {isLoading && (
              <div className="message bot">
                <div className="loading-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input-container">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      ) : (
        <button className="chatbot-toggle" onClick={toggleChat}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
