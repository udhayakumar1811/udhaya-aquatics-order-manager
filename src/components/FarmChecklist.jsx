import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const DEFAULT_TASKS = [
  { id: 'task_1', title: 'Check Water Temperature & TDS levels in breeding tubs', category: 'Water Quality' },
  { id: 'task_2', title: 'Perform 20-30% Water change for growing fry tubs', category: 'Water Quality' },
  { id: 'task_3', title: 'Feed Moina and Yeast solution to Guppy fry batches', category: 'Feeding' },
  { id: 'task_4', title: 'Feed adult Guppy varieties (High protein pellets / flakes)', category: 'Feeding' },
  { id: 'task_5', title: 'Check Green Shade Net coverage & rooftop tub protection', category: 'Farm Maintenance' },
  { id: 'task_6', title: 'Inspect for any sick fish or mortality and isolate if needed', category: 'Health Check' },
  { id: 'task_7', title: 'Check inventory levels for packaging boxes, oxygen, and medicine', category: 'Inventory' },
  { id: 'task_8', title: 'Pack and dispatch pending customer orders / update tracking IDs', category: 'Dispatch' }
];

export default function FarmChecklist() {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch checklist status for selected date
  useEffect(() => {
    const fetchChecklist = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'farmChecklists', selectedDate);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompletedTasks(data.completedTasks || {});
          setNotes(data.notes || '');
        } else {
          setCompletedTasks({});
          setNotes('');
        }
      } catch (error) {
        console.error("Error fetching checklist:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChecklist();
  }, [selectedDate]);

  const handleToggleTask = async (taskId) => {
    const updatedStatus = {
      ...completedTasks,
      [taskId]: !completedTasks[taskId]
    };
    setCompletedTasks(updatedStatus);

    try {
      const docRef = doc(db, 'farmChecklists', selectedDate);
      await setDoc(docRef, {
        date: selectedDate,
        completedTasks: updatedStatus,
        notes,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating task status:", error);
      showToast('Could not save task status.', 'error');
    }
  };

  const handleSaveNotes = async () => {
    try {
      const docRef = doc(db, 'farmChecklists', selectedDate);
      await setDoc(docRef, {
        date: selectedDate,
        completedTasks,
        notes,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast('Farm notes updated successfully.', 'success');
    } catch (error) {
      console.error("Error saving notes:", error);
      showToast('Could not save notes.', 'error');
    }
  };

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalCount = DEFAULT_TASKS.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daily Farm Task Checklist</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track daily aquatic maintenance, water parameters, feeding, and shipping tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-600">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">TODAY'S COMPLETION STATUS</p>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{completedCount} of {totalCount} Tasks Completed</h3>
        </div>
        <div className="w-full md:w-64 space-y-1">
          <div className="flex justify-between text-xs font-bold text-gray-600">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading tasks...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {DEFAULT_TASKS.map((task) => {
            const isDone = !!completedTasks[task.id];
            return (
              <div 
                key={task.id} 
                onClick={() => handleToggleTask(task.id)}
                className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-gray-50 ${isDone ? 'bg-emerald-50/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {isDone && '✓'}
                  </div>
                  <div>
                    <p className={`font-semibold text-gray-900 ${isDone ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{task.category}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {isDone ? 'Completed' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Notes Section */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Farm Supervisor Daily Notes / Observations</h2>
        <textarea
          rows="3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Record water parameter readings (e.g. TDS 280, pH 7.4), weather conditions, or medicine treatments..."
          className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}