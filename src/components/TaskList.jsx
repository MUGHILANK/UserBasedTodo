import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTrash, FaEdit, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useTask } from '../context/TaskContext';

const TaskList = ({ tasks, onEdit }) => {
  const { deleteTask, completeTask } = useTask();

  const handleDelete = async (taskId) => {
    console.log('🗑️ Delete button clicked for task:', taskId);
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const handleComplete = async (task) => {
    // Debug: Log the entire task object to see what fields are available
    console.log('✅ Complete button clicked for task:', task);
    console.log('📋 Available task fields:', Object.keys(task));
    
    // Try different possible ID field names from your backend
    const taskId = task.id || task.taskId || task.Id || task.TaskId;
    console.log('🔍 Extracted task ID:', taskId);
    
    if (!taskId) {
      console.error('❌ No valid task ID found in task object:', task);
      return;
    }
    
    await completeTask(taskId);
  };

  const handleEdit = (task) => {
    console.log('✏️ Edit button clicked for task:', task);
    const taskId = task.id || task.taskId || task.Id || task.TaskId;
    console.log('🔍 Task ID for edit:', taskId);
    onEdit(task);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <FaCheck className="status-icon completed" />;
      case 'in-progress':
        return <FaClock className="status-icon in-progress" />;
      default:
        return <FaExclamationTriangle className="status-icon pending" />;
    }
  };

  const getStatusClass = (status) => {
    return `task-card ${status?.toLowerCase() || 'pending'}`;
  };

  if (!tasks || tasks.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="empty-content">
          <h3>No tasks yet</h3>
          <p>Create your first task to get started</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="task-list">
      <div className="task-grid">
        {tasks.map((task, index) => {
          // Debug: Log each task to see its structure
          console.log(`Task ${index}:`, task);
          
          // Get task ID using multiple possible field names
          const taskId = task.id || task.taskId || task.Id || task.TaskId;
          
          return (
            <motion.div
              key={taskId || `task-${index}`} // ✅ Fixed: Use taskId or fallback
              className={getStatusClass(task.taskStatus)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="task-header">
                <div className="task-status">
                  {getStatusIcon(task.taskStatus)}
                  <span className="status-text">
                    {task.taskStatus || 'pending'}
                  </span>
                </div>
              </div>
              
              <div className="task-content">
                <h3 className="task-title">{task.taskDetails}</h3>
                {task.priority && (
                  <p className="task-priority">Priority: {task.priority}</p>
                )}
                {task.dueDate && (
                  <p className="task-due-date">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                )}
                <p className="task-id-debug">ID: {taskId || 'No ID found'}</p>
              </div>
              
              <div className="task-actions">
                {task.taskStatus?.toLowerCase() !== 'completed' && (
                  <motion.button
                    className="complete-btn"
                    onClick={() => handleComplete(task)} // ✅ Fixed: Pass entire task object
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Mark as complete"
                  >
                    <FaCheck />
                  </motion.button>
                )}
                <motion.button
                  className="edit-btn"
                  onClick={() => handleEdit(task)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Edit task"
                >
                  <FaEdit />
                </motion.button>
                <motion.button
                  className="delete-btn"
                  onClick={() => handleDelete(taskId)} // ✅ Fixed: Pass taskId
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Delete task"
                >
                  <FaTrash />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;
