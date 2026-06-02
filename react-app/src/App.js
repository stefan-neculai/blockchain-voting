import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Header from './components/Header';
import CreatePoll from './components/CreatePoll';
import PollList from './components/PollList';
import SinglePollPage from './pages/SinglePollPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <div className="container">
              <Routes>
                <Route path="/" element={<PollList />} />
                <Route path="/create" element={<CreatePoll />} />
                <Route path="/poll/:id" element={<SinglePollPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;