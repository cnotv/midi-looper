import { ChangeEvent } from 'react';

import { ReactComponent as IconAdd } from './../assets/img/add.svg';
import { ReactComponent as IconLoop } from './../assets/img/loop.svg';
import { ReactComponent as IconReset } from './../assets/img/reset.svg';
import { ReactComponent as IconClose } from './../assets/img/close.svg';
import { ReactComponent as IconLoad } from './../assets/img/load.svg';
import { ReactComponent as IconSave } from './../assets/img/save.svg';

import './Actions.scss';

interface ActionProps {
  label: string,
  load: (event: ChangeEvent<HTMLInputElement>) => void,
  action: (action: ActionType) => void
}

export const Actions = ({
  label,
  load,
  action
}: ActionProps) => {
  return (
    <>
      <div className="actions">
        <button
          className="button button--text"
          onClick={() => action('sample')}
        >Load sample</button>

        <input
          className="input input--load"
          id="load"
          type="file"
          name="load"
          accept=".mid"
          onChange={load}
        />
        <label htmlFor="load">
          <span className="button__label">{label}</span>
          <IconLoad />
        </label>

        <button
          className="button button--text"
          onClick={() => action('save')}
        >
          <span className="button__label">Save song</span>
          <IconSave />
        </button>
      </div>

      <div className="actions">
        <button className="button button--text" onClick={() => action('add')}>
          <span className="button__label">Add Track</span>
          <IconAdd />
        </button>
        <button
          className="button button--text"
          onClick={() => action('loopAll')}
        >
          <span className="button__label">Loop All</span>
          <IconLoop />
        </button>
        <button
          className="button button--text"
          onClick={() => action('resetAll')}
        >
          <span className="button__label">Reset All</span>
          <IconReset />
        </button>
        <button
          className="button button--text"
          onClick={() => action('deleteAll')}
        >
          <span className="button__label">Delete All</span>
          <IconClose />
        </button>
      </div>
    </>
  )
};