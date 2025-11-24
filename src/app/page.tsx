import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Sun } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-screen min-h-[700px] flex items-center justify-center text-center overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb258ZW58MHx8fHwxNzE4NzgzNzM4fDA&ixlib=rb-4.1.0&q=80&w=1920"
            alt="Construction site"
            fill
            className="object-cover -z-20 brightness-[0.35] dark:brightness-[0.35]"
            data-ai-hint="construction site"
          />
          
          <div className="absolute inset-0 bg-black/40 -z-10"></div>
          
          {/* Content */}
          <div className="container max-w-4xl px-4 text-background dark:text-background relative z-10">
             <div className="flex justify-center mb-8">
               <div
                  className={`flex items-center justify-center font-bold text-5xl bg-primary text-primary-foreground rounded-md h-20 w-20 shadow-lg`}
                >
                  Cx
                </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl font-headline drop-shadow-2xl">
              Build Better. Build Smarter. Build Together.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-background/90 dark:text-background/90 drop-shadow-xl max-w-3xl mx-auto">
              Construx is the ultimate project management solution for the modern construction industry.
              Streamline your projects from groundbreaking to handover with traditional excellence.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link 
                href="/login" 
                className={cn(
                  buttonVariants({ size: 'lg' }), 
                  "backdrop-blur-sm bg-primary hover:bg-primary/90 border-2 border-primary/50 shadow-2xl shadow-amber-900/50 text-primary-foreground font-semibold"
                )}
              >
                Get Started
              </Link>
              <Link 
                href="/about" 
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }), 
                  "backdrop-blur-sm bg-white/10 hover:bg-white/20 border-2 border-white/50 text-white font-semibold shadow-xl"
                )}
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
