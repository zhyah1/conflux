
import { Button, buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold">Construx</span>
          </Link>
          
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }))}>Login</Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'default' }))}>Get Started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[calc(100vh_-_3.5rem)] min-h-[500px] flex items-center justify-center text-center">
          <Image
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb258ZW58MHx8fHwxNzE4NzgzNzM4fDA&ixlib=rb-4.1.0&q=80&w=1920"
            alt="Construction site"
            fill
            className="object-cover -z-10 brightness-50"
            data-ai-hint="construction site"
          />
          <div className="container max-w-4xl px-4 text-white">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl font-headline">
              Build Better. Build Smarter. Build Together.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/80">
              Construx is the ultimate project management solution for the modern construction industry.
              Streamline your projects from groundbreaking to handover.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/login" className={cn(buttonVariants({ size: 'lg' }))}>
                Start Your Free Trial
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
