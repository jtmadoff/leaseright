/* Reviewed public operator evidence, not a live listing feed. URLs identify each source.
 * Rent observations were reviewed 2026-10-01 via indexed operator pages; publication dates
 * are not supplied. Never refresh these timestamps merely because GIS was refreshed.
 * Restricted/workforce, student/per-bed and waitlist quotes are excluded from rent signals.
 */
const RI_MARKET_EVIDENCE = [
  {id:"station-row",name:"Station Row",address:"10 Park Row West",municipality:"Providence",source:"https://www.stationrowapts.com/floorplans",reviewedAt:"2026-10-01",buildingType:"Contemporary apartments",basis:"monthly-total",notes:"Published total monthly leasing prices; required fees are included. Selected advertised floor plans, not all inventory.",concession:"Half-month offer advertised; eligibility and expiration not verified.",plans:[
    {label:"Studio",beds:0,sqftMin:629,sqftMax:823,price:2266,status:"advertised"},
    {label:"One Bedroom",beds:1,sqftMin:594,sqftMax:694,price:2258,status:"advertised"},
    {label:"Two Bedroom",beds:2,sqftMin:939,sqftMax:1058,price:3542,status:"advertised"},
    {label:"Three Bedroom",beds:3,sqftMin:1195,sqftMax:1195,price:3884,status:"advertised"}]},
  {id:"westminster-lofts",name:"Westminster Lofts",address:"126 Union Street",municipality:"Providence",source:"https://www.westminsterlofts.com/floorplans",reviewedAt:"2026-10-01",buildingType:"Historic conversion",basis:"advertised-rent",notes:"A collection of historic buildings, not one parcel. Workforce-restricted listings are excluded. Mandatory fee treatment is not established.",concession:null,plans:[
    {label:"Studio",beds:0,sqftMin:650,sqftMax:1916,price:1710,status:"advertised"},
    {label:"1 Bedroom",beds:1,sqftMin:1302,sqftMax:1580,price:2345,status:"advertised"},
    {label:"2 Bedroom",beds:2,sqftMin:988,sqftMax:988,price:3010,status:"contact"}]},
  {id:"us-rubber",name:"US Rubber Lofts",address:"12 Eagle Street",municipality:"Providence",source:"https://www.usrubberlofts.com/floorplans",reviewedAt:"2026-10-01",buildingType:"Historic conversion",basis:"advertised-rent",notes:"Published starting rents. Required fees and exact available-unit sizes are not established; floor-plan areas span multiple layouts.",concession:"Specials advertised; amount and terms not supplied.",plans:[
    {label:"2 Bed 1 Bath",beds:2,sqftMin:746,sqftMax:1626,price:2070,status:"advertised"},
    {label:"2 Bed 1.5 Bath",beds:2,sqftMin:986,sqftMax:1362,price:2425,status:"advertised"},
    {label:"2 Bed 2 Bath",beds:2,sqftMin:837,sqftMax:1654,price:2200,status:"advertised"},
    {label:"3 Bed 2 Bath",beds:3,sqftMin:1272,sqftMax:1846,price:2680,status:"advertised"}]},
  {id:"grant-mill",name:"Grant Mill",address:"299 Carpenter Street",municipality:"Providence",source:"https://www.grantmill.com/floorplans",reviewedAt:"2026-10-01",buildingType:"Historic conversion",basis:"monthly-total",notes:"Published totals include required monthly fees and may include user-selected optional fees. Only the observed one-bedroom plans are represented.",concession:"An offer required move-in by September 30; excluded from analysis as expired.",plans:[
    {label:"1A",beds:1,sqftMin:705,sqftMax:705,price:2199,status:"advertised"},
    {label:"1C",beds:1,sqftMin:1006,sqftMax:1006,price:2340,status:"advertised"},
    {label:"1D",beds:1,sqftMin:705,sqftMax:705,price:2210,status:"advertised"},
    {label:"1Q",beds:1,sqftMin:1226,sqftMax:1226,price:2400,status:"advertised"}]},
  {id:"1290w",name:"1290W",address:"1290 Westminster Street",municipality:"Providence",source:"https://www.provrentals.com/1290w",reviewedAt:"2026-10-01",buildingType:"Contemporary apartments",basis:"unallocated-range",notes:"Operator publishes $1,900–$3,000/month for the building. No price-to-bedroom or size mapping, so this range is excluded from bedroom-level analysis.",concession:null,plans:[],buildingRange:[1900,3000]},
  {id:"american-wire",name:"American Wire Residential Lofts",address:"413 Central Avenue",municipality:"Pawtucket",source:"https://www.theamericanwire.com/floorplans",reviewedAt:"2026-10-01",buildingType:"Historic conversion",basis:"advertised-rent",notes:"Waitlist-only quotes are shown separately and excluded from rent signals. Published starting rents do not establish signed rents or fee treatment.",concession:"Specials advertised; amount and terms not supplied.",plans:[
    {label:"Studio",beds:0,sqftMin:515,sqftMax:716,price:1620,status:"waitlist"},
    {label:"1 Bed 1 Bath",beds:1,sqftMin:798,sqftMax:1418,price:1830,status:"waitlist"},
    {label:"2 Bed 1 Bath",beds:2,sqftMin:797,sqftMax:1685,price:2130,status:"advertised"},
    {label:"2 Bed 2 Bath",beds:2,sqftMin:1017,sqftMax:2135,price:2130,status:"advertised"},
    {label:"3 Bed 1 Bath",beds:3,sqftMin:1548,sqftMax:1564,price:2940,status:"advertised"}]},
  {id:"slater-cotton",name:"Slater Cotton Mill",address:"75 South Union Street",municipality:"Pawtucket",source:"https://www.slatercottonmill.com/floorplans",reviewedAt:"2026-10-01",buildingType:"Historic conversion",basis:"unpublished",notes:"Operator publishes sample layouts; no quoted rent on the reviewed page. Kept as a building candidate, excluded from pricing analysis.",concession:null,plans:[
    {label:"B6",beds:1,sqftMin:1006,sqftMax:1006,price:null,status:"unpriced"},
    {label:"B1",beds:2,sqftMin:1425,sqftMax:1425,price:null,status:"unpriced"}]}
];
Object.assign(window,{RI_MARKET_EVIDENCE});
