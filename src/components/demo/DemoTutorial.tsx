import { ChevronRight, X, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDemo, TUTORIAL_STEPS } from '@/hooks/useDemo';

export function DemoTutorial() {
  const { isDemoMode, currentTutorialStep, nextTutorialStep, completeTutorial, isTutorialComplete } = useDemo();

  if (!isDemoMode || isTutorialComplete) return null;

  const step = TUTORIAL_STEPS[currentTutorialStep];
  const progress = ((currentTutorialStep + 1) / TUTORIAL_STEPS.length) * 100;
  const isLastStep = currentTutorialStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed bottom-28 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-24 z-50 lg:w-96">
      <Card className="shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Lightbulb className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Lesson {currentTutorialStep + 1} of {TUTORIAL_STEPS.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={completeTutorial}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-1 mt-2" />
          <CardTitle className="text-lg mt-3">{step.title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground leading-relaxed">{step.message}</p>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            onClick={nextTutorialStep}
            className="w-full gap-2"
          >
            {isLastStep ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Complete Tutorial
              </>
            ) : (
              <>
                Next Lesson
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
