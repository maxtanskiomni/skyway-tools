import React from 'react';
import firebase from '../../utilities/firebase';

import { StateManager } from '../../utilities/stateManager.js'

import Preview from '../../components/Preview.js';
import moment from 'moment';
import TextLine from '../../components/TextLine.js';
import ChecksButton from '../../components/ChecksButton.js';
import Check from '../../components/Check.js';
import Action from '../../components/Action.js';
import DateLine from '../../components/DateLine.js';
import FileLine from '../../components/FileLine.js';
import SelectLine from '../../components/SelectLine.js';
import Dropdown from '../../components/Dropdown.js';

const defaultEmployees = [
  {name: "Robert Chestnut", cat: "WP"},
].sort((a,b) => a.name.split(" ").slice(-1) >= b.name.split(" ").slice(-1) ? 1 : -1);

export default function Employees(props) {
    const { docRef, payload = {} } = props;
    const {employees = defaultEmployees} = payload;
    const [totals, setTotals] = React.useState(employees.map(x => x.total || ""));

    const updater = (id, value, i) => {
      let newEntry = [...employees];
      newEntry[i][id] = value;
      console.log({employees: newEntry});
      setTotals(newEntry.map(x => x.total));
      docRef.set({employees: newEntry}, {merge: true});
    }

    const generator = () => {
      // [{amount, recipient, memo, date, id}]
      const date = moment(props.date);
      const period =  date.date() >= 15 ? 1 : 2;
      const start = period === 1 ? 1 : 16;
      const end = period === 1 ? 15 : date.endOf('month').date();
      const checks = employees.map((x, i) => ({
        amount: totals[i],
        recipient: x.name,
        memo: `${x.cat}| Pay Period: ${date.format("MMM")} ${start} - ${end} ${date.format("YYYY")}`,
      }));
      return checks;
    }

    return (
        <div>
            {
              employees.map((mech, i) => {
                const outerUpdate = (id, value) => updater(id, value, i);
                const fields = [
                  <TextLine id={'total'} label={'Total'} i={i} data={mech} updater={outerUpdate} drop_is />,
                ];

                return <Dropdown key={i} id={i} label={formatTitle(mech.name)} component={fields} />
              })
            }
            <Total total={totals.reduce((a,c) => +c+a, 0)}/>
            <ChecksButton generator={generator}/>
        </div>
        );
}

const formatTitle = raw => {
    raw = raw.split('-');
    raw = raw.join(' ');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const Total = ({ total }) => {
  total = `$${total.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
      <p style={{ marginRight: '10px' }}>Total:</p>
      <p style={{ marginLeft: '10px' }}>{total}</p>
    </div>
  );
};

