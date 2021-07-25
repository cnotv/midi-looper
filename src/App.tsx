
import './App.scss';

import { listenWebMidi, info } from './utils/Looper';

import { Keyboard } from './components/Keyboard';
import { Track } from './components/Track';
import { Loader } from './components/Loader';
import { Actions } from './components/Actions';
import { MidiContextProvider, useMidiContext } from './contexts/MidiContext';

// Listen piano keyboard device to the app
listenWebMidi();

const App = () => {
  const {
    display,
    currentKeys,
    loadLabel,
    tracks,
    currentTrack,
    playRecord,
    handleAction,
    setCurrentTrack,
    handleClose,
    update,
    handleLoad
  } = useMidiContext();

  return (
    <MidiContextProvider>
      <div className="looper">
        <main>
          <h3 className="looper__displayed">{display}</h3>

          <Keyboard
            play={playRecord}
            current={currentKeys}
          />

          <header className="looper__header">
            <Actions
              action={handleAction}
              load={handleLoad}
              label={loadLabel}
            ></Actions>
          </header>

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
    </MidiContextProvider>
  );
}

export default App;
