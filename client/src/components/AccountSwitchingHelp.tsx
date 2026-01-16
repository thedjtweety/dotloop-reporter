import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Chrome, Monitor, Globe, Cookie } from "lucide-react";

interface AccountSwitchingHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSwitchingHelp({ open, onOpenChange }: AccountSwitchingHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <HelpCircle className="h-5 w-5 text-primary" />
            How to Switch Dotloop Accounts
          </DialogTitle>
          <DialogDescription className="text-foreground/70">
            Choose one of these methods to log in with a different Dotloop account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Option 1: Incognito Mode */}
          <div className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Chrome className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Option 1: Use Incognito/Private Mode (Recommended)
                </h3>
                <p className="text-sm text-foreground/70 mb-3">
                  Open a new incognito/private browser window for each account. This is the easiest way to test multiple accounts simultaneously.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">Chrome</span>
                    <span className="text-foreground/70">Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">Firefox</span>
                    <span className="text-foreground/70">Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">Safari</span>
                    <span className="text-foreground/70">Cmd+Shift+N</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Clear Cookies */}
          <div className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Cookie className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Option 2: Clear Browser Cookies
                </h3>
                <p className="text-sm text-foreground/70 mb-3">
                  Clear cookies for Zillow Workspace and Dotloop domains to force a fresh login.
                </p>
                <ol className="space-y-2 text-sm text-foreground/70 list-decimal list-inside">
                  <li>Open browser settings → Privacy & Security → Cookies</li>
                  <li>Search for and delete cookies from:
                    <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                      <li><code className="text-xs bg-muted px-1 py-0.5 rounded">zillow-workspace.com</code></li>
                      <li><code className="text-xs bg-muted px-1 py-0.5 rounded">dotloop.com</code></li>
                      <li><code className="text-xs bg-muted px-1 py-0.5 rounded">auth.dotloop.com</code></li>
                    </ul>
                  </li>
                  <li>Return to this site and click "Connect to Dotloop" again</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Option 3: Manual Logout */}
          <div className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Option 3: Manual Zillow Workspace Logout
                </h3>
                <p className="text-sm text-foreground/70 mb-3">
                  Log out directly from Zillow Workspace before reconnecting.
                </p>
                <ol className="space-y-2 text-sm text-foreground/70 list-decimal list-inside">
                  <li>Visit <a href="https://login.zillow-workspace.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">login.zillow-workspace.com</a></li>
                  <li>Log out from your current account</li>
                  <li>Return to this site and click "Connect to Dotloop"</li>
                  <li>Log in with your different Dotloop account credentials</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Why This Happens */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-2 text-sm">Why does this happen?</h4>
            <p className="text-sm text-foreground/70">
              Dotloop uses Zillow Workspace for authentication, which maintains its own browser session. 
              When you click "Sign Out" in our app, we clear your local data, but Zillow Workspace 
              keeps you logged in at the browser level. This is a security feature to prevent unauthorized logouts.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
