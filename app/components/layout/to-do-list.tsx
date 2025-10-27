import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface FloatingTodoListProps {
  storageKey: string;
}

export function FloatingTodoList({ storageKey }: FloatingTodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState<string>('');
  const [hidden, setHidden] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setTodos(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(todos));
    }
  }, [todos, storageKey, isLoaded]);

  const add = (): void => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, done: false }]);
      setInput('');
    }
  };

  const toggle = (id: number): void => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const remove = (id: number): void => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-white border border-gray-200 rounded shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Tasks</span>
        <button onClick={() => setHidden(!hidden)} className="text-gray-400 hover:text-gray-600 text-xs">
          {hidden ? 'show' : 'hide'}
        </button>
      </div>

      {!hidden && (
        <div className="p-3">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && add()}
              placeholder="Add task..."
              className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
            />
            <button onClick={add} className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800">
              +
            </button>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {todos.map((todo) => (
              <div key={todo.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggle(todo.id)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className={`flex-1 text-sm ${todo.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {todo.text}
                </span>
                <button
                  onClick={() => remove(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
