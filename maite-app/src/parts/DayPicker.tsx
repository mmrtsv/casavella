// A day, picked on a calendar instead of the browser's own; '' is no day. clearable adds «Sense dia» under the calendar.
// past lets it take days already gone. Used by Xarxes socials and Analítica.
import { useState } from 'react';
import { Button, Calendar, DateField, DatePicker, I18nProvider, Label } from '@heroui/react';
import { getLocalTimeZone, parseDate, today as todayIn, type DateValue } from '@internationalized/date';

export function DayPicker({ label, value, onChange, clearable, hideLabel, past }: { label: string; value: string; onChange: (v: string) => void; clearable?: boolean; hideLabel?: boolean; past?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <I18nProvider locale="ca-ES">
      <DatePicker aria-label={hideLabel ? label : undefined} value={value ? parseDate(value) : null} minValue={past ? undefined : todayIn(getLocalTimeZone())}
        onChange={(d: DateValue | null) => onChange(d ? d.toString().slice(0, 10) : '')} isOpen={open} onOpenChange={setOpen} className="w-40 shrink-0">
        {!hideLabel && <Label>{label}</Label>}
        <DateField.Group fullWidth>
          <DateField.Input>{segment => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix><DatePicker.Trigger><DatePicker.TriggerIndicator /></DatePicker.Trigger></DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover>
          <Calendar aria-label={label}>
            <Calendar.Header>
              <Calendar.Heading />
              <Calendar.NavButton slot="previous" />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>{d => <Calendar.HeaderCell>{d}</Calendar.HeaderCell>}</Calendar.GridHeader>
              <Calendar.GridBody>{d => <Calendar.Cell date={d} />}</Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
          {clearable && value && <Button size="sm" variant="ghost" className="mt-2 w-full" onPress={() => { onChange(''); setOpen(false); }}>Sense dia</Button>}
        </DatePicker.Popover>
      </DatePicker>
    </I18nProvider>
  );
}

