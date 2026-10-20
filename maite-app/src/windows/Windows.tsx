// Every window lives here, mounted once; which one is open is in lib/ui
import { ClientFile } from './ClientFile';
import { BlockDates, Cancel, NewBooking } from './Forms';
export default function Windows() {
  return <><ClientFile /><NewBooking /><BlockDates /><Cancel /></>;
}
