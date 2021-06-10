import React from 'react';
import * as Tone from 'tone';
import * as WebMidi from 'webmidi';
import logo from './logo.svg';
// import './App.scss';

function App() {
  const DISPLAY = document.querySelector('#display');
  const INFO = document.querySelector('#info');
  const PLAYED = document.querySelector('#played');
  // const KEYBOARD = document.querySelector('#keyboard');
  const KEY = document.querySelector('#key');
  const LOAD = document.querySelector('#load');
  const SAVE = document.querySelector('#save');
  const LOAD_LABEL = document.querySelector('#loadLabel');

  const DEFAULT_FILE_NAME = 'my-midi';
  const CLASS = 'keyboard__note--pressed';
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const KEYMAP = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k', 'o', 'l', 'p'];
  const SYNTH = new Tone.Synth().toDestination();
  const NOW = Tone.now();

  // Allow to store the current note in an index, for duration computation
  const CURRENT = {};
  const RECORDED = [];

  let isRecording = false;
  let isLoop = false;
  let recordingTime = 0;
  let theLoop;
  let octave = 4;
  let output;

  // Listen external Midi IO
  const listenWebMidi = () => {
    WebMidi.enable(function (err) {
      // Get the first real device
      input = WebMidi.inputs.filter(input => !!input.manufacturer)[0];
      output = WebMidi.outputs.filter(output => !!output.manufacturer)[0];

      if (input) {
        const { version, manufacturer, name } = input;
        INFO.innerText = [version, manufacturer, name].join(' - ');

        // TODO: Create a map to retrieve length of playing time
        input.addListener('noteon', 'all', (event) => {
          const [something, note, volume] = event.data;
          play(note, volume)
        })
        input.addListener('noteoff', 'all', (event) => {
          const [something, note, volume] = event.data;
          play(note, 0)
        })
      }
    })
  }

  // Initialize keyboard to play from PC
  const listenKeyboard = () => {
    // TODO: Verify why 8 and somewhere else 4
    const offset = 8;

    document.addEventListener('keydown', event => {
      const { key, repeat } = event;
      const pos = KEYMAP.indexOf(key);
      if (pos >= 0 && !repeat) {
        const note = pos + offset + octave * 8;
        KEY.innerText = key;
        play(note);
      }
    })

    // TODO: Create a map to retrieve length of playing time
    document.addEventListener('keyup', event => {
      const key = event.key;
      const pos = KEYMAP.indexOf(key);

      if (pos >= 0) {
        const note = pos + offset + octave * 8;
        play(note, 0);
      }
    });
  }

  const load = () => {
    const file = LOAD.files[0];
    if (!file) return;

    LOAD_LABEL.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      const midi = new Midi(e.target.result);
      // TODO: Replace when allow multiple loops
      const piano = midi.tracks
        .filter(track => ['piano', 'guitar'].includes(track.instrument.family))
        .filter(track => track.notes.length)[0];
      // TODO: Replace after refactorying note object to match tone.js
      const notes = piano.notes.map(n => {
        return {
          note: n.midi,
          volume: n.velocity * 100,
          time: n.ticks,
          duration: n.duration
        }
      })

      RECORDED.length = 0;
      RECORDED.push(...notes);
      console.log(JSON.stringify(notes))
      PLAYED.innerText = RECORDED
        .filter(note => !!note.volume)
        .map(note => inputToNote(note.note))
        .join(', ');
    };
    reader.readAsArrayBuffer(file);
  };

  // Listen input file for midi loading
  const listenLoad = () => {
    LOAD.onchange = load;
  }

  const save = () => {
    const midi = new Midi()
    const track = midi.addTrack()
    RECORDED.forEach(
      note => track.addNote({
        midi: note.note,
        time: note.time / 1000,
        duration: note.time || 0.2,
        velocity: note.volume
      })
    )

    //   // No idea what is a CC :D
    //   track.addCC({
    //     number : 64,
    //     value : 127,
    //     time : 0.2
    //   })

    const saveAs = prompt('Save midi file as:', DEFAULT_FILE_NAME);
    const fileName = `${saveAs || DEFAULT_FILE_NAME}.mid`;
    const data = midi.toArray();
    const blob = new Blob([data], { type: 'audio/midi audio/x-midi' });

    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = fileName;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }

  const listenSave = () => {
    SAVE.onclick = save;
  }

  // Reset everything
  const reset = () => {
    RECORDED.length = 0;
    PLAYED.innerText = '';
    DISPLAY.innerText = '';
    isRecording = false;
    isLoop = false;
  }

  // Map Inpput value to actual note
  const inputToNote = (input) => {
    // TODO: Verify why 4
    const offset = 4;
    const inputOffset = input - offset;
    const size = NOTES.length;
    const octave = Math.floor(inputOffset / size);
    const pos = inputOffset - size * octave;
    const note = `${NOTES[pos]}${octave}`;

    return note;
  }

  // Play not from given note and volume
  // Volume default value set for PC play
  const play = (note, volume = 50, duration) => {
    const key = document.querySelector(`#key${note}`);
    const tone = inputToNote(note);
    DISPLAY.innerText = note + ' - ' + tone;

    // if (!CURRENT[note]) {
    //   CURRENT[note] = performance.now();
    // } else {
    //   duration = Math.floor(CURRENT[note] - performance.now());
    //   delete CURRENT[note];
    // }

    const remove = () => {
      key?.classList?.remove(CLASS);
      SYNTH.triggerRelease(NOW + '8n')
      if (output) {
        output.stopNote(tone);
      }
    }

    if (!!volume) {
      // PLay Tone.js
      SYNTH.triggerAttack(tone, NOW)
      key?.classList?.add(CLASS);

      if (output) {
        // output.send([144, note, volume]);
        output.playNote(tone);
      }

      if (duration) {
        setTimeout(() => remove(), duration * 1000);
      }
    } else {
      remove();
    }

    if (isRecording) {
      const time = Math.floor(performance.now() - recordingTime);
      // Add length
      RECORDED.push({ note, volume, time, duration })
      PLAYED.innerText = RECORDED
        .filter(note => !!note.volume)
        .map(note => inputToNote(note.note))
        .join(', ');
    }
  }

  // Start recording
  const record = (status) => {
    isRecording = status;
    recordingTime = performance.now();
  };

  // Start loop
  const loop = () => {
    isLoop = !isLoop;
    isRecording = false;
    if (RECORDED.length) {
      const loopLength = RECORDED[RECORDED.length - 1].time;

      if (isLoop) {
        loopNotes();
        theLoop = setInterval(() => loopNotes(), loopLength);
      } else {
        clearInterval(theLoop)
      }
    }
  };

  const loopNotes = () => {
    RECORDED.forEach(note => {
      setTimeout(() => {
        // Prevent to keep playing also after stop
        if (!isLoop) return;

        play(note.note, note.volume, note.duration)
        // setTimeout(() => play(note.note, 0), 200)
      }, note.time);
    })
  }

  const handleClose = () => { }

  // listenMidi();
  listenWebMidi();
  listenKeyboard();
  listenLoad();
  listenSave();



  return (
    <div className="App">
      <header className="description">
        <p>
          <span>Info:</span>
          <span id="info">No recognized devices. Plug in your MIDI controller to play, otherwise use the virtual piano or your keyboards</span>
        </p>

        <input
          className="load"
          id="load"
          type="file"
          name="load"
          accept="mid"
        />
        <label
          htmlFor="load"
          id="loadLabel"
        >
          <span>Load midi</span>
          <svg viewBox="64 64 896 896" focusable="false" data-icon="upload" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 00-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z"></path>
          </svg>
        </label>

        <button id="save">
          <svg viewBox="64 64 896 896" focusable="false" data-icon="save" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840zM512 442c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"></path>
          </svg>
        </button>
      </header>

      <main>
        <h3 className="title" id="display">Input - Note</h3>
        <ul className="keyboard" id="keyboard">
          {Array.from('108').fill('').map((note, i) => {
            <li
              className="keyboard__note"
              id="i"
              onMouseDown={() => play(i)}
              onMouseOut={() => play(i, 0)}
              onTouchStart={() => play(i)}
              onTouchEnd={() => play(1, 0)}
            >{i}</li>
          })}
        </ul>

        <h3 className="title" id="key"></h3>
        <h3 className="title">Tracks</h3>
        <section className="loops">
          <h1>#1</h1>
          <p id="played"></p>
          <div className="loops__actions">
            <button onClick={() => record(true)}>
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="30" fill="red"></circle>
              </svg>
            </button>
            <button onClick={() => record(false)}>
              <svg viewBox="64 64 896 896" focusable="false" data-icon="pause" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                <path d="M304 176h80v672h-80zm408 0h-64c-4.4 0-8 3.6-8 8v656c0 4.4 3.6 8 8 8h64c4.4 0 8-3.6 8-8V184c0-4.4-3.6-8-8-8z"></path>
              </svg>
            </button>
            <button onClick={() => loop()}>
              <svg viewBox="64 64 896 896" focusable="false" data-icon="sync" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                <path d="M168 504.2c1-43.7 10-86.1 26.9-126 17.3-41 42.1-77.7 73.7-109.4S337 212.3 378 195c42.4-17.9 87.4-27 133.9-27s91.5 9.1 133.8 27A341.5 341.5 0 01755 268.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.7 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c0-6.7-7.7-10.5-12.9-6.3l-56.4 44.1C765.8 155.1 646.2 92 511.8 92 282.7 92 96.3 275.6 92 503.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8zm756 7.8h-60c-4.4 0-7.9 3.5-8 7.8-1 43.7-10 86.1-26.9 126-17.3 41-42.1 77.8-73.7 109.4A342.45 342.45 0 01512.1 856a342.24 342.24 0 01-243.2-100.8c-9.9-9.9-19.2-20.4-27.8-31.4l60.2-47a8 8 0 00-3-14.1l-175.7-43c-5-1.2-9.9 2.6-9.9 7.7l-.7 181c0 6.7 7.7 10.5 12.9 6.3l56.4-44.1C258.2 868.9 377.8 932 512.2 932c229.2 0 415.5-183.7 419.8-411.8a8 8 0 00-8-8.2z"></path>
              </svg>
            </button>
            <button onClick={() => reset()}>
              <svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
              </svg>
            </button>
          </div>
          <button className="close" onClick={() => handleClose()}>
            <svg viewBox="64 64 896 896" focusable="false" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true">
              <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
            </svg>
          </button>
        </section>
      </main>
      <div className="add">
        <button onClick={() => add()}>
          <svg viewBox="64 64 896 896" focusable="false" data-icon="plus" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <defs>
              <style></style>
            </defs>
            <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"></path>
            <path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"></path>
          </svg>
        </button>
      </div>
      <footer className="info"></footer>
    </div >
  );
}

export default App;
