import React from 'react';
import { motion } from 'framer-motion';
import { FaTasks, FaClock, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const TaskStats = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.taskStatus === 'completed').length;
  const pendingTasks = tasks.filter(task => task.taskStatus === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.taskStatus === 'in-progress').length;

  const stats = [
    {
      icon: FaTasks,
      label: 'Total Tasks',
      value: totalTasks,
      color: '#6366f1'
    },
    {
      icon: FaClock,
      label: 'In Progress',
      value: inProgressTasks,
      color: '#f59e0b'
    },
    {
      icon: FaCheck,
      label: 'Completed',
      value: completedTasks,
      color: '#10b981'
    },
    {
      icon: FaExclamationTriangle,
      label: 'Pending',
      value: pendingTasks,
      color: '#ef4444'
    }
  ];

  return (
    <div className="task-stats">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
            <stat.icon />
          </div>
          <div className="stat-content">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TaskStats;
