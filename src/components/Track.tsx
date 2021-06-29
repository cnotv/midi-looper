import { useState } from 'react';
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
  const [recordMode, setRecordMode] = useState(false);
  const [loopMode, setLoopMode] = useState(false);

  const handleRecord = () => {
    record(!recordMode);
    setRecordMode(!recordMode);
  }

  const handleLoop = () => {
    loop()
    setLoopMode(!loopMode);
  }

  return (
    <div className="track">
      <p>{ played }</p>
      <div className="track__actions">
        <button
          className={`button ${recordMode ? ' button--active' : ''}`}
          onClick={handleRecord}
        >
          {recordMode ? <IconStop /> : <IconRecord />}
        </button>

        <button
          className={`button ${loopMode ? ' button--active' : ''}`}
          onClick={handleLoop}
        >
          <IconLoop />
        </button>

        <button
          className="button"
          onClick={reset}
        >
          <IconReset />
        </button>
      </div>

      <button
        className="button button--close"
        onClick={close}
      >
        <IconClose />
      </button>
    </div>
  )
};