const urlBase = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5001/skyway-dev-373d5/us-central1/'
  : 'https://us-central1-skyway-dev-373d5.cloudfunctions.net/'

const get = params => {
  const initialValue = `${params.function || ''}?`;
  const paramsString = Object.keys(params.variables || {}).reduce(
    (string, key) => `${string}${key}=${params.variables[key]}&`, initialValue
  );
  const url = `${params.url || urlBase}${paramsString.slice(0, -1)}`;

  // if(__DEV__){
    console.log(url);
  //   return Promise.reject(new Error("You cannot perform this in dev mode"));
  // }

  return fetch(url)
    .then((response)=>{
      // console.log(response);
      if(!response.ok){
        throw response.statusText;
      }
      return params.text ? response.text() : response.json();
    })
    .catch(e => {
      console.log(e)
      return {success: false}
    });
};

const post = params => {
  const url = params.url || `${urlBase}${params.function}`;

  // if(__DEV__){
    console.log(url);
    console.log(params.variables);
  //   return Promise.reject(new Error("You cannot perform this in dev mode"));
  // }

  return fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': params.contentType || 'application/json',
      },
      body: (!!params.contentType ? "data=" : '') + JSON.stringify(params.variables),
    })
    .then((response)=>{
      console.log(response);
      if(!response.ok){
        throw response.statusText;
      }
      return response.json();
    })
    .catch(e => {
      console.log(e)
      return {success: false}
    });
};

let RequestManager = {
  get,
  post,
};

export default RequestManager
