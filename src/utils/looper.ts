import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import WebMidi, { InputEventNoteoff, InputEventNoteon } from "webmidi";

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
export let info =
  "No recognized devices. Plug in your MIDI controller to play, otherwise use the virtual piano or your keyboards";
export let fileName = "";

// TODO: Check why is propagating in the correct time
export let currentKeys: Record<string, number> = {};

let recordingTime = 0;
let theLoop: NodeJS.Timeout;
let octave = 4;
let output: {
  stopNote: (arg0: string) => void;
  playNote: (arg0: string) => void;
};

// Listen external Midi IO
export const listenWebMidi = () => {
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
      info = [manufacturer, name].join(" - ");

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

/**
 * Convert notes from midi format to internally used format
 * @param midi
 * @returns
 */
export const midiToPianoSolo = (midi: Midi): RecordedNotes[] => {
  // TODO: Replace when allow multiple loops
  const piano = midi.tracks
    .filter((track: { instrument: { family: string } }) =>
      ["piano", "guitar"].includes(track.instrument.family)
    )
    .filter((track: { notes: string | any[] }) => track.notes.length)[0];
  // TODO: Replace after refactoring note object to match tone.js
  return piano.notes.map(
    (note: { midi: any; velocity: number; ticks: any; duration: any }) => {
      return {
        note: note.midi,
        volume: note.velocity * 100,
        time: note.ticks,
        duration: note.duration,
      };
    }
  );
};

/**
 * Convert notes from midi format to internally used format
 * @param midi
 * @returns
 */
export const midiToTracks = (midi: Midi): Track[] => {
   console.log(midi)
  return midi.tracks
    .filter((track: { notes: string | any[] }) => track.notes.length)
    .map(
      (track: { notes: any[] }) => ({
        isLoop: false,
        isRecording: false,
        notes: track.notes.map((note: { midi: any; velocity: number; ticks: any; duration: any }) => ({
          note: note.midi,
          volume: note.velocity * 100,
          time: note.ticks,
          duration: note.duration,
        }))
      })
    );
};

/**
 * Retrieve list of notes from the object format
 * @param notes
 * @returns
 */
export const notesToKeys = (notes: RecordedNotes[]): string => {
  return notes
    .filter((note) => !!note.volume)
    .map((note) => inputToNote(note.note))
    .join(", ");
};

/**
 * Save handler
 */
export const save = (tracks: Track[]) => {
  const flatNotes = tracks.reduce(
    (acc, track) => acc.concat(track.notes),
    [] as RecordedNotes[]
  );
  const midi = new Midi();
  const midiTrack = midi.addTrack();
  flatNotes.forEach((note) =>
    midiTrack.addNote({
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

// Map Input value to actual note
export const inputToNote = (input: number) => {
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
): { tone: string; recordedNote: RecordedNotes } => {
  // if (!display) return;
  const tone = inputToNote(+note);
  currentKeys[note] = volume;

  const remove = () => {
    SYNTH.triggerRelease(Tone.now() + "8n");
    if (output) {
      output.stopNote(tone);
    }
  };

  if (!!volume) {
    // PLay Tone.js
    SYNTH.triggerAttack(tone, Tone.now());

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

  const time = Math.floor(performance.now() - recordingTime);

  return {
    tone,
    recordedNote: { note, volume, time, duration },
  };
};

// Start loop
export const loop = ({ isLoop, isRecording, notes }: Track) => {
  isLoop = !isLoop;
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
const loopNotes = (notes: RecordedNotes[], isLoop: boolean) => {
  notes.forEach((note) => {
    setTimeout(() => {
      // Prevent to keep playing also after stop
      if (!isLoop) return;

      play(note.note, note.volume, note.duration);
      // setTimeout(() => play(note.note, 0), 200)
    }, note.time);
  });
};
