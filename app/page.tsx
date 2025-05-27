'use client';

import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Divider } from '@heroui/divider';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';

export default function Home() {

  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main>
      <Header
        actions={
          <>
            <Button
              variant="light"
              onPress={scrollToHowItWorks}
              className="text-default-600"
            >
              How it works?
            </Button>
            <Button as={Link} href="/signup" color="primary" variant="solid">
              Sign Up
            </Button>
          </>
        }
      />

      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center justify-center max-w-7xl mx-auto px-4 pt-16">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h1 className="text-6xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Celebration
            </span>
            <br />
            your simple way to create celebration videos
          </h1>
          <p className="text-xl text-default-600">
            Create beautiful celebration videos with ease
          </p>
          <Button
            as={Link}
            href="/signin"
            color="primary"
            size="lg"
            variant="shadow"
            radius="full"
            className="px-12 py-6 text-lg font-medium"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How it works</h2>
          <Divider className="my-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              step: 'Step #1',
              title: 'Create event',
              description: 'Start by creating your celebration event',
            },
            {
              step: 'Step #2',
              title: 'Add participants',
              description: 'Invite people to join your celebration',
            },
            {
              step: 'Step #3',
              title: 'Share unique upload links',
              description: 'Send personalized upload links to participants',
            },
            {
              step: 'Step #4',
              title: 'Receive videos',
              description: 'Collect video messages from participants',
            },
            {
              step: 'Step #5',
              title: 'Compile video',
              description: 'Use our simple interface to create the final video',
            },
            {
              step: 'Step #6',
              title: 'Share celebration',
              description: 'Share the compiled video with your loved ones',
            },
          ].map((item, index) => (
            <Card
              key={index}
              className="border-none bg-gradient-to-br from-white to-default-50"
              shadow="sm"
              isPressable
            >
              <CardHeader className="pb-0 pt-4 px-6 flex-col items-start">
                <p className="text-tiny text-primary-500 font-bold uppercase">
                  {item.step}
                </p>
                <h3 className="text-xl font-medium mt-1">{item.title}</h3>
              </CardHeader>
              <CardBody className="py-4 px-6">
                <p className="text-default-500">{item.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
