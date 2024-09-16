// const algoliasearch = require('algoliasearch');
import algoliasearch from "algoliasearch";


class Algolia {
  constructor() {    
    const client = algoliasearch('KKARPLYFGH', '9b199af7f27aa572136191c31b87a9f9');
    Object.assign(this, {client});
  }

  async createRecord(idx_name, objects){
    if(!Array.isArray(objects)) objects = [objects];

    const index = this.client.initIndex(idx_name);
    const objectIDs = await index.saveObjects(objects);
    console.log(objectIDs);
  }

  async updateRecord(idx_name, objects){
    if(!Array.isArray(objects)) objects = [objects];

    const index = this.client.initIndex(idx_name);
    const objectIDs = await index.partialUpdateObjects(objects);
    console.log(objectIDs);
  }
}

const algolia = new Algolia();
export default algolia;
