import { ArrowRight, Code, Layers, Puzzle, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between  max-w-[1200px] m-auto">
          <div className="flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-purple" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-teal-500 bg-clip-text text-transparent">
              Microfrontends
            </span>
          </div>
          <div>
            <a href="/docs">
              <Button className="bg-purple-500 hover:bg-purple-500/90">
                Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] m-auto">
        {/* Hero Section with vibrant background */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-br from-purple/10 to-teal/10">
          <div className="container px-4 md:px-6 m-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
                    <span className="bg-gradient-to-r from-purple-500 to-teal-500 bg-clip-text text-transparent">
                      Microfrontends
                    </span>{' '}
                    Made Simple
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-lg">
                    Build modular, scalable web apps with independent frontend
                    modules that work together seamlessly.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    size="lg"
                    className="bg-teal-500 hover:bg-teal-500/90"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-purple text-purple hover:bg-purple/10"
                  >
                    View Docs
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-sm">
                  <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-purple-500 to-teal-500 opacity-75 blur"></div>
                  <div className="relative rounded-lg bg-white p-2 h-[300px]"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Simplified */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold">Key Features</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Everything you need to build amazing modular applications
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-amber/10 border border-amber/20 transition-all hover:shadow-md">
                <Layers className="h-12 w-12 text-amber mb-4" />
                <h3 className="text-xl font-bold">Modular Architecture</h3>
                <p className="text-muted-foreground mt-2">
                  Build independent modules that can be developed and deployed
                  separately.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-coral/10 border border-coral/20 transition-all hover:shadow-md">
                <Code className="h-12 w-12 text-coral mb-4" />
                <h3 className="text-xl font-bold">Technology Agnostic</h3>
                <p className="text-muted-foreground mt-2">
                  Mix different frontend frameworks within the same application.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-magenta/10 border border-magenta/20 transition-all hover:shadow-md">
                <Rocket className="h-12 w-12 text-magenta mb-4" />
                <h3 className="text-xl font-bold">Performance Optimized</h3>
                <p className="text-muted-foreground mt-2">
                  Load only the code needed for each route, improving load
                  times.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Simplified with colorful steps */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-br from-teal/10 to-amber/10">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Three simple steps to microfrontend success
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-white p-6 rounded-xl shadow-md relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-purple flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mt-2 text-purple">
                  Break Down Your App
                </h3>
                <p className="text-muted-foreground mt-2">
                  Divide your application into logical, independent modules.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mt-2 text-teal">
                  Develop Independently
                </h3>
                <p className="text-muted-foreground mt-2">
                  Each team builds their module with their own codebase and
                  pipeline.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-coral flex items-center justify-center text-white font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mt-2 text-coral">
                  Integrate with Router
                </h3>
                <p className="text-muted-foreground mt-2">
                  Use React Router to seamlessly integrate all modules together.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-r from-purple-500 to-teal-500 text-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="max-w-2xl mx-auto mb-8 text-white/80">
              Try our demo application and see microfrontends in action with
              React Router.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-purple-500 hover:bg-white/90"
              >
                View Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-teal-500 hover:bg-white/10"
              >
                Read Documentation
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 bg-gradient-to-r from-purple/5 to-teal/5">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 m-auto">
            <Puzzle className="h-6 w-6 text-purple" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-500 to-teal-500 bg-clip-text text-transparent">
              Microfrontends
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
