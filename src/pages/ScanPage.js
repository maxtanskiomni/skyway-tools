import React, { useState, useEffect } from 'react';
import firebase from '../utilities/firebase';

import {Scanner} from '@yudiel/react-qr-scanner';
import { StateManager } from '../utilities/stateManager';


const db = firebase.firestore();

function ScanPage() {

    //When scan, trigger an action depending on User permissions
    // Mechanics: Start or update SO with a service line
    // Everyone else: Pull up the car listing
    const onScan = (result) => {
        console.log(result)
        const [stock, ...rest] = result.split("/").reverse();
        if(StateManager.userType === "mechanic"){

        }
    }

    const onError = (error) => {
        StateManager.setAlertAndOpen(error?.message || "There was an error scanning.  Please try agian." , "error");
    }

    return (
        <Scanner
            onResult={onScan}
            onError={onError}
        />
    );
}


export default ScanPage;
