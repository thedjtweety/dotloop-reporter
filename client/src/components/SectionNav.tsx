import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Trophy, DollarSign } from 'lucide-react';

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'charts', label: 'Charts', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
  { id: 'projector', label: 'Projector', icon: <DollarSign className="w-4 h-4" /> },
];

export default function SectionNav() {
  const [activeSection, setActiveSection] = useState('metrics');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling 200px
      setIsVisible(window.scrollY > 200);

      // Detect which section is in view
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.querySelector(`[data-section="${section.id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = window.scrollY + rect.top;
          const elementBottom = elementTop + rect.height;
          
          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      const yOffset = -80; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-full shadow-lg p-2 space-y-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                group relative flex items-center justify-center w-10 h-10 rounded-full
                transition-all duration-200
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-accent text-foreground/60 hover:text-foreground'
                }
              `}
              title={section.label}
            >
              {section.icon}
              
              {/* Tooltip */}
              <span className={`
                absolute right-full mr-3 px-3 py-1.5 rounded-md
                bg-popover text-popover-foreground text-sm font-medium
                border border-border shadow-md whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-200
              `}>
                {section.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
