import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MainView } from '@/routes/MainView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
