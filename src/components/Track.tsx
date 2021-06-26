import { ReactComponent as IconClose } from '../assets/img/close.svg';
import { ReactComponent as IconLoop } from '../assets/img/loop.svg';
import { ReactComponent as IconRecord } from '../assets/img/record.svg';
import { ReactComponent as IconReset } from '../assets/img/reset.svg';
import { ReactComponent as IconStop } from '../assets/img/stop.svg';

import './Track.scss';

interface TrackProps {
  played: string,
  record: (status: boolean) => void,
  loop: () => void,
  reset: () => void,
  close: () => void,
}

export const Track = ({ played, record, loop, reset, close }: TrackProps) => {
  return (
    <div className="track">
      <h1>#1</h1>
      <p>{ played }</p>
      <div className="track__actions">
        <button onClick={() => record(true)}>
          <IconRecord />
        </button>
        <button onClick={() => record(false)}>
          <IconStop />
        </button>
        <button onClick={() => loop()}>
          <IconLoop />
        </button>
        <button onClick={() => reset()}>
          <IconReset />
        </button>
      </div>
      <button className="close" onClick={() => close()}>
        <IconClose />
      </button>
    </div>
  )
};