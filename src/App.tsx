import './App.css'
import { NewsList } from './components/NewsList';

function App() {
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>最新ニュース</h1>
      <NewsList />
    </div>
  );
}

export default App
