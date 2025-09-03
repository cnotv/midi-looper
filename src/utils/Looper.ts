import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import { WebMidi } from "webmidi";
import { DEFAULT_FILE_NAME, NOTES } from "../config/global";
import { newTrack } from "./Track";

export const SYNTH = new Tone.Synth().toDestination();
export const NOW = Tone.now();
export let info =
  "No recognized devices. Plug in your MIDI controller to play, otherwise use the virtual piano or your keyboards";
export let fileName = "";

// TODO: Check why is propagating in the correct time
export let currentKeys: Record<string, number> = {};

let recordingTime = 0;
let output: any;

// Listen external Midi IO
export const listenWebMidi = () => {
  WebMidi.enable()
    .then(() => {
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
        input.addListener("noteon", (event: any) => {
          const note = event.note.number;
          const volume = Math.floor(event.velocity * 127);
          play(note, volume);
        });
        
        input.addListener("noteoff", (event: any) => {
          const note = event.note.number;
          play(note, 0);
        });
      }
    })
    .catch((err: any) => {
      console.error("WebMidi could not be enabled:", err);
    });
};

/**
 * Convert notes from midi format to internally used format
 * @param midi
 * @returns
 */
export const midiToTracks = (midi: Midi): RecordedTrack[] => {
  return midi.tracks
    .filter(track => track.notes.length)
    .map(
      track => ({
        ...newTrack(),
        instrument: track.instrument.name,
        notes: track.notes.map((note: { midi: any; velocity: number; ticks: any; duration: any }) => ({
          note: note.midi,
          volume: note.velocity * 100,
          time: note.ticks,
          duration: note.duration,
        })),
      })
    );
};

/**
 * Retrieve list of notes from the object format
 * @param notes
 * @returns
 */
export const notesToKeys = (notes: RecordedNote[]): string => {
  return notes
    .filter((note) => !!note.volume)
    .map((note) => inputToNote(note.note))
    .join(", ");
};

/**
 * Save handler
 */
export const save = (tracks: RecordedTrack[]) => {
  const flatNotes = tracks.reduce(
    (acc, track) => acc.concat(track.notes),
    [] as RecordedNote[]
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
export const inputToNote = (input: number): string => {
  // TODO: Verify why 4
  const offset = 3;
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
): { tone: string; recordedNote: RecordedNote } => {
  // if (!display) return;
  const tone = inputToNote(+note);
  currentKeys[note] = volume;

  const remove = () => {
    SYNTH.triggerRelease(Tone.now() + "8n");
    if (output) {
      output.sendNoteOff(tone);
    }
  };

  if (!!volume) {
    // PLay Tone.js
    SYNTH.triggerAttack(tone, Tone.now());

    if (output) {
      // output.send([144, note, volume]);
      output.sendNoteOn(tone, volume / 127);
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
