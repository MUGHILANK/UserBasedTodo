import React from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaTrash, FaClock, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useTask } from '../context/TaskContext';

const TaskItem = ({ task, onEdit, index }) => {
  const { deleteTask } = useTask();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheck className="status-icon completed" />;
      case 'in-progress':
        return <FaClock className="status-icon in-progress" />;
      default:
        return <FaExclamationTriangle className="status-icon pending" />;
    }
  };

  const getStatusClass = (status) => {
    return `task-card ${status}`;
  };

  return (
    <motion.div
      className={getStatusClass(task.taskStatus)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="task-header">
        <div className="task-status">
          {getStatusIcon(task.taskStatus)}
          <span className="status-text">{task.taskStatus}</span>
        </div>
      </div>
      
      <div className="task-content">
        <p className="task-details">{task.taskDetails}</p>
      </div>
      
      <div className="task-actions">
        <motion.button
          className="edit-btn"
          onClick={onEdit}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaEdit />
        </motion.button>
        <motion.button
          className="delete-btn"
          onClick={handleDelete}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaTrash />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TaskItem;
