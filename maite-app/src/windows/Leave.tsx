// Asked when leaving a page (or a stay) with changes that are not saved yet
import { useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { Dialog } from '../parts/Sheet';
import { discard, saveAndGo, stay, usePending } from '../lib/guard';

export function Leave() {
  const open = usePending();
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); await saveAndGo(); setBusy(false); };
  return (
    <Dialog isOpen={open} onClose={stay} title="Tens canvis sense desar" subtitle="Si surts ara, es perdran."
      footer={<>
        <Button variant="ghost" onPress={stay}>Continua editant</Button>
        <Button variant="danger-soft" onPress={discard}>Descarta</Button>
        <Button isPending={busy} onPress={save}>{busy && <Spinner size="sm" color="current" />}Desa</Button>
      </>}>
      <p className="text-sm text-muted">Desa'ls per continuar, o descarta'ls per tornar a com estava.</p>
    </Dialog>
  );
}
