import { useState } from 'react';
import { ReactComponent as IconClose } from '../assets/img/close.svg';
import { ReactComponent as IconLoop } from '../assets/img/loop.svg';
import { ReactComponent as IconRecord } from '../assets/img/record.svg';
import { ReactComponent as IconReset } from '../assets/img/reset.svg';
import { ReactComponent as IconStop } from '../assets/img/stop.svg';
import { loop, notesToKeys } from '../utils/looper';

import './Track.scss';

interface TrackProps {
  track: RecordedTrack,
  close: () => void,
  update: (track: RecordedTrack) => RecordedTrack
}

export const Track = ({ track, close, update }: TrackProps) => {
  const [recordMode, setRecordMode] = useState(track.isRecording);
  const [loopMode, setLoopMode] = useState(track.isLoop);

  const handleRecord = () => {
    track.isRecording = !track.isRecording;
    setLoopMode(false)
    setRecordMode(!recordMode)
  }

  const handleLoop = () => {
    track.isLoop = !track.isLoop
    setRecordMode(false)
    setLoopMode(!loopMode)
    loop(track)
  }

  const handleReset = () => {
    return update({
      instrument: '',
      notes: [],
      isLoop: false,
      isRecording: false
    })
  }

  return (
    <div className="track">
      <p>{ track.instrument }</p>
      <p>{ notesToKeys(track.notes) }</p>
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
          onClick={handleReset}
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