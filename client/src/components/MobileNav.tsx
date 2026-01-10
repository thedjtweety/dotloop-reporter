import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings, Upload, BarChart2, Users, FileText, PieChart } from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

interface MobileNavProps {
  onReset: () => void;
  onOpenSettings: () => void;
  onOpenMapping: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNav({ 
  onReset, 
  onOpenSettings, 
  onOpenMapping,
  activeTab,
  onTabChange
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="flex items-center gap-2">
            <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-8 w-auto" />
            <span>Reporting Tool</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground px-2">Dashboard</h3>
            <Button 
              variant={activeTab === 'pipeline' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('pipeline')}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Pipeline & Performance
            </Button>
            <Button 
              variant={activeTab === 'financials' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('financials')}
            >
              <DollarSignIcon className="mr-2 h-4 w-4" />
              Financial Analytics
            </Button>
            <Button 
              variant={activeTab === 'agents' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('agents')}
            >
              <Users className="mr-2 h-4 w-4" />
              Agent Leaderboard
            </Button>
            <Button 
              variant={activeTab === 'transactions' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('transactions')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Transactions
            </Button>
            <Button 
              variant={activeTab === 'insights' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('insights')}
            >
              <PieChart className="mr-2 h-4 w-4" />
              Market Insights
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground px-2">Tools</h3>
            <Button 
              variant="ghost" 
              className="justify-start" 
              onClick={() => {
                onOpenSettings();
                setOpen(false);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Commission Settings
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start" 
              onClick={() => {
                onOpenMapping();
                setOpen(false);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Map Fields
            </Button>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-sm font-medium">Theme</span>
              <ModeToggle />
            </div>
            <Button 
              variant="outline" 
              className="justify-start text-destructive hover:text-destructive" 
              onClick={() => {
                onReset();
                setOpen(false);
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload New File
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DollarSignIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}
