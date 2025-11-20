import React, { useState, useEffect } from "react";
import type { WatchlistProps } from "../../../types/types";

export const Watchlist: React.FC<WatchlistProps> = ({ onSelectTicker }) => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [newTicker, setNewTicker] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("stockWatchlist");
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  const saveWatchlist = (list: string[]) => {
    setWatchlist(list);
    localStorage.setItem("stockWatchlist", JSON.stringify(list));
  };

  const addTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicker && !watchlist.includes(newTicker.toUpperCase())) {
      saveWatchlist([...watchlist, newTicker.toUpperCase()]);
      setNewTicker("");
    }
  };

  const removeTicker = (ticker: string) => {
    saveWatchlist(watchlist.filter((t) => t !== ticker));
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-4 text-white">Watchlist</h3>
      <form onSubmit={addTicker} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          placeholder="Add ticker..."
          className="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-white"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors font-bold"
        >
          Add
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {watchlist.map((ticker) => (
          <div
            key={ticker}
            className="flex items-center bg-gray-700 rounded-full px-3 py-1 border border-gray-600"
          >
            <button
              onClick={() => onSelectTicker(ticker)}
              className="font-bold text-blue-300 hover:text-blue-100 mr-2"
            >
              {ticker}
            </button>
            <button
              onClick={() => removeTicker(ticker)}
              className="text-gray-400 hover:text-red-400 font-bold"
            >
              ×
            </button>
          </div>
        ))}
        {watchlist.length === 0 && (
          <p className="text-gray-500 text-sm">No stocks in watchlist</p>
        )}
      </div>
    </div>
  );
};
