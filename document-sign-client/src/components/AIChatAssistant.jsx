import React, { useState, useRef, useEffect } from 'react';
import realAIChatService from '../services/realAIChatService';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

const AIChatAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 🎯 HUMAN-LIKE SAMPLE QUESTIONS
  const sampleQuestions = [
    "I'm confused about informed consent",
    "What does financial responsibility mean?",
    "Can you explain risks and benefits?",
    "I'm nervous about signing this",
    "What is HIPAA privacy?",
    "This seems complicated - can you help?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🎯 TOGGLE CHAT WITH PERSONALITY
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && messages.length === 0) {
      // Human-like welcome message
      setTimeout(() => {
        setMessages([{
          id: 1,
          text: "Hi there! 👋 I'm your friendly document assistant. I'm here to help you understand everything in plain English. Medical forms can be confusing - ask me anything!",
          isUser: false,
          timestamp: new Date()
        }]);
      }, 300);
    }
  };

  // 🎯 HUMAN-LIKE MESSAGE SENDING
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 🎯 GET REAL AI RESPONSE
      const aiResponse = await realAIChatService.askQuestion(inputMessage);
      
      // 🎯 SIMULATE TYPING DELAY FOR REALISM
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, I'm having trouble connecting right now. Please try asking your question again in a moment.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (question) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 🎯 FORMAT MESSAGE WITH LINE BREAKS
  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => (
      <div key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </div>
    ));
  };

  return (
    <>
      {/* 🎯 FLOATING AI BUTTON WITH PERSONALITY */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          color: 'white',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          animation: 'pulse 2s infinite'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';
        }}
        title="Ask me anything about your documents! 🤗"
      >
        <MessageCircle size={28} />
      </button>

      {/* 🎯 HUMAN-LIKE CHAT WINDOW */}
      {isChatOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '150px',
            right: '20px',
            width: '380px',
            height: '520px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #10B981',
            overflow: 'hidden'
          }}
        >
          {/* 🎯 FRIENDLY CHAT HEADER */}
          <div
            style={{
              backgroundColor: '#10B981',
              color: 'white',
              padding: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '16px' }}>Document Assistant</strong>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Here to help you understand 🤗
                </div>
              </div>
            </div>
            <button
              onClick={toggleChat}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '50%',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>

          {/* 🎯 NATURAL CONVERSATION MESSAGES */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              backgroundColor: '#f8fafc'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignSelf: message.isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {!message.isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Bot size={16} color="white" />
                  </div>
                )}
                <div
                  style={{
                    backgroundColor: message.isUser ? '#10B981' : 'white',
                    color: message.isUser ? 'white' : '#374151',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    boxShadow: message.isUser ? 
                      '0 2px 8px rgba(16, 185, 129, 0.3)' : 
                      '0 2px 8px rgba(0,0,0,0.1)',
                    border: message.isUser ? 'none' : '1px solid #e5e7eb'
                  }}
                >
                  {formatMessage(message.text)}
                </div>
                {message.isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <User size={16} color="white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={16} color="white" />
                </div>
                <div style={{
                  backgroundColor: 'white',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ 
                      animation: 'bounce 1s infinite',
                      fontSize: '18px'
                    }}>●</div>
                    <div style={{ 
                      animation: 'bounce 1s infinite 0.2s',
                      fontSize: '18px'
                    }}>●</div>
                    <div style={{ 
                      animation: 'bounce 1s infinite 0.4s',
                      fontSize: '18px'
                    }}>●</div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 🎯 CONTEXTUAL SAMPLE QUESTIONS */}
          {messages.length <= 2 && (
            <div style={{ 
              padding: '15px', 
              borderTop: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', fontWeight: '500' }}>
                Quick questions you might have:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQuestion(question)}
                    style={{
                      background: 'none',
                      border: '1px solid #10B981',
                      color: '#10B981',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#10B981';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#10B981';
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🎯 NATURAL INPUT AREA */}
          <div
            style={{
              padding: '15px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: 'white',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end'
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here... (Press Enter to send)"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '25px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10B981'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (!inputMessage.trim() || isLoading) ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (inputMessage.trim() && !isLoading) {
                  e.target.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
};

export default AIChatAssistant;