'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { CheckSquare, Square, Trash2, Plus, Target, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function TodosPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('completed', { ascending: true })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const { error } = await supabase.from('todos').insert([{
        title: newTodo,
        due_date: dueDate || null,
        priority
      }]);

      if (error) throw error;
      setNewTodo('');
      setDueDate('');
      setPriority('medium');
      fetchTodos();
    } catch (error) {
      console.error('Add error:', error);
      alert('Hedef eklenirken hata oluştu');
    }
  }

  async function toggleTodo(id: string, completed: boolean) {
    try {
      const { error } = await supabase.from('todos').update({ completed: !completed }).eq('id', id);
      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  }

  async function deleteTodo(id: string) {
    if (!confirm('Bu hedefi silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  const priorityConfig: Record<string, { color: string; border: string; label: string }> = {
    high: { color: 'text-red-400', border: 'border-red-500/30 bg-red-500/5', label: 'Yüksek' },
    medium: { color: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/5', label: 'Orta' },
    low: { color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/5', label: 'Düşük' }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-pink-500 w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.4em] text-pink-500 uppercase">Objective Tracker</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black bg-gradient-to-r from-white via-white/80 to-white/20 bg-clip-text text-transparent tracking-tighter">
            Hedefler
          </h1>
        </motion.div>

        {/* Add Form */}
        <motion.form
          onSubmit={addTodo}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative group mb-10"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-gray-950/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 space-y-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Yeni hedef ekle..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-pink-500/50 transition-all"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-pink-500/50 transition-all"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none appearance-none"
              >
                <option value="low" className="bg-gray-900">Düşük</option>
                <option value="medium" className="bg-gray-900">Orta</option>
                <option value="high" className="bg-gray-900">Yüksek</option>
              </select>
              <button
                type="submit"
                className="px-6 py-2 bg-pink-500 hover:bg-pink-400 text-black rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Plus size={16} /> EKLE
              </button>
            </div>
          </div>
        </motion.form>

        {/* Todos */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 text-gray-600">
              <Target size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium uppercase tracking-widest">Henüz hedef yok</p>
              <p className="text-xs font-light mt-1">Yukarıdan yeni bir hedef ekle.</p>
            </motion.div>
          ) : (
            todos.map((todo, idx) => {
              const config = priorityConfig[todo.priority] || priorityConfig.medium;
              return (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`group flex items-center gap-4 p-4 rounded-2xl border-l-4 ${config.border} hover:bg-white/[0.03] transition-all duration-300`}
                >
                  <button onClick={() => toggleTodo(todo.id, todo.completed)} className="flex-shrink-0">
                    {todo.completed ? (
                      <CheckSquare className="text-emerald-500" size={22} />
                    ) : (
                      <Square className="text-gray-600 hover:text-white transition-colors" size={22} />
                    )}
                  </button>

                  <div className="flex-1">
                    <p className={`font-bold ${todo.completed ? 'line-through text-gray-600' : 'text-white'}`}>
                      {todo.title}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${config.color}`}>
                        {config.label}
                      </span>
                      {todo.due_date && (
                        <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                          {format(new Date(todo.due_date), 'dd MMM yyyy', { locale: tr })}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 transition p-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                  >
                    <Trash2 className="text-red-400" size={16} />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
