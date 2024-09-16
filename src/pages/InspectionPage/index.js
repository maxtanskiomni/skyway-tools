import React, { useEffect, useState } from 'react';
import { Select, MenuItem, Typography, Paper, FormControlLabel, Button } from '@mui/material';
import firebase from '../../utilities/firebase.js';
import StatusLine from '../../components/StatusLine.js';
import Cars from './Cars.js';

const sectemp= [
  {title: "pre-tasks", points: [
    {point: "make-keytag", recommendations: [
      { name: "Option 1", time: "10 min" },
      { name: "Option 2", time: "15 min" },
    ]}, 
    {point: "confirm-vin", recommendations: [
      { name: "Option 1", time: "10 min" },
      { name: "Option 2", time: "15 min" },
    ]}, 
    {point: "confirm-miles", recommendations: [
      { name: "Option 1", time: "10 min" },
      { name: "Option 2", time: "15 min" },
    ]}, 
  ]},
  // {title: "exterior", order_points: [], points: ["paint-quality", "rust-bubbles", "exterior-general-notes"]},
  // {title: "trunk", order_points: [], points: ["jambs", "wires", "holes-rust", "spare-tire", "jack", "trunk-miscellaneous"]},
  // {title: "interior", order_points: [], points: ["rips", "carpet", "dash", "interior-general-notes"]},
  // {title: "engine-bay", order_points: [], points: ["belts", "oil", "coolant", "leaks", "battery-buddy", "battery-condition", "alternator", "engine-bay-miscellaneous"]},
  // {title: "test-drive", order_points: "all", points: ["speedometer", "tempurature", "gas-gauge", "overall-ride", "drive-miscellaneous"]},
  // {title: "undercarriage", order_points: "all", points: ["undercoating", "full-leaks", "body-rails", "undercarraige-miscellaneous"]},
];

let inspection_form = {};

export default function InspectionPage(props) {
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState('');
  // const [sections, setSections] = useState([]);
  const [sections, setSections] = useState(sectemp);
  const [selections, setSelections] = useState({});

  useEffect(() => {
    const fetchInspections = async () => {
      const snapshot = await firebase.firestore().collection('inspections-templates').get();
      const fetchedInspections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInspections(fetchedInspections);
    };

    fetchInspections();
  }, []);

  useEffect(() => {
    if (selectedInspection) {
      const selectedData = inspections.find(inspect => inspect.id === selectedInspection);
      setSections(selectedData ? selectedData.sections : []);
    }
  }, [selectedInspection, inspections]);

  const handleSelectChange = (event) => {
    setSelectedInspection(event.target.value);
  };

  const handleSelectItemChange = (point, value) => {
    setSelections(prevSelections => ({
      ...prevSelections,
      [point]: value
    }));
  };

  const formatTitle = (raw) => {
    return raw.charAt(0).toUpperCase() + raw.split('-').join(' ').slice(1);
  };

  const updater = (table, data) => inspection_form = {...inspection_form, ...data};

  const submit = () => {
    console.log(inspection_form);
  }

  return (
    <Paper style={{padding: 15}}>
      <Typography variant="h5" align="left" style={{ padding: 7 }}>
        New Inspection
      </Typography>
      <div style={{
        backgroundColor: 'white', 
        padding: '17px', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between',
        borderBottomWidth: '3px' 
      }}>
        <FormControlLabel control={<></>} label={"Inspection Type"} />
        <Select value={selectedInspection} onChange={handleSelectChange}>
          {inspections.map((inspection) => (
            <MenuItem key={inspection.id} value={inspection.id}>
              {inspection.name}
            </MenuItem>
          ))}
        </Select>
      </div>
      {sections.map((section, i) => (
        <div key={i} style={{ paddingTop: 10 }}>
          <Typography variant="h5" align="left" style={{ padding: 7 }}>
            {formatTitle(section.title)}
          </Typography>
          {section.points.map(({point, recommendations}, index) => (
            <div key={index} style={{ marginBottom: '3px' }}>
              <StatusLine id={point} label={formatTitle(point)} updater={updater} >
                <div style={{ marginBottom: '3px', display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Typography variant="h6" align="left" style={{ padding: 7 }}>
                  Select Recommendation
                  </Typography>
                  <Select
                    value={selections[point] || ''}
                    onChange={(e) => handleSelectItemChange(point, e.target.value)}
                  >
                    {recommendations && recommendations.map((option, optionIndex) => (
                      <MenuItem key={optionIndex} value={option.name}>
                        {option.name} - {option.time}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </StatusLine>
            </div>
          ))}
        </div>
      ))}
      <Button onClick={submit}>
        Submit Inspection
      </Button>
    </Paper>
  );
}
