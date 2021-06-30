

import { ReactComponent as IconAdd } from './assets/img/add.svg';
import { Midi } from "@tonejs/midi";

import './App.scss';
import { Keyboard } from './components/Keyboard';
import { Track } from './components/Track';
import { Loader } from './components/Loader';
import { ChangeEvent, useState } from 'react';
import { save, listenKeyboard, listenWebMidi, play, info, midiToTracks } from './utils/looper';

function App() {
  const [display, setDisplay] = useState('Input - Note');
  const [currentKey, setCurrentKey] = useState('-');
  // Allow to store the current note in an index, for duration computation
  const [currentKeys, setCurrentKeys] = useState<Record<string, number>>({});
  const [loadLabel, setLoadLabel] = useState('Load midi');
  // TODO: Replace string with object
  const [tracks, setTracks] = useState<Track[]>([{ notes: [], isRecording: false, isLoop: false }]);
  const [currentTrack, setCurrentTrack] = useState<number>(0);

  const handleAdd = () => {
    setTracks([
      ...tracks,
      { notes: [], isRecording: false, isLoop: false }
    ])
  }

  const handleClose = (index: number) => {
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
      console.log('load')
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
   * Play notes and display information about them
   * @param note 
   * @param volume 
   * @param duration 
   */
  const handlePlay = (
    note: string,
    volume: number,
    duration?: number
  ) => {
    const { tone, recordedNote } = play(note, volume, duration);

    if (recordedNote.volume > 0 && tracks[currentTrack].isRecording) {
      tracks[currentTrack].notes.push(recordedNote)
    }

    setDisplay(note + " - " + tone);
    setCurrentKeys({ ...currentKeys, [note]: volume });
    setCurrentKey(note);
  }

  // Listen piano keyboard device to the app
  listenWebMidi();
  // Listen computer keyboard to be used as piano device
  listenKeyboard();

  return (
    <div className="App">
      <header className="description">
        <Loader
          label={loadLabel}
          info={info}
          save={() => save(tracks)}
          load={handleLoad}
        />
      </header>

      <main>
        <h3 className="title">{display}</h3>
        <Keyboard
          play={handlePlay}
          current={currentKeys}
        />

        <h3 className="title">{currentKey}</h3>
        <h3 className="title">Tracks - Current: { currentTrack }</h3>
        <section className="tracks">
          {tracks.map((track, i) =>
            <div
              key={i}
              onClick={() => setCurrentTrack(i)}
            >
              <Track
                track={track}
                close={() => handleClose(i)}
                update={newTrack => (track = newTrack)}
              />
            </div>
          )}

        </section>

        <div className="add">
          <button className="button" onClick={handleAdd}>
            <IconAdd />
          </button>
        </div>
      </main>

      <footer className="info"></footer>
    </div >
  );
}

export default App;
