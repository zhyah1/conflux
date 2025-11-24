import { Button, buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, GanttChartSquare, Users, FolderKanban, BrainCircuit } from 'lucide-react';

const features = [
    {
        icon: GanttChartSquare,
        title: 'Centralized Project Management',
        description: 'Oversee all your master projects and sub-phases from a single, intuitive dashboard. Track budgets, timelines, and completion rates with ease.',
    },
    {
        icon: BrainCircuit,
        title: 'AI-Powered Insights',
        description: 'Leverage artificial intelligence to suggest document audits and automatically escalate potential task delays before they become critical problems.',
    },
    {
        icon: Users,
        title: 'Role-Based Access Control',
        description: 'Ensure team members have access only to what they need, from high-level PMCs to on-the-ground Subcontractors and read-only Clients.',
    },
    {
        icon: FolderKanban,
        title: 'Dynamic Task Boards',
        description: 'Manage tasks with a flexible Kanban board. Drag and drop tasks between statuses, assign team members, and visualize your project\'s workflow.',
    }
];

export default function AboutPage() {
    return (
        <div className="bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="mr-4 flex">
                        <Link href="/" className="flex items-center space-x-2">
                            <Logo className="h-8 w-8" />
                            <span className="font-bold">Construx</span>
                        </Link>
                    </div>
                    <div className="flex flex-1 items-center justify-end space-x-2">
                        <nav className="flex items-center">
                            <Link
                                href="/login"
                                className={cn(
                                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                                    'px-4'
                                )}
                            >
                                Login
                            </Link>
                             <Link
                                href="/login"
                                className={cn(
                                    buttonVariants({ size: 'sm' }),
                                    'ml-2'
                                )}
                            >
                                Get Started
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main>
                <section className="py-20 text-center">
                     <div className="container">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl font-headline">
                            The Future of Construction Management
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                            Construx is designed to bring clarity, efficiency, and intelligence to every phase of your construction projects.
                        </p>
                    </div>
                </section>

                <section className="py-20 bg-muted/40">
                    <div className="container">
                        <div className="grid gap-12 md:grid-cols-2">
                            <div className="flex items-center justify-center">
                                <Image 
                                    src="https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjb25zdHJ1Y3Rpb24lMjBwbGFubmluZ3xlbnwwfHx8fDE3NTg5OTM3MjB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                                    alt="Construction Planning"
                                    width={500}
                                    height={500}
                                    className="rounded-lg shadow-xl"
                                    data-ai-hint="construction planning"
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-3xl font-bold font-headline mb-6">Key Features</h2>
                                <ul className="space-y-6">
                                    {features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground">
                                                    <feature.icon className="h-6 w-6" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-semibold">{feature.title}</h3>
                                                <p className="mt-1 text-muted-foreground">{feature.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 text-center">
                    <div className="container">
                        <h2 className="text-3xl font-bold tracking-tight font-headline">
                            Ready to Transform Your Projects?
                        </h2>
                        <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                            Join today and start building better, smarter, and together.
                        </p>
                        <div className="mt-8">
                            <Link href="/login" className={cn(buttonVariants({ size: 'lg' }))}>
                                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t">
                <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                    <div className="flex items-center gap-2">
                        <Logo className="h-6 w-6" />
                        <p className="text-center text-sm leading-loose md:text-left">
                           Built for the modern construction era.
                        </p>
                    </div>
                    <p className="text-center text-sm text-muted-foreground md:text-left">
                        © {new Date().getFullYear()} Construx, Inc. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
