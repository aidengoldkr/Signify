import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MainView } from '@/routes/MainView';
import { STTView } from '@/routes/STTView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/stt" element={<STTView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
