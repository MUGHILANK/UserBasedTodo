import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';

const TaskContext = createContext();

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
      
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
      
    case 'UPDATE_TASK':
      const updatedTasks = state.tasks.map(task => {
        // Handle different ID field names
        const taskId = task.id || task.taskId || task.Id || task.TaskId;
        const payloadId = action.payload.id || action.payload.taskId || action.payload.Id || action.payload.TaskId;
        
        if (taskId === payloadId) {
          return { ...task, ...action.payload };
        }
        return task;
      });
      return { ...state, tasks: updatedTasks };
      
    case 'DELETE_TASK':
      const filteredTasks = state.tasks.filter(task => {
        const taskId = task.id || task.taskId || task.Id || task.TaskId;
        return taskId !== action.payload;
      });
      return { ...state, tasks: filteredTasks };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
      
    default:
      return state;
  }
};

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    loading: false,
    error: null
  });

  // Helper function to extract task ID from different possible field names
  const getTaskId = (task) => {
    const id = task.id || task.taskId || task.Id || task.TaskId || task._id;
    return id;
  };

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await taskAPI.getAllTasks();
      
      // Ensure we have an array
      const tasks = Array.isArray(response.data) ? response.data : [];
      
      dispatch({ type: 'SET_TASKS', payload: tasks });
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch tasks';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  }, []);

  // Create a new task
  const createTask = async (taskData) => {
    try {
      const response = await taskAPI.createTask(taskData);
      
      // Handle different response structures
      let newTask = response.data;
      
      // If response has nested data structure
      if (response.data?.data) {
        newTask = response.data.data;
      }
      
      // Ensure the task has required fields
      if (!newTask.taskDetails) {
        newTask = { ...taskData, ...newTask };
      }
      
      // Ensure task has an ID for proper display
      const taskId = getTaskId(newTask);
      if (!taskId) {
        newTask.id = `temp-${Date.now()}`;
      }
      
      // Add to local state immediately
      dispatch({ type: 'ADD_TASK', payload: newTask });
      
      // Refresh from server to ensure consistency
      setTimeout(() => {
        fetchTasks();
      }, 500);
      
      toast.success('Task created successfully!');
      return { success: true, data: newTask };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update an existing task
  const updateTask = async (taskId, updateData) => {
    // Validate taskId
    if (!taskId || taskId === 'undefined' || taskId === 'null') {
      toast.error('Invalid task ID provided');
      return { success: false, error: 'Invalid task ID' };
    }
    
    try {
      const response = await taskAPI.updateTask(taskId, updateData);
      
      let updatedTask = response.data;
      
      // If response has nested data structure
      if (response.data?.data) {
        updatedTask = response.data.data;
      }
      
      // Ensure the updated task has an ID
      const updatedTaskId = getTaskId(updatedTask);
      if (!updatedTaskId) {
        updatedTask = { ...updatedTask, id: taskId };
      }
      
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      
      // Refresh from server after update
      setTimeout(() => {
        fetchTasks();
      }, 300);
      
      toast.success('Task updated successfully!');
      return { success: true, data: updatedTask };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    // Validate taskId
    if (!taskId || taskId === 'undefined' || taskId === 'null') {
      toast.error('Invalid task ID provided');
      return { success: false, error: 'Invalid task ID' };
    }
    
    try {
      const response = await taskAPI.deleteTask(taskId);
      
      dispatch({ type: 'DELETE_TASK', payload: taskId });
      
      // Refresh from server after delete
      setTimeout(() => {
        fetchTasks();
      }, 300);
      
      toast.success('Task deleted successfully!');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Mark task as complete
  const completeTask = async (taskId) => {
    // Validate taskId
    if (!taskId || taskId === 'undefined' || taskId === 'null') {
      toast.error('Invalid task ID provided');
      return { success: false, error: 'Invalid task ID' };
    }
    
    try {
      // Find the task in current state
      const task = state.tasks.find(t => {
        const id = getTaskId(t);
        return id === taskId;
      });
      
      if (!task) {
        toast.error('Task not found');
        return { success: false, error: 'Task not found' };
      }
      
      // Prepare update data
      const updateData = {
        taskDetails: task.taskDetails,
        taskStatus: 'completed'
      };
      
      // Use the updateTask function
      const result = await updateTask(taskId, updateData);
      
      if (result.success) {
        toast.success('Task marked as complete!');
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error.message || 'Failed to complete task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Toggle task status (pending <-> completed)
  const toggleTaskStatus = async (taskId) => {
    try {
      // Find the task in current state
      const task = state.tasks.find(t => {
        const id = getTaskId(t);
        return id === taskId;
      });
      
      if (!task) {
        toast.error('Task not found');
        return { success: false, error: 'Task not found' };
      }
      
      // Toggle status
      const newStatus = task.taskStatus === 'completed' ? 'pending' : 'completed';
      
      const updateData = {
        taskDetails: task.taskDetails,
        taskStatus: newStatus
      };
      
      const result = await updateTask(taskId, updateData);
      
      if (result.success) {
        toast.success(`Task marked as ${newStatus}!`);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error.message || 'Failed to toggle task status';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get task by ID
  const getTaskById = (taskId) => {
    const task = state.tasks.find(t => {
      const id = getTaskId(t);
      return id === taskId;
    });
    
    return task;
  };

  // Get tasks by status
  const getTasksByStatus = (status) => {
    const filteredTasks = state.tasks.filter(task => 
      task.taskStatus?.toLowerCase() === status?.toLowerCase()
    );
    
    return filteredTasks;
  };

  // Force refresh from server
  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  // Clear all tasks (local state only)
  const clearTasks = () => {
    dispatch({ type: 'SET_TASKS', payload: [] });
  };

  // Get task statistics
  const getTaskStats = () => {
    const stats = {
      total: state.tasks.length,
      completed: state.tasks.filter(t => t.taskStatus?.toLowerCase() === 'completed').length,
      pending: state.tasks.filter(t => t.taskStatus?.toLowerCase() === 'pending' || !t.taskStatus).length,
      inProgress: state.tasks.filter(t => t.taskStatus?.toLowerCase() === 'in-progress').length
    };
    
    return stats;
  };

  const contextValue = {
    // State
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    
    // Actions
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    toggleTaskStatus,
    refreshTasks,
    clearTasks,
    
    // Utilities
    getTaskById,
    getTasksByStatus,
    getTaskId,
    getTaskStats,
    
    // Stats (computed)
    totalTasks: state.tasks.length,
    completedTasks: state.tasks.filter(t => t.taskStatus?.toLowerCase() === 'completed').length,
    pendingTasks: state.tasks.filter(t => t.taskStatus?.toLowerCase() === 'pending' || !t.taskStatus).length,
    inProgressTasks: state.tasks.filter(t => t.taskStatus?.toLowerCase() === 'in-progress').length
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export default TaskContext;
