import { Midi } from "@tonejs/midi";
import { ChangeEvent, createContext, Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from "react";

import { SAMPLE } from '../config/sample';
import { midiToTracks, play, save } from "../utils/Looper";

import { newTrack } from '../utils/Track';
import { KEYMAP } from '../config/global';

let theLoop: NodeJS.Timeout;

interface MidiState {
  display: string,
  currentKeys: Record<string, number>,
  loadLabel: string,
  tracks: RecordedTrack[],
  currentTrack: number,
  playRecord: (
    note: string,
    volume: number,
    duration?: number
  ) => void,
  handleAction: (type: ActionType) => void,
  setCurrentTrack: Dispatch<SetStateAction<number>>,
  handleClose: (index: number) => void,
  update: (updatedTrack: RecordedTrack, current: number) => void,
  handleLoad: (event: ChangeEvent<HTMLInputElement>) => void
}

const MidiContext = createContext<MidiState>({
  display: 'Input - Note',
  currentKeys: {},
  loadLabel: 'Load midi',
  tracks: [newTrack()],
  currentTrack: 0,
  playRecord: () => void 0,
  handleAction: () => void 0,
  setCurrentTrack: () => void 0,
  handleClose: () => void 0,
  update: () => void 0,
  handleLoad: () => void 0
});

export const useMidiContext = () => useContext(MidiContext);

export const MidiContextProvider: React.FC = ({ children }) => {
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



  /**
   * Update defined track by index value
   * @param updatedTrack 
   * @param current 
   */
  const update = (updatedTrack: RecordedTrack, current: number) => {
    loop(updatedTrack);
    const recordingOff = (track: RecordedTrack) => ({
      ...track,
      isRecording: false,
    })

    setTracks([
      ...tracks.filter((track, i) => i < current).map(recordingOff),
      updatedTrack,
      ...tracks.filter((track, i) => i > current).map(recordingOff),
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


  const add = () => {
    setTracks([
      ...tracks,
      newTrack()
    ])
  }

  /**
   * Load sample Midi song
   */
  const sample = () => {
    setTracks([
      ...tracks.filter(track => track.notes.length > 0),
      ...midiToTracks(SAMPLE)
    ])
  }

  const loopAll = () => {
    setTracks([
      ...tracks.map(track => ({
        ...track,
        isLoop: true,
        isRecording: false
      }))
    ])
  }

  const resetAll = () => {
    setTracks([
      ...tracks.map(track => ({
        ...track,
        notes: []
      }))
    ])
  }

  const deleteAll = () => {
    setTracks([])
  }

  const handleAction = (type: ActionType) => {
    switch (type) {
      case "sample":
        sample()
        break;
      case "save":
        save(tracks)
        break;
      case "add":
        add()
        break;
      case "loopAll":
        loopAll()
        break;
      case "resetAll":
        resetAll()
        break;
      case "deleteAll":
        deleteAll()
        break;
      default:
        break;
    }
  }

  const value = {
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
    handleLoad,
  };

  return (
    <MidiContext.Provider value={value}>
      {children}
    </MidiContext.Provider>
  );
};

export default MidiContext;
