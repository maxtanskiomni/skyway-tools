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
      "parts",
      "ready",
      // "purchasing",
      // "awaiting parts",
      "working",
      "quality",
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
      // "working",
      // "quality",
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

    this.approval_statuses = [
      'pending',
      'approved',
    ]

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
    // this.locations.push({value: "SR", label: "Service"});

    this.bodyStyles = [
      "Cargo Van",
      "Convertible",
      "Coupe",
      "Hatchback",
      "Minivan",
      "Passenger Van",
      "SUV",
      "Sedan",
      "Truck",
      "Wagon"
    ];
    
    this.cylinderCounts = [3, 4, 5, 6, 8, 10, 12];
    
    this.drivetrains = [
      "All-wheel Drive",
      "Four-wheel Drive",
      "Front-wheel Drive",
      "Rear-wheel Drive",
      "Unknown"
    ];
    
    this.doorCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10];

    this.userNames = {
      "QaTeMXR0TJcK9L80VTjBo60WpTt2": "Alan Tanski",
      "6u10jX0cGzcEBVq2sUpfd0O3hq42": "Shane Hale",
      "vFtENZjY6dWiMr5m3qCFqAQIy8v2": "Roy Coleman",
      "jaeuSSDch5cuGQztaD7RhZ3acv33": "Bobby Chestnut",
      "W597JhoCdAX26Xxe52BRQcn7hTP2": "Ryan Tanski",
      "FXbkDzwrCVeEda2g2bxPEJLfIFD2": "Augstin Ortiz",
      "HwxpinJD5vgatCaQ3ntyNImPP282": "Mack Besser",
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
      "STEVEN_AIENA": "Steven Aiena",
      "ROBERT_PANICO": "Robert Panico",
      "ENRIQUE_ACOSTA": "Enrique Acosta",
    }

    this.mechanics = [
      {name: "Placeholder", rate: 35, cat:"INVR", id: "test"},
      // {name: "Alex Literal", rate: 30, cat:"INVR", id: "ckFJCBv5bDXXZ4sD6umwmErwCqw1"},
      {name: "Augstin Ortiz", rate: 42, cat:"INVR", id: "FXbkDzwrCVeEda2g2bxPEJLfIFD2"},
      {name: "Mack Besser", rate: 40, cat:"INVR", id: "HwxpinJD5vgatCaQ3ntyNImPP282"},
      {name: "Jovani Ortiz", rate: 25, cat:"INVR", id: "MOXC0qR6b8NSZYZ3Lw5oCQtkHj72"},
      {name: "John Uciechowski", rate: 42, cat:"INVR", id: "9uhA796j8ShEmIQjFSd7PFxsK4t2"},
      {name: "Steven Aiena", rate: 50, cat:"INVR", id: "STEVEN_AIENA"},
      {name: "Robert Panico", rate: 50, cat:"INVR", id: "ROBERT_PANICO"},
      {name: "Enrique Acosta", rate: 40, cat:"INVR", id: "ENRIQUE_ACOSTA"},
      // {name: "Mark Proveaux", rate: 35, cat:"INVR", id: "lwd7yHbNZGSFrB3h4f9504fhXyW2"},
      // {name: "Jayme Spencer", rate: 30, cat:"INVR", id: "q6OmXvcDOWdBv6lxs41MXpQRgfm1"},
      // {name: "Jhonner Caldera", rate: 40, cat:"INVR", id: "3"},
      // {name: "Noah McKendree", rate: 27, cat:"INVR", id: "2bnTRpNHBtYYFKE8M9RXFMIEG073"},
      // {name: "Karl Knueppel", rate: 25, cat:"INVR", id: "IqcX1N46dHdgxPDC6vbN4zT9g4q2"},
      // {name: "Walter Lansing", rate: 42, cat:"INVR", id: "5HBSEpaDUOY8GIjbHg7KUInQ59I3"},
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
      "Placeholder",
      // "Alex Literal",
      "Augstin Ortiz",
      "Enrique Acosta",
      "Mack Besser",
      "Jovani Ortiz",
      "John Uciechowski",
      "Steven Aiena",
      "Robert Panico",
      // "Jhonner Caldera",
      // "Noah McKendree",
      // "Karl Knueppel",
      // "Jayme Spencer",
      // "Rob Powell",
      // "Mark Proveaux",
      // "Joe Clouse",
      "Walter Lansing"
    ];

    const superior_pricing = [
      {
        type: "Quick Wipe",
        description: "Using detail spray wipe off entire car. Usually needed when in a rush for a showing or to knock the dust off a car",
        cost: "$10"
      },
      {
        type: "Full Detail",
        description: "Full detail. Bumper to bumper. Wash exterior, wipe down interior, vacuum, clean all openings (hood, doors, trunk). Clean and wipe down engine and bay. Clean and vacuum trunk. Clean wheels. Shine tires. Clean glass. Done to all new arrivals before photos",
        cost: "$100"
      },
      {
        type: "Wash and Vac for Delivery or Showing",
        description: "Wash or wipe down. Vacuumed interior. Wipe interior. Wipe all openings. Clean glass. Wipe engine and bay",
        cost: "$25"
      },
      {
        type: "Al Special",
        description: "Full detail PLUS other items AI wants addressed. Examples include some under hood paint, paint repair, interior paint, spot polish, etc.",
        cost: "Negotiate"
      },
      {
        type: "1-Step Polish",
        description: "Using DA polish entire car. Mask off plastics",
        cost: "$100"
      },
      {
        type: "2-Step Polish",
        description: "Using a DA cut and polish entire car. Mask off plastics",
        cost: "$200"
      },
      {
        type: "Underside Paint",
        description: "Clean and paint underside of car",
        cost: "$50"
      },
      {
        type: "Trunk Rust Repair",
        description: "Wire wheel rust, fill any holes and paint trunk",
        cost: "$50"
      },
      {
        type: "Other",
        description: "Other items that do not come up on a regular basis",
        cost: "Negotiate"
      }
    ]


    this.vendors = [
      {name: "Superior Auto Detailing", type: "detail", pricing: superior_pricing},
      {name: "Duddy", type: "detail", pricing: []},
    ]

  }

  makeSelects = (type, params = {valueKey: "value", labelKey: "label", includeNone:false}, defaultFilter = () => true) => {
    let selections = this[type].filter(defaultFilter).map(x => ({value: x[params.valueKey || "value"] || x, label: x[params.labelKey || "label"] || x.toProperCase()}));
    if(params.includeNone) selections.unshift({value: "", label: "None"})
    return selections
  }

}

const constants = new Constants();
export default constants;