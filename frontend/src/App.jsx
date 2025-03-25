import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'materialize-css/dist/css/materialize.min.css';
import M from 'materialize-css';
import "./App.css";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

function App() {
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [taskCounts, setTaskCounts] = useState({ pending: 0, inProgress: 0, completed: 0, failed: 0 });
  const [taskStream, setTaskStream] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [workerStatus, setWorkerStatus] = useState('idle');
  const [schedulingAlgorithm, setSchedulingAlgorithm] = useState('FIFO');

  useEffect(() => {
    M.AutoInit();
    fetchTaskStatus();
    fetchWorkerStatus();
    const interval = setInterval(() => {
      fetchTaskStatus();
      fetchWorkerStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTaskStatus = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data.tasks || []);
      setTaskCounts({
        pending: response.data.pending || 0,
        inProgress: response.data.inProgress || 0,
        completed: response.data.completed || 0,
        failed: response.data.failed || 0,
      });
    } catch (error) {
      console.error('Error fetching task status:', error);
    }
  };

  const fetchWorkerStatus = async () => {
    try {
      const response = await axios.get('/api/workers');
      setWorkers(response.data || []);
    } catch (error) {
      console.error('Error fetching worker status:', error);
    }
  };

  const handleTaskStreamChange = (e) => {
    setTaskStream(e.target.value);
  };

  const handleWorkerNameChange = (e) => {
    setWorkerName(e.target.value);
  };

  const handleSchedulingAlgorithmChange = (e) => {
    setSchedulingAlgorithm(e.target.value);
  };

  const handleSubmitTaskStream = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/tasks?schedulingMechanism=${schedulingAlgorithm}`, { taskStream });
      setTaskStream('');
      fetchTaskStatus();
    } catch (error) {
      console.error('Error submitting task stream:', error);
    }
  };

  const handleSubmitWorker = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/workers', { name: workerName });
      setWorkerName('');
      fetchWorkerStatus();
    } catch (error) {
      console.error('Error adding worker:', error);
    }
  };

  return (
    <div className="app-container">
      <div className="content">
        <h1 className="center-align">Queued Task Distribution</h1>
        <form onSubmit={handleSubmitTaskStream} style={{ marginBottom: '20px' }}>
          <div className="input-field">
            <input
              type="text"
              id="taskStream"
              value={taskStream}
              onChange={handleTaskStreamChange}
              placeholder="Enter task stream (e.g., 2-CPU, 1-IO, 2-CPU)"
            />
            <label htmlFor="taskStream">Task Stream</label>
          </div>
          <div className="input-field">
            <select id="schedulingAlgorithm" value={schedulingAlgorithm} onChange={handleSchedulingAlgorithmChange}>
              <option value="FIFO">FIFO</option>
              <option value="RoundRobin">Round Robin</option>
              <option value="LRU">LRU</option>
            </select>
            <label htmlFor="schedulingAlgorithm">Scheduling Algorithm</label>
          </div>
          <button type="submit" className="btn">Submit Task Stream</button>
        </form>
        <form onSubmit={handleSubmitWorker} style={{ marginBottom: '20px' }}>
          <div className="input-field">
            <input
              type="text"
              id="workerName"
              value={workerName}
              onChange={handleWorkerNameChange}
              placeholder="Enter worker name"
            />
            <label htmlFor="workerName">Worker Name</label>
          </div>
          <button type="submit" className="btn">Add Worker</button>
        </form>
        <div className="task-status" style={{ marginBottom: '20px' }}>
          <h2>Task Status</h2>
          <table className="striped">
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pending</td>
                <td>{taskCounts.pending}</td>
              </tr>
              <tr>
                <td>In Progress</td>
                <td>{taskCounts.inProgress}</td>
              </tr>
              <tr>
                <td>Completed</td>
                <td>{taskCounts.completed}</td>
              </tr>
              <tr>
                <td>Failed</td>
                <td>{taskCounts.failed}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="worker-status" style={{ marginBottom: '20px' }}>
          <h2>Worker Status</h2>
          <ul>
            {Array.isArray(workers) && workers.map((worker, index) => (
              <li key={index}>{worker.name}: {worker.status}</li>
            ))}
          </ul>
        </div>
        <div className="chart" style={{ height: '400px', marginBottom: '20px' }}>
          <h2>Task Progress Chart</h2>
          <Line
            data={{
              labels: ['Pending', 'In Progress', 'Completed', 'Failed'],
              datasets: [
                {
                  label: 'Tasks',
                  data: [taskCounts.pending, taskCounts.inProgress, taskCounts.completed, taskCounts.failed],
                  backgroundColor: 'rgba(75,192,192,0.4)',
                  borderColor: 'rgba(75,192,192,1)',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              animation: {
                duration: 2000,
                easing: 'easeInOutQuart',
              },
            }}
          />
        </div>
        <div className="pending-tasks" style={{ marginTop: '20px', overflowY: 'auto', maxHeight: '200px' }}>
          <h2>Pending Tasks</h2>
          <table className="striped">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Task Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.filter(task => task.status === 'pending').map((task, index) => (
                <tr key={index}>
                  <td>{task.id}</td>
                  <td>{task.description}</td>
                  <td>{task.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;