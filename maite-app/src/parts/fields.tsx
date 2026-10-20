// Small wrappers so forms read cleanly: a labelled text/date field, a labelled select and a checkbox
import type { ReactNode } from 'react';
import { Checkbox, Description, Input, Label, ListBox, Select, TextArea, TextField, type Key } from '@heroui/react';

export function Field({ label, value, onChange, type = 'text', placeholder, help, area, className = '', inputMode, onBlur }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; help?: ReactNode; area?: boolean;
  className?: string; inputMode?: 'numeric' | 'decimal' | 'text' | 'tel' | 'email'; onBlur?: () => void;
}) {
  return (
    <TextField type={type} value={value} onChange={onChange} onBlur={onBlur} fullWidth className={className}>
      <Label>{label}</Label>
      {area ? <TextArea rows={2} placeholder={placeholder} /> : <Input placeholder={placeholder} inputMode={inputMode} autoComplete="off" />}
      {help && <Description>{help}</Description>}
    </TextField>
  );
}

export function Choice({ label, value, onChange, items, placeholder, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; items: { id: string; name: string }[]; placeholder?: string; className?: string;
}) {
  return (
    <Select value={value || null} onChange={(v: Key | null) => onChange(v == null ? '' : String(v))} placeholder={placeholder} fullWidth className={className}>
      <Label>{label}</Label>
      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
      <Select.Popover>
        <ListBox items={items}>{it => <ListBox.Item id={it.id} textValue={it.name}>{it.name}<ListBox.ItemIndicator /></ListBox.Item>}</ListBox>
      </Select.Popover>
    </Select>
  );
}

export function Check({ isSelected, onChange, children }: { isSelected: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <Checkbox isSelected={isSelected} onChange={onChange}>
      <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>{children}</Checkbox.Content>
    </Checkbox>
  );
}
