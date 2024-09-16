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
import RequestManager from '../../utilities/requestManager';
import constants from '../../utilities/constants';

const defaultMechanics = constants.mechanics.filter(x => x.name !== "Placeholder");

export default function Mechanics(props) {
    const { docRef, payload = {} } = props;
    console.log(payload)
    const {mechanics = defaultMechanics} = payload;
    const [efficiencies, setEfficiencies] = React.useState(mechanics.map(x => x.efficiency || ""));
    const [totals, setTotals] = React.useState(mechanics.map(x => x.total || ""));

    const updater = (id, value, i) => {
      let newEntry = [...mechanics];
      newEntry[i][id] = value;
      const {logged_hours, billed_hours, rate} = newEntry[i];
      newEntry[i].total = (billed_hours && rate) ? Math.round(100*(billed_hours || 0)*rate)/100 : 0;
      newEntry[i].efficiency = (logged_hours && billed_hours) ? Math.round(100*100*billed_hours/logged_hours)/100 : 0;
      console.log({mechanics: newEntry});

      setEfficiencies(newEntry.map(x => x.efficiency));
      setTotals(newEntry.map(x => x.total));
      docRef.set({mechanics: newEntry}, {merge: true});
    }

    const generator = () => {
      // [{amount, recipient, memo, date, id}]
      const date = moment(props.date);
      const period =  date.date() <= 15 ? 1 : 2;
      const start = period === 1 ? 1 : 16;
      const end = period === 1 ? 15 : date.endOf('month').date();
      const checks = mechanics.map((x, i) => ({
        amount: totals[i],
        recipient: x.name,
        memo: `${x.cat}| Pay Period: ${date.format("MMM")} ${start} - ${end} ${date.format("YYYY")}`,
        header1: `Billable Hours`, 			
        detail1: `${x.billed_hours} hours`, 
        header2: `Amount Paid`, 
        detail2: `${x.billed_hours} * ${x.rate} = ${x.total}`, 
        header3: `Period Efficiency`, 
        detail3: `${x.billed_hours}/${x.billed_hours} = ${x.efficiency}`, 
        header4: `Adjustments`, 
        detail4: `${x.adjustments || 0}`, 
      }));
      return checks.filter(x => x.amount > 0);
    }

    return (
        <div>
            {
              mechanics.map((mech, i) => {
                const outerUpdate = (id, value) => updater(id, value, i);
                const total = "$"+(totals[i] || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
                const efficiency = efficiencies[i]+"%";
                const fields = [
                  <TextLine id={'rate'} type={"number"} label={'Rate'} i={i} data={mech} updater={outerUpdate} drop_is />,
                  <TextLine id={'billed_hours'} type={"number"} label={'Billable Hours'} i={i} data={mech} updater={outerUpdate} drop_is />,
                  <TextLine id={'logged_hours'} type={"number"} label={'Logged Hours'} i={i} data={mech} updater={outerUpdate} drop_is />,
                  <TextLine id={'efficiency'} label={'Efficiency'} value={efficiency} check={+efficiencies[i] > 0} drop_is disabled />,
                  <TextLine id={'total'} label={'Total'} value={total} check={totals[i] > 0} drop_is disabled />,
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