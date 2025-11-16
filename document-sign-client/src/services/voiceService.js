// Voice Service for accessibility features
class VoiceService {
    constructor() {
      this.speech = null;
      
      // Check if browser supports speech synthesis
      if ('speechSynthesis' in window) {
        this.speech = window.speechSynthesis;
      }
    }
  
    // Speak text aloud
    speak = (text, rate = 0.8) => {
      if (!this.speech) {
        console.log("Voice synthesis not supported");
        return;
      }
  
      // Stop any current speech
      this.stop();
      
      // Create new speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; // Slower speed for better understanding
      utterance.pitch = 1;
      utterance.volume = 1;
      
      this.speech.speak(utterance);
    };
  
    // Stop current speech
    stop = () => {
      if (this.speech) {
        this.speech.cancel();
      }
    };
  
    // Speak welcome message when patient logs in
    speakWelcome = (patientName) => {
      this.speak(`Welcome ${patientName}. Please review your document and provide your signature when ready.`);
    };
  
    // Guide to signature page
    speakSignatureGuide = () => {
      this.speak("You are now on the signature page. Use your finger or mouse to draw your signature in the box. When finished, click the Save Signature button.");
    };
  
    // Confirm action
    speakConfirmation = (action) => {
      this.speak(`${action} completed successfully.`);
    };
  
    // 🆕 ADD THESE MISSING FUNCTIONS:
  
    // Guide through submit process
    speakSubmitGuidance = async () => {
      this.speak("Please review your signed document");
      await this.delay(6000);
      this.speak("If you need a copy, click the download button");
      await this.delay(6000);
      this.speak("When ready, click submit to complete the process");
    };
  
    // Login guidance
    speakLoginGuidance = () => {
      this.speak("Please enter your birthday to continue with the document signing");
    };
  
    // Utility for delays
    delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Create single instance
  const voiceService = new VoiceService();
  export default voiceService;