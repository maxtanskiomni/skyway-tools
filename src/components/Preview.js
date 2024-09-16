import React, {useEffect, useState} from 'react';
import {useDropzone} from 'react-dropzone';
import Button from '@mui/material/Button';
import Store from '../utilities/store.js';

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 16
};

const thumb = {
  display: 'inline-flex',
  borderRadius: 2,
  border: '1px solid #eaeaea',
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: 'border-box'
};

const thumbInner = {
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden'
};

const img = {
  display: 'block',
  width: 'auto',
  height: '100%'
};


export default function Preview(props) {
  const cta = props.cta || 'Take Picture'
  const [files, setFiles] = useState(props.files || []);
  const {getRootProps, getInputProps} = useDropzone({
    multiple: !props.single,
    onDrop: acceptedFiles => {
      acceptedFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }))
      acceptedFiles = [...files, ...acceptedFiles];
      setFiles(acceptedFiles);
      if(!Store[props.formName]) Store[props.formName] = {};
      // Store[props.formName].files = acceptedFiles;
      Store.update(props.formName, {name: 'files', id: 'files', value: acceptedFiles});
    }
  });

  const removeFile = index => {
    let newFiles = [...files]; 
    newFiles.splice(index, 1);
    setFiles(newFiles);
    Store[props.formName].files = newFiles;
    //TODO: Remove from firebase on save
  }
  
  const thumbs = files.map((file, i) => (
    <div onClick={() => removeFile(i)} style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img
          src={file.preview}
          style={img}
        />
      </div>
    </div>
  ));

  useEffect(() => () => {
    // Make sure to revoke the data uris to avoid memory leaks
    files.forEach(file => URL.revokeObjectURL(file.preview));
  }, [files]);

  return (
    <section className="container">
      <div {...getRootProps({className: 'dropzone'})}>
        <input {...getInputProps()} />
        {
          props.drop && (
            <p>Drop files here</p>
          )
        }
          <Button
            variant="contained"
            color="secondary"
          >
                {cta}
          </Button>
      </div>
      <aside style={thumbsContainer}>
        {thumbs}
      </aside>
    </section>
  );
}