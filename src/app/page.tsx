
import { Button, buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Building, GanttChartSquare, CheckCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Logo className="h-8 w-8 mr-2" />
            <span className="font-bold">Construx</span>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Features</Link>
            <Link href="#about" className="text-muted-foreground transition-colors hover:text-foreground">About</Link>
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }))}>Login</Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'default' }))}>Get Started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center text-center">
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
              <Link href="#features" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-white border-white')}>
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-secondary">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight font-headline">All-in-One Construction Management</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                From planning and execution to team collaboration and reporting, Construx has you covered.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="items-center text-center">
                   <div className="p-3 rounded-full bg-primary/10">
                    <Building className="h-6 w-6 text-primary" />
                   </div>
                  <CardTitle>Project Planning</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Define project phases, set budgets, and establish timelines with our intuitive planning tools.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                   <div className="p-3 rounded-full bg-primary/10">
                    <GanttChartSquare className="h-6 w-6 text-primary" />
                   </div>
                  <CardTitle>Task Management</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Create, assign, and track tasks on a visual Kanban board. Monitor progress and resolve issues faster.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                   <div className="p-3 rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                   </div>
                  <CardTitle>Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Keep your entire team—from PMCs to subcontractors—aligned with role-based access and centralized communication.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                   <div className="p-3 rounded-full bg-primary/10">
                    <CheckCircle className="h-6 w-6 text-primary" />
                   </div>
                  <CardTitle>Approval Workflows</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Streamline decision-making with automated approval requests for critical tasks.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section id="about" className="py-16 md:py-24">
          <div className="container text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Ready to Transform Your Projects?</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Join hundreds of leading construction firms who trust Construx to deliver projects on time and on budget.
            </p>
            <div className="mt-8">
              <Link href="/login" className={cn(buttonVariants({ size: 'lg' }))}>
                Get Started with Construx
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-6 flex items-center justify-between text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Construx, Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
