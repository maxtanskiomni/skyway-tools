function partition(isValid) {
  return this.reduce(([pass, fail], elem) => {
    return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
  }, [[], []]);
}

Object.defineProperty(Array.prototype, "partition",
                      { value: partition,
                        writable: true,
                        enumerable: false,
                        configurable: true });


function filterKeys(keysToRemove = []) {
  return Object.keys(this)
            .filter(key => !keysToRemove.includes(key))
            .reduce((obj, key) => {
                obj[key] = this[key];
                return obj;
            }, {});
}

Object.defineProperty(Object.prototype, "filterKeys",
                      { value: filterKeys,
                        writable: true,
                        enumerable: false,
                        configurable: true });

function removeDuplicates() {
  const unique = new Map();
  this.forEach(obj => {
      if (!unique.has(obj.id)) {
          unique.set(obj.id, obj);
      }
  });
  return Array.from(unique.values());
}

Object.defineProperty(Array.prototype, "removeDuplicates",
                      { value: removeDuplicates,
                        writable: true,
                        enumerable: false,
                        configurable: true });

