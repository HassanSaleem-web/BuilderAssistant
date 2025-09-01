import React, { useState } from 'react';
import ChatBox from './ChatBox';

function App() {
  const [messages, setMessages] = useState([]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="app-container">
     
      <ChatBox messages={messages} addMessage={addMessage} />
    </div>
  );
}

export default App;
