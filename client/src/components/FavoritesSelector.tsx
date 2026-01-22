/**
 * Favorites Selector Component
 * Dropdown for saving and loading drill-down filter configurations
 */

import React, { useState, useEffect } from 'react';
import { Heart, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getAllFavorites,
  saveFavorite,
  deleteFavorite,
  loadFavorite,
  getMostRecentFavorites,
  DrillDownFavorite,
} from '@/lib/drillDownFavorites';

interface FavoritesSelectorProps {
  filterType: 'pipeline' | 'timeline' | 'leadSource' | 'propertyType' | 'geographic' | 'agent' | 'custom';
  filterValue?: string;
  customFilters?: Record<string, any>;
  onLoadFavorite?: (favorite: DrillDownFavorite) => void;
  onSaveFavorite?: (favorite: DrillDownFavorite) => void;
  title?: string;
}

export default function FavoritesSelector({
  filterType,
  filterValue,
  customFilters,
  onLoadFavorite,
  onSaveFavorite,
  title = 'Favorite',
}: FavoritesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [favoriteDescription, setFavoriteDescription] = useState('');
  const [favorites, setFavorites] = useState<DrillDownFavorite[]>([]);
  const [recentFavorites, setRecentFavorites] = useState<DrillDownFavorite[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const all = getAllFavorites();
    const recent = getMostRecentFavorites(5);
    setFavorites(all);
    setRecentFavorites(recent);
  };

  const handleSaveFavorite = () => {
    if (!favoriteName.trim()) return;

    const favorite = saveFavorite(
      favoriteName,
      filterType,
      filterValue,
      customFilters,
      favoriteDescription
    );

    onSaveFavorite?.(favorite);
    setFavoriteName('');
    setFavoriteDescription('');
    setShowSaveForm(false);
    loadFavorites();
  };

  const handleLoadFavorite = (favorite: DrillDownFavorite) => {
    loadFavorite(favorite.id);
    onLoadFavorite?.(favorite);
    setIsOpen(false);
    loadFavorites();
  };

  const handleDeleteFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFavorite(id);
    loadFavorites();
  };

  const filteredFavorites = favorites.filter(fav => fav.filterType === filterType);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-600 gap-2"
      >
        <Heart className="w-3 h-3" />
        Favorites
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 w-64 z-50">
          {/* Save New Favorite */}
          {!showSaveForm ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSaveForm(true)}
              className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-600 gap-2 mb-3"
            >
              <Plus className="w-3 h-3" />
              Save Current Filter
            </Button>
          ) : (
            <div className="mb-3 p-2 bg-slate-800 rounded border border-slate-700">
              <Input
                placeholder="Favorite name"
                value={favoriteName}
                onChange={(e) => setFavoriteName(e.target.value)}
                className="text-xs mb-2 bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
              <Input
                placeholder="Description (optional)"
                value={favoriteDescription}
                onChange={(e) => setFavoriteDescription(e.target.value)}
                className="text-xs mb-2 bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveFavorite}
                  disabled={!favoriteName.trim()}
                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSaveForm(false)}
                  className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Recent Favorites */}
          {recentFavorites.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-slate-400 mb-2">Recent</div>
              <div className="space-y-1">
                {recentFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => handleLoadFavorite(fav)}
                    className="flex items-center justify-between p-2 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{fav.name}</div>
                      {fav.description && (
                        <div className="text-xs text-slate-500 truncate">{fav.description}</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteFavorite(e, fav.id)}
                      className="p-1 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-400 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Favorites of This Type */}
          {filteredFavorites.length > recentFavorites.length && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">All {filterType}</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => handleLoadFavorite(fav)}
                    className="flex items-center justify-between p-2 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{fav.name}</div>
                      {fav.description && (
                        <div className="text-xs text-slate-500 truncate">{fav.description}</div>
                      )}
                      <div className="text-xs text-slate-600 mt-1">
                        Used {fav.usageCount} times
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteFavorite(e, fav.id)}
                      className="p-1 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-400 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredFavorites.length === 0 && !showSaveForm && (
            <div className="text-xs text-slate-500 text-center py-2">
              No favorites yet. Save your first one!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
