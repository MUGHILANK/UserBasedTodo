import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaSave } from 'react-icons/fa';
import { useTask } from '../context/TaskContext';

const TaskForm = ({ task, onClose }) => {
  const [formData, setFormData] = useState({
    taskDetails: '',
    taskStatus: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const { createTask, updateTask } = useTask();

  useEffect(() => {
    if (task) {
      setFormData({
        taskDetails: task.taskDetails || '',
        taskStatus: task.taskStatus || 'pending'
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (task) {
        result = await updateTask(task.id, formData);
      } else {
        result = await createTask(formData);
      }

      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'Add New Task'}</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label>Task Details</label>
            <textarea
              name="taskDetails"
              placeholder="Enter task details..."
              value={formData.taskDetails}
              onChange={handleChange}
              required
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="taskStatus"
              value={formData.taskStatus}
              onChange={handleChange}
              required
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              <FaSave />
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TaskForm;
