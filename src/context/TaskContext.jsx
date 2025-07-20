import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';

const TaskContext = createContext();

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      console.log('🔄 TaskReducer: SET_LOADING -', action.payload);
      return { ...state, loading: action.payload };
      
    case 'SET_TASKS':
      console.log('📋 TaskReducer: SET_TASKS - Count:', action.payload.length);
      console.log('📋 Tasks data:', action.payload);
      return { ...state, tasks: action.payload, loading: false };
      
    case 'ADD_TASK':
      console.log('➕ TaskReducer: ADD_TASK -', action.payload);
      return { ...state, tasks: [...state.tasks, action.payload] };
      
    case 'UPDATE_TASK':
      console.log('📝 TaskReducer: UPDATE_TASK -', action.payload);
      const updatedTasks = state.tasks.map(task => {
        // Handle different ID field names
        const taskId = task.id || task.taskId || task.Id || task.TaskId;
        const payloadId = action.payload.id || action.payload.taskId || action.payload.Id || action.payload.TaskId;
        
        if (taskId === payloadId) {
          console.log('✅ Task updated:', { old: task, new: action.payload });
          return { ...task, ...action.payload };
        }
        return task;
      });
      return { ...state, tasks: updatedTasks };
      
    case 'DELETE_TASK':
      console.log('🗑️ TaskReducer: DELETE_TASK -', action.payload);
      const filteredTasks = state.tasks.filter(task => {
        const taskId = task.id || task.taskId || task.Id || task.TaskId;
        return taskId !== action.payload;
      });
      console.log('📊 Tasks after delete:', filteredTasks.length, 'remaining');
      return { ...state, tasks: filteredTasks };
      
    case 'SET_ERROR':
      console.error('❌ TaskReducer: SET_ERROR -', action.payload);
      return { ...state, error: action.payload, loading: false };
      
    default:
      console.warn('⚠️ TaskReducer: Unknown action type -', action.type);
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
    console.log('🔍 getTaskId called with task:', task);
    console.log('🔍 Extracted ID:', id);
    return id;
  };

  // Helper function to log API responses
  const logApiResponse = (operation, response) => {
    console.log(`📥 ${operation} Response:`, response);
    console.log(`📥 ${operation} Response Data:`, response?.data);
    console.log(`📥 ${operation} Response Status:`, response?.status);
  };

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    console.log('🔄 fetchTasks: Starting to fetch tasks...');
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('📡 fetchTasks: Making API call...');
      const response = await taskAPI.getAllTasks();
      logApiResponse('FETCH_TASKS', response);
      
      // Ensure we have an array
      const tasks = Array.isArray(response.data) ? response.data : [];
      
      // Log each task structure for debugging
      tasks.forEach((task, index) => {
        console.log(`📋 Task ${index}:`, task);
        console.log(`🔑 Task ${index} ID:`, getTaskId(task));
      });
      
      dispatch({ type: 'SET_TASKS', payload: tasks });
      console.log('✅ fetchTasks: Successfully fetched', tasks.length, 'tasks');
      
    } catch (error) {
      console.error('❌ fetchTasks: Error occurred:', error);
      console.error('❌ fetchTasks: Error response:', error.response?.data);
      console.error('❌ fetchTasks: Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch tasks';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  }, []);

  // Create a new task - ✅ UPDATED WITH AUTO-REFRESH
  const createTask = async (taskData) => {
    console.log('🔄 createTask: Starting to create task...');
    console.log('📝 createTask: Task data:', taskData);
    
    try {
      console.log('📡 createTask: Making API call...');
      const response = await taskAPI.createTask(taskData);
      logApiResponse('CREATE_TASK', response);
      
      // Handle different response structures
      let newTask = response.data;
      
      // If response has nested data structure
      if (response.data?.data) {
        newTask = response.data.data;
      }
      
      // Ensure the task has required fields
      if (!newTask.taskDetails) {
        console.warn('⚠️ createTask: Response missing taskDetails, using original data');
        newTask = { ...taskData, ...newTask };
      }
      
      // Ensure task has an ID for proper display
      const taskId = getTaskId(newTask);
      if (!taskId) {
        console.warn('⚠️ createTask: New task missing ID, generating temporary one');
        newTask.id = `temp-${Date.now()}`;
      }
      
      console.log('✅ createTask: New task created:', newTask);
      console.log('🔑 createTask: New task ID:', getTaskId(newTask));
      
      // ✅ ADD TO LOCAL STATE IMMEDIATELY
      dispatch({ type: 'ADD_TASK', payload: newTask });
      
      // ✅ REFRESH FROM SERVER TO ENSURE CONSISTENCY
      console.log('🔄 createTask: Refreshing task list from server...');
      setTimeout(() => {
        fetchTasks(); // Refresh after a short delay
      }, 500);
      
      toast.success('Task created successfully!');
      return { success: true, data: newTask };
      
    } catch (error) {
      console.error('❌ createTask: Error occurred:', error);
      console.error('❌ createTask: Error response:', error.response?.data);
      console.error('❌ createTask: Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 'Failed to create task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update an existing task
  const updateTask = async (taskId, updateData) => {
    console.log('🔄 updateTask: Starting to update task...');
    console.log('🔑 updateTask: Task ID:', taskId);
    console.log('📝 updateTask: Update data:', updateData);
    
    // Validate taskId
    if (!taskId || taskId === 'undefined' || taskId === 'null') {
      console.error('❌ updateTask: Invalid task ID provided:', taskId);
      toast.error('Invalid task ID provided');
      return { success: false, error: 'Invalid task ID' };
    }
    
    try {
      console.log('📡 updateTask: Making API call...');
      const response = await taskAPI.updateTask(taskId, updateData);
      logApiResponse('UPDATE_TASK', response);
      
      let updatedTask = response.data;
      
      // If response has nested data structure
      if (response.data?.data) {
        updatedTask = response.data.data;
      }
      
      // Ensure the updated task has an ID
      const updatedTaskId = getTaskId(updatedTask);
      if (!updatedTaskId) {
        console.warn('⚠️ updateTask: Response missing ID, using original taskId');
        updatedTask = { ...updatedTask, id: taskId };
      }
      
      console.log('✅ updateTask: Task updated successfully:', updatedTask);
      
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      
      // ✅ REFRESH FROM SERVER AFTER UPDATE
      console.log('🔄 updateTask: Refreshing task list from server...');
      setTimeout(() => {
        fetchTasks();
      }, 300);
      
      toast.success('Task updated successfully!');
      return { success: true, data: updatedTask };
      
    } catch (error) {
      console.error('❌ updateTask: Error occurred:', error);
      console.error('❌ updateTask: Error response:', error.response?.data);
      console.error('❌ updateTask: Error status:', error.response?.status);
      console.error('❌ updateTask: Request URL:', error.config?.url);
      
      const errorMessage = error.response?.data?.message || 'Failed to update task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    console.log('🔄 deleteTask: Starting to delete task...');
    console.log('🔑 deleteTask: Task ID:', taskId);
    
    // Validate taskId
    if (!taskId || taskId === 'undefined' || taskId === 'null') {
      console.error('❌ deleteTask: Invalid task ID provided:', taskId);
      toast.error('Invalid task ID provided');
      return { success: false, error: 'Invalid task ID' };
    }
    
    try {
      console.log('📡 deleteTask: Making API call...');
      const response = await taskAPI.deleteTask(taskId);
      logApiResponse('DELETE_TASK', response);
      
      console.log('✅ deleteTask: Task deleted successfully');
      
      dispatch({ type: 'DELETE_TASK', payload: taskId });
      
      // ✅ REFRESH FROM SERVER AFTER DELETE
      console.log('🔄 deleteTask: Refreshing task list from server...');
      setTimeout(() => {
        fetchTasks();
      }, 300);
      
      toast.success('Task deleted successfully!');
      return { success: true };
      
    } catch (error) {
      console.error('❌ deleteTask: Error occurred:', error);
      console.error('❌ deleteTask: Error response:', error.response?.data);
      console.error('❌ deleteTask: Error status:', error.response?.status);
      console.error('❌ deleteTask: Request URL:', error.config?.url);
      
      const errorMessage = error.response?.data?.message || 'Failed to delete task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Mark task as complete
  const completeTask = async (taskId) => {
    console.log('🔄 completeTask: Starting to complete task...');
    console.log('🔑 completeTask: Task ID:', taskId);
    
    // Validate taskId
    if (!taskId || taskId === 'undefined' || taskId === 'null') {
      console.error('❌ completeTask: Invalid task ID provided:', taskId);
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
        console.error('❌ completeTask: Task not found in state for ID:', taskId);
        console.log('📋 completeTask: Available tasks:', state.tasks.map(t => ({
          task: t,
          id: getTaskId(t)
        })));
        toast.error('Task not found');
        return { success: false, error: 'Task not found' };
      }
      
      console.log('📋 completeTask: Found task to complete:', task);
      
      // Prepare update data
      const updateData = {
        taskDetails: task.taskDetails,
        taskStatus: 'completed'
      };
      
      console.log('📝 completeTask: Update data:', updateData);
      
      // Use the updateTask function
      const result = await updateTask(taskId, updateData);
      
      if (result.success) {
        console.log('✅ completeTask: Task marked as complete successfully');
        toast.success('Task marked as complete!');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ completeTask: Error occurred:', error);
      const errorMessage = error.message || 'Failed to complete task';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Toggle task status (pending <-> completed)
  const toggleTaskStatus = async (taskId) => {
    console.log('🔄 toggleTaskStatus: Starting to toggle task status...');
    console.log('🔑 toggleTaskStatus: Task ID:', taskId);
    
    try {
      // Find the task in current state
      const task = state.tasks.find(t => {
        const id = getTaskId(t);
        return id === taskId;
      });
      
      if (!task) {
        console.error('❌ toggleTaskStatus: Task not found in state for ID:', taskId);
        toast.error('Task not found');
        return { success: false, error: 'Task not found' };
      }
      
      // Toggle status
      const newStatus = task.taskStatus === 'completed' ? 'pending' : 'completed';
      
      const updateData = {
        taskDetails: task.taskDetails,
        taskStatus: newStatus
      };
      
      console.log('📝 toggleTaskStatus: Toggling from', task.taskStatus, 'to', newStatus);
      
      const result = await updateTask(taskId, updateData);
      
      if (result.success) {
        toast.success(`Task marked as ${newStatus}!`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ toggleTaskStatus: Error occurred:', error);
      const errorMessage = error.message || 'Failed to toggle task status';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get task by ID
  const getTaskById = (taskId) => {
    console.log('🔍 getTaskById: Searching for task with ID:', taskId);
    
    const task = state.tasks.find(t => {
      const id = getTaskId(t);
      return id === taskId;
    });
    
    console.log('🔍 getTaskById: Found task:', task);
    return task;
  };

  // Get tasks by status
  const getTasksByStatus = (status) => {
    console.log('📊 getTasksByStatus: Filtering tasks by status:', status);
    
    const filteredTasks = state.tasks.filter(task => 
      task.taskStatus?.toLowerCase() === status?.toLowerCase()
    );
    
    console.log('📊 getTasksByStatus: Found', filteredTasks.length, 'tasks with status:', status);
    return filteredTasks;
  };

  // Force refresh from server
  const refreshTasks = useCallback(async () => {
    console.log('🔄 refreshTasks: Force refreshing tasks from server...');
    await fetchTasks();
  }, [fetchTasks]);

  // Clear all tasks (local state only)
  const clearTasks = () => {
    console.log('🗑️ clearTasks: Clearing all tasks from local state');
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
    
    console.log('📊 getTaskStats: Current statistics:', stats);
    return stats;
  };

  // Log state changes for debugging
  React.useEffect(() => {
    console.log('🔄 TaskContext State Changed:', {
      taskCount: state.tasks.length,
      loading: state.loading,
      error: state.error,
      tasks: state.tasks.map(task => ({
        id: getTaskId(task),
        taskDetails: task.taskDetails?.substring(0, 30) + '...',
        taskStatus: task.taskStatus
      }))
    });
  }, [state.tasks, state.loading, state.error]);

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
