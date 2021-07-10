import { ReactComponent as IconClose } from '../assets/img/close.svg';
import { ReactComponent as IconLoop } from '../assets/img/loop.svg';
import { ReactComponent as IconRecord } from '../assets/img/record.svg';
import { ReactComponent as IconReset } from '../assets/img/reset.svg';
import { ReactComponent as IconStop } from '../assets/img/stop.svg';
import { notesToKeys } from '../utils/Looper';
import { newTrack } from '../utils/Track';

import './Track.scss';

interface TrackProps {
  track: RecordedTrack,
  close: () => void,
  active: boolean,
  update: (track: RecordedTrack) => void
}

export const Track = ({ track, close, active, update }: TrackProps) => {

  const handleRecord = () => {
    update({
      ...track,
      isRecording: !track.isRecording,
      isLoop: false
    })
  }

  const handleLoop = () => {
    update({
      ...track,
      isRecording: false,
      isLoop: !track.isLoop
    });
  }

  const handleReset = () => {
    update(newTrack())
  }

  return (
    <div className={`track ${active ? ' track--active' : ''}`}>
      <header className="track__header">
        <span>{ track.instrument }</span>
        <button
          className="button button--small"
          onClick={close}
        >
          <IconClose />
        </button>
      </header>
      
      <p>{notesToKeys(track.notes)}</p>
      
      <div className="track__actions">
        <button
          className={`button ${track.isRecording ? ' button--active' : ''}`}
          onClick={handleRecord}
        >
          {track.isRecording ? <IconStop /> : <IconRecord />}
        </button>

        <button
          className={`button ${track.isLoop ? ' button--active' : ''}`}
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
    </div>
  )
};