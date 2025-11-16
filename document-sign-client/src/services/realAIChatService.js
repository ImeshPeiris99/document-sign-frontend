// ULTRA HUMAN-LIKE AI Chat Service - No API Keys Needed!
class RealAIChatService {
    constructor() {
      this.conversationHistory = [];
      this.userName = ''; // Will learn user's name
      this.conversationStyle = 'friendly'; // friendly, professional, comforting
    }
  
    // 🎯 HUMAN-LIKE AI RESPONSE GENERATOR
    async askQuestion(question, documentContext = 'medical') {
      try {
        // 🎯 SIMULATE THINKING DELAY FOR REALISM
        await this.simulateThinking();
        
        // 🎯 ANALYZE USER'S MOOD AND INTENT
        const userMood = this.analyzeUserMood(question);
        const userIntent = this.analyzeUserIntent(question);
        
        // 🎯 GENERATE PERSONALIZED RESPONSE
        const response = this.generateHumanResponse(question, userMood, userIntent);
        
        this.conversationHistory.push({
          question,
          answer: response,
          timestamp: new Date().toISOString(),
          mood: userMood,
          intent: userIntent
        });
        
        return response;
      } catch (error) {
        console.error('AI Chat Error:', error);
        return "I apologize, I'm having a bit of trouble right now. Could you try asking again in a different way? 🤔";
      }
    }
  
    // 🎯 SIMULATE HUMAN THINKING TIME
    async simulateThinking() {
      const thinkTime = 800 + Math.random() * 1200; // 0.8-2 seconds
      await new Promise(resolve => setTimeout(resolve, thinkTime));
    }
  
    // 🎯 ANALYZE USER'S EMOTIONAL STATE
    analyzeUserMood(question) {
      const lowerQuestion = question.toLowerCase();
      
      if (/(scared|nervous|worried|anxious|afraid|frightened)/.test(lowerQuestion)) {
        return 'anxious';
      } else if (/(confused|don't understand|unclear|what does|what is|help me)/.test(lowerQuestion)) {
        return 'confused';
      } else if (/(rushed|hurry|quick|fast|no time)/.test(lowerQuestion)) {
        return 'rushed';
      } else if (/(thank|thanks|appreciate|helpful|good)/.test(lowerQuestion)) {
        return 'grateful';
      } else if (/(frustrated|angry|annoyed|upset|mad)/.test(lowerQuestion)) {
        return 'frustrated';
      } else {
        return 'neutral';
      }
    }
  
    // 🎯 UNDERSTAND WHAT USER REALLY WANTS
    analyzeUserIntent(question) {
      const lowerQuestion = question.toLowerCase();
      
      if (/(hello|hi|hey|good morning|good afternoon)/.test(lowerQuestion)) {
        return 'greeting';
      } else if (/(informed consent|consent|agree|permission)/.test(lowerQuestion)) {
        return 'explain_consent';
      } else if (/(risk|benefit|side effect|complication)/.test(lowerQuestion)) {
        return 'explain_risks';
      } else if (/(financial|payment|cost|money|bill)/.test(lowerQuestion)) {
        return 'explain_financial';
      } else if (/(hipaa|privacy|confidential)/.test(lowerQuestion)) {
        return 'explain_privacy';
      } else if (/(what does|what is|explain|mean)/.test(lowerQuestion)) {
        return 'define_term';
      } else if (/(nervous|scared|worried|comfort)/.test(lowerQuestion)) {
        return 'seek_comfort';
      } else {
        return 'general_help';
      }
    }
  
    // 🎯 GENERATE HUMAN-LIKE RESPONSE
    generateHumanResponse(question, mood, intent) {
      // 🎯 EXTRACT USER'S NAME IF MENTIONED
      this.extractUserName(question);
  
      // 🎯 RESPONSE BASED ON MOOD + INTENT
      const responseMap = {
        // 🎯 ANXIOUS USER - COMFORTING RESPONSES
        anxious: {
          explain_consent: [
            `I completely understand feeling nervous about this ${this.userName ? this.userName + ' ' : ''}💙 Informed consent is actually designed to protect you! It ensures you have all the information you need to feel confident in your decision. Think of it as your safety net.`,
            
            `It's totally normal to feel anxious about medical documents ${this.userName ? this.userName + ' ' : ''}🕊️ Remember, informed consent means you're in control. You have the right to ask as many questions as you need until you feel comfortable.`,
            
            `I hear that you're feeling nervous, and that's completely okay ${this.userName ? this.userName + ' ' : ''}✨ Informed consent exists to make sure you never feel pressured. Take all the time you need - I'm here to help with any questions.`
          ],
          explain_risks: [
            `I understand why the risks section might feel overwhelming ${this.userName ? this.userName + ' ' : ''}📋 Doctors are required to tell you about even very rare possibilities. This doesn't mean they expect them to happen - it's about being fully transparent with you.`,
            
            `It's smart to be careful when reading about risks ${this.userName ? this.userName + ' ' : ''}🔍 Remember that doctors list everything that could possibly happen, even if it's very unlikely. The most common outcomes are usually the benefits listed above.`
          ],
          default: [
            `It's completely okay to feel anxious about this ${this.userName ? this.userName + ' ' : ''}💗 Medical documents can seem intimidating, but I'm here to walk through everything with you. What specific part is worrying you most?`,
            
            `I understand this might feel overwhelming ${this.userName ? this.userName + ' ' : ''}🌷 You're doing the right thing by asking questions. Let's take it one step at a time - what would you like me to explain first?`
          ]
        },
  
        // 🎯 CONFUSED USER - CLEAR EXPLANATIONS
        confused: {
          explain_consent: [
            `Great question! Let me explain informed consent in simple terms 🤔\n\nIt means your healthcare team must explain everything to you clearly before you agree to any treatment. They'll cover:\n\n• What the procedure involves\n• The potential benefits\n• Possible risks\n• Other options available\n\nThis ensures you can make the best decision for your health!`,
            
            `I'm happy to clarify! **Informed consent** is basically your right to understand before you agree 🎯\n\nIt's not just signing a form - it's a conversation where your doctor makes sure you know exactly what you're saying "yes" to. You should feel completely comfortable before proceeding.`
          ],
          explain_risks: [
            `Let me break down risks and benefits in everyday language 📊\n\n**Benefits** = The good outcomes we hope for from the treatment\n**Risks** = The possible negative outcomes (even if unlikely)\n\nThink of it like weather forecasting: they tell you it might rain so you can bring an umbrella, even if it's sunny most of the time!`,
            
            `This can be confusing! Let me simplify it 🌟\n\nEvery medical decision has potential upsides (benefits) and downsides (risks). This section helps you and your doctor decide if the potential good outcomes are worth the possible challenges for your specific situation.`
          ],
          explain_financial: [
            `Financial terms can be tricky! Let me explain 💰\n\n**Financial responsibility** means you agree to be responsible for medical costs that insurance doesn't cover. It's like being the backup payer for your healthcare.\n\nIf you have questions about specific costs, the billing department can give you exact numbers.`,
            
            `I understand this financial language can be confusing 🏦\n\nThink of it this way: Your insurance is the primary payer, and you're the secondary payer for anything they don't cover. You always have the right to ask about costs upfront!`
          ],
          default: [
            `I'd love to help clarify things for you! Could you tell me which specific part is confusing? That way I can give you the most helpful explanation 🎯`,
            
            `Medical documents can definitely be confusing! Let me help you understand. Which term or section would you like me to explain in simpler terms? 📝`
          ]
        },
  
        // 🎯 NEUTRAL USER - FRIENDLY EXPLANATIONS
        neutral: {
          greeting: [
            `Hello there! 👋 I'm your friendly document assistant. I'm here to help you understand everything in your medical documents in plain English. What would you like to know?`,
            
            `Hi! 🤗 I see you're reviewing some important documents. I'm here to make everything clear and answer any questions you have. What can I help explain today?`,
            
            `Welcome! 🌟 I'm your document guide here to help you understand every part of your medical forms. Feel free to ask me anything - no question is too small!`
          ],
          explain_consent: [
            `That's an important question! **Informed consent** means you fully understand a medical procedure before agreeing to it 🗺️\n\nIt ensures you know:\n• What the treatment involves\n• The potential benefits\n• Possible risks\n• Other available options\n\nThis helps you make the best decision for your health!`,
            
            `**Informed consent** is your right to complete understanding before any medical procedure 💪\n\nIt's not just about signing a form - it's about having a conversation where all your questions get answered until you feel completely comfortable and informed.`
          ],
          explain_risks: [
            `Great question! The **risks and benefits** section is like a balanced scale ⚖️\n\nOn one side: The positive outcomes we hope for (benefits)\nOn the other: The possible challenges (risks)\n\nThis helps you and your doctor decide if the potential good outcomes are worth the possible risks for your situation.`,
            
            `This section helps with informed decision-making! 📈\n\n**Benefits** = The positive results expected from treatment\n**Risks** = The potential negative outcomes (even unlikely ones)\n\nDoctors are required to tell you about all possibilities so you can make the best choice.`
          ],
          default: [
            `Thanks for your question! I'm here to help you understand this document better. Could you tell me which specific part you'd like me to explain? I want to make sure I give you the most helpful answer 🤔`,
            
            `I appreciate your question! To give you the best explanation, could you let me know which section or term you're looking at? That way I can provide the most relevant information 📚`
          ]
        },
  
        // 🎯 GRATEFUL USER - WARM RESPONSES
        grateful: {
          default: [
            `You're very welcome! I'm so glad I could help 🌟 Is there anything else you'd like me to explain? I'm here for all your questions!`,
            
            `I'm happy to help! 💫 Understanding your healthcare decisions is so important. Feel free to ask me anything else that comes to mind.`,
            
            `Thank you for saying that! 😊 It makes me happy to know I'm helping you feel more confident. What else can I clarify for you?`
          ]
        }
      };
  
      // 🎯 SELECT THE PERFECT RESPONSE
      const moodResponses = responseMap[mood] || responseMap.neutral;
      const specificResponse = moodResponses[intent] || moodResponses.default;
      
      // 🎯 RANDOMLY SELECT FROM AVAILABLE RESPONSES
      return this.randomChoice(specificResponse);
    }
  
    // 🎯 EXTRACT AND REMEMBER USER'S NAME
    extractUserName(question) {
      // Simple name extraction from patterns like "I'm John" or "This is Sarah"
      const nameMatch = question.match(/(?:i'm|im|this is|name is|called)\s+([a-z]+)/i);
      if (nameMatch && !this.userName) {
        this.userName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      }
      return this.userName;
    }
  
    // 🎯 RANDOM SELECTION FOR VARIETY
    randomChoice(array) {
      return array[Math.floor(Math.random() * array.length)];
    }
  
    getConversationHistory() {
      return this.conversationHistory;
    }
  
    clearHistory() {
      this.conversationHistory = [];
      this.userName = '';
    }
  
    // 🎯 GET USER NAME FOR PERSONALIZATION
    getUserName() {
      return this.userName;
    }
  }
  
  const realAIChatService = new RealAIChatService();
  export default realAIChatService;