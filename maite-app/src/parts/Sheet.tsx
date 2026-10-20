// Windows: a glass dialog (HeroUI Modal) and a glass side sheet (HeroUI Drawer, a bottom sheet on phones).
// HeroUI keeps focus, Escape and the backdrop; the glass is our own surface inside the dialog.
import { useEffect, useState, type ReactNode } from 'react';
import { Drawer, Modal } from '@heroui/react';
import { Glass } from '../lib/glass';

interface Props { isOpen: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg'; subtitle?: ReactNode }

const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' };

// Keeps a window mounted while it plays its closing animation, then removes it. React Aria waits for the
// animation's end event, which the browser can drop if the page updates mid-close (a reload after saving),
// leaving an invisible window over the page; unmounting on a timer makes that impossible.
export function useMounted(isOpen: boolean) {
  const [mounted, setMounted] = useState(isOpen);
  useEffect(() => {
    if (isOpen) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [isOpen]);
  return mounted || isOpen;
}
export function Dialog({ isOpen, onClose, title, subtitle, children, footer, size = 'md' }: Props) {
  if (!useMounted(isOpen)) return null;
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={o => { if (!o) onClose(); }} variant="blur" className="!bg-black/40">
      <Modal.Container placement="auto" scroll="inside" size={size === 'lg' ? 'lg' : 'md'}>
        <Modal.Dialog className={`!max-h-none !overflow-visible !bg-transparent !p-0 !shadow-none w-full ${widths[size]}`}>
          <Glass radius={28} strength="strong" className="w-full">
            <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
              <Modal.Header className="flex items-start gap-3 px-6 pt-6 pb-2">
                <div className="min-w-0 flex-1">
                  <Modal.Heading className="text-xl font-semibold tracking-tight">{title}</Modal.Heading>
                  {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
                </div>
                <Modal.CloseTrigger aria-label="Tanca" />
              </Modal.Header>
              <Modal.Body className="min-h-0 flex-1 overflow-y-auto px-6 py-3">{children}</Modal.Body>
              {footer && <Modal.Footer className="flex flex-wrap justify-end gap-2 px-6 pt-3 pb-6">{footer}</Modal.Footer>}
            </div>
          </Glass>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function useNarrow() {
  const q = '(max-width: 767px)';
  const [narrow, setNarrow] = useState(() => matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q); const f = () => setNarrow(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return narrow;
}

export function SideSheet({ isOpen, onClose, title, subtitle, children, footer }: Props) {
  const narrow = useNarrow();
  if (!useMounted(isOpen)) return null;
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={o => { if (!o) onClose(); }} variant="blur" className="!bg-black/40">
      <Drawer.Content placement={narrow ? 'bottom' : 'right'} className={narrow ? '!p-0' : '!p-3'}>
        <Drawer.Dialog className={`!bg-transparent !p-0 !shadow-none ${narrow ? 'h-[92dvh] w-full' : 'h-full w-[min(640px,92vw)]'}`}>
          <Glass radius={narrow ? 28 : 30} strength="strong" className="h-full w-full">
            <div className="flex h-full flex-col">
              {narrow && <Drawer.Handle className="mt-2" />}
              <Drawer.Header className="flex items-start gap-3 px-6 pt-5 pb-2">
                <div className="min-w-0 flex-1">
                  <Drawer.Heading className="text-2xl font-semibold tracking-tight">{title}</Drawer.Heading>
                  {subtitle && <div className="mt-1.5 text-sm text-muted">{subtitle}</div>}
                </div>
                <Drawer.CloseTrigger aria-label="Tanca" />
              </Drawer.Header>
              <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</Drawer.Body>
              {footer && <Drawer.Footer className="flex flex-wrap justify-end gap-2 px-6 pb-6">{footer}</Drawer.Footer>}
            </div>
          </Glass>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
