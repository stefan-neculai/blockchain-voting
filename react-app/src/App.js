import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Header from './components/Header';
import CreatePoll from './components/CreatePoll';
import PollList from './components/PollList';
import SinglePollPage from './pages/SinglePollPage';

function App() {
  return (
    <Web3Provider>
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<PollList />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/poll/:id" element={<SinglePollPage />} />
            {/* Add other routes here */}
          </Routes>
        </main>
      </Router>
    </Web3Provider>
  );
}

export default App;