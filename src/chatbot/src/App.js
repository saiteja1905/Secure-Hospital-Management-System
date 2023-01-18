import React from 'react';
import { Chatbot } from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import config from './config';

import './App.css';

function ChatBot() {
  return (
    <div className="App">
      <header className="App-header">
        < Chatbot config={config} messageParser={MessageParser} actionProvider={ActionProvider} />
      </header>
    </div>
  );
}

export default ChatBot;
