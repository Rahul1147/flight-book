'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import type { UserRole } from '@prisma/client';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

type AirportOption = {
  id: string;
  iata: string;
  name: string;
  city: string;
};

type UserRoleMenuProps = {
  userId: string;
  airports: AirportOption[];
  onRoleChange: (userId: string, role: UserRole, managedAirportId?: string) => Promise<void>;
};

export default function UserRoleMenu({ userId, airports, onRoleChange }: UserRoleMenuProps) {
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedAirportId, setSelectedAirportId] = useState(airports[0]?.id ?? '');

  useEffect(() => {
    if (!selectedAirportId && airports[0]?.id) {
      setSelectedAirportId(airports[0].id);
    }
  }, [airports, selectedAirportId]);

  const handleRoleChange = (role: UserRole, managedAirportId?: string) => {
    startTransition(() => {
      void onRoleChange(userId, role, managedAirportId);
    });
  };

  const openAirportDialog = () => {
    if (airports.length === 0) return;
    setSelectedAirportId((current) => current || airports[0].id);
    dialogRef.current?.showModal();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            Change Role
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => handleRoleChange('USER')}>
            Set as User
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openAirportDialog} disabled={airports.length === 0}>
            Set as Airport Manager
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleRoleChange('ADMIN')}>
            Set as Admin
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <dialog ref={dialogRef} className="rounded-lg p-0 shadow-xl backdrop:bg-black/50">
        <div className="w-[min(90vw,420px)] space-y-4 p-6">
          <div>
            <h3 className="text-lg font-semibold">Assign Airport</h3>
            <p className="text-sm text-muted-foreground">
              Select the airport this manager will control.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor={`airport-${userId}`} className="text-sm font-medium">
              Airport
            </label>
            <select
              id={`airport-${userId}`}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedAirportId}
              onChange={(event) => setSelectedAirportId(event.target.value)}
            >
              {airports.map((airport) => (
                <option key={airport.id} value={airport.id}>
                  {airport.iata} - {airport.name} ({airport.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                dialogRef.current?.close();
                handleRoleChange('AIRPORT_MANAGER', selectedAirportId);
              }}
              disabled={!selectedAirportId}
            >
              Save
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
