'use client';

import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { useState } from 'react';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';
import { useEvent } from '@/src/hooks/useEvent';
import { eventSchema } from '@/src/validations/event.schema';
import { Header } from '@/components/ui/Header';

export default function NewEvent() {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { createEvent, isPending } = useEvent();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const deadlineTimestamp = new Date(deadline).getTime();

    if (isNaN(deadlineTimestamp)) {
      setError('Please enter a valid date');
      return;
    }

    const validationResult = eventSchema.safeParse({
      name,
      deadline: deadlineTimestamp,
    });

    if (!validationResult.success) {
      const formattedError = validationResult.error.issues[0].message;
      setError(formattedError);
      return;
    }

    const eventData = {
      name: name,
      deadline: deadlineTimestamp,
    };

    try {
      await createEvent.mutateAsync(eventData);
    } catch (err) {}
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Header backText="Back" backTo="/dashboard" showBackButton={true} />

      <div className="flex flex-col justify-center items-center pt-24 px-6 pb-12 w-full max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
        <p className="text-default-500 mb-8">Set up your event details</p>

        <div className="w-full max-w-3xl">
          <Card className="shadow-md">
            <CardHeader className="flex flex-col gap-2 pb-0">
              <h2 className="text-2xl font-bold">Event Details</h2>
              <p className="text-default-500">
                Fill in the information below to create your event
              </p>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="relative w-full">
                  <label
                    htmlFor="name"
                    className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
                  >
                    Event Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter event name"
                    variant="bordered"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    isRequired
                    classNames={{
                      base: 'pt-2',
                      input: 'outline-none pt-1',
                    }}
                  />
                </div>

                <div className="relative w-full">
                  <label
                    htmlFor="deadline"
                    className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
                  >
                    Deadline
                  </label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    placeholder="Select deadline"
                    variant="bordered"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    isRequired
                    classNames={{
                      base: 'pt-2',
                      input: 'outline-none pt-1',
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  size="lg"
                  isLoading={isPending}
                >
                  Create Event
                </Button>
                <div className="h-[60px] flex items-center justify-center w-full">
                  {error && (
                    <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
                      {error}
                    </div>
                  )}

                  {createEvent.isError && !error && (
                    <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50">
                      {createEvent.error.response?.data?.message ||
                        'An error occurred. Please try again later.'}
                    </div>
                  )}
                </div>
              </form>
            </CardBody>
            <CardFooter>{/* Button moved inside the form above */}</CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
