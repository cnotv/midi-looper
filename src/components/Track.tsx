import { ReactComponent as IconClose } from '../assets/img/close.svg';
import { ReactComponent as IconLoop } from '../assets/img/loop.svg';
import { ReactComponent as IconRecord } from '../assets/img/record.svg';
import { ReactComponent as IconReset } from '../assets/img/reset.svg';
import { ReactComponent as IconStop } from '../assets/img/stop.svg';
import { loop, notesToKeys } from '../utils/looper';
import { newTrack } from '../utils/track';

import './Track.scss';

interface TrackProps {
  track: RecordedTrack,
  close: () => void,
  update: (track: RecordedTrack) => void
}

export const Track = ({ track, close, update }: TrackProps) => {

  const handleRecord = () => {
    update({
      ...track,
      isRecording: !track.isRecording,
      isLoop: false
    })
  }

  const handleLoop = () => {
    loop(track);

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
    <div className="track">
      <p>{ track.instrument }</p>
      <p>{ notesToKeys(track.notes) }</p>
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

      <button
        className="button button--close"
        onClick={close}
      >
        <IconClose />
      </button>
    </div>
  )
};