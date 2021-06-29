import { ChangeEvent } from 'react';
import { ReactComponent as IconLoad } from '../assets/img/load.svg';
import { ReactComponent as IconSave } from '../assets/img/save.svg';

interface LoaderProps {
  info: string,
  label: string,
  save: () => void
  load: (event: ChangeEvent<HTMLInputElement>) => void
}

export const Loader = ({ info, label, save, load }: LoaderProps) => {
  return (
    <section>
      <p>
        <span>Info:</span>
        <span>{ info }</span>
      </p>

      <input
        className="load"
        id="load"
        type="file"
        name="load"
        accept="mid"
        onChange={load}
      />
      <label htmlFor="load">
        <span>{ label }</span>
        <IconLoad />
      </label>

      <button className="button" onClick={save}>
        <IconSave />
      </button>
    </section>
  )
};