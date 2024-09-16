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

const defaultSales = [
  {name: "Shane Hale", base: 1000, rate: 0.075, consign_rate: 200, consign_bonus: 100, cat: "WP"},
  {name: "Al Tanski", base: 2500, rate: 0.075, consign_rate: 200, consign_bonus: 100, cat: "WP"},
  {name: "Roy Coleman", base: 1000, rate: 0.075, consign_rate: 200, consign_bonus: 100, cat: "WP"},
  {name: "Robert Chestnut", base: 1000, rate: 0.075, consign_rate: 200, consign_bonus: 100, cat: "WP"},
  {name: "Max Tanski", base: 5000, rate: 0.075, consign_rate: 200, consign_bonus: 100, cat: "WP"},
  {name: "Natalie Tanski", base: 2500, rate: 0.075, consign_rate: 200, consign_bonus: 100, cat: "WP"},
  {name: "Ray Jenkins", base: 1000, rate: 0.05, consign_rate: 200, consign_bonus: 100, cat: "WP"},
].sort((a,b) => a.name.split(" ").slice(-1) >= b.name.split(" ").slice(-1) ? 1 : -1);

export default function Salesreps(props) {
    const { docRef, payload = {} } = props;
    const {salesreps = defaultSales} = payload;
    const [totals, setTotals] = React.useState(salesreps.map(x => x.total || ""));
    const [commissions, setcommissions] = React.useState(salesreps.map(x => x.commission || ""));

    const updater = (id, value, i) => {
      let newEntry = [...salesreps];
      newEntry[i][id] = value;
      const {base, margin=0, rate=1, consign_rate=0, consign_bonus=0, consignments=0, consignment_bonuses=0, adjustments=0} = newEntry[i];

      newEntry[i].commission = Math.round(100*margin*rate)/100;
      newEntry[i].total = base + newEntry[i].commission + consign_rate*consignments + consign_bonus*consignment_bonuses - adjustments;
      // console.log({salesreps: newEntry});

      setTotals(newEntry.map(x =>(x.total || 0)));
      setcommissions(newEntry.map(x =>(x.commission || 0)));
      docRef.set({salesreps: newEntry}, {merge: true});
    }

    const generator = () => {
      // [{amount, recipient, memo, date, id}]
      const date = moment(props.date);
      const period =  date.date() >= 15 ? 1 : 2;
      const start = period === 1 ? 1 : 16;
      const end = period === 1 ? 15 : date.endOf('month').date();
      const checks = salesreps.map((x, i) => ({
        amount: totals[i],
        recipient: x.name,
        memo: `${x.cat}| Pay Period: ${date.format("MMM")} ${start} - ${end} ${date.format("YYYY")}`,
        header1: `Base Pay`, 			
        detail1: `${x.base}`, 
        header2: `Sales Commissions`, 
        detail2: `${x.margin} * ${x.rate} = ${x.commission}`, 
        header3: `Consignments Commission`, 
        detail3: `(${x.consignments || 0} * ${x.consign_rate}) + (${x.consignment_bonuses || 0} * ${x.consign_bonus}) = ${x.consignments*x.consign_rate + x.consignment_bonuses*x.consign_bonus}`,
        header4: `Adjustments`, 
        detail4: `${x.adjustments || 0}`, 
      }));
      return checks;
    }

    return (
        <div>
            {
              salesreps.map((rep, i) => {
                const outerUpdate = (id, value) => updater(id, value, i);
                const total = "$"+(totals[i] || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
                const commission = "$"+(commissions[i] || 0).toLocaleString(undefined, {minimumFractionDigits: 2});

                const fields = [
                  <TextLine id={'base'} type={"number"} label={'Base Pay'} i={i} data={rep} updater={outerUpdate} drop_is />,
                  <TextLine id={'margin'} type={"number"} label={'Margin'} i={i} data={rep} updater={outerUpdate} drop_is />,
                  <TextLine id={'rate'} type={"number"} label={'Commission Rate'} i={i} data={rep} updater={outerUpdate} drop_is />,
                  <TextLine id={'consignments'} type={"number"} label={'Number Consignments'} i={i} data={rep} updater={outerUpdate} drop_is />,
                  <TextLine id={'consignment_bonuses'} type={"number"} label={'Consignment Bonuses'} i={i} data={rep} updater={outerUpdate} drop_is />,
                  <TextLine id={'adjustments'} type={"number"} label={'Adjustments'} i={i} data={rep} updater={outerUpdate} drop_is />,
                  <TextLine id={'commission'} label={'Commissions'} value={commission} check={commissions[i] > 0} drop_is disabled />,
                  <TextLine id={'total'} label={'Total'} value={total} check={totals[i] > 0} drop_is disabled />,
                ];

                return <Dropdown key={i} id={i} label={formatTitle(rep.name)} component={fields} />
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