import React from 'react';
import { motion } from 'framer-motion';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onEditTask }) => {
  if (!tasks.length) {
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
      <motion.div
        className="task-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            onEdit={() => onEditTask(task)}
            index={index}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default TaskList;
