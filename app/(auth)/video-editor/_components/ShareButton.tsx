import { useState, useRef, useEffect } from 'react';
import {
  ShareIcon,
  PlusIcon,
  XMarkIcon,
  UserIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@heroui/button';
import { useInvitee } from '@/src/hooks//useInvitee';
import { AxiosError } from 'axios';
import { useUser } from '@/src/hooks/useUser';

interface ShareButtonProps {
  eventId: string;
}

const ShareButton = ({ eventId }: ShareButtonProps) => {
  const {
    getInvitees,
    createInvitee,
    deleteInvitee,
    isPending,
    isLoading,
    invitees,
  } = useInvitee(eventId);

  const { data: user, isLoading: userLoading } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [copiedInviteeId, setCopiedInviteeId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInviteeName, setNewInviteeName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Filter out owner from displayed invitees
  const displayedInvitees = invitees.filter(
    (invitee) => invitee.name.toLowerCase().trim() !== user?.username
  );

  // Constant limit of 4 visible invitees in UI
  const maxVisibleInvitees = 4;

  // Total limit is 5 (including owner that might exist in backend)
  const totalMaxInvitees = 5;

  // Generate links for invitees that don't have them
  const inviteesWithLinks = displayedInvitees.map((invitee) => ({
    ...invitee,
    link: `http://localhost:3000/invitee-upload/${eventId}/${invitee.id}`,
  }));

  const handleAddInvitee = async () => {
    if (invitees.length >= totalMaxInvitees) {
      setError(`Maximum number of invitees (${maxVisibleInvitees}) reached`);
      return;
    }

    if (!newInviteeName.trim()) {
      setError('Invitee name cannot be empty');
      return;
    }

    const isOwnerNameDuplicated =
      newInviteeName.trim().toLowerCase() === user?.username;

    if (isOwnerNameDuplicated) {
      setError('Invitee name cannot be the same as the owner name');
      return;
    }

    // Check for duplicate names
    const isDuplicate = invitees.some(
      (invitee) =>
        invitee.name.toLowerCase().trim() ===
        newInviteeName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError('An invitee with this name already exists');
      return;
    }

    try {
      await createInvitee.mutateAsync({ names: [newInviteeName.trim()] });
      // Reset form after successful creation
      setShowAddForm(false);
      setNewInviteeName('');
      setError(null);
    } catch (err) {
      let errorMessage = 'Failed to add invitee';

      if (err instanceof AxiosError) {
        errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message;
      }

      setError(errorMessage);
    }
  };

  const handleRemoveInvitee = async (id: string) => {
    try {
      await deleteInvitee.mutateAsync(id);
    } catch (err) {}
  };

  // Effect to refresh invitees when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      getInvitees.refetch();
    }
  }, [isOpen, getInvitees]);

  const cancelAdd = () => {
    setShowAddForm(false);
    setNewInviteeName('');
    setError(null);
  };

  const handleCopyLink = (link: string, inviteeId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedInviteeId(inviteeId);
    setTimeout(() => setCopiedInviteeId(null), 3000);
  };

  const handleAddInviteeClick = () => {
    setShowAddForm(true);
    setError(null);
    // Focus the input after form appears
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowAddForm(false);
        setNewInviteeName('');
        setError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect to scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onPress={() => setIsOpen(!isOpen)}
        color="primary"
        variant="light"
        startContent={<ShareIcon className="h-5 w-5" />}
      >
        Share to invitees
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-3 border border-gray-200 shadow-xl rounded-xl bg-white/95 backdrop-blur-md z-10 min-w-[380px] overflow-hidden">
          <div className="p-0">
            <div className="max-h-[350px] overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <p className="text-center text-gray-500">
                    Loading invitees...
                  </p>
                </div>
              ) : displayedInvitees.length === 0 ? (
                <>
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <UserIcon className="h-12 w-12 mb-2 stroke-1" />
                    <p className="text-center text-gray-500">
                      No invitees added yet
                    </p>
                  </div>

                  {showAddForm && (
                    <div className="mt-4 p-4 border border-primary-200 rounded-xl bg-primary-50/50">
                      <div className="flex flex-col space-y-3">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="Invitee Name"
                          value={newInviteeName}
                          onChange={(e) => setNewInviteeName(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                          disabled={isPending}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={cancelAdd}
                            className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                            disabled={isPending}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddInvitee}
                            className={`text-xs bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors ${
                              isPending ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            disabled={isPending}
                          >
                            {isPending ? 'Adding...' : 'Add Invitee'}
                          </button>
                        </div>
                        {error && (
                          <div
                            ref={errorRef}
                            className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200 flex items-center"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1.5" />
                            {error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {inviteesWithLinks.map((invitee) => (
                      <div
                        key={invitee.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
                      >
                        <div className="flex items-center">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {invitee.name}
                            </span>
                            <span className="text-xs text-gray-400 truncate max-w-[160px]">
                              {invitee.link}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(invitee.link, invitee.id);
                            }}
                            className={`text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-full transition-all ${
                              copiedInviteeId === invitee.id
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {copiedInviteeId === invitee.id ? (
                              <>
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveInvitee(invitee.id);
                            }}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-full transition-all"
                            aria-label="Remove invitee"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showAddForm && (
                    <div className="mt-4 p-4 border border-primary-200 rounded-xl bg-primary-50/50">
                      <div className="flex flex-col space-y-3">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="Invitee Name"
                          value={newInviteeName}
                          onChange={(e) => setNewInviteeName(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                          disabled={isPending}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={cancelAdd}
                            className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                            disabled={isPending}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddInvitee}
                            className={`text-xs bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors ${
                              isPending ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            disabled={isPending}
                          >
                            {isPending ? 'Adding...' : 'Add Invitee'}
                          </button>
                        </div>
                        {error && (
                          <div
                            ref={errorRef}
                            className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200 flex items-center"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1.5" />
                            {error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && !showAddForm && (
                <div
                  ref={errorRef}
                  className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1.5" />
                  {error}
                </div>
              )}

              {!showAddForm && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleAddInviteeClick}
                    disabled={
                      displayedInvitees.length >= maxVisibleInvitees ||
                      isPending
                    }
                    className={`flex items-center gap-2 text-sm py-2 px-4 rounded-lg transition-all ${
                      displayedInvitees.length >= maxVisibleInvitees ||
                      isPending
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Invitee</span>
                  </button>
                </div>
              )}
            </div>

            {displayedInvitees.length > 0 && (
              <div className="border-t border-gray-200 p-3 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {displayedInvitees.length}{' '}
                  {displayedInvitees.length === 1 ? 'invitee' : 'invitees'} (
                  {maxVisibleInvitees - displayedInvitees.length} remaining)
                </span>
                <button
                  className="text-xs bg-primary-600 hover:bg-primary-700 text-white py-1.5 px-3 rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
