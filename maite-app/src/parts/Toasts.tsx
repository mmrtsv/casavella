// The toast region, loaded after the first paint
import { Toast } from '@heroui/react';
export default function Toasts() {
  return <Toast.Provider placement="bottom" maxVisibleToasts={3} className="max-lg:!bottom-24" />;
}
