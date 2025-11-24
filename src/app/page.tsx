
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
            className="object-cover -z-20 brightness-50"
            data-ai-hint="construction site"
          />
          {/* CSS Skyline from image */}
           <div className="absolute inset-0 -z-10">
              {/* Ground */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-zinc-800 to-zinc-900"></div>

              {/* Sun */}
              <Sun className="absolute top-[15%] right-[15%] h-12 w-12 text-yellow-400/80 animate-pulse" />

              {/* Left Building */}
              <div className="absolute bottom-2 left-[10%] w-48 h-48">
                {/* Building Base */}
                <div className="absolute bottom-0 w-full h-3/4 bg-[#6b4f3a] rounded-t-lg">
                    {/* Windows */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3/4 h-1/3 bg-black/20 grid grid-cols-3 grid-rows-2 gap-1 p-1 rounded">
                        <div className="bg-yellow-300/30 rounded-sm"></div>
                        <div className="bg-yellow-300/30 rounded-sm"></div>
                        <div className="bg-yellow-300/30 rounded-sm"></div>
                        <div className="bg-yellow-300/30 rounded-sm"></div>
                        <div className="bg-yellow-300/30 rounded-sm"></div>
                        <div className="bg-yellow-300/30 rounded-sm"></div>
                    </div>
                     {/* Door */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-[#523d2e] rounded-t-md flex items-center justify-center">
                       <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                    </div>
                </div>
                 {/* Roof/Awning */}
                <div className="absolute -top-8 -left-4 w-48 h-20 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg -rotate-[15deg] origin-bottom-left"></div>
                 <div className="absolute -top-2 left-12 w-32 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg -rotate-[15deg] origin-bottom-left opacity-90"></div>
              </div>
              
              {/* Right Building */}
              <div className="absolute bottom-2 right-[12%] w-40 h-80 bg-slate-800 rounded-t-xl overflow-hidden border-x-2 border-orange-500/50">
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-8 gap-2 p-2">
                    {Array.from({length: 32}).map((_, i) => (
                        <div key={i} className="bg-blue-300/10 rounded-sm"></div>
                    ))}
                  </div>
                  <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-orange-500/50"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-10 bg-[#523d2e] rounded-t-lg border-x-4 border-t-4 border-orange-500/50"></div>
              </div>

              {/* People/Bushes */}
              <div className="absolute bottom-2 left-[25%]">
                <div className="w-4 h-6 bg-green-500 rounded-t-full"></div>
                <div className="w-4 h-2 bg-green-600"></div>
              </div>
               <div className="absolute bottom-2 left-[50%]">
                <div className="w-3 h-4 bg-green-500 rounded-t-full"></div>
                <div className="w-3 h-1.5 bg-green-600"></div>
              </div>

               {/* Faint Circle */}
              <div className="absolute top-1/2 left-1/3 w-32 h-32 border-2 border-green-500/10 rounded-full"></div>
          </div>

          <div className="container max-w-4xl px-4 text-white">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl font-headline text-shadow">
              Build Better. Build Smarter. Build Together.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-foreground/80 text-shadow-md">
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
