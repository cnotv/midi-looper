

import { ReactComponent as IconAdd } from './assets/img/add.svg';

import './App.scss';
import { Keyboard } from './components/Keyboard';
import { Track } from './components/Track';
import { Loader } from './components/Loader';
import { useState } from 'react';
import { loop, record, reset, save, listenKeyboard, listenLoad, listenWebMidi, play, load, info, fileName } from './utils/looper';

function App() {
  const [display, setDisplay] = useState('Input - Note');
  const [played, setPlayed] = useState('');
  const [currentKey, setCurrentKey] = useState('');
  // Allow to store the current note in an index, for duration computation
  const [currentKeys, setCurrentKeys] = useState<Record<string, number>>({});
  const [loadLabel, setLoadLabel] = useState('Load midi');

  const handleAdd = () => {
    // Use for add multiple tracks
  }

  const handleLoad = () => {
    setPlayed(load());
    setLoadLabel(fileName);
  }

  const handleClose = () => {
    // Use for removing multiple tracks
  }

  const handlePlay = (
    note: string,
    volume: number,
    duration?: number
  ) => {
    const { tone, recorded } = play(note, volume, duration);
    setPlayed(recorded);
    setDisplay(note + " - " + tone);
    setCurrentKeys({ ...currentKeys, [note]: volume });
    setCurrentKey(note);
    console.log(currentKeys);
  }


  // Reset everything
  const handleReset = () => {
    reset();
    setPlayed('');
    setDisplay('');
  }

  listenWebMidi();
  listenKeyboard();
  listenLoad();

  return (
    <div className="App">
      <header className="description">
        <Loader
          label={loadLabel}
          info={info}
          save={save}
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
        <h3 className="title">Tracks</h3>
        <section className="tracks">
          <Track
            played={played}
            record={record}
            loop={loop}
            reset={handleReset}
            close={handleClose}
          />
        </section>
      </main>
      <div className="add">
        <button onClick={handleAdd}>
          <IconAdd />
        </button>
      </div>
      <footer className="info"></footer>
    </div >
  );
}

export default App;
