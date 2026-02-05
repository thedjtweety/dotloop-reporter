import { useState } from 'react';
import { Bookmark, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { saveBookmark, getBookmarks, deleteBookmark, FilterBookmark } from '@/lib/bookmarkUtils';

interface BookmarkManagerProps {
  type: 'transaction' | 'pipeline';
  currentFilters: any;
  onLoadBookmark: (bookmark: FilterBookmark) => void;
}

export default function BookmarkManager({ type, currentFilters, onLoadBookmark }: BookmarkManagerProps) {
  const [bookmarks, setBookmarks] = useState<FilterBookmark[]>(() => getBookmarks(type));
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');

  const handleSaveBookmark = () => {
    if (!bookmarkName.trim()) return;

    const newBookmark = saveBookmark({
      name: bookmarkName,
      type,
      filters: currentFilters,
    });

    setBookmarks(prev => [...prev, newBookmark]);
    setBookmarkName('');
    setShowSaveDialog(false);
  };

  const handleLoadBookmark = (bookmark: FilterBookmark) => {
    onLoadBookmark(bookmark);
  };

  const handleDeleteBookmark = (id: string) => {
    if (deleteBookmark(id)) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            title={`${bookmarks.length} saved bookmarks`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">Bookmarks</span>
            {bookmarks.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-accent text-accent-foreground rounded-full">
                {bookmarks.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Saved Bookmarks</p>
          </div>

          {bookmarks.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground text-center">
              No bookmarks yet
            </div>
          ) : (
            <>
              {bookmarks.map(bookmark => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between px-2 py-2 hover:bg-accent rounded-sm group"
                >
                  <button
                    onClick={() => handleLoadBookmark(bookmark)}
                    className="flex-1 text-left text-sm hover:text-accent-foreground truncate"
                    title={bookmark.name}
                  >
                    {bookmark.name}
                  </button>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={() => setShowSaveDialog(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Save Current as Bookmark
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Bookmark</DialogTitle>
            <DialogDescription>
              Give this filter configuration a name for quick access later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="e.g., High-Value Deals, This Month's Closings"
              value={bookmarkName}
              onChange={e => setBookmarkName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveBookmark();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBookmark} disabled={!bookmarkName.trim()}>
              Save Bookmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
