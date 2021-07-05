import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { ReactComponent as IconAdd } from './assets/img/add.svg';
import { Midi } from "@tonejs/midi";

import { ReactComponent as IconLoop } from './assets/img/loop.svg';
import { ReactComponent as IconReset } from './assets/img/reset.svg';
import { ReactComponent as IconClose } from './assets/img/close.svg';
import { ReactComponent as IconLoad } from './assets/img/load.svg';
import { ReactComponent as IconSave } from './assets/img/save.svg';

import './App.scss';
import { Keyboard } from './components/Keyboard';
import { Track } from './components/Track';
import { Loader } from './components/Loader';
import { save, listenWebMidi, play, info, midiToTracks } from './utils/looper';
import { newTrack } from './utils/track';
import { KEYMAP } from './config/global';
import { SAMPLE } from './config/sample';

let theLoop: NodeJS.Timeout;

// Listen piano keyboard device to the app
listenWebMidi();

function App() {
  const [display, setDisplay] = useState('Input - Note');
  // Allow to store the current note in an index, for duration computation
  const [currentKeys, setCurrentKeys] = useState<Record<string, number>>({});
  const [loadLabel, setLoadLabel] = useState('Load midi');
  // TODO: Replace string with object
  const [tracks, setTracks] = useState<RecordedTrack[]>([newTrack()]);
  const [currentTrack, setCurrentTrack] = useState<number>(0);
  // Prevent infinite loops
  const ref = useRef(null);

  /**
   * Listen computer keyboard to be used as piano device
   */
  useEffect(() => {
    document.addEventListener("keydown", event => playKey(event, 'keydown'));
    // TODO: Create a map to retrieve length of playing time
    document.addEventListener("keyup", event => playKey(event, 'keyup'));
    return () => {
      document.removeEventListener("keydown", event => playKey(event, 'keydown'));
      // TODO: Create a map to retrieve length of playing time
      document.removeEventListener("keyup", event => playKey(event, 'keyup'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  const playKey = (event: KeyboardEvent, keyType: string) => {
    const { key, repeat } = event;
    if (repeat) {
      return;
    }

    let octave = 4;
    // TODO: Verify why 8 and somewhere else 4
    const offset = 8;
    const pos = KEYMAP.indexOf(key);
    const volume = keyType === 'keydown' ? 50 : 0;

    if (pos >= 0) {
      const note = `${pos + offset + octave * 8}`;
      playRecord(note, volume);
    }
  }

  // Start loop
  const loop = ({ isLoop, notes }: RecordedTrack) => {
    if (notes.length) {
      const loopLength = notes[notes.length - 1].time;

      if (isLoop) {
        loopNotes(notes, isLoop);
        theLoop = setInterval(() => loopNotes(notes, isLoop), loopLength);
      } else {
        clearInterval(theLoop);
      }
    }
  };

  /**
   * Loop saved notes using play capabilities
   */
  const loopNotes = (notes: RecordedNote[], isLoop: boolean) => {
    notes.forEach((note) => {
      setTimeout(() => {
        // Prevent to keep playing also after stop
        if (!isLoop) return;

        playRecord(note.note, note.volume, note.duration);
        // setTimeout(() => play(note.note, 0), 200)
      }, note.time);
    });
  };

  const handleAdd = () => {
    setTracks([
      ...tracks,
      newTrack()
    ])
  }

  /**
   * Update defined track by index value
   * @param updatedTrack 
   * @param current 
   */
  const update = (updatedTrack: RecordedTrack, current: number) => {
    loop(updatedTrack);

    setTracks([
      ...tracks.map(
        (track, i) => (i === current ? updatedTrack : track)
      )
    ])
  };

  /**
   * Remove track from the list
   * @param index 
   */
  const handleClose = (index: number) => {
    setCurrentTrack(currentTrack === index ? 0 : currentTrack)
    setTracks(tracks.filter((track, i) => i !== index))
  }

  /**
   * Load midi from the input and display information
   * @param event 
   * @returns 
   */
  const handleLoad = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event || !event.target.files) {
      setLoadLabel('');
      return;
    }

    const file = event.target.files[0];
    if (!file) {
      setLoadLabel('');
      return;
    }

    setLoadLabel(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e || !e.target || !e.target.result) return;
      const midi = new Midi(e.target.result as ArrayBuffer);
      setTracks([
        ...tracks.filter(track => track.notes.length > 0),
        ...midiToTracks(midi)
      ]);
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Load sample Midi song
   */
  const handleSample = () => {
    setTracks([
      ...tracks.filter(track => track.notes.length > 0),
      ...midiToTracks(SAMPLE)
    ])
  }

  const handleLoopAll = () => {
    setTracks([
      ...tracks.map(track => ({
        ...track,
        isLoop: true
      }))
    ])
  }

  const handleResetAll = () => {
    setTracks([
      ...tracks.map(track => ({
        ...track,
        notes: []
      }))
    ])
  }

  const handleDeleteAll = () => {
    setTracks([])
  }

  /**
   * Handle side effects related to play note
   * @param note 
   * @param volume 
   * @param duration 
   */
  const playRecord = (
    note: string,
    volume: number,
    duration?: number
  ) => {
    const { tone, recordedNote } = play(note, volume, duration);
    recordNote(recordedNote);
    setDisplay(note + " - " + tone);
    setCurrentKeys({ ...currentKeys, [note]: volume });
  }

  /**
   * Conditionally record new note to the existing ones
   * @param recordedNote 
   */
  const recordNote = (recordedNote: RecordedNote) => {
    const track = tracks[currentTrack];
    if (recordedNote.volume > 0 && track.isRecording) {
      update({
        ...track,
        notes: [
          ...track.notes,
          recordedNote
        ]
      }, currentTrack)
    }

  }

  return (
    <div className="looper">
      <header className="looper__header">
        <div>
          <button
            className="button button--text"
            onClick={handleSample}
          >Load sample</button>

          <input
            className="input input--load"
            id="load"
            type="file"
            name="load"
            accept=".mid"
            onChange={handleLoad}
          />
          <label htmlFor="load">
            <span>{loadLabel}</span>
            <IconLoad />
          </label>

          <button
            className="button"
            onClick={() => save}
          >
            <IconSave />
          </button>
        </div>

        <div className="looper__actions">
          <button className="button" onClick={handleAdd}>
            <IconAdd />
          </button>
          <button
            className={`button`}
            onClick={handleLoopAll}
          >
            <IconLoop />
          </button>
          <button
            className="button"
            onClick={handleResetAll}
          >
            <IconReset />
          </button>
          <button
            className="button"
            onClick={handleDeleteAll}
          >
            <IconClose />
          </button>
        </div>
      </header>

      <main>
        <h3 className="looper__displayed">{display}</h3>

        <Keyboard
          play={playRecord}
          current={currentKeys}
        />

        <div className="looper__breadcrumbs">Tracks {'>'} {currentTrack + 1}. {tracks[currentTrack]?.instrument}</div>

        <section className="tracks">
          {tracks.map((track, i) =>
            <div
              key={i}
              onClick={() => setCurrentTrack(i)}
            >
              <Track
                track={track}
                active={currentTrack === i}
                close={() => handleClose(i)}
                update={updatedTrack => update(updatedTrack, i)}
              />
            </div>
          )}
        </section>
      </main>

      <footer className="looper__footer">
        <Loader
          info={info}
        />
      </footer>
    </div >
  );
}

export default App;
