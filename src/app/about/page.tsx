
import { GanttChartSquare, Users, FolderKanban, BrainCircuit, FileText, Banknote } from 'lucide-react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const features = [
    {
        icon: GanttChartSquare,
        title: 'Centralized Project Management',
        description: 'Oversee all your master projects and sub-phases from a single, intuitive dashboard. Track timelines and completion rates with ease.',
    },
    {
        icon: BrainCircuit,
        title: 'AI-Powered Insights',
        description: 'Leverage AI to suggest document audits and automatically escalate potential task delays before they become critical problems.',
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
    },
    {
        icon: FileText,
        title: 'Document Management',
        description: 'Keep all your project-related documents, plans, and reports organized and accessible in a centralized repository.',
    },
    {
        icon: Banknote,
        title: 'Budget & Financial Tracking',
        description: 'Monitor project budgets, track expenses, and manage financial health to ensure your projects stay on track financially.',
    },
];

export default function AboutPage() {
    return (
        <div className="bg-background text-foreground min-h-screen">
            <main className="container mx-auto py-12 md:py-20 px-4">
                <section className="text-center">
                    <h1 className="text-4xl font-bold font-headline mb-4">Why Choose Construx?</h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        An integrated platform designed to bring clarity, efficiency, and intelligence to your construction projects.
                    </p>
                </section>

                 <section className="my-12">
                    <Image 
                        src="https://static.vecteezy.com/system/resources/thumbnails/027/103/993/small/engineer-with-yellow-helmet-ensures-worker-safety-amidst-new-highrise-construction-and-cranes-against-an-evening-sunset-backdrop-free-photo.jpg"
                        alt="Construction Blueprint"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-xl mx-auto"
                        data-ai-hint="construction engineer sunset"
                    />
                </section>

                <section>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <Card key={index} className="flex flex-col">
                                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                     <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground">
                                            <feature.icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
