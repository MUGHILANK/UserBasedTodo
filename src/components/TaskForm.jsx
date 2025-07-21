import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSave, FaSpinner } from 'react-icons/fa';
import { useTask } from '../context/TaskContext';

const TaskForm = ({ task, onClose }) => {
  const [formData, setFormData] = useState({
    taskDetails: '',
    taskStatus: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const { createTask, updateTask, fetchTasks } = useTask();

  // Populate form data when editing existing task
  useEffect(() => {
    if (task) {
      setFormData({
        taskDetails: task.taskDetails || '',
        taskStatus: task.taskStatus || 'pending'
      });
    } else {
      setFormData({
        taskDetails: '',
        taskStatus: 'pending'
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.taskDetails.trim()) {
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (task) {
        // Update existing task
        const taskId = task.id || task.taskId || task.Id || task.TaskId;
        result = await updateTask(taskId, formData);
      } else {
        // Create new task
        result = await createTask(formData);
      }

      if (result.success) {
        // Refresh task list from server
        await fetchTasks();
        onClose();
      }
    } catch (error) {
      // Error handling without logging
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
      >
        <motion.div
          className="modal-content task-form-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header">
            <h3 className="modal-title">
              {task ? '✏️ Edit Task' : '➕ Add New Task'}
            </h3>
            <button 
              className="close-btn" 
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              <FaTimes />
            </button>
          </div>

          {/* Task Form */}
          <form onSubmit={handleSubmit} className="task-form">
            {/* Task Details Input */}
            <div className="form-group">
              <label htmlFor="taskDetails" className="form-label">
                Task Details
              </label>
              <textarea
                id="taskDetails"
                name="taskDetails"
                placeholder="Enter your task details here..."
                value={formData.taskDetails}
                onChange={handleChange}
                required
                disabled={loading}
                rows="4"
                className="form-textarea"
              />
            </div>

            {/* Task Status Select */}
            <div className="form-group">
              <label htmlFor="taskStatus" className="form-label">
                Status
              </label>
              <select
                id="taskStatus"
                name="taskStatus"
                value={formData.taskStatus}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-select"
              >
                <option value="pending">📋 Pending</option>
                <option value="in-progress">⏳ In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-btn"
                disabled={loading || !formData.taskDetails.trim()}
              >
                {loading && <FaSpinner className="spin" />}
                <FaSave />
                {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TaskForm;
