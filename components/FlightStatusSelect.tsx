'use client';

import { useTransition } from 'react';
import type { FlightStatus } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FlightStatusSelectProps = {
  flightId: string;
  value: FlightStatus;
  onStatusChange: (flightId: string, status: FlightStatus) => Promise<void>;
};

export default function FlightStatusSelect({
  flightId,
  value,
  onStatusChange,
}: FlightStatusSelectProps) {
  const [, startTransition] = useTransition();

  const handleChange = (status: string) => {
    startTransition(() => {
      void onStatusChange(flightId, status as FlightStatus);
    });
  };

  return (
    <Select defaultValue={value} onValueChange={handleChange}>
      <SelectTrigger className="h-10 w-[170px] rounded-xl border-slate-300 bg-white text-xs font-semibold tracking-wide text-slate-700 sm:w-[190px]">
        <SelectValue placeholder="Set Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
        <SelectItem value="DELAYED">DELAYED</SelectItem>
        <SelectItem value="BOARDING">BOARDING</SelectItem>
        <SelectItem value="CANCELLED">CANCELLED</SelectItem>
      </SelectContent>
    </Select>
  );
}