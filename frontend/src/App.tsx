import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <>
      {isAdminMode ? (
        <AdminPanel onBackClick={() => setIsAdminMode(false)} />
      ) : (
        <ChatInterface onAdminClick={() => setIsAdminMode(true)} />
      )}
    </>
  );
}

export default App;
