'use client';

import Link from 'next/link';
import { Button } from '@heroui/button';
import { useUser } from '@/src/hooks/useUser';
import { useAuth } from '@/src/hooks/useAuth';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';
import { useEvent } from '@/src/hooks/useEvent';
import { EventsByOwnerId } from '@/src/types/event';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Header } from '@/components/ui/Header';

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const { getEvents, deleteEvent } = useEvent();
  const { data: eventsData = [], isLoading: eventsLoading } = getEvents;
  const events: EventsByOwnerId[] = Array.isArray(eventsData)
    ? eventsData
    : [eventsData].filter(Boolean);

  const { signOut } = useAuth();

  if (userLoading || eventsLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div>Loading...</div>
      </main>
    );
  }

  // Create date formatter using Intl API
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync(eventId);
    } catch (error) {}
  };

  const logoutButton = (
    <Button color="primary" variant="light" onPress={() => signOut.mutate()}>
      Logout
    </Button>
  );

  return (
    <main className="flex min-h-screen flex-col">
      <Header actions={logoutButton} />

      <div className="flex flex-col justify-center items-center pt-24 px-6 pb-12 w-full max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {user?.username || 'User'}!
        </h1>
        <p className="text-default-500 mb-8">{user?.email}</p>

        <div className="flex w-full gap-8">
          {/* Left Column - Create Event Widget */}
          <div className="w-full">
            <Card className="shadow-md">
              <CardHeader className="flex flex-col gap-2 pb-0">
                <h2 className="text-2xl font-bold">Create</h2>
                <p className="text-default-500">
                  Start a new celebration event
                </p>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col mt-2 mb-4">
                  <p className="text-default-500">
                    Create a new event to track your celebration timeline and
                    preparation steps.
                  </p>
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  as={Link}
                  href="/new-event"
                  color="primary"
                  variant="solid"
                  fullWidth
                  size="lg"
                  className="mt-2"
                >
                  New Event
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column - Event Listings Widget */}
          <div className="w-full">
            <Card className="shadow-md">
              <CardHeader className="flex flex-col gap-2 pb-0">
                <h2 className="text-2xl font-bold">Your Events</h2>
                <p className="text-default-500">
                  Track your celebration timelines
                </p>
              </CardHeader>
              <CardBody>
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="text-xl font-semibold mb-2">
                      No events yet
                    </h3>
                    <p className="text-default-500 max-w-sm">
                      Create your first event to start planning your
                      celebration. It's easy to get started!
                    </p>
                  </div>
                ) : (
                  <ul
                    className={`flex flex-col gap-4 ${events.length > 4 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}
                  >
                    {events.map((event) => (
                      <li
                        key={event.id}
                        className="border-b border-default-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <h3 className="text-lg font-semibold">
                              <Link
                                href={`/video-editor/${event.id}`}
                                className="hover:text-primary hover:underline transition-colors"
                              >
                                {event.name}
                              </Link>
                            </h3>
                            <p className="text-default-500">
                              <span>
                                Created:{' '}
                                {dateFormatter.format(
                                  new Date(event.createdAt)
                                )}
                              </span>
                              <span className="mx-1">•</span>
                              <span>
                                Due:{' '}
                                {dateFormatter.format(new Date(event.deadline))}
                              </span>
                            </p>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            aria-label="Delete event"
                            onPress={() => {
                              handleDeleteEvent(event.id);
                            }}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
