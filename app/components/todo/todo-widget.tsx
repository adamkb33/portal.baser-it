import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface TodoWidgetProps {
  initialTodos?: Todo[];
  storageKey: string;
}

export default function TodoWidget({ initialTodos, storageKey }: TodoWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [todos, setTodos] = useState<Todo[]>(initialTodos ?? []);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage only after mount (client-side)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setTodos(JSON.parse(stored));
    }
    setMounted(true);
  }, [storageKey]);

  // Save to localStorage on change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, JSON.stringify(todos));
    }
  }, [todos, storageKey, mounted]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([...todos, { id: crypto.randomUUID(), text: input, done: false }]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  // Show loading state during SSR and initial hydration
  if (!mounted) {
    return (
      <div className="fixed top-4 right-4 z-50 w-80 border border-border bg-background">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 border border-border bg-foreground text-background px-3 py-2 text-xs font-medium rounded-none"
      >
        TASKS ({todos.filter((t) => !t.done).length})
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-foreground">Tasks</span>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={addTodo} className="border-b border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add task..."
            className="flex-1 border border-border bg-background text-foreground px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="border border-border bg-foreground text-background px-3 py-2 text-xs font-medium rounded-none"
          >
            ADD
          </button>
        </div>
      </form>

      <div className="max-h-96 overflow-y-auto divide-y divide-border">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-start gap-3 p-4 hover:bg-muted">
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
              className="mt-0.5 h-4 w-4 border-border rounded-none"
            />
            <span className={`flex-1 text-sm ${todo.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-2 bg-muted">
        <p className="text-[0.7rem] text-muted-foreground">
          {todos.filter((t) => !t.done).length} active · {todos.filter((t) => t.done).length} done
        </p>
      </div>
    </div>
  );
}
