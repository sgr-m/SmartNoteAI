import React from 'react';
import { AppProvider } from './context/AppContext';
import { Shell } from './components/Shell';

export default function App(): React.ReactElement {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
