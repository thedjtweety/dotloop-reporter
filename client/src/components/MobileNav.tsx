import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings, Upload, BarChart2, Users, FileText, PieChart, Map, Activity, DollarSign, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
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
  const [, setLocation] = useLocation();

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
    
    // Scroll to tabs section
    setTimeout(() => {
      const tabsElement = document.querySelector('[role="tablist"]');
      if (tabsElement) {
        tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleAgentClick = () => {
    setOpen(false);
    // Scroll to agent leaderboard section
    setTimeout(() => {
      // We need to find the agent leaderboard section. 
      // Since it doesn't have an ID, we'll look for the text or class
      const headings = Array.from(document.querySelectorAll('h2'));
      const agentHeading = headings.find(h => h.textContent?.includes('Agent Leaderboard'));
      
      if (agentHeading) {
        agentHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback to scrolling to the container before charts
        const tabsElement = document.querySelector('[role="tablist"]');
        if (tabsElement) {
          // The leaderboard is usually before the tabs
          tabsElement.parentElement?.previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="flex items-center gap-2">
            <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-8 w-auto" />
            <span>Reporting Tool</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-6 pb-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground px-2">Dashboard Sections</h3>
            <Button 
              variant={activeTab === 'pipeline' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('pipeline')}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Pipeline
            </Button>
            <Button 
              variant={activeTab === 'timeline' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('timeline')}
            >
              <Activity className="mr-2 h-4 w-4" />
              Timeline
            </Button>
            <Button 
              variant={activeTab === 'financial' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('financial')}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Financial
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start" 
              onClick={handleAgentClick}
            >
              <Users className="mr-2 h-4 w-4" />
              Agent Leaderboard
            </Button>
            <Button 
              variant={activeTab === 'leadsource' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('leadsource')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Lead Source
            </Button>
            <Button 
              variant={activeTab === 'property' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('property')}
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              Property Type
            </Button>
            <Button 
              variant={activeTab === 'geographic' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('geographic')}
            >
              <Map className="mr-2 h-4 w-4" />
              Geographic
            </Button>
            <Button 
              variant={activeTab === 'insights' ? 'secondary' : 'ghost'} 
              className="justify-start" 
              onClick={() => handleTabClick('insights')}
            >
              <PieChart className="mr-2 h-4 w-4" />
              Insights
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground px-2">Tools</h3>
            <Button 
              variant="ghost" 
              className="justify-start" 
              onClick={() => {
                setLocation('/commission');
                setOpen(false);
              }}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Commission Management
              <ArrowRight className="ml-auto h-4 w-4" />
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

          <div className="flex flex-col gap-2 mt-auto pt-4 border-t">
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

function HomeIcon(props: any) {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
