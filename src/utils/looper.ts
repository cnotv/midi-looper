import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import WebMidi, { InputEventNoteoff, InputEventNoteon } from "webmidi";

// const KEYBOARD = document.querySelector('#keyboard') as HTMLElement;
export const LOAD = document.querySelector("#load") as HTMLInputElement;

export const DEFAULT_FILE_NAME = "my-midi";
export const NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
export const KEYMAP = [
  "a",
  "w",
  "s",
  "e",
  "d",
  "f",
  "t",
  "g",
  "y",
  "h",
  "u",
  "j",
  "k",
  "o",
  "l",
  "p",
];
export const SYNTH = new Tone.Synth().toDestination();
export const NOW = Tone.now();
export let info = 'No recognized devices. Plug in your MIDI controller to play, otherwise use the virtual piano or your keyboards';
export let fileName = '';

const RECORDED: { time: any; volume: any; note: any; duration: any }[] = [];

let isRecording = false;
let isLoop = false;
let recordingTime = 0;
let theLoop: NodeJS.Timeout;
let octave = 4;
let output: {
  stopNote: (arg0: string) => void;
  playNote: (arg0: string) => void;
};

// Listen external Midi IO
export const listenWebMidi = () => {
  console.log("listenWebMidi");
  WebMidi.enable(function (err: any) {
    // Get the first real device
    let input = WebMidi.inputs.filter(
      (x: { manufacturer: any }) => !!x.manufacturer
    )[0];
    output = WebMidi.outputs.filter(
      (x: { manufacturer: any }) => !!x.manufacturer
    )[0];

    if (input && info) {
      const { manufacturer, name } = input;
      info = ([manufacturer, name].join(" - "));

      // TODO: Create a map to retrieve length of playing time
      input.addListener("noteon", "all", (event: InputEventNoteon) => {
        const [something, note, volume] = event.data;
        console.log(something);
        play(note, volume);
      });
      input.addListener("noteoff", "all", (event: InputEventNoteoff) => {
        const [something, note] = event.data;
        console.log(something);
        play(note, 0);
      });
    }
  });
};

// Initialize keyboard to play from PC
export const listenKeyboard = () => {
  console.log("listenKeyboard");
  // TODO: Verify why 8 and somewhere else 4
  const offset = 8;

  document.addEventListener("keydown", (event) => {
    const { key, repeat } = event;
    const pos = KEYMAP.indexOf(key);
    if (pos >= 0 && !repeat) {
      const note = pos + offset + octave * 8;
      play(note, 50);
    }
  });

  // TODO: Create a map to retrieve length of playing time
  document.addEventListener("keyup", (event) => {
    const key = event.key;
    const pos = KEYMAP.indexOf(key);

    if (pos >= 0) {
      const note = pos + offset + octave * 8;
      play(note, 0);
    }
  });
};

export const load = (): string => {
  console.log("load");
  if (!LOAD || !LOAD.files) {
    return "";
  }
  const file = LOAD.files[0];
  if (!file) {
    return "";
  }

  fileName = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (!e || !e.target || !e.target.result) return;
    const midi = new Midi(e.target.result as ArrayBuffer);
    // TODO: Replace when allow multiple loops
    const piano = midi.tracks
      .filter((track: { instrument: { family: string } }) =>
        ["piano", "guitar"].includes(track.instrument.family)
      )
      .filter((track: { notes: string | any[] }) => track.notes.length)[0];
    // TODO: Replace after refactoring note object to match tone.js
    const notes = piano.notes.map(
      (n: { midi: any; velocity: number; ticks: any; duration: any }) => {
        return {
          note: n.midi,
          volume: n.velocity * 100,
          time: n.ticks,
          duration: n.duration,
        };
      }
    );

    RECORDED.length = 0;
    RECORDED.push(...notes);
    console.log(JSON.stringify(notes));
  };
  reader.readAsArrayBuffer(file);

  return RECORDED.filter((note) => !!note.volume)
    .map((note) => inputToNote(note.note))
    .join(", ");
};

// Listen input file for midi loading
export const listenLoad = () => {
  console.log("listenLoad");
  if (!LOAD) return;
  LOAD.onchange = load;
};

export const save = () => {
  const midi = new Midi();
  const track = midi.addTrack();
  RECORDED.forEach((note) =>
    track.addNote({
      midi: note.note,
      time: note.time / 1000,
      duration: note.time || 0.2,
      velocity: note.volume,
    })
  );

  //   // No idea what is a CC :D
  //   track.addCC({
  //     number : 64,
  //     value : 127,
  //     time : 0.2
  //   })

  const saveAs = prompt("Save midi file as:", DEFAULT_FILE_NAME);

  if (saveAs) {
    const fileName = `${saveAs}.mid`;
    const data = midi.toArray();
    const blob = new Blob([data], { type: "audio/midi audio/x-midi" });

    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = fileName;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
};

// Reset everything
export const reset = () => {
  console.log("reset");
  RECORDED.length = 0;
  isRecording = false;
  isLoop = false;
};

// Map Input value to actual note
const inputToNote = (input: number) => {
  // TODO: Verify why 4
  const offset = 4;
  const inputOffset = input - offset;
  const size = NOTES.length;
  const currentOctave = Math.floor(inputOffset / size);
  const pos = inputOffset - size * currentOctave;
  const note = `${NOTES[pos]}${currentOctave}`;

  return note;
};

// Play not from given note and volume
// Volume default value set for PC play
export const play = (
  note: string | number,
  volume: number,
  duration?: number
): { tone: string; recorded: string } => {
  console.log("play");
  console.log(note, volume, duration);

  // if (!display) return;
  const tone = inputToNote(+note);

  const remove = () => {
    SYNTH.triggerRelease(NOW + "8n");
    if (output) {
      output.stopNote(tone);
    }
  };

  if (!!volume) {
    // PLay Tone.js
    SYNTH.triggerAttack(tone, NOW);

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
    RECORDED.push({ note, volume, time, duration });
  }

  return {
    tone,
    recorded: RECORDED.filter((x) => !!x.volume)
      .map((x) => inputToNote(x.note))
      .join(", "),
  };
};

// Start recording
export const record = (status: boolean) => {
  console.log("record");
  isRecording = status;
  recordingTime = performance.now();
};

// Start loop
export const loop = () => {
  console.log("loop");
  isLoop = !isLoop;
  isRecording = false;
  if (RECORDED.length) {
    const loopLength = RECORDED[RECORDED.length - 1].time;

    if (isLoop) {
      loopNotes();
      theLoop = setInterval(() => loopNotes(), loopLength);
    } else {
      clearInterval(theLoop);
    }
  }
};

const loopNotes = () => {
  console.log("loopNotes");
  RECORDED.forEach((note) => {
    setTimeout(() => {
      // Prevent to keep playing also after stop
      if (!isLoop) return;

      play(note.note, note.volume, note.duration);
      // setTimeout(() => play(note.note, 0), 200)
    }, note.time);
  });
};
