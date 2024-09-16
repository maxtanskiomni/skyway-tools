import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import constants from './constants';

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();});
};

class StateModule {
    constructor(){
      this.authed = localStorage.getItem('authed') || sessionStorage.getItem('authed');
      this.whiteList = JSON.parse(localStorage.getItem('whiteList') || sessionStorage.getItem('whiteList') || "[]");
      this.userID = localStorage.getItem('userID') || sessionStorage.getItem('userID') || "";
      this.userType = localStorage.getItem('userType') || sessionStorage.getItem('userType') || "";
      this.userName = constants.userNames[this.userID] || "not a real user";
      this.selectedSOs = [];
      this.orgID = "skyway-classics";
    }

    secondaryAction = (input) => null;
    updatePlaid = () => null;

    states = [
        { name: 'ALABAMA', abbreviation: 'AL'},
        { name: 'ALASKA', abbreviation: 'AK'},
        { name: 'AMERICAN SAMOA', abbreviation: 'AS'},
        { name: 'ARIZONA', abbreviation: 'AZ'},
        { name: 'ARKANSAS', abbreviation: 'AR'},
        { name: 'CALIFORNIA', abbreviation: 'CA'},
        { name: 'COLORADO', abbreviation: 'CO'},
        { name: 'CONNECTICUT', abbreviation: 'CT'},
        { name: 'DELAWARE', abbreviation: 'DE'},
        { name: 'DISTRICT OF COLUMBIA', abbreviation: 'DC'},
        { name: 'FEDERATED STATES OF MICRONESIA', abbreviation: 'FM'},
        { name: 'FLORIDA', abbreviation: 'FL'},
        { name: 'GEORGIA', abbreviation: 'GA'},
        { name: 'GUAM', abbreviation: 'GU'},
        { name: 'HAWAII', abbreviation: 'HI'},
        { name: 'IDAHO', abbreviation: 'ID'},
        { name: 'ILLINOIS', abbreviation: 'IL'},
        { name: 'INDIANA', abbreviation: 'IN'},
        { name: 'IOWA', abbreviation: 'IA'},
        { name: 'KANSAS', abbreviation: 'KS'},
        { name: 'KENTUCKY', abbreviation: 'KY'},
        { name: 'LOUISIANA', abbreviation: 'LA'},
        { name: 'MAINE', abbreviation: 'ME'},
        { name: 'MARSHALL ISLANDS', abbreviation: 'MH'},
        { name: 'MARYLAND', abbreviation: 'MD'},
        { name: 'MASSACHUSETTS', abbreviation: 'MA'},
        { name: 'MICHIGAN', abbreviation: 'MI'},
        { name: 'MINNESOTA', abbreviation: 'MN'},
        { name: 'MISSISSIPPI', abbreviation: 'MS'},
        { name: 'MISSOURI', abbreviation: 'MO'},
        { name: 'MONTANA', abbreviation: 'MT'},
        { name: 'NEBRASKA', abbreviation: 'NE'},
        { name: 'NEVADA', abbreviation: 'NV'},
        { name: 'NEW HAMPSHIRE', abbreviation: 'NH'},
        { name: 'NEW JERSEY', abbreviation: 'NJ'},
        { name: 'NEW MEXICO', abbreviation: 'NM'},
        { name: 'NEW YORK', abbreviation: 'NY'},
        { name: 'NORTH CAROLINA', abbreviation: 'NC'},
        { name: 'NORTH DAKOTA', abbreviation: 'ND'},
        { name: 'NORTHERN MARIANA ISLANDS', abbreviation: 'MP'},
        { name: 'OHIO', abbreviation: 'OH'},
        { name: 'OKLAHOMA', abbreviation: 'OK'},
        { name: 'OREGON', abbreviation: 'OR'},
        { name: 'PALAU', abbreviation: 'PW'},
        { name: 'PENNSYLVANIA', abbreviation: 'PA'},
        { name: 'PUERTO RICO', abbreviation: 'PR'},
        { name: 'RHODE ISLAND', abbreviation: 'RI'},
        { name: 'SOUTH CAROLINA', abbreviation: 'SC'},
        { name: 'SOUTH DAKOTA', abbreviation: 'SD'},
        { name: 'TENNESSEE', abbreviation: 'TN'},
        { name: 'TEXAS', abbreviation: 'TX'},
        { name: 'UTAH', abbreviation: 'UT'},
        { name: 'VERMONT', abbreviation: 'VT'},
        { name: 'VIRGIN ISLANDS', abbreviation: 'VI'},
        { name: 'VIRGINIA', abbreviation: 'VA'},
        { name: 'WASHINGTON', abbreviation: 'WA'},
        { name: 'WEST VIRGINIA', abbreviation: 'WV'},
        { name: 'WISCONSIN', abbreviation: 'WI'},
        { name: 'WYOMING', abbreviation: 'WY' }
    ].map(x => ({value: x.abbreviation, label: x.name.toProperCase()}));

    sexes = [
        {value:"male", label: "Male"}, 
        {value:"female", label: "Female"},
        {value:"c", label: "Company"}
    ];

    banks = [
        {
            name: "Workers Federal Credit Union",
            address: "119 Russell St",
            city: "Littleton",
            state: "MA",
            zip: "01460",
            lien_id: "0204108393",
            is_elt: true,
        },

        {
            name: "Greenwood Credit Union",
            address: "2669 Post Road",
            city: "Warwick",
            state: "RI",
            zip: "02886",
            lien_id: "03885706",
            is_elt: true,
        },

        {
            name: "JJ Best Banc & Co.",
            address: "60 N Water St",
            city: "New Bedford",
            state: "MA",
            zip: "02740",
            lien_id: "228381777",
            is_elt: true,
        },

        {
            name: "Floridacentral Credit Union",
            address: "3333 Henderson Blvd",
            city: " Tampa",
            state: "FL",
            zip: "33611",
            lien_id: "01883301",
            is_elt: true,
        },

        {
            name: "Woodside Credit LLC",
            address: "PO BOX 12379",
            city: "Newport Beach",
            state: "CA",
            zip: "92658",
            lien_id: "231740745",
            is_elt: true,
        },

        {
          name: "USAA Federal Savings Bank",
          address: "PO Box 25145",
          city: "Lehigh Valley",
          state: "PA",
          zip: "18002",
          lien_id: "201882743",
          is_elt: true,
        },

        {
          name: "Power Financial Credit Union",
          address: "2020 N.W. 150th Avenue, Suite #100",
          city: "Pembroke Pines",
          state: "FL",
          zip: "33028",
          lien_id: "204850720",
          is_elt: true,
        },

        {
          name: "Boulevard Specialty Lending",
          address: "PO Box 440249",
          city: "St. Louis",
          state: "MO",
          zip: "63144",
          lien_id: "0245547173",
          is_elt: true,
        },

        {
          name: "Medallion Bank",
          address: "1100 E 6600 S Suite 510",
          city: "Salt Lake City",
          state: "UT",
          zip: "84121",
          lien_id: "225208027",
          is_elt: true,
        },
    ].sort((a,b) => (a.name > b.name) ? 1 : -1).map((x,i) => ({value: "banks-"+i, label: x.name, data:x}));

    fuels = [
        {value:"gas", label:"Gas"},
        {value:"diesel", label:"Diesel"},
        {value:"electric", label:"Electric"},
    ];
    
    app_types = [
        {value: "original", label: "Original"},
        {value: "transfer", label: "Transfer"},
    ];

    authed_emails = [
      "alan@skywayclassics.com",
      "augustin@skywayclassics.com",
      "bobby.chestnut@skywayclassics.com",
      "mark@skywayclassics.com",
      "max@skywayclassics.com",
      "mechanics@skywayclassics.com",
      "roger.hruby@skywayclassics.com",
      "roy.coleman@skywayclassics.com",
      "ryan@skywayclassics.com",
      "shane@skywayclassics.com",
      "david@skywayclassics.com",
      "porters@skywayclassics.com",
      "parts@skywayclassics.com"
    ];

    deposit_banks = [
      {value: "mercury", label: 'Mercury'}, 
      {value: "pilot", label: 'Pilot'},
      {value: "safe", label: 'Safe'}, 
      {value: "inventory", label: 'Trade'},
      {value: "wells-fargo", label: 'Wells Fargo'},
      {value: "seacoast", label: 'Seacoast'},
    ].sort((a,b) => (a.value > b.value) ? 1 : -1);


    isUserAllowed = (path) => {
      if(!this.whiteList) this.whiteList = [];
      const isRestricted = true; //["accounting", "deal-dashboard", "checks"].includes(path);
      if(isRestricted) return this.whiteList.includes(path);
      else return true;
    }

    binaryIndicator = (isEnabled) => (
      isEnabled ? <CheckBox /> : <CheckBoxOutlineBlank />
    );

    formatTitle = raw => {
      raw = raw.split('-');
      raw = raw.join(' ');
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    uploadFile = async params => {
      const {storageRef, file} = params;
      if(!storageRef || !file) return false;
      await storageRef.put(file);
      return true;
    }

    isAdmin = () => {
      // return false
      return this.userType === "admin";
    }

    isManager = () => {
      // return false
      return ["admin", "manager"].includes(this.userType);
    }

    isBackoffice = () => {
      // return false
      return ["admin", "manager", "backoffice"].includes(this.userType);
    }

    isPorter = () => {
      // return false
      return ["admin", "porter"].includes(this.userType);
    }
}

export const StateManager = new StateModule();
