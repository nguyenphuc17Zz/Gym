import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Dumbbell, Moon, Sun, Settings } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import ExerciseCard from './components/ExerciseCard';
import ExerciseModal from './components/ExerciseModal';
import SkeletonCard from './components/SkeletonCard';
import SettingsModal from './components/SettingsModal';
import AIChat from './components/AIChat';
import './index.css';

function App() {
  const [exercises, setExercises] = useState([]);
  const [filters, setFilters] = useState({ categories: [], equipments: [], bodyParts: [] });
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [updatedAiExercise, setUpdatedAiExercise] = useState(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aiModel, setAiModel] = useState('gemini-3.5-flash');

  const { ref, inView } = useInView({
    threshold: 0,
  });
  
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('fitdb_theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    const savedKey = localStorage.getItem('fitai_key');
    if (savedKey) setApiKey(savedKey);
    const savedPrompt = localStorage.getItem('fitai_prompt');
    if (savedPrompt) setPrompt(savedPrompt);
    const savedModel = localStorage.getItem('fitai_model');
    if (savedModel) setAiModel(savedModel);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('fitdb_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSaveSettings = (newKey, newPrompt, newModel) => {
    setApiKey(newKey);
    setPrompt(newPrompt);
    setAiModel(newModel);
    localStorage.setItem('fitai_key', newKey);
    localStorage.setItem('fitai_prompt', newPrompt);
    localStorage.setItem('fitai_model', newModel);
  };

  const handleSaveToDB = async (exercise) => {
    try {
      await axios.post('http://localhost:3001/api/exercises', exercise);
      fetchExercises(true); // reload list
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleExerciseUpdated = (updatedEx) => {
    setSelectedExercise(updatedEx);
    if (!updatedEx.isAiGenerated) {
       fetchExercises(true);
    } else {
       setUpdatedAiExercise(updatedEx);
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/filters');
      setFilters({
        categories: res.data.categories || [],
        equipments: res.data.equipments || [],
        bodyParts: res.data.bodyParts || []
      });
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchExercises = async (isNewFilter = false) => {
    if (isNewFilter) {
      setLoading(true);
      setPage(1);
      setExercises([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = isNewFilter ? 1 : page;
      const res = await axios.get('http://localhost:3001/api/exercises', {
        params: {
          category: selectedCategory,
          equipment: selectedEquipment,
          body_part: selectedBodyPart,
          search,
          page: currentPage,
          limit: 20
        }
      });
      
      const newExercises = res.data.data;
      if (isNewFilter) {
        setExercises(newExercises);
      } else {
        setExercises(prev => [...prev, ...newExercises]);
      }
      
      setHasMore(currentPage < res.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  // Effect for filter changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchExercises(true);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [selectedCategory, selectedEquipment, selectedBodyPart, search]);

  // Effect for infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      setPage(p => p + 1);
    }
  }, [inView, hasMore, loading, loadingMore]);

  useEffect(() => {
    if (page > 1) fetchExercises(false);
  }, [page]);

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleCategoryChange = (e) => setSelectedCategory(e.target.value);
  const handleEquipmentChange = (e) => setSelectedEquipment(e.target.value);
  const handleBodyPartChange = (e) => setSelectedBodyPart(e.target.value);

  const skeletonArray = Array(8).fill(0);

  return (
    <div>
      <header className="header">
        <h1 className="logo">
          <Dumbbell size={28} />
          FitDB <span style={{fontSize: '1rem', marginLeft: '0.5rem', opacity: 0.7}}>V2</span>
        </h1>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <button className="theme-toggle" onClick={() => setShowSettings(true)} aria-label="Settings">
            <Settings size={20} />
          </button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <section className="hero">
        <h2>Discover Your Next Workout</h2>
        <p>Explore over 1,300+ exercises with high-quality animations and step-by-step instructions. Now powered by <strong>Gemini AI</strong>.</p>
        
        <div className="search-container">
          <Search size={22} className="hero-search-icon" />
          <input 
            type="text" 
            className="hero-search" 
            placeholder="Search for exercises (e.g., bench press, squat)..." 
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filters-bar">
          <select className="filter-select" value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">All Categories</option>
            {filters.categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select className="filter-select" value={selectedBodyPart} onChange={handleBodyPartChange}>
            <option value="">All Body Parts</option>
            {filters.bodyParts.map(bp => (
              <option key={bp} value={bp}>{bp}</option>
            ))}
          </select>
          
          <select className="filter-select" value={selectedEquipment} onChange={handleEquipmentChange}>
            <option value="">All Equipment</option>
            {filters.equipments.map(eq => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>
      </section>

      <main className="main-content">
        <div className="grid">
          {exercises.map(exercise => (
            <ExerciseCard 
              key={exercise.id} 
              exercise={exercise} 
              onClick={setSelectedExercise}
            />
          ))}
          {loading && exercises.length === 0 && skeletonArray.map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        
        {!loading && exercises.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
            No exercises found matching your criteria. Try asking FitAI Coach!
          </div>
        )}

        {exercises.length > 0 && hasMore && (
          <div ref={ref} className="bottom-loader">
            {loadingMore && <div className="spinner"></div>}
          </div>
        )}
      </main>

      <ExerciseModal 
        exercise={selectedExercise} 
        onClose={() => setSelectedExercise(null)} 
        onExerciseUpdated={handleExerciseUpdated}
      />

      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          initialApiKey={apiKey}
          initialPrompt={prompt}
          initialModel={aiModel}
        />
      )}

      <AIChat 
        apiKey={apiKey}
        prompt={prompt}
        model={aiModel}
        onExerciseClick={setSelectedExercise}
        onSaveToDB={handleSaveToDB}
        updatedAiExercise={updatedAiExercise}
      />
    </div>
  );
}

export default App;
