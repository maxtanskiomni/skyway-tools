String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();});
};

class Constants {
  constructor() {
    this.statuses = [
      'intake',
      // 'game plan',
      // "restoration",
      "marketing",
      "active",
      "success",
      "sold",
      "terminated",
      "holding",
      "admin review",
      "service",
    ];

    this.sub_statuses = [
      'inspection',
      'repair',
      "detail",
      "pictures",
      "video",
      "write-up",
      "sales review",
      "complete",
    ];

    this.order_statuses = [
      // 'pending',
      'estimate',
      // "parts",
      "approval",
      // "purchasing",
      // "awaiting parts",
      "working",
      "payment",
      "complete",
      // "deleted",
    ];

    this.lead_statuses = [
      'pending contact',
      'unresponsive',
      'qualifying',
      "dead",
      "escalated",
      "won",
      "lost",
    ];

    this.service_statuses = [
      'pending',
      "working",
      "quality",
      "complete",
    ];

    this.part_statuses = [
      'pending',
      'inbound',
      'returning',
      "complete",
    ];

    this.part_locations = [
      'in vehicle',
      'office shelf',
      'part room',
      'vehicle shelf',
      ...([1,2,3,4,5,6].map(rack => [1,2,3,4].map(shelf => `R${rack} S${shelf}`))).flat()
    ];

    this.order_types = [
      'detail',
      'pictures',
      "video",
      "repair",
      "purchase",
      "inspection",
      "marketing",
      "misc"
    ]
    .sort();

    this.title_statuses = [
      'receving',
      "processing",
      "complete",
    ];

    this.shipping_statuses = [
      'pending',
      "complete",
    ];

    this.trans_types = [
      'automatic',
      'manual',
    ]
    .sort();

    this.employees = [
      'Al',
      'Max',
      "Ryan",
      "Mark",
      "Bobby",
      "Roy",
      "Nila",
      "Reanna",
      "Daryll",
      "Kevin",
      // "Karl",
      "Augy",
      "Chris F",
      "Chris H",
      "Chino",
      "Rueben",
      "David",
      "Jayme",
    ]
    .sort();

    this.timeCodes = [
      {value: "WS|admin labor", label: "Admin"},
      {value: "WS|general break", label: "Break"},
      {value: "WS|cleaning labor", label: "Cleaning"},
      {value: "WS|lunch break", label: "Lunch"},
      {value: "RM|Skyway vehicle repair", label: "Skyway Vehicle"},
      {value: "SCOGS|Non-stock vehicle labor", label: "Non-stock Vehicle"},
      {value: "SCOGS|Non-stock vehicle labor", label: "Clock-out"},
    ];

    this.locations = [
      {value: "FL", label: "Sarasota"},
      {value: "DAL", label: "Dallas"},
      // {value: "DAL", label: "Orange County"},
      // {value: "PHX", label: "Pheonix"},
      // {value: "ATL", label: "Atlanta"},
      // {value: "LAX", label: "Los Angeles"},
      // {value: "CHR", label: "Charlotte"},
      // {value: "HOU", label: "Houston"},
      // {value: "HOU", label: "Denver"},
      // {value: "DTW", label: "Detroit"},
      // {value: "MIA", label: "Miami"},
    ]
    .sort((a, b) => a.value.localeCompare(b.value));
    this.locations.push({value: "SR", label: "Service"});

    this.userNames = {
      "QaTeMXR0TJcK9L80VTjBo60WpTt2": "Alan Tanski",
      "6u10jX0cGzcEBVq2sUpfd0O3hq42": "Shane Hale",
      "vFtENZjY6dWiMr5m3qCFqAQIy8v2": "Roy Coleman",
      "jaeuSSDch5cuGQztaD7RhZ3acv33": "Bobby Chestnut",
      "W597JhoCdAX26Xxe52BRQcn7hTP2": "Ryan Tanski",
      "FXbkDzwrCVeEda2g2bxPEJLfIFD2": "Augstin Ortiz",
      // "ckFJCBv5bDXXZ4sD6umwmErwCqw1": "Alex Literal",
      "9uhA796j8ShEmIQjFSd7PFxsK4t2": "John Uciechowski",
      "2bnTRpNHBtYYFKE8M9RXFMIEG073": "Noah McKendree",
      // "IqcX1N46dHdgxPDC6vbN4zT9g4q2": "Karl Knueppel",
      "q6OmXvcDOWdBv6lxs41MXpQRgfm1": "Jayme Spencer",
      // "TJxfGmhzuvU9riykprL04GI0V3w2": "Rob Powell",
      "Ppg7VM83fVTugAj1tVifKa8amtF2": "Max Tanski",
      "ESXGyJliPDQkVvSAewGAAWJWteG3": "Ray Jenkins",
      "94xfdgIH44fSJniMf5shQn2aefC2": "Natalie Tanski",
      "5HBSEpaDUOY8GIjbHg7KUInQ59I3": "Walter Lansing",
      "d4eMzjkJqPhUTdPL4zrHFUcvxM63": "Porters",
      "8zj1gUmxaxSUE7suolaqaQUHkmE2": "Sallie Suski",
    }

    this.mechanics = [
      // {name: "Placeholder", rate: 35, cat:"INVR", id: "test"},
      // {name: "Alex Literal", rate: 30, cat:"INVR", id: "ckFJCBv5bDXXZ4sD6umwmErwCqw1"},
      {name: "Augstin Ortiz", rate: 40, cat:"INVR", id: "FXbkDzwrCVeEda2g2bxPEJLfIFD2"},
      {name: "John Uciechowski", rate: 40, cat:"INVR", id: "9uhA796j8ShEmIQjFSd7PFxsK4t2"},
      {name: "Mark Proveaux", rate: 35, cat:"INVR", id: "lwd7yHbNZGSFrB3h4f9504fhXyW2"},
      {name: "Jayme Spencer", rate: 30, cat:"INVR", id: "q6OmXvcDOWdBv6lxs41MXpQRgfm1"},
      // {name: "Jhonner Caldera", rate: 40, cat:"INVR", id: "3"},
      // {name: "Noah McKendree", rate: 27, cat:"INVR", id: "2bnTRpNHBtYYFKE8M9RXFMIEG073"},
      // {name: "Karl Knueppel", rate: 25, cat:"INVR", id: "IqcX1N46dHdgxPDC6vbN4zT9g4q2"},
      {name: "Walter Lansing", rate: 42, cat:"INVR", id: "5HBSEpaDUOY8GIjbHg7KUInQ59I3"},
      // {name: "Rob Powell", rate: 35, cat:"INVR", id: "TJxfGmhzuvU9riykprL04GI0V3w2"},
      // {name: "Joe Clouse", rate: 25, cat:"INVR", id: "h7HqTy9tMUNodcaNQ7yZPtHcJzq2"},
    ].sort((a,b) => a.name.split(" ").slice(-1) >= b.name.split(" ").slice(-1) ? 1 : -1);


    this.sales = [
      {name: "Alan Tanski", id: "QaTeMXR0TJcK9L80VTjBo60WpTt2"},
      {name: "Shane Hale", id: "6u10jX0cGzcEBVq2sUpfd0O3hq42"},
      // {name: "Roy Coleman", id: "vFtENZjY6dWiMr5m3qCFqAQIy8v2"},
      {name: "Bobby Chestnut", id: "jaeuSSDch5cuGQztaD7RhZ3acv33"},
      {name: "Ryan Tanski", id: "W597JhoCdAX26Xxe52BRQcn7hTP2"},
      {name: "Sallie Grace", id: "8zj1gUmxaxSUE7suolaqaQUHkmE2"},
      // {name: "Ray Jenkins", id: "ESXGyJliPDQkVvSAewGAAWJWteG3"},
    ].sort((a,b) => a.name.split(" ").slice(-1) >= b.name.split(" ").slice(-1) ? 1 : -1);

    this.mechanicNames = [
      // "Placeholder",
      // "Alex Literal",
      "Augstin Ortiz",
      "John Uciechowski",
      // "Jhonner Caldera",
      // "Noah McKendree",
      // "Karl Knueppel",
      "Jayme Spencer",
      // "Rob Powell",
      "Mark Proveaux",
      // "Joe Clouse",
      "Walter Lansing"
    ];

  }

  makeSelects = (type, params = {valueKey: "value", labelKey: "label", includeNone:false}, defaultFilter = () => true) => {
    let selections = this[type].filter(defaultFilter).map(x => ({value: x[params.valueKey || "value"] || x, label: x[params.labelKey || "label"] || x.toProperCase()}));
    if(params.includeNone) selections.unshift({value: "", label: "None"})
    return selections
  }

}

const constants = new Constants();
export default constants;