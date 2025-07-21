import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import TaskStats from '../components/TaskStats';
import { useTask } from '../context/TaskContext';
import { FaPlus, FaSync } from 'react-icons/fa';

const Dashboard = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { fetchTasks, tasks, loading } = useTask();

  // Initial load
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Auto-refresh mechanism (optional)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchTasks, autoRefresh]);

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = useCallback(async () => {
    setShowTaskForm(false);
    setEditingTask(null);
    
    // Refresh task list when form closes
    await fetchTasks();
  }, [fetchTasks]);

  if (loading && tasks.length === 0) {
    return (
      <div className="dashboard">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>My Tasks</h1>
            <p>Manage your daily tasks efficiently</p>
          </div>
          
          <div className="dashboard-actions">
            {/* Manual refresh button */}
            <motion.button
              className="refresh-btn"
              onClick={handleManualRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              title="Refresh Tasks"
            >
              <FaSync className={loading ? 'spin' : ''} />
            </motion.button>
            
            <motion.button
              className="add-task-btn"
              onClick={handleAddTask}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus /> Add Task
            </motion.button>
          </div>
        </div>

        <TaskStats tasks={tasks} />
        
        <TaskList 
          tasks={tasks}
          onEdit={handleEditTask}
        />

        {showTaskForm && (
          <TaskForm
            task={editingTask}
            onClose={handleCloseForm}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
