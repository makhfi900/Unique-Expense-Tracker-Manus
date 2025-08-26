import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './ui/command';
import {
  Kbd,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Filter,
  RefreshCw,
  Settings,
  User,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Zap,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Escape,
  Command as CommandIcon,
  Control,
  Shift,
  Alt,
  Enter,
  Home,
  End,
  Delete,
  Backspace
} from 'lucide-react';

// Keyboard shortcut definitions
const SHORTCUTS = {
  // Global shortcuts
  global: [
    {
      key: 'cmd+k',
      description: 'Open command palette',
      action: 'openCommandPalette',
      icon: CommandIcon,
      category: 'Navigation'
    },
    {
      key: 'cmd+/',
      description: 'Show keyboard shortcuts',
      action: 'showShortcuts',
      icon: Settings,
      category: 'Help'
    },
    {
      key: 'cmd+shift+a',
      description: 'Add new expense',
      action: 'addExpense',
      icon: Plus,
      category: 'Actions'
    },
    {
      key: 'cmd+shift+s',
      description: 'Quick search',
      action: 'focusSearch',
      icon: Search,
      category: 'Navigation'
    },
    {
      key: 'cmd+r',
      description: 'Refresh data',
      action: 'refresh',
      icon: RefreshCw,
      category: 'Actions'
    },
    {
      key: 'cmd+shift+f',
      description: 'Toggle advanced filters',
      action: 'toggleFilters',
      icon: Filter,
      category: 'Navigation'
    }
  ],
  
  // List navigation
  list: [
    {
      key: 'j',
      description: 'Next item',
      action: 'nextItem',
      icon: ArrowDown,
      category: 'Navigation'
    },
    {
      key: 'k',
      description: 'Previous item',
      action: 'previousItem',
      icon: ArrowUp,
      category: 'Navigation'
    },
    {
      key: 'space',
      description: 'Select/deselect item',
      action: 'toggleSelect',
      icon: Target,
      category: 'Selection'
    },
    {
      key: 'shift+a',
      description: 'Select all',
      action: 'selectAll',
      icon: Target,
      category: 'Selection'
    },
    {
      key: 'escape',
      description: 'Clear selection',
      action: 'clearSelection',
      icon: Escape,
      category: 'Selection'
    }
  ],
  
  // Item actions
  item: [
    {
      key: 'e',
      description: 'Edit selected item',
      action: 'editItem',
      icon: Edit,
      category: 'Actions'
    },
    {
      key: 'd',
      description: 'Duplicate item',
      action: 'duplicateItem',
      icon: Copy,
      category: 'Actions'
    },
    {
      key: 'delete',
      description: 'Delete selected items',
      action: 'deleteItems',
      icon: Trash2,
      category: 'Actions'
    },
    {
      key: 'cmd+e',
      description: 'Export selected items',
      action: 'exportItems',
      icon: Download,
      category: 'Actions'
    }
  ],
  
  // View controls
  view: [
    {
      key: '1',
      description: 'Grid view',
      action: 'gridView',
      icon: Target,
      category: 'View'
    },
    {
      key: '2',
      description: 'List view',
      action: 'listView',
      icon: Target,
      category: 'View'
    },
    {
      key: 'cmd+shift+c',
      description: 'Toggle compact mode',
      action: 'toggleCompact',
      icon: Target,
      category: 'View'
    },
    {
      key: 'cmd+shift+b',
      description: 'Toggle sidebar',
      action: 'toggleSidebar',
      icon: Target,
      category: 'View'
    }
  ]
};

// Command palette actions
const COMMAND_ACTIONS = [
  {
    id: 'add-expense',
    title: 'Add New Expense',
    description: 'Create a new expense entry',
    icon: Plus,
    shortcut: 'cmd+shift+a',
    category: 'Actions',
    keywords: ['add', 'create', 'new', 'expense', 'entry']
  },
  {
    id: 'search',
    title: 'Search Expenses',
    description: 'Search through all expenses',
    icon: Search,
    shortcut: 'cmd+shift+s',
    category: 'Navigation',
    keywords: ['search', 'find', 'filter', 'look']
  },
  {
    id: 'filters',
    title: 'Advanced Filters',
    description: 'Open advanced filtering options',
    icon: Filter,
    shortcut: 'cmd+shift+f',
    category: 'Navigation',
    keywords: ['filter', 'advanced', 'search', 'criteria']
  },
  {
    id: 'refresh',
    title: 'Refresh Data',
    description: 'Reload all expense data',
    icon: RefreshCw,
    shortcut: 'cmd+r',
    category: 'Actions',
    keywords: ['refresh', 'reload', 'update', 'sync']
  },
  {
    id: 'export',
    title: 'Export Data',
    description: 'Export expenses to CSV',
    icon: Download,
    shortcut: 'cmd+e',
    category: 'Actions',
    keywords: ['export', 'download', 'csv', 'save']
  },
  {
    id: 'grid-view',
    title: 'Grid View',
    description: 'Switch to card grid layout',
    icon: Target,
    shortcut: '1',
    category: 'View',
    keywords: ['grid', 'cards', 'view', 'layout']
  },
  {
    id: 'list-view',
    title: 'List View',
    description: 'Switch to table list layout',
    icon: Target,
    shortcut: '2',
    category: 'View',
    keywords: ['list', 'table', 'view', 'layout']
  },
  {
    id: 'toggle-compact',
    title: 'Toggle Compact Mode',
    description: 'Switch between compact and comfortable view',
    icon: Target,
    shortcut: 'cmd+shift+c',
    category: 'View',
    keywords: ['compact', 'comfortable', 'density', 'spacing']
  }
];

// Helper function to format keyboard shortcuts for display
const formatShortcut = (shortcut) => {
  return shortcut
    .replace('cmd', '⌘')
    .replace('shift', '⇧')
    .replace('alt', '⌥')
    .replace('ctrl', '⌃')
    .split('+')
    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
    .join(' + ');
};

// Keyboard shortcut hook
const useKeyboardShortcuts = (shortcuts, onShortcut) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, metaKey, ctrlKey, shiftKey, altKey, target } = event;
      
      // Don't trigger shortcuts when typing in inputs
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Exception: allow Escape to blur inputs
        if (key === 'Escape') {
          target.blur();
          event.preventDefault();
        }
        return;
      }

      const modifiers = [];
      if (metaKey || ctrlKey) modifiers.push('cmd');
      if (shiftKey) modifiers.push('shift');
      if (altKey) modifiers.push('alt');
      
      const shortcutKey = [...modifiers, key.toLowerCase()].join('+');
      
      // Find matching shortcut
      const allShortcuts = Object.values(shortcuts).flat();
      const matchedShortcut = allShortcuts.find(s => s.key === shortcutKey);
      
      if (matchedShortcut) {
        event.preventDefault();
        onShortcut(matchedShortcut.action, matchedShortcut);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, onShortcut]);
};

// Keyboard shortcuts help dialog
const ShortcutsHelp = ({ open, onOpenChange }) => {
  const shortcutsByCategory = useMemo(() => {
    const categories = {};
    Object.values(SHORTCUTS).flat().forEach(shortcut => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    });
    return categories;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CommandIcon className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with the expense tracker efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-primary">{category}</h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => {
                  const Icon = shortcut.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{shortcut.description}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {formatShortcut(shortcut.key)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Power User Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use <Badge variant="outline" className="mx-1 font-mono">⌘ + K</Badge> to open the command palette for quick actions</li>
            <li>• Navigate lists with <Badge variant="outline" className="mx-1 font-mono">J</Badge> and <Badge variant="outline" className="mx-1 font-mono">K</Badge> keys</li>
            <li>• Select items with <Badge variant="outline" className="mx-1 font-mono">Space</Badge> and perform bulk actions</li>
            <li>• Use number keys <Badge variant="outline" className="mx-1 font-mono">1</Badge> <Badge variant="outline" className="mx-1 font-mono">2</Badge> to switch between views</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Command palette component
const CommandPalette = ({ 
  open, 
  onOpenChange, 
  onAction, 
  recentActions = [],
  context = {} 
}) => {
  const [searchValue, setSearchValue] = useState('');

  const filteredActions = useMemo(() => {
    if (!searchValue) return COMMAND_ACTIONS;
    
    const search = searchValue.toLowerCase();
    return COMMAND_ACTIONS.filter(action =>
      action.title.toLowerCase().includes(search) ||
      action.description.toLowerCase().includes(search) ||
      action.keywords.some(keyword => keyword.includes(search))
    );
  }, [searchValue]);

  const groupedActions = useMemo(() => {
    const groups = {};
    filteredActions.forEach(action => {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }
      groups[action.category].push(action);
    });
    return groups;
  }, [filteredActions]);

  const handleSelect = (actionId) => {
    const action = COMMAND_ACTIONS.find(a => a.id === actionId);
    if (action) {
      onAction(actionId, action);
      onOpenChange(false);
      setSearchValue('');
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {recentActions.length > 0 && searchValue === '' && (
          <>
            <CommandGroup heading="Recent">
              {recentActions.slice(0, 5).map((actionId) => {
                const action = COMMAND_ACTIONS.find(a => a.id === actionId);
                if (!action) return null;
                
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={actionId}
                    value={actionId}
                    onSelect={() => handleSelect(actionId)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.title}</span>
                    {action.shortcut && (
                      <CommandShortcut>{formatShortcut(action.shortcut)}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        
        {Object.entries(groupedActions).map(([category, actions]) => (
          <CommandGroup key={category} heading={category}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.id}
                  value={action.id}
                  onSelect={() => handleSelect(action.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div>{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                  {action.shortcut && (
                    <CommandShortcut>{formatShortcut(action.shortcut)}</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

// Main keyboard shortcuts provider
const KeyboardShortcuts = ({ 
  children, 
  onShortcutAction,
  recentActions = [],
  context = {}
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const handleShortcut = useCallback((action, shortcut) => {
    switch (action) {
      case 'showShortcuts':
        setShowHelp(true);
        break;
      case 'openCommandPalette':
        setShowCommandPalette(true);
        break;
      default:
        onShortcutAction?.(action, shortcut);
    }
  }, [onShortcutAction]);

  const handleCommandAction = useCallback((actionId, action) => {
    onShortcutAction?.(actionId, { action, source: 'command-palette' });
  }, [onShortcutAction]);

  useKeyboardShortcuts(SHORTCUTS, handleShortcut);

  return (
    <>
      {children}
      
      <ShortcutsHelp 
        open={showHelp} 
        onOpenChange={setShowHelp} 
      />
      
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        onAction={handleCommandAction}
        recentActions={recentActions}
        context={context}
      />
    </>
  );
};

// Hook to use keyboard shortcuts
export const useKeyboardShortcut = (shortcut, callback, deps = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, metaKey, ctrlKey, shiftKey, altKey, target } = event;
      
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const modifiers = [];
      if (metaKey || ctrlKey) modifiers.push('cmd');
      if (shiftKey) modifiers.push('shift');
      if (altKey) modifiers.push('alt');
      
      const shortcutKey = [...modifiers, key.toLowerCase()].join('+');
      
      if (shortcutKey === shortcut) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
};

// Quick shortcut indicator component
export const ShortcutIndicator = ({ shortcut, className = "" }) => {
  return (
    <Badge variant="outline" className={`font-mono text-xs ${className}`}>
      {formatShortcut(shortcut)}
    </Badge>
  );
};

export default KeyboardShortcuts;