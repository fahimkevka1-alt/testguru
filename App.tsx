import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType, CampaignGoal } from './types';
import { getAdCampaignAdvice } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import LoadingSpinner from './components/LoadingSpinner';
import { SendIcon, GoogleIcon, ShoppingCartIcon, MousePointerClickIcon, UserPlusIcon, MegaphoneIcon } from './components/icons';

const goals: { name: CampaignGoal, icon: React.ReactNode }[] = [
    { name: 'Sales', icon: <ShoppingCartIcon className="w-8 h-8 mb-2" /> },
    { name: 'Lead Generation', icon: <UserPlusIcon className="w-8 h-8 mb-2" /> },
    { name: 'Website Traffic', icon: <MousePointerClickIcon className="w-8 h-8 mb-2" /> },
    { name: 'Brand Awareness', icon: <MegaphoneIcon className="w-8 h-8 mb-2" /> },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      role: 'model',
      text: "Hello! I'm your Google Ads Expert Agent. First, please select your main goal for this campaign.",
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [budget, setBudget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGoalSelection = (goal: CampaignGoal) => {
    setSelectedGoal(goal);
    const goalSelectedMessage: ChatMessageType = {
        role: 'model',
        text: `Great! Your goal is **${goal}**. Now, please tell me about your business. What do you sell, and who is your target audience?`,
    };
    setMessages(prev => [...prev, goalSelectedMessage]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !selectedGoal) return;

    // The API prompt should just be the user's latest message, with budget info appended if provided.
    // The model relies on the history for the rest of the context.
    const promptForApi = `${userInput}${budget.trim() ? ` (Note: My desired monthly budget is $${budget.trim()})` : ''}`;
    
    const history = messages.map(m => ({
      role: m.role as ('user' | 'model'),
      parts: [{ text: m.text }]
    }));
      
    // The message displayed in the chat should be clean, without the budget note.
    const newUserMessage: ChatMessageType = { role: 'user', text: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setBudget('');
    setIsLoading(true);

    try {
      const response = await getAdCampaignAdvice(promptForApi, history);
      
      let responseText = response.text;
      // If the model only returns function calls, the text can be empty. Provide a default.
      if (!responseText && (response.campaign || response.pricingTiers)) {
        responseText = "I've prepared a campaign and pricing plan based on our discussion. You can see the details below.";
      }

      const newModelMessage: ChatMessageType = {
        role: 'model',
        text: responseText,
        campaign: response.campaign,
        pricingTiers: response.pricingTiers,
      };
      setMessages((prev) => [...prev, newModelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessageType = {
        role: 'model',
        text: 'An error occurred. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="flex items-center justify-center p-4 border-b border-gray-700 shadow-md bg-gray-800">
        <GoogleIcon className="w-8 h-8 mr-3" />
        <h1 className="text-xl font-bold tracking-wider">Google Ads Expert Agent</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}

          {!selectedGoal && messages.length === 1 && (
            <div className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {goals.map((goal) => (
                        <button
                            key={goal.name}
                            onClick={() => handleGoalSelection(goal.name)}
                            className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-700 transition-all duration-200"
                        >
                            {goal.icon}
                            <span className="font-semibold">{goal.name}</span>
                        </button>
                    ))}
                </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-start gap-3 my-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-600">
                    <GoogleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="p-4 rounded-lg bg-gray-800 rounded-tl-none max-w-lg flex items-center justify-center h-16">
                    <LoadingSpinner />
                </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">$</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Budget"
              disabled={isLoading || !selectedGoal}
              className="w-32 bg-gray-700 rounded-full border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition duration-200 pl-7 pr-4 py-3 disabled:opacity-50"
              aria-label="Desired monthly budget"
              min="0"
            />
          </div>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={selectedGoal ? "Tell me about your business..." : "Please select a goal first"}
            disabled={isLoading || !selectedGoal}
            className="flex-1 p-3 bg-gray-700 rounded-full border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition duration-200 disabled:opacity-50"
            aria-label="User input for Google Ads campaign"
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim() || !selectedGoal}
            className="w-12 h-12 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;