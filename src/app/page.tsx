
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

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
            className="object-cover -z-20 brightness-50"
            data-ai-hint="construction site"
          />
          {/* CSS Skyline */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 -z-10">
              <div className="absolute bottom-0 left-[5%] w-20 h-48 bg-foreground/30 backdrop-blur-sm"></div>
              <div className="absolute bottom-0 left-[10%] w-16 h-64 bg-foreground/40 backdrop-blur-sm border-t-8 border-accent"></div>
              <div className="absolute bottom-0 left-[20%] w-24 h-80 bg-foreground/20 backdrop-blur-sm"></div>
              {/* Traditional peak */}
              <div className="absolute bottom-0 left-[28%] w-0 h-0 
                border-l-[50px] border-l-transparent
                border-r-[50px] border-r-transparent
                border-b-[80px] border-b-accent/50">
              </div>
               <div className="absolute bottom-0 left-[calc(28%-10px)] w-32 h-56 bg-foreground/30 backdrop-blur-sm"></div>
              {/* Modern Tower */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-96 bg-foreground/50 backdrop-blur-sm flex justify-center items-start pt-4">
                <div className="w-2 h-20 bg-accent animate-pulse"></div>
              </div>
              <div className="absolute bottom-0 right-[20%] w-12 h-72 bg-foreground/20 backdrop-blur-sm"></div>
              <div className="absolute bottom-0 right-[10%] w-28 h-56 bg-foreground/40 backdrop-blur-sm border-t-4 border-b-8 border-accent"></div>
               <div className="absolute bottom-0 right-[5%] w-16 h-40 bg-foreground/30 backdrop-blur-sm"></div>
          </div>
          <div className="container max-w-4xl px-4 text-white">
            <Logo className="h-24 w-24 text-5xl mx-auto mb-8 bg-gradient-to-br from-primary to-accent shadow-2xl" />
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl font-headline text-shadow">
              Build Better. Build Smarter. Build Together.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/80 text-shadow-md">
              Construx is the ultimate project management solution for the modern construction industry.
              Streamline your projects from groundbreaking to handover.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), "backdrop-blur-sm bg-primary/80 hover:bg-primary")}>
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
