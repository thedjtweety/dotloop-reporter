import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, BookOpen, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: 'getting-started' | 'features' | 'advanced' | 'tips';
  videoUrl: string;
  thumbnail?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const tutorials: Tutorial[] = [
  {
    id: 'upload-csv',
    title: 'How to Upload a CSV File',
    description: 'Learn how to upload your Dotloop export CSV file to the reporting tool. We\'ll walk you through selecting your file and understanding the validation process.',
    duration: '8 seconds',
    category: 'getting-started',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663283621115/ZLSeLzvmTLBueVOK.mp4',
    difficulty: 'beginner',
  },
  {
    id: 'interpret-reports',
    title: 'Interpreting Your Dashboard Reports',
    description: 'Understand how to read and interpret the dashboard metrics, charts, and key performance indicators. Learn what each metric means and how to use them for insights.',
    duration: '8 seconds',
    category: 'features',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663283621115/OLHRkalHKGLdNNBA.mp4',
    difficulty: 'beginner',
  },
  {
    id: 'assign-commissions',
    title: 'Assigning Commission Plans to Agents',
    description: 'Discover how to assign commission plans to your agents. We\'ll show you how to select agents, choose a template, and apply commission structures.',
    duration: '8 seconds',
    category: 'features',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663283621115/pNFegzbbxLxsbQQv.mp4',
    difficulty: 'intermediate',
  },
  {
    id: 'export-results',
    title: 'Exporting and Sharing Reports',
    description: 'Learn how to export your reports in multiple formats (CSV, Excel, PDF) and share them with your team. Perfect for presentations and analysis.',
    duration: '8 seconds',
    category: 'advanced',
    videoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663283621115/jFWnXenZCRsbOOvd.mp4',
    difficulty: 'beginner',
  },
];

export default function VideoWalkthroughs() {
  const [, setLocation] = useLocation();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'getting-started': 'Getting Started',
      'features': 'Features',
      'advanced': 'Advanced',
      'tips': 'Pro Tips',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'getting-started':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'features':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'advanced':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'tips':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default:
        return '';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return '';
    }
  };

  const groupedTutorials = {
    'getting-started': tutorials.filter(t => t.category === 'getting-started'),
    'features': tutorials.filter(t => t.category === 'features'),
    'advanced': tutorials.filter(t => t.category === 'advanced'),
    'tips': tutorials.filter(t => t.category === 'tips'),
  };

  if (selectedTutorial) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedTutorial(null);
              setIsPlaying(false);
            }}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tutorials
          </Button>

          {/* Video Player */}
          <Card className="p-6 bg-card/50 border-border mb-8">
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {isPlaying ? (
                <video
                  src={selectedTutorial.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              ) : (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <Play className="h-16 w-16 text-white mb-4" />
                  <span className="text-white text-lg font-semibold">Play Video</span>
                </button>
              )}
            </div>
          </Card>

          {/* Tutorial Details */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground">{selectedTutorial.title}</h1>
              <div className="flex gap-2 flex-wrap">
                <Badge className={getCategoryColor(selectedTutorial.category)}>
                  {getCategoryLabel(selectedTutorial.category)}
                </Badge>
                <Badge className={getDifficultyColor(selectedTutorial.difficulty)}>
                  {selectedTutorial.difficulty.charAt(0).toUpperCase() + selectedTutorial.difficulty.slice(1)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedTutorial.duration}
                </Badge>
              </div>
            </div>

            <p className="text-lg text-foreground/70 leading-relaxed">
              {selectedTutorial.description}
            </p>

            {/* Next Steps */}
            <Card className="p-6 bg-emerald-500/10 border-emerald-500/20">
              <h3 className="font-semibold text-foreground mb-3">Next Steps</h3>
              <ul className="space-y-2 text-foreground/70">
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Try the steps shown in this tutorial</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Explore related features in the application</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Check out other tutorials for more advanced features</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Video Walkthroughs</h1>
          </div>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Learn how to use the Dotloop Reporting Tool with our short, focused video tutorials. Each video is 8 seconds long and covers a specific feature or workflow.
          </p>
        </div>

        {/* Getting Started Section */}
        {groupedTutorials['getting-started'].length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="text-blue-500">●</span>
              Getting Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedTutorials['getting-started'].map((tutorial) => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial}
                  onClick={() => setSelectedTutorial(tutorial)}
                  getCategoryColor={getCategoryColor}
                  getDifficultyColor={getDifficultyColor}
                  getCategoryLabel={getCategoryLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        {groupedTutorials['features'].length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="text-emerald-500">●</span>
              Core Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedTutorials['features'].map((tutorial) => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial}
                  onClick={() => setSelectedTutorial(tutorial)}
                  getCategoryColor={getCategoryColor}
                  getDifficultyColor={getDifficultyColor}
                  getCategoryLabel={getCategoryLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Advanced Section */}
        {groupedTutorials['advanced'].length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="text-purple-500">●</span>
              Advanced Topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedTutorials['advanced'].map((tutorial) => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial}
                  onClick={() => setSelectedTutorial(tutorial)}
                  getCategoryColor={getCategoryColor}
                  getDifficultyColor={getDifficultyColor}
                  getCategoryLabel={getCategoryLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pro Tips Section */}
        {groupedTutorials['tips'].length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="text-orange-500">●</span>
              Pro Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedTutorials['tips'].map((tutorial) => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial}
                  onClick={() => setSelectedTutorial(tutorial)}
                  getCategoryColor={getCategoryColor}
                  getDifficultyColor={getDifficultyColor}
                  getCategoryLabel={getCategoryLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Reference */}
        <Card className="p-6 bg-card/50 border-border">
          <h3 className="text-xl font-bold text-foreground mb-4">Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-foreground/70">
            <div>
              <p className="font-semibold text-foreground mb-2">📊 Dashboard</p>
              <p>View metrics, charts, and agent performance in one place</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">💼 Commission Management</p>
              <p>Assign plans and track commission calculations</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">📤 Export & Share</p>
              <p>Download reports in CSV, Excel, or PDF format</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface TutorialCardProps {
  tutorial: Tutorial;
  onClick: () => void;
  getCategoryColor: (category: string) => string;
  getDifficultyColor: (difficulty: string) => string;
  getCategoryLabel: (category: string) => string;
}

function TutorialCard({
  tutorial,
  onClick,
  getCategoryColor,
  getDifficultyColor,
  getCategoryLabel,
}: TutorialCardProps) {
  return (
    <Card
      onClick={onClick}
      className="p-6 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer border-border group"
    >
      <div className="space-y-4">
        {/* Thumbnail / Play Button Area */}
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
          <Play className="h-12 w-12 text-primary/60 group-hover:text-primary transition-colors" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {tutorial.title}
          </h3>
          <p className="text-sm text-foreground/70 line-clamp-2">
            {tutorial.description}
          </p>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap pt-2">
            <Badge className={getCategoryColor(tutorial.category)} variant="secondary">
              {getCategoryLabel(tutorial.category)}
            </Badge>
            <Badge className={getDifficultyColor(tutorial.difficulty)} variant="secondary">
              {tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {tutorial.duration}
            </Badge>
          </div>
        </div>

        {/* Play Button */}
        <Button className="w-full" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Watch Tutorial
        </Button>
      </div>
    </Card>
  );
}
