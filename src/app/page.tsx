import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="container mx-auto flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-semibold">Construx</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="relative isolate pt-14">
            <div
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                aria-hidden="true"
            >
                <div
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#8085ff] to-[#3B82F6] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    style={{
                        clipPath:
                        'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }}
                />
            </div>
            <div className="py-24 sm:py-32">
                <div className="container mx-auto text-center">
                    <Logo className="w-24 h-24 mx-auto mb-8 shadow-2xl shadow-blue-500/50 ring-4 ring-primary/20" />

                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-headline">
                        Build Better. Build Smarter. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Build Together.</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
                        Construx is the ultimate project management solution for the modern construction industry.
                        Streamline your projects from groundbreaking to handover with traditional excellence.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'bg-white text-black hover:bg-gray-200')}>
                            Get Started <ArrowRight className="ml-2" />
                        </Link>
                        <Link href="/about" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'text-white')}>
                            Learn More
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
