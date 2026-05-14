/*import Header from "@/components/header";
import { SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <Header />

      <main className="pt-20 px-6">
        {/* SUBSCRIBE SECTION – ONLY BEFORE SIGN IN} */
       /* <SignedOut>
          <div className="max-w-3xl">
            <p className="text-lg mb-2">
              Subscribe to RoadsideCoder
            </p>

            <button className="bg-red-600 text-white px-4 py-2 rounded">
              Subscribe
            </button>
          </div>
        </SignedOut>
      </main>
    </>
  );
}
*/import Header from "@/components/header";
import Image from "next/image";
import Link from "next/link";

import { FEATURES, STEPS, TESTIMONIALS } from "@/lib/landing";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <>
      <Header />

      <main className="pt-28 px-6">

        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto">
          <span className="inline-block mb-4 rounded-full bg-green-100 px-4 py-1 text-sm text-green-700">
            Split expenses. Simplify life.
          </span>

          <h1 className="text-4xl md:text-6xl font-bold text-green-600">
            The smartest way to split expenses with friends
          </h1>

          <p className="mt-4 text-gray-600 md:text-lg">
            Track shared expenses, split bills effortlessly, and settle up
            quickly. Never worry about who owes who again.
          </p>

          <div className="mt-6 flex justify-center gap-4">
  <Button asChild className="bg-green-600 hover:bg-green-700">
    <Link href="/dashboard">
      Get Started <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  </Button>

  <Button asChild variant="outline" className="border-green-600 text-green-600">
    <a href="#features">
      See How It Works
    </a>
  </Button>
</div>
        </section>

        {/* HERO IMAGE */}
        <div className="mt-16 max-w-6xl mx-auto">
          <Image
            src="/hero.png"
            alt="Splitr Hero"
            width={1280}
            height={720}
            className="rounded-xl shadow-xl"
            priority
          />
        </div>

        {/* FEATURES SECTION */}
        <section id="features" className="bg-gray-50 py-20 mt-20">
          <div className="container mx-auto px-4 md:px-6 text-center">

            <Badge variant="outline" className="bg-green-100 text-green-700">
              Features
            </Badge>

            <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
              Everything you need to split expenses
            </h2>

            <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-xl/relaxed">
              Our platform provides all the tools you need to handle shared expenses with ease.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
              {FEATURES.map(({ title, Icon, bg, color, description }) => (
                <Card
                  key={title}
                  className="flex flex-col items-center space-y-4 p-6 text-center"
                >
                  <div className={`rounded-full p-3 ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>

                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="text-gray-500">{description}</p>
                </Card>
              ))}
            </div>

          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
<section id="how-it-works" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">

            <Badge variant="outline" className="bg-green-100 text-green-700">
              Testimonials
            </Badge>

            <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
              What our users are saying
            </h2>

            <div className="mx-auto mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map(({ quote, name, role, image }) => (
                <Card key={name}>
                  <CardContent className="space-y-4 pt-6">
                    <p className="text-gray-500">“{quote}”</p>

                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={image} alt={name} />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="text-left">
                        <p className="font-semibold">{name}</p>
                        <p className="text-sm text-gray-500">{role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

          </div>
        </section>

        {/* STEPS SECTION (ADDED AT LAST) */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">

            <h2 className="text-3xl md:text-4xl font-bold">
              Splitting expenses has never been easier
            </h2>

            <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-xl/relaxed">
              Follow these simple steps to start tracking and splitting expenses with friends.
            </p>

            <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
              {STEPS.map(({ label, title, description }) => (
                <div
                  key={label}
                  className="flex flex-col items-center space-y-4 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600">
                    {label}
                  </div>

                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="text-gray-500">{description}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

 <section className="py-20 gradient bg-green-500 from-green-500 to-green-700">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
            Ready to simplify expense sharing?
          </h2>
          <p className="mx-auto max-w-[600px] text-green-100 md:text-xl/relaxed">
            Join thousands of users who have made splitting expenses stress-free.
          </p>
        <Button asChild size="lg" className="bg-green-800 hover:opacity-90">
  <Link href="/dashboard">
              Get Started
              {/* ArrowRight icon component usage */}
              <ArrowRight className="ml-2 h-4 w-4" /> 
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-white py-4">
        <div className="container mx-auto px-4 md:px-6 flex justify-center items-center">
          {/* N logo would go here as an image or icon */}
          <span className="text-gray-600">Make Splitting Simple </span> 
          <span className="text-red-500 mx-1">❤️</span> 
          
        </div>
      </footer>
  
      </main>
    </>
  );
}
console.log(
  "CONVEX URL:",
  process.env.NEXT_PUBLIC_CONVEX_URL
);
