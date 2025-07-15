import firebase from './firebase.js';
import constants from './constants';
import RequestManager from './requestManager.js';
import history from './history';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import algolia from './algolia.js';
import { StateManager } from './stateManager.js';

// import klaviyo from './klaviyo.js';
// import Geocode from 'react-geocode';
// import ReactPixel from 'react-facebook-pixel';
// import MomentUtils from '@date-io/moment';
// const moment = new MomentUtils();

class Store{
  constructor(){
    this.deal = {};
    this.customer = {};
    this.trades = [];
    this.coBuyer = {};
  }

  update = (location, e) => {
    // console.log(location, e)
    // console.log(e)
    let object = this[location] || {};
    object[e.id || e.name] =  e.value;
    // console.log(object)
    this[location] = object;
  };

  updateArray = (location, arrayName, e) => {
    // console.log(1, this[location])
    // console.log(e)
    let object = this[location] || {};
    // console.log(e)
    e.id = e.id.split("-")[0]
    object[arrayName] =  object[arrayName] || [];
    object[arrayName][e.index] = object[arrayName][e.index] || {}
    object[arrayName][e.index][e.id] = e.value
    this[location] = object;
    // console.log(this[location])
  };

  clearForm = () => {
    for (const id in this.activeFormSetter) this.activeFormSetter[id]('');
  }

  uploadFiles = async (collection, form) => {
    const { files = [] } = form;
    for(let i = 0; i < files.length; i++) {
      const file = files[i];
      const [name = "", ext = ""] = (form.name || file.name).split(".");
      const fileName = uuidv4()+"."+ext;
      const storageRef = firebase.storage().ref('files/'+fileName);
      await storageRef.put(file);
      await firebase.firestore().collection(collection).doc(fileName).set({
        name: form.name || file.name || fileName,
        date: form.date, 
        stock: form.stock,
      }); 
    }
    
    // TODO: add more flexible callback support
    if(this.form.callback) this.form.callback(form.stock)
    return {complete: true};
  }

  uploadForms = async (collection, form) => {
    const iterable = [...form[form.iterable]];
    delete form[form.iterable]
    delete form.iterable
    //TODO: add docID to forms in order to update documents
    for (let i = 0; i < iterable.length; i++) {
      const item = iterable[i];
      const newform = {...form, ...item};
      await this.uploadForm(collection, newform, newform);
      
    }
    
    // TODO: add more flexible callback support
    if(this.form.callback) this.form.callback(form.stock)
    return {complete: true};
  }

  uploadForm = async (collection, form, callbackParams = null) => {
    // const delay = ms => new Promise(res => setTimeout(res, ms));
    // await delay(3000);
    // this.clearForm();
    // return {complete: true};
    const folder = form.folder || "receipts";
    console.log(collection, form);
    if(!collection || !form) return {complete: false};
    form.date = !!form.date ? form.date : moment().format('YYYY/MM/DD');
    //Trims string values as necessary
    Object.keys(form).map(key => form[key] = form[key].trim && form[key].trim() || form[key] );
    const { files = [] } = form;

    let fileNames = []
    for(let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = uuidv4();
      const location = `${folder}/${fileName}`;
      fileNames = [...fileNames, location];
      const storageRef = firebase.storage().ref(location);
      await storageRef.put(file);//.then((snapshot) => console.log('Uploaded a blob or file!'));
    }

    if(fileNames.length > 0) form.files = fileNames;
    const db = firebase.firestore();
    if(this.form.docID){
      const defaultID = form[this.form.docID];
      await db.collection(collection).doc(defaultID).set(form, {merge: true});
    }
    else{ 
      await db.collection(collection).doc().set(form);
    }

    let response = {complete: true}
    if(this.form.callback) response = this.form.callback(callbackParams) || response;
    console.log(response)

    return response;
  }

  addFormWithStockNumberConcat = (collection, form) => {
    form.stock = `SN${form.stock}`;
    // form.stock = `${form.stock}-${form.location}`;
    this.uploadForm(collection, form, form);
  }

  addFormWithCallback = (collection, form) => this.uploadForm(collection, form, form);

  addItemWithCallback = (collection, form) => this.uploadForm(collection, form, form.parameter);

  clearChecks = async (collection, form) => {
    const db = firebase.firestore();
    
    const iterable = [...form[form.iterable]];
    for (let i = 0; i < iterable.length; i++) {
      const item = iterable[i];
      await db.collection(collection).doc(item.checkNumber).update({status:'cleared'});
    }
    return {complete: true};
  }

  assignCheck = async (collection, form) => {
    const iterable = [...form[form.iterable]];
    delete form[form.iterable];
    delete form.iterable;
    form.account = 'inventory';
    form.memo = form.check + " - " + form.memo;
    const checkID = form.check;
    delete form.check;
    for (let i = 0; i < iterable.length; i++) {
      const item = iterable[i];
      console.log({...form, ...item})
      await this.uploadForm(collection, {...form, ...item}, checkID)
    }
    return {complete: true};
  }

  assignCash = async (collection, form) => {
    const iterable = [...form[form.iterable]];
    const cashID = form.cash;
    delete form[form.iterable];
    delete form.iterable;
    delete form.cur_memo
    delete form.cur_amount
    delete form.cash
    let reductionAmount = 0;
    for (let i = 0; i < iterable.length; i++) {
      let item = iterable[i];
      item.account = item.stock === undefined || item.stock === '-FL' ? 'expense' : 'inventory'
      if(item.stock === undefined || item.stock === '-FL') delete item.stock;
      item.memo = "CASH - " + item.memo;
      await this.uploadForm(collection, {...form, ...item,  cashID});
      reductionAmount += item.amount;
      //TODO update current withdrawls amount
    }
    const increment = firebase.firestore.FieldValue.increment(-reductionAmount);
    await firebase.firestore().doc('cash/'+cashID).update({amount: increment});
    return {complete: true};
  }

  uploadRequest = async (collection, form) => {
    // const delay = ms => new Promise(res => setTimeout(res, ms));
    // await delay(3000);
    // return {complete: true};
    if(!collection || !form) return {complete: false};
    const db = firebase.firestore();
    form.date = moment().format('YYYY/MM/DD');
    // var processPaymentRequest = firebase.functions().httpsCallable('processPaymentRequest');

    if(form.payment === 'check'){
      //request check data from firebase functions
      //form.check = await processPaymentRequest({form});

      const {check, pdf} = await RequestManager.post({function: 'processPaymentRequest', variables:{form} });
      form.check = check;
      form.check.pdf = pdf;

      let url = "data:application/pdf;base64,"+form.check.pdf;
      let filename = `Check ${form.bank.lastCheck} - ${form.vendor}.pdf`;
      var file = dataURLtoFile(url, filename);
      var data = window.URL.createObjectURL(file);
      // base64toPDF(form.check.pdf, `Check ${form.bank.lastCheck} - ${form.vendor}.pdf`)
      let a = document.createElement('a');
      a.href = data;
      a.title = filename;
      a.download = filename;
      a.target="_blank";
      a.click();
      // window.open(url, "_blank")
      //increase check number for bank
      await db.doc(`banks/${form.bank.name}-${form.bank.accountNumber}`).update({lastCheck: firebase.firestore.FieldValue.increment(1)});
    }
    else if(form.payment === 'wire'){
      const wire = await RequestManager.post({function: 'processPaymentRequest', variables:{form} });
      console.log('Wire request sent!');
    }

    // await db.collection(collection).doc().set(form);
    return {complete: true};
  }

  generateForm = (name, parameters) => {
    // this.clearForm()
    this.form = forms[name] || {};
    this.form.filterInputs && this.form.filterInputs(this.form);
    this[name] = {};

    const keys = Object.keys(parameters);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      const {inputs} = this.form;
      for (let j = 0; j < inputs.length; j++) {
        const input = inputs[j];
        if(input.id === key) {
          this.form.inputs[j].defaultValue =  !!input.mask ? input.mask(parameters[key]) : parameters[key];
          break;
        }
      }
    }
    return this.form;
  }

  // getUser = async (id) => {
  //   const user = await Firebase.firestore().doc(`people/${id}`).get();
  //   this.user = user.data();
  //   this.user.id = id;
  //   if(this.firstLogin) this.klaviyoTrack();
  // }

  // createCar = async (car) => {
  //   //Create car
  //   const carRef = Firebase.firestore().collection('cars').doc();
  //   car.readableTitle = `${car.year} ${car.make} ${car.model}'`;
  //   car = {...car, owner: user.id, timeCreated: new Date()};
  //   await carRef.set(car);
  //   this.cars = [...this.cars, car];
  // };

  handleError = (e) =>{
    console.log(e);
    this.setMessage(e.message || 'An uknown error occurred.  Please try again');
    this.openError(true);
    this.toggleLoading(true);
    return Promise.resolve(false);
  };

  calculateTax = async (deal, trades = []) => {
    const { cashPrice = 0, docFee = 0 } = deal;
    const tradeSanp = await firebase.firestore().collection(`trades`).where('stock', '==', deal.stock).get();
    const tradeValue = tradeSanp.docs.map(doc => doc.data().trade).reduce( (a,c) => a + c, 0);
    const taxBase = Math.max(0, cashPrice + docFee - tradeValue);
    const salesTax = Math.round(taxBase * 0.06 *100)/100;
    const surtax = Math.round(100 * (taxBase * 0.01 >= 50 ? 50 : taxBase * 0.01)) / 100;
    return [salesTax, surtax]
  };

  calculateProfit = (location) => {
    const { 
      cashPrice = 0,
      docFee = 0,
      conciergeFee = 0,
      shippingCost = 0,
      inventoryCost = 0,
      miscCost = 0,
    } = this[location];

    const profit = cashPrice + docFee + conciergeFee - shippingCost - inventoryCost - miscCost;
    this[location].profit = profit
    this.activeFormSetter['profit']('$'+profit.toLocaleString());
  };

  updatePaidDate = (location, updatedVar) => {
    // console.log(updatedVar, this[location]);
    // console.log(this.activeFormSetter);
    let target_location  = this[location];
    let target_setter = "paidDate";
    const { iterable = false } = target_location;
    const isArray = !!iterable;
    if(isArray){
      let index = 0;
      [updatedVar, index] = updatedVar.split("-");
      target_location = this[location][iterable][index];
      target_setter = target_setter+`-${index}`;
    } 
    // console.log(target_location)

    if(updatedVar !== "isPayable") return;
    
    const { isPayable } = target_location;
    // console.log(isPayable);
    const new_paid_date = !!isPayable ? "" : moment().format("YYYY/MM/DD");

    this.activeFormSetter[target_setter](new_paid_date);
    target_location.paidDate = new_paid_date;
  }

  updateCompleteDate = (location, updatedVar) => {
    if(updatedVar !== "is_complete") return;

    const { is_complete } = this[location];
    const new_date = is_complete ? moment().format("YYYY/MM/DD") : "";

    this.activeFormSetter["end_date"](new_date);
    this[location].end_date = new_date;
  }

  calculateServiceCost = async (location) => {
    let { 
      time = 0,
      mechanic = "",
      revenue = 0,
    } = this[location];
    
    mechanic = constants.mechanics.filter(x => x.name == mechanic).at(0) || {};
    console.log(mechanic)
    let {rate = 0, id = ""} = mechanic;
    if(Object.keys(mechanic).length < 1) rate = 0;

    this[location].rate = Number(rate);
    this.activeFormSetter['rate'](rate);
    this[location].mechanicID = id;
    this.activeFormSetter['mechanicID'](id);
    
    // Add assignDate when mechanic is assigned
    if (id) {
      const assignDate = moment().format('YYYY/MM/DD');
      this[location].assignDate = assignDate;
      this.activeFormSetter['assignDate'](assignDate);
    }
    
    const cost = Number(rate) * Number(time);
    console.log(cost, id)
    this[location].cost = Number(cost);
    this.activeFormSetter['cost'](cost);
  }

  calculatePartProfit = async (location) => {
    let { 
      cost = 0,
      revenue = 0,
    } = this[location];

    if(!StateManager.isAdmin()){
      revenue = Math.round(Number(cost) * 1.35 * 100)/100;
      this[location].revenue = Number(revenue);
      this.activeFormSetter['revenue'](revenue);
      console.log(cost, revenue);
    }


    const profit = Number(revenue) - Number(cost);
    this[location].profit = Number(profit);
    this.activeFormSetter['profit'](profit);
  }

  calculateTotal = async (location) => {
    const { 
      cashPrice = 0,
      docFee = 0,
      conciergeFee = 0,
      titleFee = 0,
      tagFee = 0,
      hasTax,
    } = this[location];
    console.log(this)

    const [salesTax, surtax] = hasTax ? await this.calculateTax(this[location]) : [0, 0];

    const total = Number(cashPrice) + Number(docFee) + Number(conciergeFee) + Number(titleFee) + Number(tagFee) + Number(salesTax) + Number(surtax);
    
    this.activeFormSetter['total'](total);
    this.activeFormSetter['salesTax'](salesTax);
    this.activeFormSetter['surtax'](surtax);

    this[location].total = total;
    this[location].revenue = cashPrice + docFee + conciergeFee + titleFee + tagFee;
    this[location].salesTax = Number(salesTax);
    this[location].surtax = Number(surtax);
    this[location] = {...this[location]}
    console.log(this[location])
  };

  shippingTotal = async (location) => {
    const { price = 0, adjustments = 0 } = this[location];
    const total = Number(price) - Number(adjustments);
    this.activeFormSetter['total']('$'+total.toLocaleString());
    this[location].total = total;
  };

  financeTotal = async (location) => {
    const { conciergeFee = 0, participationFee = 0, adjustments = 0 } = this[location];
    const total = Number(conciergeFee) + Number(participationFee) - Number(adjustments);
    this.activeFormSetter['total']('$'+total.toLocaleString());
    this[location].total = total;
  };

  calculate = (location, key, items, options = {money: true}) => {
    let value = 0
    const keys = Object.keys(items);
    for (const [index, item] of Object.entries(items)) {
      if(item === '+') value += this[location][index] || 0;
      else value -= this[location][index] || 0;
    }

    this[location][key] = value

    if(options.money) value = '$'+value.toLocaleString();
    this.activeFormSetter[key](value);
  }

  formatPhoneNumber = (phoneNumberString) => {
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      var intlCode = (match[1] ? '+1 ' : '');
      return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
    }
    return null;
  };
}

const store = new Store();
export default store;

const getActiveStockNumbers = () => [
  {value:'123-FL', label: '123-FL'},
  {value:'940-FL', label: '940-FL'},
  {value:'1924-FL', label: '1924-FL'},
].sort((f, s) => f.value < s.value ? -1 : 1);

const getNextStockNumber = async ( input = {setter: () => null} ) => {
  const carSettings = await firebase.firestore().collection(`admin`).doc('car_settings').get();
  let nextStockNumber = carSettings.data().lastStock + 1
  input.setter(nextStockNumber)
  return nextStockNumber
}

const increaseLastStockNumber = async () => {
  await firebase.firestore().collection(`admin`).doc('car_settings').update({lastStock: firebase.firestore.FieldValue.increment(1)});
}

const getActiveExpenseAccounts = () => [
  {value:'marketing', label: 'Marketing'},
  {value:'bank', label: 'Bank Fees'},
  {value:'commissions', label: 'Commissions'},
  {value:'contractors', label: 'Contractors'},
  {value:'tolls', label: 'Tolls'},
  {value:'legal', label: 'Legal Services'},
  {value:'meals', label: 'Meals'},
  {value:'office', label: 'Office/Shop Supplies'},
  {value:'reimburse', label: 'Reimbursable Expenses'},
  {value:'mortgage', label: 'Mortgage Interest'},
  {value:'salaries', label: 'Salaries & Wages'},
  {value:'shipping', label: 'Shipping'},
  {value:'taxes', label: 'Taxes'},
  {value:'towing', label: 'Towing'},
  {value:'travel', label: 'Travel'},
  {value:'utilities', label: 'Utilities'},
  {value:'fuel', label: 'Fuel'},
  {value:'uncategorized', label: 'Uncategorized'},
  {value:'repair', label: 'Repair'},
  {value:'inventory', label: 'Inventory Purchase'},
].sort((f, s) => f.value < s.value ? -1 : 1);

const getActivePaymentTypes = () => [
  // {value:'cash', label: 'Cash'}, 
  {value:'check', label: 'Check'}, 
  // {value:'credit', label: 'Credit'}, 
  {value:'wire', label: 'Wire'}, 
];

const getBanks = async () => {
  const bankSnapshot = await firebase.firestore().collection(`banks`).get();
  return bankSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      label: data.name,
      value: data,
    }
  });
};

const forms = {
  purchase: {
    inputs: [
      {type: 'select', id: 'account', label: 'Account', selections: [...getActiveExpenseAccounts()],
        conditionals: [
          {
            id: 'account',
            value: 'repair',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true} // requiredselections: [...getActiveStockNumbers()]},
            ]
          },
          {
            id: 'account',
            value: 'inventory',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true} // requiredselections: [...getActiveStockNumbers()]},
            ]
          },
        ]
      },
      {type: 'select', id: 'payment', label: 'Payment Type', selections: getActivePaymentTypes(), 
        conditionals: [
          {
            id: 'payment',
            value: 'wire',
            inputs: [
              {type: 'text', id: 'address', label: 'Recipient Address', inputType:"text", required: true},
              {type: 'text', id: 'routing', label: 'Routing Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
              {type: 'text', id: 'accountNum', label: 'Account Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
            ]
          },
          {
            id: 'payment',
            value: 'check',
            inputs: [
              {type: 'select', id: 'bank', label: 'Bank Account', selections: getBanks},
            ]
          },
        ]
      },
      {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'vendor', label: 'Recipient', inputType:"text", required: true},
      {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
    ], 
    action: store.uploadRequest,
    collection: 'purchases',
    title: 'Payment Request'
  },
  expense: {
    inputs: [
      {type: 'select', id: 'account', label: 'Account', selections: [...getActiveExpenseAccounts()], 
        conditionals: [
          {
            id: 'account',
            value: 'repair',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true} // requiredselections: [...getActiveStockNumbers()]},
            ]
          },
          {
            id: 'account',
            value: 'inventory',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true} // requiredselections: [...getActiveStockNumbers()]},
            ]
          },
        ]
      },
      {type: 'text', id: 'amount', label: 'Amount', inputType:"tel", mask:cleanNumber, required: true},
      // {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text", required: true},
      {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
      {type: 'file', id: 'receipt', label: 'Receipt', required: false},
    ],
    action: store.uploadForm,
    collection: 'purchases',
    title: 'Record Receipt'
  },
  costing: {
    inputs: [
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel",  required: true},
      {type: 'text', id: 'cashPrice', label: 'Cash Price', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'docFee', label: 'Doc Fee', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'conciergeFee', label: 'Concierge Fee', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'shippingCost', label: 'Shipping Cost', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'inventoryCost', label: 'Inventory Cost', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'miscCost', label: 'Miscellaneous Cost', inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'profit', label: 'Profit', inputType:"numeric", required: false, disabled: true},
    ],
    action: store.uploadForm,
    updater: store.calculateProfit,
    collection: 'costings',
    title: 'Costing Sheet'
  },
  deal: {
    inputs: [
      {type: 'text', id: 'i', label: 'id', required: true, visible:false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel",  required: true},
      {type: 'blank'},
      {type: 'text', id: 'cashPrice', label: 'Cash Price', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'downpayment', label: 'Down Payment', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'docFee', label: 'Doc Fee', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'titleFee', label: 'Title Fee', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'tagFee', label: 'Tag Fee', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'conciergeFee', label: 'Concierge Fee', inputType:"number", mask:cleanNumber,  required: true},
      // {type: 'text', id: 'downpayment', label: 'Cash Downpayment', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'select', id: 'hasTax', label: 'Taxes', loadDefault:() => true, selections: [{value: true, label: 'Apply Taxes'}, {value: false, label: 'Tax Exempt'}],},
      {type: 'text', id: 'salesTax', label: 'Sales Tax', mask:cleanNumber, required: false, disabled: true},
      {type: 'text', id: 'surtax', label: 'Surtax', mask:cleanNumber, required: false, disabled: true},
      {type: 'text', id: 'total', label: 'Total Amount Due', mask:cleanNumber, required: false, disabled: true},
    ],
    action: store.uploadForm,
    updater: store.calculateTotal,
    docID: 'i',
    callback: async () => { 
      const url = new URL(window.location.href);
      const stockNumber = url.searchParams.get("stock");
      const invoice = url.searchParams.get("i");
      await firebase.firestore().doc('deals/'+stockNumber).set({invoice}, {merge: true});
      return {complete: true}
    },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'invoices',
    title: 'Create Invoice'
  },
  shipping: {
    baseInputs: [
      {type: 'text', id: 'i', label: 'id', required: true, visible:false},
      {type: 'text', id: 'type', label: 'type', defaultValue: "shipping", required: true, visible: false},
      {type: 'text', id: 'date', label: 'Date', defaultValue: moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'origin', label: 'Origin Zip Code', inputType:"tel", defaultValue: "34211", required: false},
      {type: 'text', id: 'destination', label: 'Destination Zip Code', inputType:"tel",  required: false},
      {type: 'text', id: 'price', label: 'Price', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'adjustments', label: 'Adjustments/Discounts', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'blank'},
      {type: 'text', id: 'total', label: 'Total Amount Due', mask:cleanNumber, required: false, disabled: true},
    ],
    conditionalInputs:[
      {type: 'text', id: 'customer', label: 'Customer Name', required: true, visible: true, filter: false},
      {type: 'text', id: 'car', label: 'Car', required: true, visible: true, filter: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel",  required: false, visible: true, filter:  true},
      {type: 'blank', filter: true},
    ],
    action: store.uploadForm,
    updater: store.shippingTotal,
    docID: 'i',
    filterInputs: (form) => {
      const hasStock = !!(new URL(window.location.href)).searchParams.get("stock");
      const conditionalInputs = form.conditionalInputs.filter(x => x.filter === hasStock);
      form.inputs = [...conditionalInputs, ...form.baseInputs];
    },
    callback: async () => { 
      const url = new URL(window.location.href);
      const stockNumber = url.searchParams.get("stock") || false;
      const shipping = url.searchParams.get("i");
      if(stockNumber) await firebase.firestore().doc('deals/'+stockNumber).set({shipping}, {merge: true});
      return {complete: true}
    },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'invoices',
    title: 'Create Shipping Invoice'
  },
  shipping_in: {
    baseInputs: [
      {type: 'text', id: 'i', label: 'id', required: true, visible:false},
      {type: 'text', id: 'type', label: 'type', defaultValue: "shipping_in", required: true, visible: false},
      {type: 'text', id: 'date', label: 'Date', defaultValue: moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'price', label: 'Price', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'adjustments', label: 'Adjustments/Discounts', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'blank'},
      {type: 'text', id: 'total', label: 'Total Amount Due', mask:cleanNumber, required: false, disabled: true},
    ],
    conditionalInputs:[
      {type: 'text', id: 'customer', label: 'Customer Name', required: true, visible: true, filter: false},
      {type: 'text', id: 'car', label: 'Car', required: true, visible: true, filter: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel",  required: false, visible: true, filter:  true},
      {type: 'blank', filter: true},
    ],
    action: store.uploadForm,
    updater: store.shippingTotal,
    docID: 'i',
    filterInputs: (form) => {
      const hasStock = !!(new URL(window.location.href)).searchParams.get("stock");
      const conditionalInputs = form.conditionalInputs.filter(x => x.filter === hasStock);
      form.inputs = [...conditionalInputs, ...form.baseInputs];
    },
    callback: async () => { 
      const url = new URL(window.location.href);
      const stockNumber = url.searchParams.get("stock") || false;
      const shipping_in = url.searchParams.get("i");
      if(stockNumber) await firebase.firestore().doc('deals/'+stockNumber).set({shipping_in}, {merge: true});
      return {complete: true}
    },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'invoices',
    title: 'Create Shipping Invoice'
  },
  finance: {
    inputs: [
      {type: 'text', id: 'i', label: 'id', required: true, visible:false},
      {type: 'text', id: 'type', label: 'type', defaultValue: "finance", required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel",  required: true},
      {type: 'blank'},
      {type: 'text', id: 'date', label: 'Date', defaultValue: moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'conciergeFee', label: 'Price', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'participationFee', label: 'Bank Participation Fee', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'adjustments', label: 'Adjustments/Discounts', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'blank'},
      {type: 'blank'},
      {type: 'text', id: 'total', label: 'Total Amount Due', mask:cleanNumber, required: false, disabled: true},
    ],
    action: store.uploadForm,
    updater: store.financeTotal,
    docID: 'i',
    callback: async () => { 
      const url = new URL(window.location.href);
      const stockNumber = url.searchParams.get("stock") || false;
      const finance = url.searchParams.get("i");
      if(stockNumber) await firebase.firestore().doc('deals/'+stockNumber).set({finance}, {merge: true});
      return {complete: true}
    },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'invoices',
    title: 'Create Finance Invoice'
  },
  trade: {
    inputs: [
      {type: 'text', id: 't', label: 'id', required: true, visible:false},
      {type: 'text', id: 'stock', label: 'Selling Car Stock Number', inputType:"tel",  required: true, disabled:true},
      {type: 'text', id: 'year', label: 'Year', inputType:"number", required: true},
      {type: 'text', id: 'make', label: 'Make', inputType:"text", required: true},
      {type: 'text', id: 'model', label: 'Model', inputType:"text", required: true},
      {type: 'text', id: 'vin', label: 'VIN', inputType:"text", required: true},
      {type: 'text', id: 'trade', label: 'Trade Amount', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'payoff', label: 'Payoff Amount', inputType:"number", mask:cleanNumber,  required: true},
      {type: 'text', id: 'netTrade', label: 'Net Trade', inputType:"numeric", required: false, disabled: true},
    ],
    action: store.uploadForm,
    updater: (location) => store.calculate(location, 'netTrade', {trade: '+', payoff: '-'}),
    docID: 't',
    callback: async () => { 
      const url = new URL(window.location.href);
      const tradeID = url.searchParams.get("t");
      const stockNumber = url.searchParams.get("stock");
      const trades = firebase.firestore.FieldValue.arrayUnion(tradeID);
      await firebase.firestore().doc('deals/'+stockNumber).set({trades}, {merge: true});
      return {complete: true}
    },
    onSuccess: (urlParams) => history.push(`/${urlParams.redirect}/${urlParams.stock}?tab=${urlParams.tab}`),
    collection: 'trades', 
    title: 'Add Trade'
  },
  car: {
    inputs: [
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", loadDefault:getNextStockNumber, disabled: true},
      {type: 'text', id: 'year', label: 'Year', inputType:"text", required: true},
      {type: 'text', id: 'make', label: 'Make', inputType:"text", required: true},
      {type: 'text', id: 'model', label: 'Model', inputType:"text", required: true},
      {type: 'text', id: 'color', label: 'Color', inputType:"text", required: true},
      {type: 'text', id: 'vin', label: 'VIN', inputType:"text", required: true},
      {type: 'text', id: 'miles', label: 'Miles', inputType:"text", inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'purchase', label: 'Purchase Amount/NTO', inputType:"number", mask:cleanNumber,  required: true},
    ],
    action: store.addFormWithCallback,
    docID: 'stock',
    callback: (form) => {
      increaseLastStockNumber();
      return {complete: true};
    },
    updater: () => null,
    collection: 'cars', 
    title: 'Add Vehicle'
  },
  repairs: {
    inputs: [
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", required: true},
      {type: 'blank'},
      {type: 'array', id: 'repairs', items:[
        {type: 'text', id: 'description', label: 'Description', inputType:"text", required: true},
        {type: 'select', id: 'type', label: 'Type', selections: [
          {value:1, label: 'Mechanical'}, {value:2, label: 'Electrical'}, {value:3, label: 'Wheels/Tires'},{value:4, label: 'Body'}, ],
        },
      ]}
    ],
    action: store.uploadForm,
    secondaryAction: () => null,
    updater: () => null,
    collection: 'cars', 
    title: 'Add Repairs'
  },
  "car-expenses": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'expenses', required: true, visible: false},
      {type: 'text', id: 'account', label: 'Account', defaultValue: 'repair', required: true, visible: false},
      {type: 'text', id: 'type', label: 'Type', defaultValue: "sales", required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
      {type: 'blank'},
      {type: 'array', id: 'expenses', tag:'iterable', items:[
        {type: 'text', id: 'e', label: 'Doc ID', required: true, visible: false},
        {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text", required: true},
        {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
        {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
        {type: 'text', id: 'paidDate', label: 'Paid Date', defaultValue: moment().format("YYYY/MM/DD"), disabled:true, required: true, visible: true},
        {type: 'select', id: 'isPayable', label: 'Is Paid?', defaultValue: false, loadDefault:() => false, selections: [{value: false, label: 'Yes'}, {value: true, label: 'No'}], disabled:false},
        {type: 'file', id: 'receipt', label: 'Receipt', required: false},
        // {type: 'blank'},
      ]}
    ],
    action: store.uploadForms,
    updater: store.updatePaidDate,
    arrayDocId: "e",
    secondaryAction: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'purchases', 
    title: 'Add Expense'
  },
  "edit-expenses": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', disabled: true, required: true, visible: false},
      {type: 'text', id: 'paidDate', label: 'Paid Date', disabled: false, required: true, visible: true},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true, disabled: false},
      {type: 'text', id: 'e', label: 'Doc ID', required: true, visible: false},
      {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text", required: true},
      {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
      {type: 'select', id: 'isPayable', label: 'Is Paid?', selections: [{value: false, label: 'Yes'}, {value: true, label: 'No'}],},
      {type: 'text', id: 'type', label: 'Type', inputType:"text", disabled: !StateManager.isAdmin(), required: true},
      {type: 'file', id: 'receipt', label: 'Receipt', required: false},
    ],
    action: store.uploadForm,
    updater: store.updatePaidDate,
    docID: "e",
    secondaryAction: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'purchases', 
    title: 'Edit Expense'
  },
  "edit-deposits": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', disabled: true, required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true, disabled: true}, //mask:cleanStockNumber
      {type: 'text', id: 'd', label: 'Doc ID', required: true, visible: false},
      {type: 'select', id: 'account', label: 'Receiving Bank', selections: StateManager.deposit_banks},
      {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
      {type: 'text', id: 'type', label: 'Type', inputType:"text", disabled: !StateManager.isAdmin(), required: true},
      {type: 'file', id: 'receipt', label: 'Receipt', required: false},
    ],
    action: store.uploadForm,
    docID: "d",
    secondaryAction: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'deposits', 
    title: 'Edit Deposit'
  },
  "add-invoice": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'expenses', required: true, visible: false},
      // {type: 'text', id: 'paidDate', label: 'Paid Date', disabled: true, required: true, visible: false},
      {type: 'select', id: 'isPayable', label: 'Is Paid?', loadDefault:() => true, defaultValue: true, selections: [{value: false, label: 'Yes'}, {value: true, label: 'No'}], visible: true},
      {type: 'array', id: 'expenses', tag:'iterable', items:[
        {type: 'text', id: 'e', label: 'Doc ID', required: true, visible: false},
        {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
        {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text", required: true},
        {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
        {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
        {type: "blank"},
        {type: 'file', id: 'receipt', label: 'Receipt', required: false},
      ]}
    ],
    action: store.uploadForms,
    // updater: store.updatePaidDate,
    arrayDocId: "e",
    secondaryAction: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'purchases', 
    title: 'Request Payment'
  },
  "add-expenses": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'expenses', required: true, visible: false},
      // {type: 'text', id: 'paidDate', label: 'Paid Date', disabled: true, required: true, visible: false},
      {type: 'select', id: 'isPayable', label: 'Is Paid?', loadDefault:() => false, defaultValue: false, selections: [{value: false, label: 'Yes'}, {value: true, label: 'No'}], visible: true},
      {type: 'array', id: 'expenses', tag:'iterable', items:[
        {type: 'text', id: 'e', label: 'Doc ID', required: true, visible: false},
        {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
        {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text", required: true},
        {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
        {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
        {type: "blank"},
        {type: 'file', id: 'receipt', label: 'Receipt', required: false},
      ]}
    ],
    action: store.uploadForms,
    updater: store.updatePaidDate,
    arrayDocId: "e",
    secondaryAction: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'purchases', 
    title: 'Add Paid Expenses'
  },
  "car-deposits": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'deposits', required: true, visible: false},
      {type: 'text', id: 'account', label: 'Account', loadDefault:() => 'sales', required: true, visible: false},
      {type: 'text', id: 'type', label: 'Type', defaultValue: "sales", required: true, visible: false},
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true, disabled: true},
      {type: 'blank'},
      {type: 'array', id: 'deposits', tag:'iterable', items:[
        {type: 'select', id: 'account', label: 'Receiving Bank', selections: StateManager.deposit_banks},
        {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
        {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
        {type: 'file', id: 'receipt', label: 'Receipt', required: false},
      ]}
    ],
    action: store.uploadForms,
    secondaryAction: () => null,
    updater: () => null,
    callback: async (form) =>{
      const account = form.account;
      if(account === "safe"){
        const deposit = {
          date:  form.date,
          assigned: false,
          source: "sales",
          memo: form.memo,
          amount: form.amount,
          user: form.stock
        }
        await firebase.firestore().collection("cash").doc().set(deposit, {merge: true});
      }

      const type = form.type;
      if(["shipping", "shipping_in", "finance"].includes(type)){
        const memo = form.memo;
        if(memo.includes("TFD")){
          const doc = firebase.firestore().collection("purchases").doc();
          const purchase = {
            date:  form.date,
            paidDate:  form.date,
            stock: form.stock,
            e: doc.id,
            vendor: "Skyway Classics",
            amount: form.amount,
            memo: `TFD - transfer to ${type}`,
            isPayable: false,
            assigned: false,
          }
          await doc.set(purchase, {merge: true});
        }
      }
    },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'deposits', 
    title: 'Add Deposit'
  },
  "new-customer": {
    inputs: [
      {type: 'text', id: 'customer', label: 'id', required: true, visible:false},
      {type: 'text', id: 'stock', label: 'Stock Number', required: true, visible:false},
      {type: 'text', id: 'first_name', label: 'First Name', inputType:"text", required: true},
      {type: 'text', id: 'last_name', label: 'Last Name', inputType:"text", required: true},
      {type: 'select', id: 'sex', label: 'Sex', selections: StateManager.sexes, required: true},
      {type: 'date', id: 'birthday', label: 'Birthday', required: true},
      {type: 'text', id: 'email', label: 'Email', inputType:"text", required: true},
      {type: 'text', id: 'phone_number', label: 'Phone Number', inputType:"tel", required: true},
      {type: 'text', id: 'address1', label: 'Address', inputType:"text", required: true},
      {type: 'text', id: 'city', label: 'City', inputType:"text", required: true},
      {type: 'select', id: 'state', label: 'State', selections: StateManager.states, required: true},
      {type: 'text', id: 'zip', label: 'Zip Code', inputType:"text", required: true},
      {type: 'text', id: 'dl', label: 'License Number', inputType:"text", required: true},
      // {type: 'file', id: 'license', label: 'License Picture', required: true},
      // {type: 'file', id: 'insurance', label: 'Insurance Picture', required: true},
      {type: 'text', id: 'routing_num', label: 'Routing Number', inputType:"text", required: true},
      {type: 'text', id: 'account_num', label: 'Account Number', inputType:"text", required: true},
    ],
    action: store.addFormWithCallback,
    docID: 'customer',
    folder: 'customer_data',
    // updater: () => null,
    callback: async (form) =>{
      const stockNumber = form.stock
      var url = new URL(window.location.href);
      var type = url.searchParams.get("type");
      var customer = url.searchParams.get("customer");
      const table = url.searchParams.get("table");
      await firebase.firestore().doc(table+'/'+stockNumber).set({[type]: customer}, {merge: true});
      await algolia.createRecord("customers", {objectID: customer, ...form});

      if(type == "consignor"){
        const {first_name = "", last_name = ""} = form;
        const name = first_name + " " + last_name;
        console.log(name, `purchases/${stockNumber}-NTO`)
        await firebase.firestore().doc(`purchases/${stockNumber}-NTO`).set({vendor: name}, {merge: true});
      }
      return {complete: true};
    },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'customers', 
    title: 'New Customer'
  },
  files: {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", disabled: true, required: true, visible: false},
      {type: 'text', id: 'name', label: 'File name', required: true},
      {type: 'blank'},
      {type: 'file', id: 'file', label: 'Upload Files', required: true},
      {type: 'blank'},
    ],
    action: store.uploadFiles,
    secondaryAction: () => null,
    updater: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'files', 
    title: 'Add Files'
  },
  "deposit-cash": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'select', id: 'source', label: 'Source of Funds', selections: [
        {value: "sales", label: 'Funding Car Sale'},
        {value: "safe", label: 'Safe'}, 
        {value: "pilot", label: 'Pilot'},
        {value: "wells-fargo", label: 'Wells Fargo'},
      ],},
      {type: 'text', id: 'memo', label: 'Memo', required: false, visible: true, disabled: false},
      {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true, disabled: false},
      {type: 'text', id: 'user', label: 'Employee Name', required: false, visible: true, disabled: false},
    ],
    action: async (collection, form) => {
      form.originalAmount = form.amount;
      form.assigned = false;
      return await store.uploadForm(collection, form);
    },
    secondaryAction: () => null,
    updater: () => null,
    onSuccess: (urlParams) => history.push(`/${urlParams.redirect}/${urlParams.stock}?tab=${urlParams.tab}`),
    collection: 'cash', 
    title: 'Deposit Cash'
  },
  "assign-cash": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'cash', label: 'CashID', disabled: true, required: true, visible: false},
      {type: 'text', id: 'cur_memo', label: 'Widthawl Memo', required: false, visible: true, disabled: true},
      {type: 'text', id: 'cur_amount', label: 'Widthawl Amount', inputType:"number", mask:cleanNumber, required: true, disabled: true},
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'stockNumbers', required: true, visible: false},
      {type: 'array', id: 'stockNumbers', items:[
        {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false},
        {type: 'text', id: 'memo', label: 'Memo', required: false, visible: true, disabled: false},
        {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
        {type: 'blank'},
      ]}
    ],
    action: store.assignCash,
    secondaryAction: () => null,
    updater: () => null,
    onSuccess: (urlParams) => history.push(`/${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'purchases', 
    title: 'Assign Cash'
  },
  "edit-cash": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', disabled: true, required: true, visible: false},
      {type: 'text', id: 'cash', label: 'CashID', disabled: true, required: true, visible: true},
      {type: 'text', id: 'memo', label: 'Memo', required: false, visible: true, disabled: false},
      {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
    ],
    action: store.uploadForm,
    docID: "cash",
    secondaryAction: () => null,
    updater: () => null,
    onSuccess: (urlParams) => history.push(`/${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'cash', 
    title: 'Edit Cash Entry'
  },
  "edit-check": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', disabled: true, required: true, visible: false},
      {type: 'text', id: 'id', label: 'ID', disabled: true, required: true, visible: true},
      {type: 'text', id: 'recipient', label: 'Recipient', disabled: false, required: true, visible: true},
      {type: 'text', id: 'memo', label: 'Memo', required: false, visible: true, disabled: false},
      {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'status', label: 'Status', required: false, visible: true, disabled: false},
      {type: 'select', id: 'force_vis', label: 'Force', defaultValue: false, loadDefault:() => false, selections: [{value: true, label: 'Yes'}, {value: "", label: "No"}], disabled:false, visible: true},
    ],
    action: store.uploadForm,
    docID: "id",
    secondaryAction: () => null,
    updater: () => null,
    onSuccess: (urlParams) => history.push(`/${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'checks', 
    title: 'Edit Check'
  },
  "clear-checks": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'checks', required: true, visible: false},
      {type: 'array', id: 'checks', items:[
        {type: 'text', id: 'checkNumber', label: 'Check Number', inputType:"text", required: true},
        {type: 'blank'},
      ]}
    ],
    action: store.clearChecks,
    collection: 'checks', 
    title: 'Clear checks'
  },
  "assign-checks": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'stockNumbers', required: true, visible: false},
      {type: 'text', id: 'check', label: 'Check Number', required: true, visible: true},
      {type: 'text', id: 'memo', label: 'Memo', required: false, visible: true, disabled: true},
      {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true, disabled: true},
      {type: 'blank'},
      {type: 'array', id: 'stockNumbers', items:[
        {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
        {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
      ]}
    ],
    action: store.assignCheck,
    collection: 'purchases', 
    callback: async (checkID) => {
      await firebase.firestore().collection('checks').doc(checkID).update({assigned: true});
      const url = new URL(window.location.href);
      const tab = url.searchParams.get("tab");
      history.push(`/accounting?tab=${tab}`);
    },
    title: 'Assign Check'
  },
  "new-lead": {
    inputs: [
      {type: 'text', id: 'c', label: 'id', required: true, visible:false},
      {type: 'text', id: 'first_contact', label: 'first_contact', loadDefault:() => moment().format('YYYY/MM/DD HH:mm'), required: true, visible:false},
      {type: 'text', id: 'last_contact', label: 'last_contact', loadDefault:() => moment().format('YYYY/MM/DD HH:mm'), required: true, visible:false},
      {type: 'text', id: 'contacts', label: 'contacts', loadDefault:() => 0, required: true, visible:false, mask:cleanNumber},
      {type: 'text', id: 'first_name', label: 'First Name', inputType:"text",required: true},
      {type: 'text', id: 'last_name', label: 'Last Name', inputType:"text", required: true},
      {type: 'text', id: 'email', label: 'Email', inputType:"text", required: true},
      {type: 'text', id: 'phone_number', label: 'Phone Number', inputType:"tel", required: true}, //mask:cleanPhoneNumber
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
      {type: 'text', id: 'source', label: 'Source', inputType:"text", required: true},
      {type: 'text', id: 'comments', label: 'Comments', inputType:"tel", required: true, multiline: true},
    ],
    action: store.addFormWithCallback,
    docID: 'c',
    // updater: () => null,
    callback: async (form) =>{
      var url = new URL(window.location.href);
      var customer = url.searchParams.get("c");
      await algolia.createRecord("customers", {objectID: customer, ...form})
      history.push(`/sales-dashboard`);
      return {complete: true};
    },
    collection: 'customers', 
    title: 'Add Lead'
  },
  "new-part": {
    inputs: [
      {type: 'text', id: 'entry_date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'is_recieved', label: 'Status', loadDefault:() => false, disabled: true, required: true, visible: false},
      {type: 'text', id: 'is_ordered', label: 'Status', loadDefault:() => false, disabled: true, required: true, visible: false},
      {type: 'text', id: 'repair', label: 'Repair ID', disabled: true, required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, disabled: true, required: true, visible: false},
      {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text",required: true},
      {type: 'text', id: 'link', label: 'Link', inputType:"text",required: true},
      {type: 'text', id: 'desc', label: 'Description', inputType:"text",required: true},
    ],
    action: store.uploadForm,
    // updater: () => null,
    // callback: async (param) =>{
    //   history.push(`/repair-dashboard?tab=parts`)
    // },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'parts', 
    title: 'Request Part'
  },
  "add-tracking": {
    inputs: [
      {type: 'text', id: 'p', label: 'id', required: true, disabled:true, visible:false},
      {type: 'text', id: 'ordered_date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'is_ordered', label: 'Status', loadDefault:() => true, disabled: true, required: true, visible: false},
      {type: 'text', id: 'tracking_number', label: 'Tracking Number', inputType:"text", required: true},
    ],
    action: store.uploadForm,
    docID: "p",
    // updater: () => null,
    // callback: async (param) =>{
    //   history.push(`/repair-dashboard?tab=parts`)
    // },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'parts', 
    title: 'Add Tracking'
  },
  "new-repair": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'stockNumbers', required: true, visible: false},
      {type: 'text', id: 'entry_date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'status', label: 'Status', loadDefault:() => 'active', disabled: true, required: true, visible: false},
      {type: 'array', id: 'stockNumbers', items:[
        {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
        {type: 'text', id: 'desc', label: 'Description', inputType:"text",required: true,  multiline: true},
        {type: 'text', id: 'part_link', label: 'Part Link', inputType:"text",required: true,  multiline: true},
        {type: 'blank'},
      ]},
    ],
    action: store.uploadForms,
    // updater: () => null,
    callback: async (param) =>{
      // history.push(`/repair-dashboard?tab=repairs`)
    },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'repairs', 
    title: 'Add Repair'
  },
  "new-note": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'ref_values', required: true, visible: false},
      {type: 'text', id: 'ref_value', required: true, visible: false},
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'array', id: 'ref_values', items:[
        {type: 'text', id: 'ref_value', label: 'Ref Value', required: true, visible: false},
        {type: 'text', id: 'note', label: 'Note', inputType:"text",required: true,  multiline: true},
        {type: 'blank'},
      ]},
    ],
    action: store.uploadForms,
    // updater: () => null,
    callback: async (param) =>{
      // history.push(`/repair-dashboard?tab=repairs`)
    },
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'notes', 
    title: 'Add Note'
  },
  "add-car": {
    inputs: [
      {type: 'select', id: 'inDA', label: 'In DA?', defaultValue: false, loadDefault:() => false, selections: [{value: false, label: 'No'}, {value: true, label: 'Yes'}], disabled:true, visible: false},
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'status', label: 'Status', loadDefault:() => constants.statuses[0], disabled: true, required: true, visible: false},
      {type: 'text', id: 'status_time', label: 'Status Time', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'sub_status', label: 'Status', loadDefault:() => constants.sub_statuses[0], disabled: true, required: true, visible: false},
      {type: 'text', id: 'sub_status_time', label: 'Status Time', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true, disabled: true, visible:true},
      {type: 'select', id: 'location', label: 'Location', loadDefault:() => "FL", selections: constants.makeSelects("locations"), required: true},
      {type: 'text', id: 'vin', label: 'VIN', inputType:"text",required: true},
      {type: 'text', id: 'year', label: 'Year', inputType:"text", required: true},
      {type: 'text', id: 'make', label: 'Make', inputType:"text", required: true},
      {type: 'text', id: 'model', label: 'Model', inputType:"text", required: true},
      {type: 'text', id: 'color', label: 'Color', inputType:"text", required: true},
    ],
    action: store.addFormWithStockNumberConcat,
    docID: 'stock',
    // updater: () => null),
    callback: async (form) =>{
      const url = new URL(window.location.href);
      const lastStock = +url.searchParams.get("stock");
      const table = url.searchParams.get("table");
      const service_number = url.searchParams.get("service_number");
      let update = {inDA: false};
      if(table && service_number) {
        await firebase.firestore().doc(table+'/'+service_number).set({car: form.stock}, {merge: true});
        update = {inDA: false, sub_status: "complete", status: "service"};
      }

      await firebase.firestore().doc('cars/'+form.stock).update(update);
      if(service_number) await firebase.firestore().doc('admin/counters').update({lastServiceStock: lastStock});
      else await firebase.firestore().doc('admin/counters').update({lastStock});
      await algolia.createRecord("cars", {objectID: form.stock, ...form});

      const redirect = url.searchParams.get("redirect");
      if(redirect) history.push(redirect);
      return {complete: true};
    },
    collection: 'cars', 
    title: 'Add New Car'
  },
  "add-task": {
    inputs: [
      {type: 'text', id: 'start_date', label: 'Start Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'is_complete', label: 'Is Complete', loadDefault:() => false, disabled: true, required: true, visible: false},
      {type: 'select', id: 'type', label: 'Type', selections: constants.makeSelects("order_types"), required: true,
        conditionals: [
          {
            id: 'payment',
            value: 'detail',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
              {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: false},
            ]
          },
          {
            id: 'payment',
            value: 'pictures',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
            ]
          },
          {
            id: 'payment',
            value: 'video',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
            ]
          },
          {
            id: 'payment',
            value: 'purchase',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
            ]
          },
          {
            id: 'payment',
            value: 'inspection',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
            ]
          },
          {
            id: 'payment',
            value: 'repair',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
              {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: false},
            ]
          },
        ]
      },
      {type: 'select', id: 'owner', label: 'Owner', selections: constants.makeSelects("employees"), required: false},
      {type: 'text', id: 'memo', label: 'Task', inputType:"text", required: true, multiline: true},
    ],
    action: store.addFormWithCallback,
    // updater: () => null,
    callback: async (form) =>{
      history.push(`/task-dashboard/${form.owner}`);
      return {complete: true};
    },
    collection: 'tasks', 
    title: 'Add Task'
  },
  "edit-task": {
    inputs: [
      {type: 'text', id: 't', label: 'id', required: true, disabled:true, visible:false},
      {type: 'text', id: 'start_date', label: 'Start Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'end_date', label: 'Complete Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: true},
      {type: 'select', id: 'type', label: 'Type', selections: constants.makeSelects("order_types"), required: true,
        conditionals: [
          {
            id: 'payment',
            value: 'detail',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
              {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: false},
            ]
          },
          {
            id: 'payment',
            value: 'pictures',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
            ]
          },
          {
            id: 'payment',
            value: 'video',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
            ]
          },
          {
            id: 'payment',
            value: 'purchase',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
            ]
          },
          {
            id: 'payment',
            value: 'inspection',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
            ]
          },
          {
            id: 'payment',
            value: 'repair',
            inputs: [
              {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: false, disabled: false},
              {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: false},
            ]
          },
        ]
      },
      {type: 'select', id: 'owner', label: 'Owner', selections: constants.makeSelects("employees"), required: false},
      {type: 'text', id: 'memo', label: 'Task', inputType:"text", required: true, multiline: true},
      {type: 'select', id: 'is_complete', label: 'Is Complete?', defaultValue: false, loadDefault:() => false, selections: [{value: true, label: 'Yes'}, {value: false, label: 'No'}], disabled:true},
    ],
    action: store.uploadForm,
    updater: store.updateCompleteDate,
    docID: "t",
    // updater: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'tasks', 
    title: 'Add Task'
  },
  "edit-vendor-item": {
    inputs: [
      {type: 'text', id: 'type', label: 'Type', defaultValue: "sales", required: true, visible: false},
      {type: 'text', id: 'date', label: 'Date', disabled: true, required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true},
      {type: 'text', id: 'e', label: 'Doc ID', required: true, visible: false},
      {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text", required: true, visible: false},
      {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'memo', label: 'Memo', defaultValue: "Detail Work - See Invoice", inputType:"text", required: true, visible: false},
      {type: 'text', id: 'paidDate', label: 'Paid Date', defaultValue: "", disabled:true, required: true, disabled: true, visible: false,},
      {type: 'select', id: 'isPayable', label: 'Is Paid?', defaultValue: true, loadDefault:() => true, selections: [{value: false, label: 'Yes'}, {value: true, label: 'No'}], disabled:true, visible: false},
      {type: 'file', id: 'receipt', label: 'Receipt', required: false},
    ],
    action: store.uploadForm,
    updater: store.updatePaidDate,
    docID: "e",
    secondaryAction: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}`),
    collection: 'purchases', 
    title: 'Add Payable Item'
  },
  "order-parts": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'order', label: 'Order', inputType:"tel", inputProps:{inputmode: 'tel'}, mask:cleanServiceStockNumber, disabled: true, required: true},
      {type: 'text', id: 'service', label: 'Service', required: true, disabled: true, visible: false},
      {type: 'blank'},
      {type: 'text', id: 'name', label: 'Item', inputType:"text", required: true},
      {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text",required: true},
      {type: 'text', id: 'partNumber', label: 'Part Number', inputType:"text",required: true},
      {type: 'text', id: 'link', label: 'Link', inputType:"text", required: true},
      {type: 'select', id: 'status', label: 'Status', loadDefault:() => constants.part_statuses.at(0), selections: constants.makeSelects("part_statuses"), required: true},
      {type: "blank"},
      {type: "blank"},
      {type: "blank"},
      {type: 'date', id: 'orderDate', label: 'Order Date', required: true},
      {type: 'date', id: 'arrivalDate', label: 'Estimated Arrival Date', required: true},
      {type: "blank"},
      {type: "blank"},
      {type: 'text', id: 'cost', label: 'Cost', inputType:"number", mask:cleanNumber, required: true},
      {type: "blank"},
      // {type: 'text', id: 'revenue', label: 'Revenue', inputType:"number", mask:cleanNumber, disabled: !StateManager.isAdmin(), required: true, visible: StateManager.isAdmin()},
      // {type: 'text', id: 'profit', label: 'Profit', mask:cleanNumber, required: false, disabled: true, visible: StateManager.isAdmin()},
      {type: 'file', id: 'receipt', label: 'Receipt', required: false},
    ],
    action: store.uploadForm,
    secondaryAction: () => null,
    // updater: store.calculatePartProfit,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'parts', 
    title: 'Part Request'
  },
  "edit-parts": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', disabled: true, required: true, visible: false},
      {type: 'text', id: 'order', label: 'Order', inputType:"tel", inputProps:{inputmode: 'tel'}, mask:cleanServiceStockNumber, required: true},
      {type: 'text', id: 'p', label: 'Doc ID', required: true, visible: false},
      {type: 'text', id: 'name', label: 'Item', inputType:"text", required: true},
      {type: 'text', id: 'link', label: 'Link', inputType:"text", required: true},
      {type: 'select', id: 'status', label: 'Status', selections: constants.makeSelects("part_statuses"), required: true},
      {type: "blank"},
      {type: "blank"},
      {type: 'date', id: 'orderDate', label: 'Order Date', required: true},
      {type: 'date', id: 'arrivalDate', label: 'Estimated Arrival Date', required: true},
      {type: "blank"},
      {type: "blank"},
      {type: 'text', id: 'cost', label: 'Cost', inputType:"number", mask:cleanNumber, required: true},
      {type: "blank"},
      // {type: 'text', id: 'revenue', label: 'Revenue', inputType:"number", mask:cleanNumber, disabled: !StateManager.isAdmin(), required: true, visible: false},
      // {type: 'text', id: 'profit', label: 'Profit', mask:cleanNumber, required: false, disabled: true, visible: false},
      {type: 'file', id: 'receipt', label: 'Receipt', required: false},
    ],
    action: store.uploadForm,
    // updater: store.calculatePartProfit,
    docID: "p",
    secondaryAction: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'parts', 
    title: 'Edit Part'
  },
  "order-services": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'text', id: 'assignDate', label: 'Assign Date', disabled: true, required: true, visible: false},
      {type: 'select', id: 'status', label: 'Status', loadDefault:() => "pending", selections: constants.makeSelects("service_statuses"),  visible: false},
      {type: 'text', id: 'mechanicID', label: 'mechanicID', disabled: true, required: true, visible: false},
      {type: 'text', id: 'order', label: 'Order', inputType:"tel", inputProps:{inputmode: 'tel'}, mask:cleanServiceStockNumber, required: true},
      {type: 'blank'},
      {type: 'text', id: 'name', label: 'Service', inputType:"text", required: true},
      {type: 'text', id: 'time', label: 'Hours to complete', inputType:"number", mask:cleanNumber, required: true},
      {type: 'select', id: 'mechanic', label: 'Mechanic', selections: constants.makeSelects("mechanicNames"), required: true},
      {type: 'text', id: 'rate', label: 'Rate', inputType:"number", mask:cleanNumber, visible: false, disabled: true},
      {type: 'text', id: 'cost', label: 'Cost', inputType:"number", mask:cleanNumber, required: false, disabled: true},
      // {type: 'text', id: 'revenue', label: 'Revenue', inputType:"number", mask:cleanNumber, required: false, disabled: false},
      // {type: 'text', id: 'profit', label: 'Profit', inputType:"number", mask:cleanNumber, required: false, disabled: true},
    ],
    action: store.uploadForm,
    secondaryAction: () => null,
    updater: store.calculateServiceCost,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'services', 
    title: 'Add Service'
  },
  "edit-services": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', disabled: true, required: true, visible: false},
      {type: 'select', id: 'status', label: 'Status', loadDefault:() => "pending", selections: constants.makeSelects("service_statuses"),  visible: false},
      {type: 'text', id: 'mechanicID', label: 'mechanicID', disabled: true, required: true, visible: false},
      {type: 'text', id: 'order', label: 'Order', inputType:"tel", inputProps:{inputmode: 'tel'}, mask:cleanServiceStockNumber, required: true},
      {type: 'text', id: 's', label: 'Doc ID', required: true, visible: false},
      {type: 'blank'},
      {type: 'text', id: 'name', label: 'Service', inputType:"text", required: true},
      {type: 'text', id: 'time', label: 'Hours to complete', inputType:"number", mask:cleanNumber, required: true},
      {type: 'select', id: 'mechanic', label: 'Mechanic', selections: constants.makeSelects("mechanicNames"), required: true},
      {type: 'text', id: 'rate', label: 'Rate', inputType:"number", mask:cleanNumber, visible: false, disabled: true},
      {type: 'text', id: 'cost', label: 'Cost', inputType:"number", mask:cleanNumber, required: false, disabled: true},
      // {type: 'text', id: 'revenue', label: 'Revenue', inputType:"number", mask:cleanNumber, required: false, disabled: false},
      // {type: 'text', id: 'profit', label: 'Profit', inputType:"number", mask:cleanNumber, required: false, disabled: true},
    ],
    action: store.uploadForm,
    docID: "s",
    secondaryAction: () => null,
    updater: store.calculateServiceCost,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'services', 
    title: 'Edit Service'
  },
  "order-expenses": {
    inputs: [
      {type: 'text', id: 'iterable', label: 'iterable', loadDefault:() => 'expenses', required: true, visible: false},
      {type: 'text', id: 'account', label: 'Account', defaultValue: 'repair', required: true, visible: false},
      {type: 'text', id: 'type', label: 'Type', defaultValue: "sales", required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", inputProps:{inputmode: 'tel'}, required: true, disabled: true},
      {type: 'blank'},
      {type: 'array', id: 'expenses', tag:'iterable', items:[
        {type: 'text', id: 'e', label: 'Doc ID', required: true, visible: false},
        {type: 'text', id: 'vendor', label: 'Vendor', inputType:"text", required: true},
        {type: 'text', id: 'amount', label: 'Amount', inputType:"number", mask:cleanNumber, required: true},
        {type: 'text', id: 'memo', label: 'Memo', inputType:"text", required: true},
        {type: 'text', id: 'paidDate', label: 'Paid Date', defaultValue: moment().format("YYYY/MM/DD"), disabled:true, required: true, visible: true},
        {type: 'select', id: 'isPayable', label: 'Is Paid?', defaultValue: false, loadDefault:() => false, selections: [{value: false, label: 'Yes'}, {value: true, label: 'No'}], disabled:false},
        {type: 'file', id: 'receipt', label: 'Receipt', required: false},
        // {type: 'blank'},
      ]}
    ],
    action: store.uploadForms,
    updater: store.updatePaidDate,
    arrayDocId: "e",
    secondaryAction: () => null,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'purchases', 
    title: 'Add Expense'
  },
  "order-subcontracts": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', loadDefault:() => moment().format('YYYY/MM/DD'), disabled: true, required: true, visible: false},
      {type: 'select', id: 'status', label: 'Status', loadDefault:() => "pending", selections: constants.makeSelects("service_statuses"),  visible: false},
      {type: 'text', id: 'order', label: 'Order', inputType:"tel", inputProps:{inputmode: 'tel'}, mask:cleanServiceStockNumber, required: true},
      {type: 'blank'},
      {type: 'text', id: 'name', label: 'Service', inputType:"text", required: true},
      {type: 'text', id: 'provider', label: 'Subcontractor', inputType:"text", required: true},
      {type: 'text', id: 'cost', label: 'Cost', inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'revenue', label: 'Revenue', inputType:"number", mask:cleanNumber, disabled: !StateManager.isAdmin(), required: true, visible: StateManager.isAdmin()},
      {type: 'text', id: 'profit', label: 'Profit', mask:cleanNumber, required: false, disabled: true, visible: StateManager.isAdmin()},
    ],
    action: store.uploadForm,
    secondaryAction: () => null,
    updater: store.calculatePartProfit,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'subcontracts', 
    title: 'Add Subcontract'
  },
  "edit-subcontracts": {
    inputs: [
      {type: 'text', id: 'date', label: 'Date', disabled: true, required: true, visible: false},
      {type: 'text', id: 'order', label: 'Order', inputType:"tel", inputProps:{inputmode: 'tel'}, mask:cleanServiceStockNumber, required: true},
      {type: 'text', id: 's', label: 'Doc ID', required: true, visible: false},
      {type: 'blank'},
      {type: 'text', id: 'name', label: 'Service', inputType:"text", required: true},
      {type: 'text', id: 'provider', label: 'Subcontractor', inputType:"text", required: true},
      {type: 'text', id: 'cost', label: 'Cost', inputType:"number", mask:cleanNumber, required: true},
      {type: 'text', id: 'revenue', label: 'Revenue', inputType:"number", mask:cleanNumber, disabled: !StateManager.isAdmin(), required: true, visible: StateManager.isAdmin()},
      {type: 'text', id: 'profit', label: 'Profit', mask:cleanNumber, required: false, disabled: true, visible: StateManager.isAdmin()},
    ],
    action: store.uploadForm,
    docID: "s",
    secondaryAction: () => null,
    updater: store.calculatePartProfit,
    onSuccess: (urlParams) => history.push(`${urlParams.redirect}?tab=${urlParams.tab}`),
    collection: 'subcontracts', 
    title: 'Edit Subcontract'
  },
  "edit-lead": {
    inputs: [
      {type: 'text', id: 'id', label: 'Doc ID', required: true, visible: false},
      {type: 'text', id: 'stock', label: 'Stock Number', inputType:"tel", disabled: true},
      {type: 'text', id: 'name', label: 'Name', inputType:"text", required: true},
      {type: 'text', id: 'email', label: 'Email', inputType:"text", required: true},
      {type: 'text', id: 'phone', label: 'Phone Number', inputType:"tel", required: true},
      {type: 'text', id: 'comments', label: 'Comments', inputType:"tel", disabled: true}
    ],
    action: store.uploadForm,
    docID: "id",
    secondaryAction: () => null,
    // updater: store.calculateServiceCost,
    onSuccess: (urlParams) => history.push(`/leads`),
    collection: 'leads', 
    title: 'Edit Lead'
  },
};

export function cleanPhoneNumber(text){
  text = text.replace(/\D/g,"");
  let reg = /(\d{3})(\d{3})(\d{4})/;
  var x = text.match(reg);
  if(!x) return text;
  else return '(' + x[1] + ') ' + (x[2] || "") + '-' + (x[3] || "");
}

export function cleanStockNumber(text){
  const url = new URL(window.location.href);
  const post = "-" + (url.searchParams.get("post") || "FL");
  if(text.slice(-2) === post.slice(0,-1)) return text.replace(/\D/g,'').slice(0, -1)+post;
  return text.replace(/\D/g,'')+post;
}

export function cleanServiceStockNumber(text){
  return "SO"+text.replace(/\D/g,'');
}

export function cleanNumber(text){
  text = text.replace(/[^0-9\-.]/g,'');
  if(text !== "") text = Number(text);
  return text;
}

export function cleanBoolean(text, baseline="true"){
  console.log(text, baseline, text === baseline)
  return text === baseline
}

export function cleanDate(text){
  text = moment(text)
  return text.format("MM/DD/YYYY");
}

function base64toPDF(data, name) {
  var bufferArray = base64ToArrayBuffer(data);
  var blobStore = new Blob([bufferArray], { type: "application/pdf" });
  // if (window.navigator && window.navigator.msSaveOrOpenBlob) {
  //     var fileURL = URL.createObjectURL(blobStore);
  //     window.open(fileURL);
  //     // window.navigator.msSaveBlob(blobStore, name);
  //     return;
  // }
  var data = window.URL.createObjectURL(blobStore);
  var link = document.createElement('a');
  document.body.appendChild(link);
  link.href = data;
  link.download = name;
  link.target="_blank";
  link.click();
  // window.URL.revokeObjectURL(data);
  link.remove();
}

function base64ToArrayBuffer(data) {
  var bString = window.atob(data);
  var bLength = bString.length;
  var bytes = new Uint8Array(bLength);
  for (var i = 0; i < bLength; i++) {
      var ascii = bString.charCodeAt(i);
      bytes[i] = ascii;
  }
  return bytes;
};

function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), 
      n = bstr.length, 
      u8arr = new Uint8Array(n);
  console.log(mime);
      
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, {type:mime});
}


export function parseSearchString(string) {
  string = string.substr(1);
  let list = string.split('&');
  let params = {}
  for (let index = 0; index < list.length; index++) {
    let varString = list[index];
    let [key, value] = varString.split('=');
    params[key] = value;
  }

  return params;
}




// function format(value, pattern) {
//   var i = 0,
//       v = value.toString();
//   return pattern.replace(/#/g, _ => v[i++]);
// }

// console.log(format(123456789, '## ## ## ###'));
