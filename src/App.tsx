import GameLayout from './components/GameLayout';
import AppInitializer from './components/AppInitializer';
import IdentityManager from './components/IdentityManager';

function App() {
  return (
    <>
      <AppInitializer />
      <GameLayout />
      <IdentityManager />
    </>
  );
}

export default App;
